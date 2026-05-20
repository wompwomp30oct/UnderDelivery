import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function hasAdminConfig() {
  return Boolean(projectId && clientEmail && privateKey);
}

export function getAdminDb() {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Missing Firebase Admin credentials');
  }
  return getFirestore(app);
}

export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Missing Firebase Admin credentials');
  }
  return getAuth(app);
}
