import { randomInt, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { SessionData } from '../types';

export interface StoredSession extends SessionData { ownerToken: string; operatorToken?: string; purging?: boolean; uploadSealed?: boolean; purgeSource?: SessionData["deletionSource"]; uploadSlots?: Record<string, { size: number; type: string }> }
const root = path.resolve(process.env.ZDROP_DATA_DIR || '.zdrop-data');
const cloud = process.env.ZDROP_STORAGE === 'firebase';
export const isCloud = cloud;
if (process.env.VERCEL && !cloud) throw new Error('Vercel requires ZDROP_STORAGE=firebase.');
export const database = () => firebase().db;
function firebase() {
  if (!getApps().length) initializeApp({ credential: process.env.FIREBASE_PRIVATE_KEY ? cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) : applicationDefault(), storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
  return { db: getFirestore(), bucket: getStorage().bucket() };
}
export async function readSession(id: string): Promise<StoredSession | null> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return null;
  if (cloud) return (await firebase().db.collection('sessions').doc(id).get()).data() as StoredSession || null;
  try { return JSON.parse(await readFile(path.join(root, id, 'session.json'), 'utf8')); } catch { return null; }
}
export async function saveSession(s: StoredSession) {
  if (cloud) { await firebase().db.collection('sessions').doc(s.id).set(s); return; }
  await mkdir(path.join(root, s.id), { recursive: true, mode: 0o700 });
  const temporary = path.join(root, s.id, `metadata-${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(s), { mode: 0o600 });
  await (await import('node:fs/promises')).rename(temporary, path.join(root, s.id, 'session.json'));
}
export async function allSessions(): Promise<StoredSession[]> {
  if (cloud) return (await firebase().db.collection('sessions').get()).docs.map(d => d.data() as StoredSession);
  await mkdir(root, { recursive: true });
  return (await Promise.all((await readdir(root)).map(readSession))).filter((s): s is StoredSession => !!s);
}
export async function reserve(s: StoredSession) {
  for (let attempt = 0; attempt < 20; attempt++) {
    s.accessCode = String(randomInt(100000, 1000000));
    if (cloud) {
      const { db } = firebase();
      const ok = await db.runTransaction(async t => {
        const ref = db.collection('codes').doc(s.accessCode);
        const existing = await t.get(ref);
        if (existing.exists && existing.data()!.expiresAt > Date.now()) return false;
        t.set(ref, { sessionId: s.id, expiresAt: s.expiresAt });
        t.set(db.collection('sessions').doc(s.id), s);
        return true;
      });
      if (ok) return;
    } else {
      // Exclusive code reservation also works across local Node workers.
      await mkdir(path.join(root, 'codes'), { recursive: true });
      try {
        await writeFile(path.join(root, 'codes', s.accessCode), s.id, { flag: 'wx', mode: 0o600 });
        try { await saveSession(s); } catch (error) { await rm(path.join(root, 'codes', s.accessCode), { force: true }); throw error; }
        return;
      } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
    }
  }
  throw new Error('Unable to reserve a code. Please retry.');
}
export async function byCode(code: string) {
  if (cloud) { const d = await firebase().db.collection('codes').doc(code).get(); return d.exists ? readSession(d.data()!.sessionId) : null; }
  try { return await readSession(await readFile(path.join(root, 'codes', code), 'utf8')); } catch { return null; }
}
export async function putFile(id: string, fileId: string, bytes: Buffer, type: string) {
  if (cloud) await firebase().bucket.file(`sessions/${id}/${fileId}`).save(bytes, { resumable: false, metadata: { contentType: type, cacheControl: 'no-store' } });
  else await writeFile(path.join(root, id, fileId), bytes, { mode: 0o600 });
}
export async function getFile(id: string, fileId: string) {
  if (cloud) return (await firebase().bucket.file(`sessions/${id}/${fileId}`).download())[0];
  return readFile(path.join(root, id, fileId));
}
export async function purge(s: StoredSession, source: StoredSession['deletionSource']) {
  s.purging = true; s.purgeSource ||= source;
  await saveSession(s);
  if (cloud) await firebase().bucket.deleteFiles({ prefix: `sessions/${s.id}/` });
  else await Promise.all(s.files.map(f => rm(path.join(root, s.id, f.fileId), { force: true })));
  source = s.purgeSource;
  s.status = source === 'TTL_PURGE' ? 'EXPIRED' : 'DELETED';
  s.deletedAt = Date.now(); s.deletionSource = source; s.preferences = { copies: 1, colorMode: 'BW', sides: 'DOUBLE', pageRange: 'ALL' }; s.files = []; s.totalSizeBytes = 0; s.uploadSlots = {}; s.purging = false;
  await saveSession(s);
  if (cloud) await getAuth().deleteUser(s.id).catch(error => { if (error.code !== 'auth/user-not-found') throw error; });
  // Tombstones retain no filenames or file contents; codes remain reserved until TTL.
  return s;
}
export async function active(s: StoredSession) {
  if (s.purging) { await purge(s, s.purgeSource); return false; }
  if (!['DELETED', 'EXPIRED'].includes(s.status) && s.expiresAt <= Date.now()) await purge(s, 'TTL_PURGE');
  return !['DELETED', 'EXPIRED'].includes(s.status);
}
export function publicSession(s: StoredSession, token?: string): SessionData {
  const { ownerToken, operatorToken, purging, purgeSource, uploadSlots, uploadSealed, ...result } = s;
  return { ...result, files: result.files.map(f => ({ ...f, previewUrl: token ? `/api/files?sessionId=${s.id}&fileId=${f.fileId}&token=${token}` : undefined })) };
}
export const newId = () => `ses_${randomUUID()}`;
export const newToken = () => randomUUID() + randomUUID();

export async function withSessionLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return operation();
  const lease = newToken();
  const lockPath = path.join(root, `${id}.lock`);
  if (cloud) {
    const { db } = firebase();
    await db.runTransaction(async t => {
      const ref = db.collection('locks').doc(id);
      const d = await t.get(ref);
      if (d.exists && d.data()!.expiresAt > Date.now()) throw new Error('Session busy');
      t.set(ref, { lease, expiresAt: Date.now() + 300000 });
    });
  } else {
    await mkdir(root, { recursive: true });
    const startTime = Date.now();
    let acquired = false;
    while (!acquired) {
      try {
        await mkdir(lockPath);
        acquired = true;
      } catch {
        try {
          const info = await stat(lockPath);
          if (Date.now() - info.mtimeMs >= 300000) {
            await rm(lockPath, { recursive: true, force: true });
            continue;
          }
        } catch {
          // Lock was just released by another process; retry immediately
          continue;
        }
        if (Date.now() - startTime >= 3000) {
          throw new Error('Session busy');
        }
        await new Promise((res) => setTimeout(res, 50));
      }
    }
  }
  try { return await operation(); }
  finally {
    if (cloud) {
      const { db } = firebase();
      await db.runTransaction(async t => { const ref = db.collection('locks').doc(id); const d = await t.get(ref); if (d.data()?.lease === lease) t.delete(ref); });
    } else await rm(lockPath, { recursive: true, force: true });
  }
}

export async function cloudUpload(s: StoredSession) {
  if (!cloud) return null;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_STORAGE_BUCKET) throw new Error('Firebase web upload configuration is missing.');
  firebase();
  return { customToken: await getAuth().createCustomToken(s.id, { uploader: true }), config: { apiKey, authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`, projectId: process.env.FIREBASE_PROJECT_ID, storageBucket: process.env.FIREBASE_STORAGE_BUCKET } };
}
export async function retire(s: StoredSession) {
  if (cloud) {
    firebase(); await getAuth().deleteUser(s.id).catch(error => { if (error.code !== 'auth/user-not-found') throw error; });
    const { db } = firebase();
    await db.runTransaction(async t => { const code = db.collection('codes').doc(s.accessCode); const d = await t.get(code); if (d.data()?.sessionId === s.id) t.delete(code); t.delete(db.collection('sessions').doc(s.id)); });
  } else {
    const code = path.join(root, 'codes', s.accessCode);
    try { if (await readFile(code, 'utf8') === s.id) await rm(code, { force: true }); } catch {}
    await rm(path.join(root, s.id), { recursive: true, force: true });
  }
}
export async function maintenance() {
  let purged = 0, retired = 0, failed = 0;
  for (const candidate of await allSessions()) {
    if (candidate.expiresAt > Date.now() && !candidate.purging && !candidate.deletedAt) continue;
    await withSessionLock(candidate.id, async () => {
      const s = await readSession(candidate.id); if (!s) return;
      if (s.purging || (!s.deletedAt && s.expiresAt <= Date.now())) { await purge(s, s.purgeSource || 'TTL_PURGE'); purged++; }
      if (s.deletedAt && Date.now() > Math.max(s.expiresAt, s.deletedAt) + 3600000) { await retire(s); retired++; }
    }).catch(() => { failed++; });
  }
  return { purged, retired, failed };
}

export async function signedFileUrl(s: StoredSession, fileId: string) {
  if (!cloud) return null;
  return (await firebase().bucket.file(`sessions/${s.id}/${fileId}`).getSignedUrl({ action: 'read', expires: Math.min(s.expiresAt, Date.now() + 60000), responseDisposition: `${s.files.find(f => f.fileId === fileId)?.type.includes('wordprocessing') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(s.files.find(f => f.fileId === fileId)?.name || 'document')}` }))[0];
}

export async function activateSession(s: StoredSession) {
  if (s.expiresAt <= Date.now()) throw new Error('Upload expired');
  s.expiresAt = Date.now() + 900000; s.status = 'ACTIVE';
  if (cloud) {
    const { db } = firebase();
    await db.runTransaction(async t => {
      const code = db.collection('codes').doc(s.accessCode); const d = await t.get(code);
      if (d.data()?.sessionId !== s.id) throw new Error('Code reservation lost');
      t.update(code, { expiresAt: s.expiresAt }); t.set(db.collection('sessions').doc(s.id), s);
    });
  } else await saveSession(s);
}
