import { NextResponse } from 'next/server';
import { getRazorpayClient, getRazorpayKeyId } from '@/lib/razorpay';
import { DELIVERY_FEE, getCafeStatus } from '@/lib/utils';
import { getAdminAuth, getAdminDb, hasAdminConfig } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    if (!hasAdminConfig()) {
      console.error('Create-order failed: missing server configuration');
      return NextResponse.json({ error: 'Missing server configuration' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      console.error('Create-order failed: missing auth token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const amount = Number(body?.amount);
    const currency = body?.currency || 'INR';
    const receipt = body?.receipt || `order_${Date.now()}`;
    const notes = body?.notes || {};
    const items = body?.items || [];
    const orderType = body?.orderType === 'delivery' ? 'delivery' : 'pickup';

    const cafeStatus = getCafeStatus();
    if (!cafeStatus.isOpen) {
      console.error('Create-order blocked: cafe closed');
      return NextResponse.json({ error: 'Cafe is closed' }, { status: 400 });
    }

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      console.error('Create-order failed: invalid amount', { amount });
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Create-order failed: missing items');
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    if (items.length >= 16) {
      console.error('Create-order failed: too many items');
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    const db = getAdminDb();
    const itemDocs = await Promise.all(
      items.map(item => db.collection('menuItems').doc(item.id).get())
    );

    let computedSubtotal = 0;
    for (let i = 0; i < itemDocs.length; i += 1) {
      const docSnap = itemDocs[i];
      const item = items[i];
      if (!docSnap.exists) {
        console.error('Create-order failed: invalid menu item');
        return NextResponse.json({ error: 'Invalid menu item' }, { status: 400 });
      }

      const data = docSnap.data();
      const quantity = Number(item.quantity || 0);
      const price = Number(data?.price || 0);

      if (!data?.isAvailable) {
        console.error('Create-order failed: item unavailable');
        return NextResponse.json({ error: 'Item is unavailable' }, { status: 400 });
      }

      if (!quantity || quantity <= 0 || !price) {
        console.error('Create-order failed: invalid quantities');
        return NextResponse.json({ error: 'Invalid order quantities' }, { status: 400 });
      }

      computedSubtotal += price * quantity;
    }

    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const computedTotal = computedSubtotal + deliveryFee;

    if (Math.round(amount) !== Math.round(computedTotal * 100)) {
      console.error('Create-order failed: amount mismatch', { amount, computedTotal });
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes,
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (error) {
    console.error('Create-order failed', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
