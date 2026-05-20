'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, DELIVERY_FEE, getCafeStatus } from '@/lib/utils';
import Button from '@/components/ui/Button';
import './cart.css';

export default function CartPage() {
  const { items, orderType, setOrderType, updateQuantity, removeItem, subtotal, deliveryFee, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();
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
  const isOverItemLimit = items.length >= 16;

  if (items.length === 0) {
    return (
      <div className="container py-8 cart-container empty">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-secondary mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Button onClick={() => router.push('/menu')} className="btn btn-primary">
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 cart-container">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

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
      
      <div className="cart-grid">
        <div className="cart-items-section glass-card">
          <h2 className="section-title">Order Items</h2>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">{formatPrice(item.price)}</p>
                </div>
                
                <div className="item-controls">
                  <div className="qty-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >-</button>
                    <span className="qty">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-summary-section">
          <div className="glass-card mb-6">
            <h2 className="section-title">Order Options</h2>
            <div className="order-type-selector">
              <label className={`type-option ${orderType === 'pickup' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="orderType" 
                  value="pickup" 
                  checked={orderType === 'pickup'}
                  onChange={() => setOrderType('pickup')}
                />
                <span>🚶‍♂️ Takeout (Pickup)</span>
              </label>
              <label className={`type-option ${orderType === 'delivery' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="orderType" 
                  value="delivery" 
                  checked={orderType === 'delivery'}
                  onChange={() => setOrderType('delivery')}
                />
                <span>🚴 Delivery (+{formatPrice(DELIVERY_FEE)})</span>
              </label>
            </div>
          </div>

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
              onClick={() => router.push('/checkout')}
              className="btn btn-primary btn-full btn-lg mt-6"
              disabled={isCafeClosed || isOverItemLimit}
            >
              Continue to Checkout
            </Button>
            {isOverItemLimit && (
              <p className="text-secondary text-sm mt-4">Please reduce your cart to 15 items or fewer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
