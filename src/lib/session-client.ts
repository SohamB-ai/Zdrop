import { FileMetadata, PrintPreferences, SessionData } from './types';
const tokens = new Map<string, string>();
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
export async function createSession(files: FileMetadata[], preferences: PrintPreferences, progress?: (percent: number) => void): Promise<SessionData> {
  const result = await request('/api/sessions/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: files.map(f => ({ fileName: f.name, fileSize: f.size, mimeType: f.type })), preferences }) });
  const s: SessionData = result.session;
  tokens.set(s.id, result.token);
  try {
    if (result.upload) { const { uploadCloud } = await import('./cloud-upload'); await uploadCloud(s, files, result.upload, progress); } else for (let i = 0; i < files.length; i++) {
      if (!files[i].file) throw new Error('Please select your files again.');
      await request(`/api/sessions/upload?sessionId=${s.id}&fileId=${s.files[i].fileId}`, { method: 'POST', headers: { Authorization: `Bearer ${result.token}` }, body: files[i].file });
      progress?.(Math.round((i + 1) / files.length * 100));
    }
    const confirmed = await request('/api/sessions/confirm', { method: 'POST', headers: { Authorization: `Bearer ${result.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s.id }) });
    files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    sessionStorage.setItem('zdrop-session', JSON.stringify({ id: s.id, token: result.token }));
    return confirmed.session;
  } catch (error) { await deleteSession(s.id).catch(() => {}); throw error; }
}
export async function resolveByAccessCode(code: string): Promise<SessionData> {
  const result = await request(`/api/sessions/resolve?code=${encodeURIComponent(code)}`);
  tokens.set(result.session.id, result.token); return result.session;
}
export async function deleteSession(id: string): Promise<SessionData> {
  const result = await request('/api/sessions/delete', { method: 'POST', headers: { Authorization: `Bearer ${tokens.get(id)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
  sessionStorage.removeItem('zdrop-session'); return result.session;
}
export async function restoreSession(): Promise<SessionData | null> {
  const raw = sessionStorage.getItem('zdrop-session'); if (!raw) return null;
  const { id, token } = JSON.parse(raw); tokens.set(id, token);
  return (await request(`/api/sessions/status?sessionId=${id}`, { headers: { Authorization: `Bearer ${token}` } })).session;
}
export function subscribeToSession(id: string, callback: (s: SessionData) => void, onError?: (message: string) => void) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const poll = async () => {
    try { const r = await request(`/api/sessions/status?sessionId=${id}`, { headers: { Authorization: `Bearer ${tokens.get(id)}` } }); if (!stopped) { callback(r.session); if (['DELETED', 'EXPIRED'].includes(r.session.status)) stopped = true; } }
    catch { if (!stopped) onError?.('Connection interrupted. Retrying session status…'); }
    if (!stopped) timer = setTimeout(poll, 1500);
  };
  void poll(); return () => { stopped = true; clearTimeout(timer); };
}
