/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocFromServer,
  getDocs,
  setDoc,
  writeBatch,
  WriteBatch,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  sanitizeForFirestore,
  validatePassword,
  isStandalonePwa,
  shouldFallbackToRedirect,
} from '../utils/firestoreSanitize';

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

// CRITICAL: Must pass firestoreDatabaseId from configuration
export const db = createFirestoreInstance();
export const auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function clearUserLocalStorageCache(uid?: string): void {
  try {
    const prefix = uid ? `stash_user_${uid}_` : 'stash_user_';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage access errors
  }
}

export const FIRESTORE_BATCH_CHUNK_SIZE = 400;

export async function commitFirestoreOpsInChunks<T>(
  items: T[],
  applyOp: (batch: WriteBatch, item: T) => void
): Promise<void> {
  if (items.length === 0) return;
  for (let i = 0; i < items.length; i += FIRESTORE_BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + FIRESTORE_BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) {
      applyOp(batch, item);
    }
    await batch.commit();
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function logFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = logFirestoreError(error, operationType, path);
  throw new Error(JSON.stringify(errInfo));
}

export async function upsertUserProfile(user: FirebaseUser, primaryCurrency: string): Promise<void> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      sanitizeForFirestore({
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        primaryCurrency,
        updatedAt: now,
      }),
      { merge: true }
    );
  } catch (error) {
    logFirestoreError(error, OperationType.WRITE, path);
  }
}

// Connection check when signed in (reads the signed-in user's own document)
export async function testConnection(): Promise<boolean> {
  if (!auth.currentUser) return true;
  try {
    await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local persistent cache.');
    }
    return false;
  }
}

// Auth helpers
export async function consumeGoogleRedirectResult() {
  return await getRedirectResult(auth);
}

export async function signInWithGoogle() {
  if (isStandalonePwa()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (shouldFallbackToRedirect(err)) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  const check = validatePassword(pass);
  if (!check.valid) {
    const err = new Error(check.error) as Error & { code?: string };
    err.code = 'auth/weak-password';
    throw err;
  }
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn('Could not send initial verification email:', err);
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendUserVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('No signed-in user.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function deleteUserAccountAndData(password?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No signed-in user.');
  }

  const hasPasswordProvider = currentUser.providerData.some((p) => p.providerId === 'password');
  const hasGoogleProvider = currentUser.providerData.some((p) => p.providerId === 'google.com');

  // Re-authenticate proactively if credentials are supplied or session may be stale
  if (hasPasswordProvider && currentUser.email && password) {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  } else if (hasGoogleProvider) {
    const lastSignInMs = currentUser.metadata.lastSignInTime
      ? Date.parse(currentUser.metadata.lastSignInTime)
      : 0;
    if (!lastSignInMs || Date.now() - lastSignInMs > 4 * 60 * 1000) {
      await reauthenticateWithPopup(currentUser, googleProvider);
    }
  }

  const uid = currentUser.uid;
  const [accSnap, txSnap, pledgeSnap, savingsSnap, categorySnap, budgetSnap] = await Promise.all([
    getDocs(collection(db, `users/${uid}/accounts`)),
    getDocs(collection(db, `users/${uid}/transactions`)),
    getDocs(collection(db, `users/${uid}/charity_pledges`)),
    getDocs(collection(db, `users/${uid}/savings_goals`)),
    getDocs(collection(db, `users/${uid}/categories`)),
    getDocs(collection(db, `users/${uid}/budgets`)),
  ]);

  const refs: DocumentReference[] = [
    ...accSnap.docs.map((d) => d.ref),
    ...txSnap.docs.map((d) => d.ref),
    ...pledgeSnap.docs.map((d) => d.ref),
    ...savingsSnap.docs.map((d) => d.ref),
    ...categorySnap.docs.map((d) => d.ref),
    ...budgetSnap.docs.map((d) => d.ref),
    doc(db, 'users', uid),
  ];

  await commitFirestoreOpsInChunks(refs, (batch, ref) => batch.delete(ref));
  clearUserLocalStorageCache(uid);
  clearUserLocalStorageCache();
  await deleteUser(currentUser);
}

export async function logoutUser() {
  await signOut(auth);
}
