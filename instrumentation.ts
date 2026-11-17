export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { isCloud, maintenance } = await import('./src/lib/server/store');
    if (isCloud) return;
    const state = globalThis as typeof globalThis & { zdropPurgeTimer?: ReturnType<typeof setInterval> };
    state.zdropPurgeTimer ||= setInterval(() => { maintenance().catch(() => console.error('ZDrop cleanup failed; will retry.')); }, 5000);
    state.zdropPurgeTimer.unref();
  }
}
