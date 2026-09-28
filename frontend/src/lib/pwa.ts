/**
 * PWA Install Utility
 *
 * Handles the complex cross-platform PWA install UX:
 *
 * Android / Chrome:
 *   - Captures the `beforeinstallprompt` event early (on page load)
 *   - Defers it so we don't auto-prompt — we show it only at checkout
 *   - Calling `triggerInstallPrompt()` shows the native Android install sheet
 *
 * iOS / Safari:
 *   - There is NO programmatic install API on iOS
 *   - We detect iOS and show a manual tooltip: "Share → Add to Home Screen"
 *   - The tooltip is triggered at the same checkout gate
 *
 * Detection logic:
 *   - `isIOS()`        : checks userAgent for iPhone/iPad/iPod
 *   - `isAndroid()`    : checks userAgent for Android
 *   - `isInStandaloneMode()` : checks if already running as installed PWA
 */

// Stores the deferred Android install prompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * The browser fires `beforeinstallprompt` when the PWA install criteria
 * are met. We intercept it here and hold it for later use.
 * Call this ONCE at app startup (in main.tsx or App.tsx).
 */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.debug('[PWA] Install prompt captured and deferred');
  });
}

/**
 * Trigger the native Android PWA install prompt.
 * Returns true if the user accepted, false if dismissed or not available.
 */
export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.debug('[PWA] No deferred prompt available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond
  const { outcome } = await deferredPrompt.userChoice;
  console.debug(`[PWA] User ${outcome} the install prompt`);

  // The prompt can only be used once — discard it
  deferredPrompt = null;

  return outcome === 'accepted';
}

/** Returns true if running on an iOS device (iPhone, iPad, iPod) */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Returns true if running on Android */
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/** Returns true if the app is already installed and running as a PWA */
export function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error — iOS-specific property
    window.navigator.standalone === true
  );
}

/** Returns true if a deferred install prompt is available (Android only) */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

// ── TypeScript augmentation for the non-standard BeforeInstallPromptEvent ──
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}
