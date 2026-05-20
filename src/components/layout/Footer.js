import Link from 'next/link';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="brand-icon">🍔</span>
            <span className="brand-text">Under<span className="brand-highlight">Delivery</span></span>
          </div>
          <p className="footer-tagline">
            VIT Bhopal food ordering with peer delivery.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/menu">Menu</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/deliver">Deliver</Link>
        </div>

        <div className="footer-meta">
          <span>Powered by UnderBelly Cafe</span>
          <span>© {new Date().getFullYear()} UnderDelivery</span>
        </div>
      </div>
    </footer>
  );
}
