'use client';

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  // Check localStorage first
  const stored = localStorage.getItem('rgpv_device_fp');
  if (stored) {
    cachedFingerprint = stored;
    return stored;
  }

  // Generate new fingerprint
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  cachedFingerprint = result.visitorId;

  // Persist to localStorage
  localStorage.setItem('rgpv_device_fp', cachedFingerprint);

  return cachedFingerprint;
}
