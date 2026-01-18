import Heroshot from './components/Heroshot.vue';

// Re-export from shared for convenience
export { setManifest, getManifest } from '../../shared/manifestStore';
export type { Manifest } from '../../shared/types';

export { Heroshot };
export default Heroshot;
