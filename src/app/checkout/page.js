'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, DELIVERY_FEE, getCafeStatus } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Script from 'next/script';
import '../cart/cart.css';

export default function CheckoutPage() {
  const {
    items,
    orderType,
    deliveryDetails,
    setDeliveryDetails,
    subtotal,
    deliveryFee,
    total,
    clearCart,
  } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const cafeStatus = useMemo(() => getCafeStatus(now), [now]);
  const isCafeClosed = !cafeStatus.isOpen;

  const handleDeliveryChange = (e) => {
    setDeliveryDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayment = async () => {
    if (loading) return;
    if (!user || !profile) {
      addToast('Please log in to continue with payment.', 'error');
      router.push('/');
      return;
    }
    if (isCafeClosed) {
      addToast('Cafe is closed. Please try during operating hours.', 'error');
      return;
    }

    if (orderType === 'delivery') {
      const { hostelNumber, floor, roomNo } = deliveryDetails;
      if (!hostelNumber || !floor || !roomNo) {
        addToast('Please fill in all delivery details', 'error');
        return;
      }
    }

    if (items.length >= 16) {
      addToast('Please reduce your cart to 15 items or fewer.', 'error');
      return;
    }

    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const orderData = {
        customerId: user.uid,
        customerName: profile.fullName,
        customerPhone: profile.phone,
        customerRegNo: profile.registrationNumber,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryFee,
        totalAmount: total,
        orderType,
        deliveryDetails: orderType === 'delivery'
          ? { ...deliveryDetails, roomNumber: deliveryDetails.roomNo }
          : null,
      };

      const createResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          amount: total * 100,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            customerId: user.uid,
          },
          orderType,
          items: orderData.items,
        }),
      });

      if (!createResponse.ok) {
        const errorPayload = await createResponse.json().catch(() => ({}));
        const message = errorPayload?.error === 'Item is unavailable'
          ? 'Some items are unavailable. Please update your cart.'
          : errorPayload?.error === 'Cafe is closed'
            ? 'Cafe is closed. Please try during operating hours.'
            : errorPayload?.error === 'Too many items'
              ? 'Please reduce your cart to 15 items or fewer.'
              : errorPayload?.error || 'Failed to create payment order';
        throw new Error(message);
      }

      const createPayload = await createResponse.json();

      const options = {
        key: createPayload.keyId,
        amount: createPayload.amount,
        currency: createPayload.currency,
        name: 'UnderDelivery',
        description: 'Food Order Payment',
        order_id: createPayload.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderData,
              }),
            });

            if (!verifyResponse.ok) {
              const errorPayload = await verifyResponse.json().catch(() => ({}));
              throw new Error(errorPayload?.error || 'Payment verification failed');
            }

            const verified = await verifyResponse.json();
            clearCart();
            addToast(`Payment successful! Order #${verified.orderNumber} placed.`, 'success');
            router.push(`/order-confirmed?orderId=${verified.orderId}&orderNumber=${verified.orderNumber}`);
          } catch (error) {
            addToast(error?.message || 'Failed to verify payment', 'error');
            setLoading(false);
          }
        },
        prefill: {
          name: profile?.fullName || '',
          email: user?.email || '',
          contact: profile?.phone || '',
        },
        theme: {
          color: '#f97316',
        },
      };

      if (!window?.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function () {
        addToast('Payment Failed', 'error');
        setLoading(false);
      });
      rzp1.open();
    } catch (error) {
      addToast(error?.message || 'Unable to start payment', 'error');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-8 cart-container empty">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-secondary mb-8">Add items before checking out.</p>
          <Button onClick={() => router.push('/menu')} className="btn btn-primary">
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="container py-8 cart-container">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {isCafeClosed && (
          <div className="notice-banner">
            <span className="notice-icon">⏰</span>
            <div>
              <strong>Cafe is closed right now.</strong>
              <p className="text-secondary">
                Orders are accepted Mon–Sat {cafeStatus.opensAt}–{cafeStatus.closesAt} ({cafeStatus.timezone}).
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="notice-banner processing-banner">
            <span className="notice-icon">⌛</span>
            <div>
              <strong>Processing payment...</strong>
              <p className="text-secondary">Please complete the Razorpay checkout window.</p>
            </div>
          </div>
        )}
        <div className="cart-grid">
          <div className="cart-items-section glass-card">
            <h2 className="section-title">Delivery Details</h2>
            {orderType === 'delivery' ? (
              <div className="delivery-form animate-fade-in-up">
                <div className="form-group mb-4">
                  <label className="form-label">Hostel Block / Name</label>
                  <input
                    type="text"
                    name="hostelNumber"
                    className="form-input"
                    value={deliveryDetails.hostelNumber}
                    onChange={handleDeliveryChange}
                    placeholder="e.g. Block 1, Block 2"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-grid mb-4">
                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      name="floor"
                      className="form-input"
                      value={deliveryDetails.floor}
                      onChange={handleDeliveryChange}
                      placeholder="e.g. 3rd"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room No.</label>
                    <input
                      type="text"
                      name="roomNo"
                      className="form-input"
                      value={deliveryDetails.roomNo}
                      onChange={handleDeliveryChange}
                      placeholder="e.g. 312"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <p className="text-secondary text-sm">
                  Delivery fee: {formatPrice(DELIVERY_FEE)}
                </p>
              </div>
            ) : (
              <p className="text-secondary">Pickup order — no delivery details needed.</p>
            )}
          </div>

          <div className="cart-summary-section">
            <div className="glass-card summary-card">
              <h2 className="section-title">Order Summary</h2>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="summary-row">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total to Pay</span>
                  <span className="total-amount">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="btn btn-primary btn-full btn-lg mt-6"
                isLoading={loading}
                disabled={isCafeClosed || loading}
              >
                Pay {formatPrice(total)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
