import { SessionData, FileMetadata, PrintPreferences } from "./types";
import { generateOtp } from "./utils";

const STORAGE_KEY = "zdrop_active_sessions";
const CHANNEL_NAME = "zdrop_session_channel";

// BroadcastChannel for cross-tab real-time sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
}

function getStoredSessions(): Record<string, SessionData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSessions(sessions: Record<string, SessionData>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "SYNC", timestamp: Date.now() });
    }
  } catch (e) {
    console.error("Failed to save sessions to localStorage", e);
  }
}

export function createMockSession(
  files: FileMetadata[],
  preferences: PrintPreferences
): SessionData {
  const sessionId = "ses_" + Math.random().toString(36).substring(2, 11);
  const accessCode = generateOtp();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes TTL

  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  const newSession: SessionData = {
    id: sessionId,
    accessCode,
    status: "ACTIVE",
    createdAt: now,
    expiresAt,
    preferences,
    files,
    totalSizeBytes,
  };

  const sessions = getStoredSessions();
  sessions[sessionId] = newSession;
  saveSessions(sessions);

  return newSession;
}

export function getSessionById(sessionId: string): SessionData | null {
  const sessions = getStoredSessions();
  const session = sessions[sessionId];
  if (!session) return null;

  // Check TTL
  if (session.status === "ACTIVE" && Date.now() > session.expiresAt) {
    session.status = "EXPIRED";
    sessions[sessionId] = session;
    saveSessions(sessions);
  }

  return session;
}

export function resolveByAccessCode(code: string): SessionData | null {
  const cleanCode = code.trim();
  const sessions = getStoredSessions();
  const matchingKey = Object.keys(sessions).find((id) => {
    const s = sessions[id];
    return s.accessCode === cleanCode && (s.status === "ACTIVE" || s.status === "ACCESSED");
  });

  if (!matchingKey) return null;

  const session = sessions[matchingKey];
  if (Date.now() > session.expiresAt) {
    session.status = "EXPIRED";
    sessions[matchingKey] = session;
    saveSessions(sessions);
    return null;
  }

  // Transition to ACCESSED
  session.status = "ACCESSED";
  session.accessedAt = Date.now();
  sessions[matchingKey] = session;
  saveSessions(sessions);

  return session;
}

export function deleteMockSession(
  sessionId: string,
  source: "OPERATOR_PRINT" | "STUDENT_REVOKE" | "TTL_PURGE"
): boolean {
  const sessions = getStoredSessions();
  const session = sessions[sessionId];
  if (!session) return false;

  session.status = "DELETED";
  session.deletedAt = Date.now();
  session.deletionSource = source;
  // Clear files array to simulate zero retention purge
  session.files = [];
  sessions[sessionId] = session;
  saveSessions(sessions);
  return true;
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: SessionData | null) => void
): () => void {
  // Initial callback
  callback(getSessionById(sessionId));

  const handleUpdate = () => {
    callback(getSessionById(sessionId));
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleUpdate);
  }

  window.addEventListener("storage", handleUpdate);

  // Interval check for TTL countdown
  const timer = setInterval(() => {
    callback(getSessionById(sessionId));
  }, 1000);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleUpdate);
    }
    window.removeEventListener("storage", handleUpdate);
    clearInterval(timer);
  };
}
