// Firestore database helpers
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ---- Menu Items ----

export async function getMenuItems() {
  const q = query(
    collection(db, 'menuItems'),
    where('isAvailable', '==', true),
    orderBy('category'),
    orderBy('sortOrder')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllMenuItems() {
  const q = query(collection(db, 'menuItems'), orderBy('category'), orderBy('sortOrder'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addMenuItem(item) {
  return addDoc(collection(db, 'menuItems'), {
    ...item,
    isAvailable: true,
    sortOrder: item.sortOrder || 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateMenuItem(id, data) {
  return updateDoc(doc(db, 'menuItems', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(id) {
  return deleteDoc(doc(db, 'menuItems', id));
}

// ---- Orders ----

export async function createOrder(orderData) {
  // Generate a simple order number (last 4 digits of timestamp + random)
  const orderNumber = Math.floor(1000 + Math.random() * 9000);

  const orderRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    orderNumber,
    status: 'placed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add order items as sub-collection
  if (orderData.items && orderData.items.length > 0) {
    for (const item of orderData.items) {
      await addDoc(collection(db, 'orders', orderRef.id, 'items'), item);
    }
  }

  return { id: orderRef.id, orderNumber };
}

export async function getOrder(orderId) {
  const docSnap = await getDoc(doc(db, 'orders', orderId));
  if (!docSnap.exists()) return null;

  // Get order items
  const itemsSnap = await getDocs(collection(db, 'orders', orderId, 'items'));
  const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { id: docSnap.id, ...docSnap.data(), items };
}

export async function getUserOrders(userId) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateOrderStatus(orderId, status, additionalData = {}) {
  return updateDoc(doc(db, 'orders', orderId), {
    status,
    ...additionalData,
    updatedAt: serverTimestamp(),
  });
}

// ---- Real-time Listeners ----

export function subscribeToOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
}

export function subscribeToUserOrders(userId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
}

// ---- Delivery ----

export function subscribeToAvailableDeliveries(callback) {
  const q = query(
    collection(db, 'orders'),
    where('orderType', '==', 'delivery'),
    where('status', '==', 'ready'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
}

export async function claimDelivery(orderId, agentData) {
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + 40);

  return updateDoc(doc(db, 'orders', orderId), {
    status: 'agent_assigned',
    agent: {
      agentId: agentData.agentId,
      fullName: agentData.fullName,
      registrationNumber: agentData.registrationNumber,
      phoneNumber: agentData.phoneNumber,
      claimedAt: Timestamp.now(),
      deliveryDeadline: Timestamp.fromDate(deadline),
      deliveredAt: null,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function markPickedUp(orderId) {
  return updateDoc(doc(db, 'orders', orderId), {
    status: 'picked_up',
    updatedAt: serverTimestamp(),
  });
}

export async function markDelivered(orderId) {
  return updateDoc(doc(db, 'orders', orderId), {
    status: 'delivered',
    'agent.deliveredAt': Timestamp.now(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToAgentOrders(agentId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('agent.agentId', '==', agentId),
    where('status', 'in', ['agent_assigned', 'picked_up']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
}

// ---- Admin ----

export function subscribeToAllOrders(callback) {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
}
