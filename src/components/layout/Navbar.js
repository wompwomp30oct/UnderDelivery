'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();

  // Don't show navbar on login/register pages
  if (pathname === '/' || pathname === '/register') return null;

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner container">
        <Link href="/select-role" className="navbar-brand" id="nav-logo">
          <span className="brand-icon">🍔</span>
          <span className="brand-text">Under<span className="brand-highlight">Delivery</span></span>
        </Link>

        <div className="navbar-links">
          {user && (
            <>
              <Link
                href="/menu"
                className={`nav-link ${pathname === '/menu' ? 'active' : ''}`}
                id="nav-menu"
              >
                🍽️ Menu
              </Link>
              {profile?.role !== 'admin' && (
                <Link
                  href="/orders"
                  className={`nav-link ${pathname === '/orders' ? 'active' : ''}`}
                  id="nav-orders"
                >
                  📋 My Orders
                </Link>
              )}
              {profile?.role !== 'admin' && (
                <Link
                  href="/deliver"
                  className={`nav-link ${pathname === '/deliver' ? 'active' : ''}`}
                  id="nav-deliver"
                >
                  🚴 Deliver
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
                  id="nav-admin"
                >
                  ⚙️ Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user && (
            <>
              <Link href="/cart" className="cart-btn" id="nav-cart">
                🛒
                {itemCount > 0 && (
                  <span className="cart-badge">{itemCount}</span>
                )}
              </Link>
              <div className="user-menu">
                <span className="user-name">{profile?.fullName?.split(' ')[0] || 'Student'}</span>
                <button onClick={logout} className="btn btn-ghost btn-sm" id="nav-logout">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
