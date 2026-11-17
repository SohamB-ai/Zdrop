import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getShopByOwnerId } from '@/lib/server/shops-store';
import { getProfilesDb, saveUserProfile } from '@/lib/server/user-profiles';
import { UserProfile } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ user: null, shop: null });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ user: null, shop: null });
    const shop = await getShopByOwnerId(userId);

    try {
      const db = getProfilesDb();
      if (db) await saveUserProfile(db, clerkUser, shop);
    } catch (error) {
      console.error('Failed to persist authenticated profile:', error);
      return NextResponse.json({ error: 'Could not save user profile', shop }, { status: 503 });
    }

    const user: UserProfile = {
      id: userId,
      email: clerkUser?.primaryEmailAddress?.emailAddress || '',
      name: clerkUser?.fullName || clerkUser?.firstName || 'User',
      avatarUrl: clerkUser?.imageUrl,
      role: (clerkUser?.publicMetadata?.role as 'user' | 'shop_owner') || (shop ? 'shop_owner' : 'user'),
      shopId: shop?.id,
    };

    return NextResponse.json({ user, shop });
  } catch {
    return NextResponse.json({ user: null, shop: null });
  }
}
