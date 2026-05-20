'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToUserOrders } from '@/lib/firebase/firestore';
import { formatDateTime, formatPrice, ORDER_STATUS } from '@/lib/utils';
import Loader from '@/components/ui/Loader';
import './orders.css';

export default function OrdersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
    if (!user || profile?.role === 'admin') return;

    const unsubscribe = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data || []);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || loadingOrders) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8 orders-page">
      <div className="orders-header">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-secondary">Track your latest UnderBelly orders in real time.</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state text-center py-12">
          <div className="text-5xl mb-4">📦</div>
          <h3>No orders yet</h3>
          <p className="text-secondary">Your order history will appear here once you place an order.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status] || { label: 'Processing', emoji: '⏳', color: 'blue' };
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="order-card-link">
                <div className="order-card glass-card">
                  <div className="order-card-header">
                    <div>
                      <h3>Order #{order.orderNumber}</h3>
                      <span className="order-time">{formatDateTime(order.createdAt)}</span>
                    </div>
                    <div className={`status-pill status-${status.color}`}>
                      <span>{status.emoji}</span>
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-items">
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item.id} className="order-item">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <span className="order-more">+{order.items.length - 3} more items</span>
                      )}
                    </div>

                    <div className="order-summary">
                      <span>{order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                      <span className="order-total">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
