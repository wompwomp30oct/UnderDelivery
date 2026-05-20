'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToOrder } from '@/lib/firebase/firestore';
import { formatDateTime, formatPrice, ORDER_STATUS } from '@/lib/utils';
import Loader from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import './order-detail.css';

const DELIVERY_STEPS = ['placed', 'preparing', 'ready', 'agent_assigned', 'picked_up', 'delivered'];
const PICKUP_STEPS = ['placed', 'preparing', 'ready', 'completed'];

export default function OrderDetailPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile?.role === 'admin') {
      router.push('/admin');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!orderId || profile?.role === 'admin') return;

    const unsubscribe = subscribeToOrder(orderId, (data) => {
      setOrder(data || null);
      setLoadingOrder(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const statusSteps = useMemo(() => {
    if (!order) return [];
    return order.orderType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  }, [order]);

  const activeIndex = useMemo(() => {
    if (!order) return -1;
    return statusSteps.indexOf(order.status);
  }, [order, statusSteps]);

  if (loading || loadingOrder) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8 order-detail">
        <div className="glass-card order-detail-card">
          <h2>Order not found</h2>
          <p className="text-secondary">This order might have been removed or never existed.</p>
          <Button className="btn btn-primary" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS[order.status] || { label: 'Processing', emoji: '⏳', color: 'blue' };

  return (
    <div className="container py-8 order-detail">
      <div className="order-detail-header">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-secondary">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className={`status-pill status-${statusInfo.color}`}>
          <span>{statusInfo.emoji}</span>
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="glass-card order-detail-card">
          <h2 className="section-title">Status Timeline</h2>
          <div className="timeline">
            {statusSteps.map((step, index) => {
              const stepInfo = ORDER_STATUS[step] || { label: step, emoji: '⏳' };
              const isActive = index === activeIndex;
              const isComplete = index < activeIndex;

              return (
                <div key={step} className={`timeline-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                  <div className="timeline-dot">
                    <span>{stepInfo.emoji}</span>
                  </div>
                  <div>
                    <h3>{stepInfo.label}</h3>
                    {isActive && <p className="text-secondary">Current status</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card order-detail-card">
          <h2 className="section-title">Order Summary</h2>
          <div className="order-summary-detail">
            <div>
              <span>Order Type</span>
              <strong>{order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(order.subtotal)}</strong>
            </div>
            {order.orderType === 'delivery' && (
              <div>
                <span>Delivery Fee</span>
                <strong>{formatPrice(order.deliveryFee)}</strong>
              </div>
            )}
            <div className="order-total-row">
              <span>Total</span>
              <strong>{formatPrice(order.totalAmount)}</strong>
            </div>
          </div>

          <div className="order-items-list">
            {order.items?.map(item => (
              <div key={item.id} className="order-item-row">
                <span>{item.name}</span>
                <span>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {order.orderType === 'delivery' && (
          <div className="glass-card order-detail-card">
            <h2 className="section-title">Delivery Details</h2>
            <div className="order-summary-detail">
              <div>
                <span>Hostel</span>
                <strong>{order.deliveryDetails?.hostelNumber || 'TBD'}</strong>
              </div>
              <div>
                <span>Floor</span>
                <strong>{order.deliveryDetails?.floor || 'TBD'}</strong>
              </div>
              <div>
                <span>Room</span>
                <strong>{order.deliveryDetails?.roomNumber || order.deliveryDetails?.roomNo || 'TBD'}</strong>
              </div>
            </div>

            <div className="delivery-info">
              {!order.agent ? (
                <div className="agent-wait">
                  <div className="agent-wait-icon">🚴</div>
                  <div>
                    <h3>Waiting for a delivery partner</h3>
                    <p className="text-secondary">
                      We are matching your order with a nearby student. Timer starts once an agent claims it.
                    </p>
                    <span className="delivery-timer">ETA: 5-10 min</span>
                  </div>
                </div>
              ) : (
                <div className="agent-card">
                  <h3>Delivery Agent</h3>
                  <p>{order.agent.fullName}</p>
                  <p>{order.agent.registrationNumber}</p>
                  <p>{order.agent.phoneNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="order-detail-actions">
        <Button className="btn btn-ghost" onClick={() => router.push('/orders')}>
          Back to Orders
        </Button>
        <Button className="btn btn-primary" onClick={() => router.push('/menu')}>
          Order More
        </Button>
      </div>
    </div>
  );
}
