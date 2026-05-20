'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToAllOrders, updateOrderStatus } from '@/lib/firebase/firestore';
import { formatDateTime, ORDER_STATUS } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import './admin.css';

const ADMIN_STATUSES = ['placed', 'preparing', 'ready', 'completed'];

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile?.role !== 'admin') {
      router.push('/select-role');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data || []);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const ordersByStatus = useMemo(() => {
    return ADMIN_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter(order => order.status === status);
      return acc;
    }, {});
  }, [orders]);

  const setOrderLoading = (orderId, value) => {
    setActionLoading(prev => ({ ...prev, [orderId]: value }));
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setOrderLoading(orderId, true);
      await updateOrderStatus(orderId, status);
      addToast(`Order updated to ${ORDER_STATUS[status]?.label || status}.`, 'success');
    } catch (error) {
      console.error('Failed to update order', error);
      addToast('Failed to update order status.', 'error');
    } finally {
      setOrderLoading(orderId, false);
    }
  };

  if (loading || loadingOrders) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8 admin-page">
      <header className="admin-header">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-secondary">Manage live orders and update kitchen status.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/menu" className="btn btn-ghost">
            Manage Menu
          </Link>
          <div className="admin-metric glass-card">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="admin-empty-state glass-card">
          <h2>No live orders yet</h2>
          <p className="text-secondary">New orders will appear here as soon as students place them.</p>
          <Button
            className="btn btn-primary"
            onClick={() => router.push('/admin/menu')}
          >
            Manage Menu
          </Button>
        </div>
      ) : (
        <div className="admin-columns">
          {ADMIN_STATUSES.map(status => (
            <div key={status} className="admin-column">
              <div className="admin-column-header">
                <span>{ORDER_STATUS[status]?.label || status}</span>
                <span className="admin-count">{ordersByStatus[status]?.length || 0}</span>
              </div>

              <div className="admin-orders">
                {ordersByStatus[status]?.length === 0 ? (
                  <div className="admin-empty">No orders</div>
                ) : (
                  ordersByStatus[status].map(order => (
                    <div key={order.id} className="admin-card glass-card">
                      <div className="admin-card-header">
                        <div>
                          <h3>Order #{order.orderNumber}</h3>
                          <span className="admin-time">{formatDateTime(order.createdAt)}</span>
                        </div>
                        <span className="admin-type">{order.orderType}</span>
                      </div>

                      <div className="admin-card-body">
                        <p className="admin-customer">{order.customerName}</p>
                        <p className="admin-items">{order.items?.length || 0} items</p>
                      </div>

                      <div className="admin-actions">
                        {status === 'placed' && (
                          <Button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            isLoading={actionLoading[order.id]}
                          >
                            Mark Preparing
                          </Button>
                        )}
                        {status === 'preparing' && (
                          <Button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            isLoading={actionLoading[order.id]}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {status === 'ready' && order.orderType === 'pickup' && (
                          <Button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            isLoading={actionLoading[order.id]}
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
