import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { FileMetadata, SessionData } from './types';
export interface CloudUpload { customToken: string; config: { apiKey: string; authDomain: string; projectId: string; storageBucket: string } }
export async function uploadCloud(session: SessionData, files: FileMetadata[], upload: CloudUpload, progress?: (percent: number) => void) {
  const app = initializeApp(upload.config, session.id);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  try {
    await signInWithCustomToken(auth, upload.customToken);
    const storage = getStorage(app); let completed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i].file; if (!file) throw new Error('Please select your files again.');
      const task = uploadBytesResumable(ref(storage, `sessions/${session.id}/${session.files[i].fileId}`), file, { contentType: files[i].type, cacheControl: 'no-store' });
      await new Promise<void>((resolve, reject) => task.on('state_changed', state => progress?.(Math.round((completed + state.bytesTransferred) / session.totalSizeBytes * 100)), reject, resolve));
      completed += file.size;
    }
  } finally { await signOut(auth).catch(() => {}); await deleteApp(app); }
}
