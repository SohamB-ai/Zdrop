import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { maintenance } from '@/lib/server/store';
export const runtime = 'nodejs';
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ''}`);
  const actual = Buffer.from(req.headers.get('authorization') || '');
  if (!process.env.CRON_SECRET || expected.length !== actual.length || !timingSafeEqual(expected, actual)) return new Response('Unauthorized', { status: 401 });
  return NextResponse.json(await maintenance(), { headers: { 'Cache-Control': 'no-store' } });
}
export const POST = GET;
