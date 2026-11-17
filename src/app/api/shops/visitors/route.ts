import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getProfilesDb, getGoogleAccount } from '@/lib/server/user-profiles';
import { getShopByCode, getShopByOwnerId } from '@/lib/server/shops-store';

const shopDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });

function visitors(db: NonNullable<ReturnType<typeof getProfilesDb>>, shopId: string) {
  return db.collection('shops').doc(shopId).collection('visitorDays')
    .doc(shopDay.format(new Date())).collection('visitors');
}

export async function POST(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.code !== 'string' || !/^[a-z0-9_-]{1,30}$/i.test(body.code)) {
    return NextResponse.json({ error: 'Invalid shop code' }, { status: 400 });
  }

  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
    const google = getGoogleAccount(user);
    const name = [google?.firstName, google?.lastName].filter(Boolean).join(' ') || user.fullName;
    if (!google || !name?.trim()) return NextResponse.json({ recorded: false });

    const db = getProfilesDb();
    if (!db) return NextResponse.json({ error: 'Visitor tracking unavailable' }, { status: 503 });
    const shop = await getShopByCode(body.code);
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    if (shop.ownerId === user.id) return NextResponse.json({ recorded: false });

    await visitors(db, shop.id).doc(user.id).set({ name: name.trim() });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error('Failed to save shop visitor:', error);
    return NextResponse.json({ error: 'Could not record visit' }, { status: 503 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    const shop = userId ? await getShopByOwnerId(userId) : null;
    if (!shop) return NextResponse.json({ error: 'Shop owner access required' }, { status: 403 });
    const db = getProfilesDb();
    if (!db) return NextResponse.json({ error: 'Visitor tracking unavailable' }, { status: 503 });
    const snapshot = await visitors(db, shop.id).orderBy('name').get();
    return NextResponse.json({ names: snapshot.docs.map((doc) => doc.get('name')) }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Failed to load shop visitors:', error);
    return NextResponse.json({ error: 'Could not load visitors' }, { status: 503 });
  }
}
