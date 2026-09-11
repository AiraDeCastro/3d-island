export type QualityTier = 'high' | 'low'

export interface QualityProfile {
  tier: QualityTier
  /** Live-adjustable: applied via renderer.setPixelRatio(), no rebuild needed. */
  pixelRatioCap: number
  /** Baked into geometry at construction — the sand/ocean meshes aren't rebuilt if this changes later. */
  sandSegments: number
  oceanSegments: number
  /** Live-adjustable: passes can be added/removed from the composer at any time. */
  bloomEnabled: boolean
  ssaoEnabled: boolean
}

const HIGH: QualityProfile = {
  tier: 'high',
  pixelRatioCap: 2,
  sandSegments: 96,
  oceanSegments: 128,
  bloomEnabled: true,
  ssaoEnabled: true,
}

const LOW: QualityProfile = {
  tier: 'low',
  pixelRatioCap: 1,
  sandSegments: 40,
  oceanSegments: 48,
  bloomEnabled: true,
  ssaoEnabled: false,
}

export interface DeviceCapabilities {
  hardwareConcurrency: number
  /** A touch-primary pointer is a reasonable, cheap proxy for "phone-class device". */
  isCoarsePointer: boolean
}

/** Reads the actual browser/device state — not called from unit tests, same reasoning as SandSystem's WebGL-bound constructor. */
export function detectCapabilities(): DeviceCapabilities {
  return {
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isCoarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
  }
}

/** Pure decision logic, kept separate from detectCapabilities() so it's unit-testable without a browser. */
export function chooseQualityTier(caps: DeviceCapabilities): QualityTier {
  if (caps.isCoarsePointer) return 'low'
  if (caps.hardwareConcurrency <= 2) return 'low'
  return 'high'
}

export function getQualityProfile(tier: QualityTier): QualityProfile {
  return tier === 'high' ? HIGH : LOW
}
