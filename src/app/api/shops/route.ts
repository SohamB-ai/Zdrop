import { NextRequest, NextResponse } from 'next/server';
import { listShops, getShopByOwnerId, getShopByCode, createShop } from '@/lib/server/shops-store';
import { auth, currentUser } from '@clerk/nextjs/server';

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
    const email = user?.primaryEmailAddress?.emailAddress || '';
    const body = await req.json();

    const shop = await createShop({
      ownerId: userId,
      ownerEmail: email,
      shopName: body.shopName,
      ownerName: body.ownerName || user?.fullName || 'Shop Owner',
      phone: body.phone,
      campusAddress: body.campusAddress,
      shopCode: body.shopCode,
      pricing: body.pricing,
    });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
