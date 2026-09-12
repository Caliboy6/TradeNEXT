import { initializePublic } from './opennext-public.js';
import './opennext-a11y.js';
const initialRoute = location.hash.slice(1);
await import('./phase1-entry-v2.js');
const { procurementState } = await import('./procurement-data.js');
window.OpenNEXTSetGpuMode = mode => { procurementState.gpuMode = mode === 'hardware' ? 'hardware' : 'rental'; };
initializePublic(initialRoute);
console.info('OpenNEXT public site and procurement workspace ready');
