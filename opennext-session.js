// A tab-scoped demo session. This is not production authentication.
export const workspaceRoutes = new Set(['models', 'gpus', 'rfq', 'supply', 'data', 'docs', 'scheduler']);
export const DEMO_CODE = '123456';
const KEY = 'opennext.demo-session.v1';
export function safeDestination(value) {
  return workspaceRoutes.has(value) ? value : 'models';
}
export function readSession(storage) {
  try {
    const session = JSON.parse(storage.getItem(KEY));
    return session?.demo === true && typeof session.email === 'string' && typeof session.expiresAt === 'number' && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}
export function writeSession(storage, profile = {}) {
  const session = { demo: true, email: profile.email || 'visitor@demo.example', name: profile.name || 'Demo user', company: profile.company || 'Demo Workspace', expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
  try { storage.setItem(KEY, JSON.stringify(session)); } catch { /* In-memory session remains usable. */ }
  return session;
}
export function clearSession(storage) {
  try { storage.removeItem(KEY); } catch { /* Restricted storage. */ }
}
