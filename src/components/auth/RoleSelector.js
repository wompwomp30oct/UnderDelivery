import Link from 'next/link';

export default function RoleSelector({ role }) {
  return (
    <div className="container role-container animate-fade-in">
      <div className="role-header text-center">
        <h1>What would you like to do?</h1>
        <p>Choose an option below to continue</p>
        {role === 'admin' && (
          <p className="text-secondary role-admin-note">You are signed in as an admin.</p>
        )}
      </div>

      <div className="role-cards">
        {role === 'admin' && (
          <Link href="/admin/menu" className="role-card glass-card admin-card stagger-1">
            <div className="role-icon">🧑‍🍳</div>
            <h2>Manage Menu</h2>
            <p>Update UnderBelly menu items, availability, and pricing.</p>
            <div className="role-action">
              Open Admin Panel <span className="arrow">→</span>
            </div>
          </Link>
        )}
        {role !== 'admin' && (
          <>
            <Link href="/menu" className="role-card glass-card order-card stagger-1">
              <div className="role-icon">🍔</div>
              <h2>Order Food</h2>
              <p>Browse the UnderBelly menu, order your favorite food, and get it delivered to your hostel room.</p>
              <div className="role-action">
                Start Ordering <span className="arrow">→</span>
              </div>
            </Link>

            <Link href="/deliver" className="role-card glass-card deliver-card stagger-2">
              <div className="role-icon">🚴</div>
              <h2>Make a Delivery</h2>
              <p>Pick up food from the academic block and deliver it to fellow students to earn ₹50 per delivery.</p>
              <div className="role-action">
                View Deliveries <span className="arrow">→</span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
