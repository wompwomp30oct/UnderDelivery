import Razorpay from 'razorpay';

let razorpayClient;

/**
 * Returns a Razorpay client instance. If mock mode is enabled via the
 * `NEXT_PUBLIC_ENABLE_RAZORPAY` environment variable (false by default),
 * a lightweight mock client is returned that mimics the two methods used
 * in the codebase: `orders.create` and `orders.fetch`.
 *
 * The mock client stores created orders in a simple in‑memory map.
 */
export function getRazorpayClient() {
  const enableRazorpay = process.env.NEXT_PUBLIC_ENABLE_RAZORPAY === 'true';
  if (!enableRazorpay) {
    // Simple mock client – stores orders in a map
    const mockStore = new Map();
    return {
      orders: {
        create: async ({ amount, currency, receipt, notes }) => {
          const id = `mock_${Date.now()}`;
          const order = { id, amount, currency, receipt, notes };
          mockStore.set(id, order);
          return order;
        },
        fetch: async (orderId) => {
          const order = mockStore.get(orderId);
          if (!order) throw new Error('Mock order not found');
          return order;
        },
      },
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay server keys');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || '';
}
