import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrintPreferencesSchema, AllowedMimeTypesEnum } from '@/lib/types';
import { active, byCode, newId, newToken, publicSession, purge, putFile, readSession, reserve, saveSession, withSessionLock, StoredSession, cloudUpload, isCloud, useFirestoreFiles, firestoreFileLimit, enforceFileNoStore, activateSession } from '@/lib/server/store';
import { inspectDocument, DocumentError } from '@/lib/server/documents';
import { rateLimit } from '@/lib/server/rate-limit';
import { auth, currentUser } from '@clerk/nextjs/server';
export const runtime = 'nodejs';
export const maxDuration = 300;
const metadata = z.object({
  fileName: z.string().min(1).max(120),
  fileSize: z.number().int().positive().max(25 * 1024 * 1024),
  mimeType: AllowedMimeTypesEnum,
  pageCount: z.number().int().positive().max(2000).optional(),
});
const createSchema = z.object({
  files: z.array(metadata).min(1).max(3),
  preferences: PrintPreferencesSchema,
  shopId: z.string().optional(),
  shopName: z.string().optional(),
});
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function handle(req: NextRequest, action: string) {
  try {
    let authUser: { id: string; email?: string; name?: string; avatarUrl?: string; role?: string } | null = null;
    try {
      const { userId } = await auth();
      if (userId) {
        const u = await currentUser();
        authUser = {
          id: userId,
          email: u?.primaryEmailAddress?.emailAddress,
          name: u?.fullName || u?.firstName || 'User',
          avatarUrl: u?.imageUrl,
          role: (u?.publicMetadata?.role as string) || 'user',
        };
      }
    } catch {
      // Unauthenticated session
    }

    if (action === 'create' && req.method === 'POST') {
      const input = createSchema.parse(await req.json());
      if (useFirestoreFiles && input.files.some((file) => file.fileSize > firestoreFileLimit)) {
        return reply({ error: 'Uploads are limited to 768 KiB per file on this deployment.' }, 413);
      }
      const s: StoredSession = {
        ...(useFirestoreFiles ? { fileStorage: 'firestore' } : {}),
        id: newId(),
        accessCode: '',
        ownerToken: newToken(),
        status: 'PENDING_UPLOAD',
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000,
        preferences: input.preferences,
        totalSizeBytes: input.files.reduce((n, f) => n + f.fileSize, 0),
        files: input.files.map(f => ({
          fileId: `file_${newToken().replaceAll('-', '').slice(0, 16)}`,
          name: f.fileName.replace(/[\x00-\x1f/\\]/g, '_'),
          size: f.fileSize,
          type: f.mimeType,
          pageCount: typeof f.pageCount === 'number' && f.pageCount > 0 ? f.pageCount : undefined,
        })),
        userId: authUser?.id,
        userEmail: authUser?.email,
        userName: authUser?.name,
        userAvatar: authUser?.avatarUrl,
        shopId: input.shopId,
        shopName: input.shopName,
      };

      try {
        const { calculatePrintCost } = await import('@/lib/pricing');
        const { getShopById, getShopByCode } = await import('@/lib/server/shops-store');
        const shop = input.shopId ? (await getShopById(input.shopId)) || (await getShopByCode(input.shopId)) : null;
        s.costEstimate = calculatePrintCost(s.files, s.preferences, shop?.pricing);
        s.paymentStatus = 'UNPAID';
        if (shop) {
          s.shopId = shop.id;
          s.shopName = shop.shopName;
        }
      } catch (err) {
        console.warn('Cost estimation init error:', err);
      }

      s.uploadSlots = Object.fromEntries(s.files.map(f => [f.fileId, { size: f.size, type: f.type }]));
      s.purging = false; s.uploadSealed = false;
      const upload = await cloudUpload(s);
      await reserve(s);
      return reply({ session: publicSession(s), token: s.ownerToken, upload }, 201);
    }
    if (action === 'resolve' && req.method === 'GET') {
      const code = z.string().regex(/^\d{6}$/).parse(req.nextUrl.searchParams.get('code'));
      const s = await byCode(code);
      if (!s) return reply({ error: 'Code not found.' }, 404);
      if (!await active(s)) return reply({ error: 'Code expired or files deleted.' }, 410);
      if (s.status === 'PENDING_UPLOAD') return reply({ error: 'Upload is still in progress.' }, 409);

      const { getShopByOwnerId, getShopById, getShopByCode } = await import('@/lib/server/shops-store');
      let shop = authUser ? await getShopByOwnerId(authUser.id) : null;
      const requestedShopId = s.shopId || req.nextUrl.searchParams.get('shopId');
      if (!shop && requestedShopId) {
        shop = (await getShopById(requestedShopId)) || (await getShopByCode(requestedShopId));
      }

      s.status = 'ACCESSED';
      s.accessedAt ||= Date.now();
      s.operatorToken ||= newToken();

      if (shop) {
        s.shopId = shop.id;
        s.shopName = shop.shopName;
        s.operatorId = authUser?.id || shop.ownerId;
        const { calculatePrintCost } = await import('@/lib/pricing');
        s.costEstimate = calculatePrintCost(s.files, s.preferences, shop.pricing);
      } else if (authUser?.role === 'shop_owner' || authUser?.id) {
        s.operatorId = authUser.id;
      }

      await saveSession(s);
      return reply({ session: publicSession(s, s.operatorToken), token: s.operatorToken });
    }
    const input = req.method === 'GET' ? Object.fromEntries(req.nextUrl.searchParams) : action === 'upload' ? Object.fromEntries(req.nextUrl.searchParams) : await req.json();
    const s = await readSession(String(input.sessionId));
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
    if (!s || !token || (token !== s.ownerToken && token !== s.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    const live = await active(s);
    if (action === 'status' && req.method === 'GET') return reply({ session: publicSession(s, token === s.operatorToken ? token : undefined) });
    if (!live) return reply({ error: 'Session expired or deleted.' }, 410);
    if (action === 'upload' && req.method === 'POST') {
      if (isCloud && s.fileStorage !== 'firestore') return reply({ error: 'Use direct cloud upload.' }, 409);
      if (token !== s.ownerToken || s.status !== 'PENDING_UPLOAD' || s.uploadSealed) return reply({ error: 'Upload not permitted.' }, 409);
      const f = s.files.find(f => f.fileId === input.fileId);
      if (!f) return reply({ error: 'Unknown file.' }, 400);
      const length = Number(req.headers.get('content-length'));
      if (length > 25 * 1024 * 1024) return reply({ error: 'File too large.' }, 413);
      const chunks: Uint8Array[] = []; let size = 0;
      const reader = req.body?.getReader();
      if (!reader) return reply({ error: 'File is empty.' }, 400);
      while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > f.size || size > 25 * 1024 * 1024) { await reader.cancel(); return reply({ error: 'File too large.' }, 413); } chunks.push(chunk.value); }
      const bytes = Buffer.concat(chunks);
      if (bytes.length !== f.size) return reply({ error: 'File size does not match.' }, 400);
      await inspectDocument(bytes, f.type, false);
      await putFile(s, f.fileId, bytes, f.type);
      return reply({ success: true });
    }
    if (action === 'confirm' && req.method === 'POST') {
      if (token !== s.ownerToken || s.status !== 'PENDING_UPLOAD') return reply({ error: 'Session cannot be activated.' }, 409);
      const { getFile } = await import('@/lib/server/store');
      s.uploadSealed = true; await saveSession(s); // Seal direct uploads before inspecting immutable contents.
      try {
        for (const f of s.files) {
          if (isCloud) await enforceFileNoStore(s, f.fileId);
          const bytes = await getFile(s, f.fileId);
          if (bytes.length !== f.size) throw new DocumentError('Upload incomplete or file size mismatch.');
          const inspected = await inspectDocument(bytes, f.type);
          if (inspected) {
            f.pageCount = typeof inspected === 'number' ? inspected : inspected.pageCount;
            if (typeof inspected === 'object') {
              f.colorPages = inspected.colorPages;
              f.bwPages = inspected.bwPages;
            }
          }
        }
        // Update accurate cost estimate now that page counts are verified
        const { calculatePrintCost } = await import('@/lib/pricing');
        const { getShopById, getShopByCode } = await import('@/lib/server/shops-store');
        const shop = s.shopId ? (await getShopById(s.shopId)) || (await getShopByCode(s.shopId)) : null;
        s.costEstimate = calculatePrintCost(s.files, s.preferences, shop?.pricing);
      } catch (error) { await purge(s, 'STUDENT_REVOKE'); throw error; }
      await activateSession(s); return reply({ session: publicSession(s) });
    }
    if (action === 'payment' && req.method === 'POST') {
      s.paymentStatus = input.paymentStatus || 'PAID_COUNTER';
      s.paymentMethod = input.paymentMethod || 'COUNTER';
      s.paymentTimestamp = Date.now();
      await saveSession(s);
      return reply({ session: publicSession(s, token === s.operatorToken ? token : undefined) });
    }
    if (action === 'delete' && req.method === 'POST') {
      const source = token === s.ownerToken ? 'STUDENT_REVOKE' : 'OPERATOR_PRINT';
      await purge(s, source); return reply({ session: publicSession(s) });
    }
    return reply({ error: 'Unknown operation.' }, 404);
  } catch (e) {
    console.error('[sessions error]:', e);
    if (e instanceof DocumentError) return reply({ error: e.message }, 400);
    if (e instanceof z.ZodError) return reply({ error: e.issues[0].message }, 400);
    if (e instanceof SyntaxError) return reply({ error: 'Malformed JSON payload.' }, 400);
    return reply({ error: (e as Error)?.message || 'The operation could not be completed. Please retry.' }, 500);
  }
}
async function dispatch(req: NextRequest, action: string) {
  try {
    if ((action === 'create' || action === 'resolve') && !await rateLimit(req, action)) return reply({ error: 'Too many attempts. Please wait one minute.' }, 429);
    if (req.method === 'POST' && action !== 'upload' && Number(req.headers.get('content-length')) > 16384) return reply({ error: 'Request too large.' }, 413);
    let id = req.nextUrl.searchParams.get('sessionId');
    if (action === 'resolve') {
      const code = req.nextUrl.searchParams.get('code') || '';
      if (/^\d{6}$/.test(code)) id = (await byCode(code))?.id || null;
    } else if (!id && action !== 'create' && req.method === 'POST') {
      id = (await req.clone().json()).sessionId;
    }
    if (id && action !== 'resolve') {
      const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
      const session = await readSession(id);
      if (!session || !token || (token !== session.ownerToken && token !== session.operatorToken)) return reply({ error: 'Session access denied.' }, 403);
    }
    return id ? await withSessionLock(id, () => handle(req, action)) : await handle(req, action);
  } catch (err) {
    console.error(`[dispatch error ${action}]:`, err);
    return reply({ error: 'Session is busy. Please retry.' }, 409);
  }
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) { return dispatch(req, (await ctx.params).action); }
