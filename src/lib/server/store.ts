import 'server-only';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, type Transaction } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getFirebaseApp, getProfilesDb } from './user-profiles';
import { enforceNoStore } from './firebase-storage-policy';
import { randomInt, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { SessionData } from '../types';


export interface StoredSession extends SessionData {
  ownerToken: string;
  operatorToken?: string;
  purging?: boolean;
  uploadSealed?: boolean;
  purgeSource?: SessionData['deletionSource'];
  uploadSlots?: Record<string, { size: number; type: string }>;
}

const root = path.resolve(process.env.ZDROP_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', '.zdrop-data') : '.zdrop-data'));
const hosted = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.K_SERVICE);
const cloud = hosted || process.env.ZDROP_STORAGE === 'firebase';
export const isCloud = cloud;

export function firestore() {
  const db = getProfilesDb();
  if (!db) throw new Error('Firestore configuration is missing.');
  return db;
}

const leases = new AsyncLocalStorage<{ id: string; lease: string }>();

function currentLease(id: string) {
  const current = leases.getStore();
  if (!current || current.id !== id) throw new Error('Session mutation requires a lease.');
  return current.lease;
}

function firebase() {
  const app = getFirebaseApp();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!app || !bucket) throw new Error('Firebase Storage configuration is missing.');
  return { bucket: getStorage(app).bucket(bucket), auth: getAuth(app) };
}

const sessionRef = (id: string) => firestore().collection('sessions').doc(id);
const codeRef = (code: string) => firestore().collection('codes').doc(code);
const lockRef = (id: string) => firestore().collection('locks').doc(id);
const leaseDuration = 300000;

async function requireLease(tx: Transaction, id: string) {
  const lock = await tx.get(lockRef(id));
  if (lock.get('lease') !== currentLease(id) || !(lock.get('expiresAt') > Date.now())) {
    throw new Error('Session lease expired.');
  }
}

function sessionData(session: StoredSession) {
  return JSON.parse(JSON.stringify(session)) as StoredSession;
}

export async function readSession(id: string): Promise<StoredSession | null> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return null;
  if (cloud) {
    const snapshot = await sessionRef(id).get();
    return snapshot.exists ? snapshot.data() as StoredSession : null;
  }
  try {
    return JSON.parse(await readFile(path.join(root, id, 'session.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function saveSession(s: StoredSession) {
  if (cloud) {
    await firestore().runTransaction(async (tx) => {
      await requireLease(tx, s.id);
      tx.set(sessionRef(s.id), sessionData(s));
    });
    return;
  }
  await mkdir(path.join(root, s.id), { recursive: true, mode: 0o700 });
  const temporary = path.join(root, s.id, `metadata-${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(s), { mode: 0o600 });
  await (await import('node:fs/promises')).rename(temporary, path.join(root, s.id, 'session.json'));
}

export async function allSessions(): Promise<StoredSession[]> {
  if (cloud) {
    const result: StoredSession[] = [];
    const collection = firestore().collection('sessions');
    const cutoff = Date.now();
    for (const filter of [
      collection.where('expiresAt', '<=', cutoff).orderBy('expiresAt'),
      collection.where('purging', '==', true),
      collection.where('deletedAt', '>', 0).orderBy('deletedAt'),
    ]) {
      let query = filter.limit(200);
      while (true) {
        const page = await query.get();
        result.push(...page.docs.map((doc) => doc.data() as StoredSession));
        if (page.size < 200) break;
        query = filter.startAfter(page.docs[page.size - 1]).limit(200);
      }
    }
    return [...new Map(result.map((session) => [session.id, session])).values()];
  }
  await mkdir(root, { recursive: true });
  return (await Promise.all((await readdir(root)).map(readSession))).filter((s): s is StoredSession => !!s);
}

export async function reserve(s: StoredSession) {
  for (let attempt = 0; attempt < 20; attempt++) {
    s.accessCode = String(randomInt(100000, 1000000));
    if (cloud) {
      const reserved = await firestore().runTransaction(async (tx) => {
        const ref = codeRef(s.accessCode);
        if ((await tx.get(ref)).exists) return false;
        tx.create(ref, { sessionId: s.id });
        tx.create(sessionRef(s.id), sessionData(s));
        return true;
      });
      if (reserved) return;
    } else {
      await mkdir(path.join(root, 'codes'), { recursive: true });
      try {
        await writeFile(path.join(root, 'codes', s.accessCode), s.id, { flag: 'wx', mode: 0o600 });
        try {
          await saveSession(s);
        } catch (error) {
          await rm(path.join(root, 'codes', s.accessCode), { force: true });
          throw error;
        }
        return;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      }
    }
  }
  throw new Error('Unable to reserve a code. Please retry.');
}

export async function byCode(code: string) {
  if (cloud) {
    const id = (await codeRef(code).get()).get('sessionId');
    return typeof id === 'string' ? readSession(id) : null;
  }
  try {
    return await readSession(await readFile(path.join(root, 'codes', code), 'utf8'));
  } catch {
    return null;
  }
}

export async function putFile(id: string, fileId: string, bytes: Buffer, type: string) {
  if (cloud) {
    await firebase().bucket.file(`sessions/${id}/${fileId}`).save(bytes, {
      resumable: false,
      metadata: { contentType: type, cacheControl: 'no-store' },
    });
  } else {
    await writeFile(path.join(root, id, fileId), bytes, { mode: 0o600 });
  }
}

export async function enforceFileNoStore(id: string, fileId: string) {
  if (cloud) {
    await enforceNoStore(firebase().bucket.file(`sessions/${id}/${fileId}`));
  }
}

export async function getFile(id: string, fileId: string): Promise<Buffer> {
  if (cloud) {
    return (await firebase().bucket.file(`sessions/${id}/${fileId}`).download())[0];
  }
  return readFile(path.join(root, id, fileId));
}

export async function purge(s: StoredSession, source: StoredSession['deletionSource']) {
  s.purging = true;
  s.purgeSource ||= source;
  await saveSession(s);

  if (cloud) {
    await firebase().bucket.deleteFiles({ prefix: `sessions/${s.id}/` });
  } else {
    await Promise.all(s.files.map((f) => rm(path.join(root, s.id, f.fileId), { force: true })));
  }

  source = s.purgeSource;
  s.status = source === 'TTL_PURGE' ? 'EXPIRED' : 'DELETED';
  s.deletedAt = Date.now();
  s.deletionSource = source;
  s.preferences = { copies: 1, colorMode: 'BW', sides: 'DOUBLE', pageRange: 'ALL' };
  s.files = [];
  s.totalSizeBytes = 0;
  s.uploadSlots = {};
  s.purging = false;
  await saveSession(s);

  if (cloud) {
    await firebase().auth.deleteUser(s.id).catch((error) => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
  }
  return s;
}

export async function active(s: StoredSession) {
  if (s.purging) {
    await purge(s, s.purgeSource);
    return false;
  }
  if (!['DELETED', 'EXPIRED'].includes(s.status) && s.expiresAt <= Date.now()) {
    await purge(s, 'TTL_PURGE');
  }
  return !['DELETED', 'EXPIRED'].includes(s.status);
}

export function publicSession(s: StoredSession, token?: string): SessionData {
  const { ownerToken, operatorToken, purging, purgeSource, uploadSlots, uploadSealed,
    userId, userEmail, userName, userAvatar, ...result } = s;
  return {
    ...result,
    files: result.files.map((f) => ({
      ...f,
      previewUrl: token ? `/api/files?sessionId=${s.id}&fileId=${f.fileId}&token=${token}` : undefined,
    })),
  };
}

export const newId = () => `ses_${randomUUID()}`;
export const newToken = () => randomUUID() + randomUUID();

export async function withSessionLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  if (!/^ses_[a-f0-9-]{36}$/.test(id)) return operation();
  const lease = newToken();
  const lockPath = path.join(root, `${id}.lock`);
  if (cloud) {
    let acquired = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (await firestore().runTransaction(async (tx) => {
        const ref = lockRef(id);
        const now = Date.now();
        if ((await tx.get(ref)).get('expiresAt') > now) return false;
        tx.set(ref, { lease, expiresAt: now + leaseDuration, deleteAfter: Timestamp.fromMillis(now + leaseDuration) });
        return true;
      })) {
        acquired = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200 + attempt * 200));
    }
    if (!acquired) {
      throw new Error('Session busy');
    }
  } else {
    await mkdir(root, { recursive: true });
    try {
      await mkdir(lockPath);
    } catch {
      const info = await stat(lockPath);
      if (Date.now() - info.mtimeMs < 300000) throw new Error('Session busy');
      await rm(lockPath, { recursive: true, force: true });
      await mkdir(lockPath);
    }
  }
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let renewal = Promise.resolve();
  if (cloud) {
    heartbeat = setInterval(() => {
      renewal = renewal
        .then(async () => {
          await firestore().runTransaction(async (tx) => {
            const ref = lockRef(id);
            const lock = await tx.get(ref);
            const now = Date.now();
            if (lock.get('lease') !== lease || !(lock.get('expiresAt') > now)) return;
            const expiresAt = now + leaseDuration;
            tx.update(ref, { expiresAt, deleteAfter: Timestamp.fromMillis(expiresAt) });
          });
        })
        .catch(() => {});
    }, 30000);
    heartbeat.unref();
  }
  try {
    return await leases.run({ id, lease }, operation);
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await renewal;
    if (cloud) await firestore().runTransaction(async (tx) => {
      const ref = lockRef(id);
      if ((await tx.get(ref)).get('lease') === lease) tx.delete(ref);
    });
    else await rm(lockPath, { recursive: true, force: true });
  }
}

export async function cloudUpload(s: StoredSession) {
  if (!cloud) return null;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error('Firebase web upload configuration is missing.');
  }
  firebase();
  return {
    provider: 'firebase' as const,
    customToken: await firebase().auth.createCustomToken(s.id, { uploader: true }),
    config: {
      apiKey,
      authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
  };
}

export async function retire(s: StoredSession) {
  if (cloud) {
    await firebase().auth.deleteUser(s.id).catch((error) => {
      if (error.code !== 'auth/user-not-found') throw error;
    });
    await firestore().runTransaction(async (tx) => {
      await requireLease(tx, s.id);
      const ref = codeRef(s.accessCode);
      const code = await tx.get(ref);
      if (code.get('sessionId') === s.id) tx.delete(ref);
      tx.delete(sessionRef(s.id));
    });
  } else {
    const code = path.join(root, 'codes', s.accessCode);
    try {
      if ((await readFile(code, 'utf8')) === s.id) await rm(code, { force: true });
    } catch {}
    await rm(path.join(root, s.id), { recursive: true, force: true });
  }
}

export async function maintenance() {
  let purged = 0,
    retired = 0,
    failed = 0;
  for (const candidate of await allSessions()) {
    if (candidate.expiresAt > Date.now() && !candidate.purging && !candidate.deletedAt) continue;
    await withSessionLock(candidate.id, async () => {
      const s = await readSession(candidate.id);
      if (!s) return;
      if (s.purging || (!s.deletedAt && s.expiresAt <= Date.now())) {
        await purge(s, s.purgeSource || 'TTL_PURGE');
        purged++;
      }
      if (s.deletedAt && Date.now() > Math.max(s.expiresAt, s.deletedAt) + 3600000) {
        await retire(s);
        retired++;
      }
    }).catch(() => {
      failed++;
    });
  }
  return { purged, retired, failed };
}

export async function signedFileUrl(s: StoredSession, fileId: string) {
  if (!cloud) return null;
  return (
    await firebase()
      .bucket.file(`sessions/${s.id}/${fileId}`)
      .getSignedUrl({
        action: 'read',
        expires: Math.min(s.expiresAt, Date.now() + 60000),
        responseDisposition: `${s.files.find((f) => f.fileId === fileId)?.type.includes('wordprocessing') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(s.files.find((f) => f.fileId === fileId)?.name || 'document')}`,
      })
  )[0];
}

export async function activateSession(s: StoredSession) {
  if (s.expiresAt <= Date.now()) throw new Error('Upload expired');
  s.expiresAt = Date.now() + 900000;
  s.status = 'ACTIVE';
  await saveSession(s);
}
