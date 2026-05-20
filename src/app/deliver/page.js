'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  claimDelivery,
  markDelivered,
  markPickedUp,
  subscribeToAvailableDeliveries,
  subscribeToAgentOrders,
} from '@/lib/firebase/firestore';
import { formatDateTime, formatPrice, getTimeRemaining } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import './deliver.css';

export default function DeliverPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [claimedOrders, setClaimedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile?.role === 'admin') {
      addToast('Admins cannot claim deliveries.', 'error');
      router.push('/admin');
    }
  }, [loading, user, profile, router, addToast]);

  useEffect(() => {
    if (!user || profile?.role === 'admin') return;

    const unsubscribeAvailable = subscribeToAvailableDeliveries((orders) => {
      setAvailableOrders(orders || []);
      setLoadingOrders(false);
    });

    const unsubscribeClaimed = subscribeToAgentOrders(user.uid, (orders) => {
      setClaimedOrders(orders || []);
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeClaimed();
    };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const deliveryCount = useMemo(() => claimedOrders.length, [claimedOrders]);

  const handleClaim = async (order) => {
    if (!user || !profile) {
      addToast('Complete your profile before claiming deliveries.', 'error');
      return;
    }

    try {
      await claimDelivery(order.id, {
        agentId: user.uid,
        fullName: profile.fullName,
        registrationNumber: profile.registrationNumber,
        phoneNumber: profile.phone,
      });
      addToast(`Order #${order.orderNumber} claimed.`, 'success');
    } catch (error) {
      addToast('Unable to claim delivery. Please try again.', 'error');
    }
  };

  const setOrderLoading = (orderId, value) => {
    setActionLoading(prev => ({ ...prev, [orderId]: value }));
  };

  const handlePickedUp = async (orderId) => {
    try {
      setOrderLoading(orderId, true);
      await markPickedUp(orderId);
      addToast('Marked as picked up.', 'success');
    } catch (error) {
      addToast('Unable to update status. Please try again.', 'error');
    } finally {
      setOrderLoading(orderId, false);
    }
  };

  const handleDelivered = async (orderId) => {
    try {
      setOrderLoading(orderId, true);
      await markDelivered(orderId);
      addToast('Delivery completed. Nice work!', 'success');
    } catch (error) {
      addToast('Unable to update status. Please try again.', 'error');
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
    <div className="container py-8 deliver-page">
      <header className="deliver-header">
        <div>
          <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
          <p className="text-secondary">Claim deliveries and earn {formatPrice(50)} per order.</p>
        </div>
        <div className="delivery-metrics glass-card">
          <span>Claimed</span>
          <strong>{deliveryCount}</strong>
        </div>
      </header>

      <section className="deliver-section">
        <h2 className="section-title">Available Orders</h2>
        {availableOrders.length === 0 ? (
          <div className="empty-state text-center py-12">
            <div className="text-5xl mb-4">🛵</div>
            <h3>No deliveries right now</h3>
            <p className="text-secondary">New delivery orders will appear here once they are ready.</p>
          </div>
        ) : (
          <div className="deliver-grid">
            {availableOrders.map(order => (
              <div key={order.id} className="deliver-card glass-card">
                <div className="deliver-card-header">
                  <div>
                    <h3>Order #{order.orderNumber}</h3>
                    <span className="deliver-time">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <span className="deliver-fee">+{formatPrice(50)}</span>
                </div>
                <div className="deliver-card-body">
                  <div className="deliver-row">
                    <span>Hostel</span>
                    <strong>{order.deliveryDetails?.hostelNumber || 'TBD'}</strong>
                  </div>
                  <div className="deliver-row">
                    <span>Floor</span>
                    <strong>{order.deliveryDetails?.floor || 'TBD'}</strong>
                  </div>
                  <div className="deliver-row">
                    <span>Room</span>
                    <strong>{order.deliveryDetails?.roomNumber || order.deliveryDetails?.roomNo || 'TBD'}</strong>
                  </div>
                </div>
                <Button
                  className="btn btn-primary btn-full"
                  onClick={() => handleClaim(order)}
                >
                  Claim Delivery
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="deliver-section">
        <h2 className="section-title">My Active Deliveries</h2>
        {claimedOrders.length === 0 ? (
          <div className="empty-state text-center py-12">
            <div className="text-5xl mb-4">🚴</div>
            <h3>No active deliveries</h3>
            <p className="text-secondary">Claim an order to start delivering.</p>
          </div>
        ) : (
          <div className="deliver-grid">
            {claimedOrders.map(order => {
              const timer = getTimeRemaining(order.agent?.deliveryDeadline);
              const timerLabel = timer ? timer.text : '—';
              const isExpired = timer?.expired;
              const isLoading = actionLoading[order.id];

              return (
              <div key={order.id} className="deliver-card glass-card">
                <div className="deliver-card-header">
                  <div>
                    <h3>Order #{order.orderNumber}</h3>
                    <span className="deliver-time">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <span className="deliver-fee">{order.status.replace('_', ' ')}</span>
                </div>
                <div className="deliver-card-body">
                  <div className="deliver-row">
                    <span>Hostel</span>
                    <strong>{order.deliveryDetails?.hostelNumber || 'TBD'}</strong>
                  </div>
                  <div className="deliver-row">
                    <span>Floor</span>
                    <strong>{order.deliveryDetails?.floor || 'TBD'}</strong>
                  </div>
                  <div className="deliver-row">
                    <span>Room</span>
                    <strong>{order.deliveryDetails?.roomNumber || order.deliveryDetails?.roomNo || 'TBD'}</strong>
                  </div>
                </div>
                <div className="deliver-status">
                  <span>Deadline: {formatDateTime(order.agent?.deliveryDeadline)}</span>
                  <span className={`deliver-timer ${isExpired ? 'expired' : ''}`}>⏱️ {timerLabel}</span>
                </div>
                <div className="deliver-actions">
                  {order.status === 'agent_assigned' && (
                    <Button
                      className="btn btn-primary btn-full"
                      onClick={() => handlePickedUp(order.id)}
                      isLoading={isLoading}
                    >
                      Mark Picked Up
                    </Button>
                  )}
                  {order.status === 'picked_up' && (
                    <Button
                      className="btn btn-primary btn-full"
                      onClick={() => handleDelivered(order.id)}
                      isLoading={isLoading}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            );})}
          </div>
        )}
      </section>
    </div>
  );
}
