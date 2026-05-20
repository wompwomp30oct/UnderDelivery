// Firebase Auth helpers with @vitbhopal.ac.in domain restriction
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

const ALLOWED_DOMAIN = 'vitbhopal.ac.in';

/**
 * Validate that an email belongs to VIT Bhopal
 */
export function isValidVITEmail(email) {
  if (!email) return false;
  const domain = email.split('@')[1];
  return domain === ALLOWED_DOMAIN;
}

/**
 * Register a new user with VIT Bhopal email
 */
export async function registerUser({ email, password, fullName, registrationNumber, phone }) {
  // Validate email domain
  if (!isValidVITEmail(email)) {
    throw new Error('Only @vitbhopal.ac.in email addresses are allowed');
  }

  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    fullName,
    email,
    phone,
    registrationNumber,
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Send verification email
  await sendEmailVerification(user);

  return user;
}

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
  if (!isValidVITEmail(email)) {
    throw new Error('Only @vitbhopal.ac.in email addresses are allowed');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  await firebaseSignOut(auth);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
