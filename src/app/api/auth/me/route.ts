import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getShopByOwnerId } from '@/lib/server/shops-store';
import { UserProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ user: null, shop: null });
    }

    const clerkUser = await currentUser();
    const shop = await getShopByOwnerId(userId);

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
