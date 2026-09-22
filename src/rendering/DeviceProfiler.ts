export type QualityPreset = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DeviceProfile {
  preset: QualityPreset;
  pixelRatio: number;
  antialias: boolean;
}

/** Small, deterministic quality boundary for HTML5 portal devices. */
export function profileDevice(): DeviceProfile {
  const memory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? Number((navigator as Navigator & {deviceMemory?:number}).deviceMemory ?? 4) : 4;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (memory <= 2 || cores <= 2) return {preset:'LOW', pixelRatio:1, antialias:false};
  if (memory <= 4 || cores <= 4) return {preset:'MEDIUM', pixelRatio:Math.min(dpr, 1.5), antialias:true};
  return {preset:'HIGH', pixelRatio:Math.min(dpr, 2), antialias:true};
}
