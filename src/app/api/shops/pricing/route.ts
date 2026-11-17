import { NextRequest, NextResponse } from 'next/server';
import { updateShopPricing, getShopById } from '@/lib/server/shops-store';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getProfilesDb, saveUserProfile } from '@/lib/server/user-profiles';
import { isCloud } from '@/lib/server/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { shopId, pricing } = await req.json();
    if (!shopId || !pricing) {
      return NextResponse.json({ error: 'Shop ID and pricing are required.' }, { status: 400 });
    }

    const shop = await getShopById(shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
    }

    // Verify user owns the shop
    if (shop.ownerId !== userId) {
      return NextResponse.json({ error: 'Access denied for this shop.' }, { status: 403 });
    }

    const db = getProfilesDb();
    if (!db && isCloud) {
      return NextResponse.json({ error: 'Shop profile storage is unavailable.' }, { status: 503 });
    }
    const user = db ? await currentUser() : null;
    if (db && user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const updatedShop = await updateShopPricing(shop, pricing);
    if (db && user) await saveUserProfile(db, user, updatedShop);
    return NextResponse.json({ shop: updatedShop });
  } catch (err) {
    console.error('Shop pricing could not be saved:', err);
    return NextResponse.json({ error: 'Could not save shop pricing. Please try again.' }, { status: 503 });
  }
}
