import 'server-only';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { User } from '@clerk/nextjs/server';
import type { ShopProfile } from '../types';

export function getFirebaseApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId && !process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const app = getApps().find((candidate) => candidate.name === 'zdrop-profiles') ||
    initializeApp({
      projectId,
      credential: privateKey ? cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }) : applicationDefault(),
    }, 'zdrop-profiles');
  return app;
}

export function getProfilesDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getGoogleAccount(user: User) {
  return user.externalAccounts.find(({ provider, verification }) =>
    (provider === 'google' || provider === 'oauth_google') && verification?.status === 'verified'
  );
}

export async function saveUserProfile(
  db: NonNullable<ReturnType<typeof getProfilesDb>>,
  user: User,
  shop?: ShopProfile | null,
) {
  if (shop && shop.ownerId !== user.id) throw new Error('Shop owner does not match the signed-in user.');

  const google = getGoogleAccount(user);
  const profile = db.collection('users').doc(user.id);
  const data = {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.firstName || 'User',
    avatarUrl: user.imageUrl,
    provider: google ? 'google.com' : null,
    role: shop ? 'shop_owner' : 'user',
    shopId: shop?.id ?? null,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
  };

  await profile.set(data, { merge: true });
}
