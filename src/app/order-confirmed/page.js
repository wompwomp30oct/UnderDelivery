'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import './order-confirmed.css';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', emoji: '⏳' },
  { key: 'preparing', label: 'Food Being Prepared', emoji: '👨‍🍳' },
  { key: 'ready', label: 'Food Ready', emoji: '✅' },
  { key: 'agent_assigned', label: 'Delivery Agent Assigned', emoji: '🚴' },
  { key: 'picked_up', label: 'Agent Picked Up', emoji: '📦' },
  { key: 'delivered', label: 'Delivered', emoji: '🎉' },
];

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderNumber = searchParams.get('orderNumber');
  const orderId = searchParams.get('orderId');

  const heading = useMemo(() => {
    if (orderNumber) {
      return `Order #${orderNumber} confirmed!`;
    }
    return 'Order confirmed!';
  }, [orderNumber]);

  return (
    <div className="container py-8 order-confirmed">
      <div className="glass-card confirmation-card">
        <div className="confirmation-header">
          <div className="confirmation-icon">🎉</div>
          <h1>{heading}</h1>
          <p>Your order is now in the queue. We will keep updating the status here.</p>
          <div className="confirmation-meta">
            <span className="order-id">Status: ⏳ Order Placed</span>
            {orderId && (
              <button
                type="button"
                className="order-link"
                onClick={() => router.push(`/orders/${orderId}`)}
              >
                View Live Status
              </button>
            )}
          </div>
        </div>

        <div className="status-timeline">
          {STATUS_STEPS.map((step, index) => (
            <div key={step.key} className="status-step">
              <div className="status-badge">
                <span>{step.emoji}</span>
              </div>
              <div className="status-content">
                <span className="status-label">{step.label}</span>
                {index === 0 && <span className="status-note">Current status</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="confirmation-actions">
          <Button
            className="btn btn-primary"
            onClick={() => router.push('/orders')}
          >
            View My Orders
          </Button>
          <Button
            className="btn btn-ghost"
            onClick={() => router.push('/menu')}
          >
            Order More
          </Button>
        </div>
      </div>
    </div>
  );
}
