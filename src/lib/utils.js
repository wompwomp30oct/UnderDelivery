// Utility helper functions

/**
 * Format price in INR
 */
export function formatPrice(amount) {
  return `₹${Number(amount).toFixed(0)}`;
}

/**
 * Format date/time
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp) {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
}

/**
 * Get remaining time until deadline
 */
export function getTimeRemaining(deadline) {
  if (!deadline) return null;
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const diff = deadlineDate - now;
  
  if (diff <= 0) return { expired: true, minutes: 0, seconds: 0, text: 'Expired' };
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return {
    expired: false,
    minutes,
    seconds,
    text: `${minutes}:${String(seconds).padStart(2, '0')}`,
  };
}

/**
 * Order status display mapping
 */
export const ORDER_STATUS = {
  placed: { label: 'Order Placed', emoji: '⏳', color: 'blue' },
  preparing: { label: 'Food Being Prepared', emoji: '👨‍🍳', color: 'yellow' },
  ready: { label: 'Food Ready', emoji: '✅', color: 'green' },
  agent_assigned: { label: 'Delivery Agent Assigned', emoji: '🚴', color: 'purple' },
  picked_up: { label: 'Agent Picked Up', emoji: '📦', color: 'orange' },
  delivered: { label: 'Delivered', emoji: '🎉', color: 'green' },
  completed: { label: 'Completed', emoji: '✅', color: 'green' },
};

/**
 * Menu category labels
 */
export const CATEGORIES = {
  snacks: { label: 'Snacks', emoji: '🍟' },
  meals: { label: 'Meals', emoji: '🍛' },
  beverages: { label: 'Beverages', emoji: '☕' },
  desserts: { label: 'Desserts', emoji: '🍰' },
};

/**
 * Generate a unique order ID (human-readable)
 */
export function generateOrderNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * Delivery fee (₹50)
 */
export const DELIVERY_FEE = 50;

/**
 * Delivery timeout in minutes
 */
export const DELIVERY_TIMEOUT_MINUTES = 40;

// ---- Cafe Operating Hours ----

export const CAFE_TIMEZONE = 'Asia/Kolkata';

export const CAFE_SCHEDULE = {
  mon: { open: '10:00', close: '17:30' },
  tue: { open: '10:00', close: '17:30' },
  wed: { open: '10:00', close: '17:30' },
  thu: { open: '10:00', close: '17:30' },
  fri: { open: '10:00', close: '17:30' },
  sat: { open: '10:00', close: '17:30' },
  sun: null,
};

const WEEKDAY_KEYS = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function getCafeStatus(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CAFE_TIMEZONE,
  }).formatToParts(date);

  const weekdayPart = parts.find(part => part.type === 'weekday');
  const hourPart = parts.find(part => part.type === 'hour');
  const minutePart = parts.find(part => part.type === 'minute');

  const weekdayKey = WEEKDAY_KEYS[weekdayPart?.value] || 'sun';
  const schedule = CAFE_SCHEDULE[weekdayKey];
  const currentMinutes = Number(hourPart?.value || 0) * 60 + Number(minutePart?.value || 0);

  if (!schedule) {
    return {
      isOpen: false,
      opensAt: null,
      closesAt: null,
      timezone: CAFE_TIMEZONE,
      weekday: weekdayKey,
    };
  }

  const openMinutes = toMinutes(schedule.open);
  const closeMinutes = toMinutes(schedule.close);
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  return {
    isOpen,
    opensAt: schedule.open,
    closesAt: schedule.close,
    timezone: CAFE_TIMEZONE,
    weekday: weekdayKey,
  };
}
