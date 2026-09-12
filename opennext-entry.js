import { initializePublic, initializePublicShell, reportWorkspaceFailure } from './opennext-public.js?v=opennext-20260912-6';
import './opennext-a11y.js?v=opennext-20260912-6';
const initialRoute = location.hash.slice(1);
// The public site must never wait for the procurement application to load.
initializePublicShell(initialRoute);
const watchdog = setTimeout(() => reportWorkspaceFailure(new Error('Workspace startup timed out')), 15000);
try {
  await import('./phase1-entry-v2.js?v=opennext-20260912-6');
  const { procurementState } = await import('./procurement-data.js?v=opennext-20260912-6');
  window.OpenNEXTSetGpuMode = mode => { procurementState.gpuMode = mode === 'hardware' ? 'hardware' : 'rental'; };
  const { initializeWorkspaceShell } = await import('./opennext-workspace-shell.js?v=opennext-20260912-6');
  initializeWorkspaceShell();
  initializePublic(initialRoute);
  console.info('OpenNEXT public site and procurement workspace ready');
} catch (error) {
  console.error('OpenNEXT workspace could not start', error);
  reportWorkspaceFailure(error);
} finally {
  clearTimeout(watchdog);
}
