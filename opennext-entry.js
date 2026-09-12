import { initializePublic } from './opennext-public.js?v=opennext-20260912-3';
import './opennext-a11y.js?v=opennext-20260912-3';
const initialRoute = location.hash.slice(1);
await import('./phase1-entry-v2.js?v=opennext-20260912-3');
const { procurementState } = await import('./procurement-data.js?v=opennext-20260912-3');
window.OpenNEXTSetGpuMode = mode => { procurementState.gpuMode = mode === 'hardware' ? 'hardware' : 'rental'; };
initializePublic(initialRoute);
console.info('OpenNEXT public site and procurement workspace ready');
