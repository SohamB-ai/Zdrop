import { NextRequest, NextResponse } from 'next/server';
import { updateShopPricing, getShopById } from '@/lib/server/shops-store';
import { auth } from '@clerk/nextjs/server';

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
    if (shop.ownerId && shop.ownerId !== userId) {
      return NextResponse.json({ error: 'Access denied for this shop.' }, { status: 403 });
    }

    const updatedShop = await updateShopPricing(shopId, pricing);
    return NextResponse.json({ shop: updatedShop });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
