import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { database, isCloud } from './store';
const limits = new Map<string, { count: number; reset: number }>();
export async function rateLimit(req: NextRequest, operation: string) {
  // Only trust forwarded IPs behind the configured hosting proxy.
  const ip = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for')?.split(',')[0] : process.env.ZDROP_TRUST_PROXY === 'true' ? req.headers.get('x-forwarded-for')?.split(',')[0] : 'local';
  const secret = process.env.RATE_LIMIT_SECRET || process.env.CRON_SECRET;
  if (isCloud && !secret) throw new Error('RATE_LIMIT_SECRET must be configured.');
  const key = createHmac('sha256', secret || 'local-development').update(`${operation}:${ip || 'unknown'}`).digest('hex');
  const max = operation === 'create' ? 10 : 30;
  const now = Date.now();
  if (isCloud) return database().runTransaction(async transaction => {
    const ref = database().collection('rateLimits').doc(key); const d = await transaction.get(ref);
    const current = d.exists && d.data()!.reset > now ? d.data()! : { count: 0, reset: now + 60000 };
    if (current.count >= max) return false;
    transaction.set(ref, { count: current.count + 1, reset: current.reset, deleteAfter: new Date(current.reset + 3600000) }); return true;
  });
  for (const [k, v] of limits) if (v.reset <= now) limits.delete(k);
  const current = limits.get(key) || { count: 0, reset: now + 60000 };
  if (current.count >= max) return false;
  current.count++; limits.set(key, current); return true;
}
