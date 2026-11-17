import { NextRequest, NextResponse } from 'next/server';
import { listShops, getShopByOwnerId, getShopByCode, createShop } from '@/lib/server/shops-store';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getProfilesDb, saveUserProfile } from '@/lib/server/user-profiles';
import { isCloud } from '@/lib/server/store';

const registration = z.object({
  shopName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(5).max(30),
  campusAddress: z.string().trim().min(3).max(300),
  shopCode: z.string().trim().regex(/^[a-z0-9_-]{3,30}$/i),
  pricing: z.object({
    bwRate: z.number().positive().max(10000),
    colorRate: z.number().positive().max(10000),
    duplexDiscount: z.number().min(0).max(10000),
    currencySymbol: z.string().trim().min(1).max(10),
    upiId: z.string().trim().max(100),
    payeeName: z.string().trim().max(120),
  }).partial().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ownerId = req.nextUrl.searchParams.get('ownerId');
    const code = req.nextUrl.searchParams.get('code');

    if (ownerId) {
      const shop = await getShopByOwnerId(ownerId);
      return NextResponse.json({ shop });
    }

    if (code) {
      const shop = await getShopByCode(code);
      return NextResponse.json({ shop });
    }

    const shops = await listShops();
    return NextResponse.json({ shops });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to register a print shop.' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!user || user.id !== userId || !email) {
      return NextResponse.json({ error: 'A signed-in account with an email address is required.' }, { status: 400 });
    }

    const input = registration.safeParse(await req.json().catch(() => null));
    if (!input.success) {
      return NextResponse.json({ error: 'Enter valid shop details and rates.' }, { status: 400 });
    }

    const db = getProfilesDb();
    if (!db && isCloud) {
      return NextResponse.json({ error: 'Shop profile storage is unavailable.' }, { status: 503 });
    }

    const existing = await getShopByOwnerId(userId);
    if (existing && existing.shopCode !== input.data.shopCode.toUpperCase()) {
      return NextResponse.json({ error: 'This account already owns a shop.' }, { status: 409 });
    }

    const shop = existing ?? await createShop({
      ...input.data,
      ownerId: userId,
      ownerEmail: email,
      ownerName: input.data.ownerName || user.fullName || 'Shop Owner',
    });

    if (db) await saveUserProfile(db, user, shop);
    return NextResponse.json({ shop }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Shop registration could not be completed:', error);
    return NextResponse.json({ error: 'Could not save your shop. Please try again.' }, { status: 503 });
  }
}
