/**
 * PWA Install Utility & Reactive Hook
 *
 * Handles cross-platform PWA installation:
 * - Chrome / Edge / Chromium (Desktop & Android):
 *   - Captures `beforeinstallprompt` immediately upon script load.
 *   - Allows programmatic triggering via `triggerInstallPrompt()`.
 *   - Detects successful installation via `appinstalled`.
 * - iOS Safari:
 *   - Detects standalone mode vs browser.
 *   - Provides helper info for "Share -> Add to Home Screen".
 */

import { useState, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ── Singleton State ────────────────────────────────────────────────────────
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

/**
 * Capture beforeinstallprompt immediately at module evaluation time
 * so we NEVER miss the event if Chrome fires it before React mounts.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent automated browser prompt so we can show custom install UI
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] beforeinstallprompt event captured and deferred');
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[PWA] App successfully installed!');
    notifyListeners();
  });
}

/**
 * Explicit initializer if needed by main.tsx
 */
export function captureInstallPrompt(): void {
  // Event listener already bound at top level, log for confirmation
  console.debug('[PWA] captureInstallPrompt initialized');
}

/**
 * Trigger the native PWA install prompt.
 * Works on Chrome/Edge (Desktop and Android).
 * Returns true if the user accepted, false if dismissed or prompt unavailable.
 */
export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.debug('[PWA] No deferred prompt available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    // Wait for user choice
    const choice = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${choice.outcome} the install prompt`);
    if (choice.outcome === 'accepted') {
      deferredPrompt = null;
      notifyListeners();
      return true;
    }
    return false;
  } catch (err) {
    console.error('[PWA] Error triggering install prompt:', err);
    return false;
  }
}

/** Returns true if running on an iOS device (iPhone, iPad, iPod) */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Returns true if running on Android */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/** Returns true if the app is already installed and running as a standalone PWA */
export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error — iOS-specific standalone property
    window.navigator.standalone === true
  );
}

/** Returns true if a deferred install prompt is currently ready */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/**
 * React hook for components to subscribe to PWA install availability.
 * Automatically updates when beforeinstallprompt fires or when app is installed.
 */
export function usePWAInstall() {
  const [installable, setInstallable] = useState<boolean>(() => canInstall());
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isInStandaloneMode());

  useEffect(() => {
    const update = () => {
      setInstallable(canInstall());
      setIsStandalone(isInStandaloneMode());
    };

    listeners.add(update);
    update();

    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    canInstall: installable,
    isStandalone,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    triggerInstallPrompt,
  };
}
