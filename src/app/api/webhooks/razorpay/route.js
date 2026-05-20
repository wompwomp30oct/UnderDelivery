import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminDb, hasAdminConfig } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    if (!hasAdminConfig()) {
      return NextResponse.json({ error: 'Missing server configuration' }, { status: 500 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
    }

    const signature = request.headers.get('x-razorpay-signature');
    const rawBody = await request.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;
    const orderId = payload?.payload?.payment?.entity?.order_id
      || payload?.payload?.order?.entity?.id;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    if (event !== 'payment.captured' && event !== 'order.paid') {
      return NextResponse.json({ received: true });
    }

    const db = getAdminDb();
    const snapshot = await db.collection('orders').where('razorpayOrderId', '==', orderId).get();

    if (snapshot.empty) {
      return NextResponse.json({ received: true });
    }

    const updates = snapshot.docs.map(doc => doc.ref.update({
      paymentStatus: 'paid',
      updatedAt: FieldValue.serverTimestamp(),
    }));

    await Promise.all(updates);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
