import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { ToastProvider } from '@/hooks/useToast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'UnderDelivery — VIT Bhopal Food Ordering',
  description: 'Order food from UnderBelly cafe and get it delivered to your hostel by fellow students. Takeout & delivery for VIT Bhopal.',
  keywords: 'VIT Bhopal, food ordering, cafe, delivery, UnderBelly, campus food',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main className="page-wrapper">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
