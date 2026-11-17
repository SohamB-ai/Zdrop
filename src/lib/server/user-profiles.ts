import 'server-only';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { User } from '@clerk/nextjs/server';

export function getProfilesDb() {
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
  return getFirestore(app);
}

export function getGoogleAccount(user: User) {
  return user.externalAccounts.find(({ provider, verification }) =>
    (provider === 'google' || provider === 'oauth_google') && verification?.status === 'verified'
  );
}

export async function saveUserProfile(db: NonNullable<ReturnType<typeof getProfilesDb>>, user: User, shopId?: string) {
  const google = getGoogleAccount(user);
  await db.collection('users').doc(user.id).set({
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.firstName || 'User',
    avatarUrl: user.imageUrl,
    provider: google ? 'google.com' : null,
    role: shopId ? 'shop_owner' : 'user',
    shopId: shopId ?? null,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
  }, { merge: true });
}
