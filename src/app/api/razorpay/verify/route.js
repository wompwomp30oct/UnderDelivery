import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, hasAdminConfig } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DELIVERY_FEE, getCafeStatus } from '@/lib/utils';
import { getRazorpayClient } from '@/lib/razorpay';

const generateOrderNumber = () => Math.floor(1000 + Math.random() * 9000);

export async function POST(request) {
  try {
    if (!hasAdminConfig()) {
      return NextResponse.json({ error: 'Missing server configuration' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const paymentId = body?.razorpay_payment_id;
    const orderId = body?.razorpay_order_id;
    const signature = body?.razorpay_signature;
    const orderData = body?.orderData;

    if (!paymentId || !orderId || !signature || !orderData) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (orderData.customerId !== decoded.uid) {
      return NextResponse.json({ error: 'Unauthorized customer' }, { status: 403 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Missing Razorpay secret' }, { status: 500 });
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const cafeStatus = getCafeStatus();
    if (!cafeStatus.isOpen) {
      return NextResponse.json({ error: 'Cafe is closed' }, { status: 400 });
    }

    const db = getAdminDb();

    const existingPayment = await db
      .collection('orders')
      .where('razorpayPaymentId', '==', paymentId)
      .limit(1)
      .get();

    if (!existingPayment.empty) {
      const doc = existingPayment.docs[0];
      return NextResponse.json({ orderId: doc.id, orderNumber: doc.data().orderNumber });
    }

    const existingOrder = await db
      .collection('orders')
      .where('razorpayOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!existingOrder.empty) {
      const doc = existingOrder.docs[0];
      return NextResponse.json({ orderId: doc.id, orderNumber: doc.data().orderNumber });
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    if (orderData.items.length >= 16) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    const normalizedOrderType = orderData.orderType === 'delivery' ? 'delivery' : 'pickup';
    const deliveryFee = normalizedOrderType === 'delivery' ? DELIVERY_FEE : 0;

    if (normalizedOrderType === 'delivery') {
      const details = orderData.deliveryDetails || {};
      if (!details.hostelNumber || !details.floor || !(details.roomNumber || details.roomNo)) {
        return NextResponse.json({ error: 'Delivery details are required' }, { status: 400 });
      }
    }

    const itemDocs = await Promise.all(
      orderData.items.map(item => db.collection('menuItems').doc(item.id).get())
    );

    const validatedItems = [];
    let computedSubtotal = 0;

    for (let i = 0; i < itemDocs.length; i += 1) {
      const docSnap = itemDocs[i];
      const item = orderData.items[i];
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Invalid menu item' }, { status: 400 });
      }

      const data = docSnap.data();
      const quantity = Number(item.quantity || 0);
      const price = Number(data?.price || 0);

      if (!data?.isAvailable) {
        return NextResponse.json({ error: 'Item is unavailable' }, { status: 400 });
      }

      if (!quantity || quantity <= 0 || !price) {
        return NextResponse.json({ error: 'Invalid order quantities' }, { status: 400 });
      }

      computedSubtotal += price * quantity;
      validatedItems.push({
        id: docSnap.id,
        name: data?.name || item.name,
        price,
        quantity,
      });
    }

    const computedTotal = computedSubtotal + deliveryFee;

    if (Number(orderData.totalAmount) !== computedTotal) {
      return NextResponse.json({ error: 'Order total mismatch' }, { status: 400 });
    }

    try {
      const razorpay = getRazorpayClient();
      const razorpayOrder = await razorpay.orders.fetch(orderId);
      if (Number(razorpayOrder.amount) !== Math.round(computedTotal * 100)) {
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }
    } catch (error) {
      console.error('Razorpay order validation failed', { orderId, paymentId });
      return NextResponse.json({ error: 'Unable to validate payment order' }, { status: 502 });
    }
    const normalizedDelivery = orderData?.deliveryDetails
      ? {
          ...orderData.deliveryDetails,
          roomNumber: orderData.deliveryDetails.roomNumber || orderData.deliveryDetails.roomNo,
        }
      : null;

    const orderNumber = generateOrderNumber();
    const orderRef = await db.collection('orders').add({
      ...orderData,
      items: validatedItems,
      orderType: normalizedOrderType,
      subtotal: computedSubtotal,
      deliveryFee,
      totalAmount: computedTotal,
      deliveryDetails: normalizedDelivery,
      orderNumber,
      status: 'placed',
      paymentStatus: 'paid',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        await db.collection('orders').doc(orderRef.id).collection('items').add(item);
      }
    }

    return NextResponse.json({ orderId: orderRef.id, orderNumber });
  } catch (error) {
    console.error('Payment verification failed', { orderId: body?.razorpay_order_id });
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
