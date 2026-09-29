/**
 * AppStoreMimic — Phase 2 PWA Onboarding
 *
 * Purpose:
 *   When a user scans a marketing QR code we detect their OS and render
 *   a landing page that mimics the native app store experience:
 *
 *   iOS     → looks like Apple App Store (white bg, SF-like typography)
 *   Android → looks like Google Play Store (Material card style)
 *   Desktop → neutral landing page with QR code hint
 *
 * Flow:
 *   1. User scans QR → lands on /get-app
 *   2. This page renders (OS-aware design)
 *   3. "Browse Now" / "Install App" → enters guest app at /
 *   4. At checkout, PWA install is triggered (see pwa.ts)
 *
 * The install prompt is NOT shown here — it's deferred to checkout.
 * We only show the "how to install" tooltip here for iOS users.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Download, ShoppingBag, Clock, Shield, ChevronRight,
  Share, PlusSquare, ArrowDownCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIOS, isAndroid, isInStandaloneMode, triggerInstallPrompt, canInstall, usePWAInstall } from '@/lib/pwa';
import OEMBrowserGuideModal from '@/components/pwa/OEMBrowserGuideModal';

// ── App metadata shown on the mimic page ───────────────────────────────────
const APP_META = {
  name: 'Sab Kuch',
  developer: 'Sab Kuch Technologies',
  rating: 4.8,
  reviews: '12K',
  downloads: '500K+',
  description: 'Order food, groceries, medicines & more from local shops near you. Fast delivery, real-time tracking.',
  features: [
    { icon: ShoppingBag, label: 'Order anything from local shops' },
    { icon: Clock,       label: 'Real-time delivery tracking'    },
    { icon: Shield,      label: 'Secure & trusted payments'     },
  ],
  screenshots: [
    { color: 'from-orange-400 to-red-500', label: 'Home' },
    { color: 'from-amber-400 to-orange-500', label: 'Shops' },
    { color: 'from-red-400 to-pink-500', label: 'Orders' },
  ],
};

export default function AppStoreMimic() {
  const navigate = useNavigate();
  const [os, setOs] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showIosTooltip, setShowIosTooltip] = useState(false);
  const [showOEMGuide, setShowOEMGuide] = useState(false);

  const {
    isProblematicPWA,
    isOEMBrowser,
    isAndroid: isAndroidDevice,
    redirectToChrome,
  } = usePWAInstall();

  // ── Detect OS & auto-redirect OEM browsers on mount ───────────────────
  useEffect(() => {
    if (isIOS())     setOs('ios');
    else if (isAndroid()) setOs('android');
    else setOs('desktop');

    // If already installed as PWA, skip straight to the app
    if (isInStandaloneMode()) {
      navigate('/', { replace: true });
      return;
    }

    // Defensive auto-redirect: if OEM browser on Android, attempt Chrome redirect once
    if (isOEMBrowser && isAndroidDevice && !sessionStorage.getItem('pwa_oem_mimic_redirect')) {
      sessionStorage.setItem('pwa_oem_mimic_redirect', 'true');
      redirectToChrome();
    }
  }, [navigate, isOEMBrowser, isAndroidDevice, redirectToChrome]);

  // ── "Browse Now" — enter app as guest ──────────────────────────────────
  function handleBrowse() {
    navigate('/');
  }

  // ── "Install App" — platform-aware behaviour ───────────────────────────
  async function handleInstall() {
    // If in an OEM browser or in-app webview that breaks PWA
    if (isProblematicPWA) {
      setShowOEMGuide(true);
      if (isAndroidDevice) {
        redirectToChrome();
      }
      return;
    }

    if (os === 'ios') {
      // iOS has no programmatic install — show the share sheet tooltip
      setShowIosTooltip(true);
    } else if (canInstall()) {
      const accepted = await triggerInstallPrompt();
      if (accepted) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* ── Store Header bar ─────────────────────────────────────────────── */}
      {os === 'ios' ? <IOSHeader /> : os === 'android' ? <AndroidHeader /> : <DesktopHeader />}

      {/* ── App Hero ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 flex items-start gap-4">
        {/* App icon */}
        <div className="w-20 h-20 rounded-[22px] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-100 bg-white p-2">
          <img src="/logo.jpg" alt="Sab Kuch" className="w-full h-full object-contain aspect-square" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{APP_META.name}</h1>
          <p className="text-primary-500 text-sm font-medium mt-0.5">{APP_META.developer}</p>
          {/* Star rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className={s <= Math.round(APP_META.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{APP_META.rating} · {APP_META.reviews} reviews</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{APP_META.downloads} downloads</p>
        </div>
      </div>

      {/* ── CTA Buttons ──────────────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-3">
        <Button
          className="w-full h-12 text-base font-bold shadow-md"
          onClick={handleInstall}
        >
          {os === 'ios' ? (
            <><Download size={18} className="mr-2" /> Install App</>
          ) : os === 'android' ? (
            <><ArrowDownCircle size={18} className="mr-2" /> Install App</>
          ) : (
            <><ShoppingBag size={18} className="mr-2" /> Open App</>
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-base font-semibold"
          onClick={handleBrowse}
        >
          Browse Now <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>

      {/* ── iOS Install Tooltip ───────────────────────────────────────────── */}
      {showIosTooltip && (
        <div className="mx-5 mt-4 bg-gray-900 text-white rounded-xl p-4 text-sm animate-fade-in">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <Share size={16} /> How to install on iOS:
          </p>
          <ol className="space-y-1.5 text-gray-300">
            <li className="flex items-center gap-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
              Tap the <Share size={14} className="inline mx-1 text-white" /> <strong className="text-white">Share</strong> button in Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
              Scroll down and tap <PlusSquare size={14} className="inline mx-1 text-white" /> <strong className="text-white">Add to Home Screen</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
              Tap <strong className="text-white">Add</strong> — done! 🎉
            </li>
          </ol>
          <button
            className="mt-3 text-primary-400 text-xs underline"
            onClick={() => { setShowIosTooltip(false); handleBrowse(); }}
          >
            Skip — browse without installing
          </button>
        </div>
      )}

      {/* ── Screenshots carousel ─────────────────────────────────────────── */}
      <div className="mt-6 px-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Screenshots</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {APP_META.screenshots.map((s) => (
            <div
              key={s.label}
              className={`flex-shrink-0 w-32 h-56 rounded-xl bg-gradient-to-b ${s.color} flex items-end p-3`}
            >
              <span className="text-white text-xs font-semibold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature list ─────────────────────────────────────────────────── */}
      <div className="mt-5 px-5 space-y-3 pb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What's inside</p>
        {APP_META.features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-primary-500" />
            </div>
            <p className="text-sm text-gray-700 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <div className="px-5 pb-10">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</p>
        <p className="text-sm text-gray-600 leading-relaxed">{APP_META.description}</p>
      </div>

      {/* OEM / In-App Browser Defensive Installation Guide Modal */}
      <OEMBrowserGuideModal
        isOpen={showOEMGuide}
        onClose={() => setShowOEMGuide(false)}
      />
    </div>
  );
}

// ── OS-specific header bars ─────────────────────────────────────────────────

function IOSHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="text-primary-500 text-sm font-medium">‹ Apps</span>
      <span className="text-xs text-gray-500 font-medium">App Store</span>
      <span className="text-primary-500 text-sm font-medium">Search</span>
    </div>
  );
}

function AndroidHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
        <span className="text-gray-400 text-xs">🔍</span>
        <span className="text-gray-400 text-sm">Search apps & games</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
        <span className="text-primary-500 text-xs font-bold">SK</span>
      </div>
    </div>
  );
}

function DesktopHeader() {
  return (
    <div className="gradient-primary px-5 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs">
        <img src="/logo.jpg" alt="Sab Kuch" className="w-full h-full object-contain aspect-square" />
      </div>
      <span className="text-white font-bold text-lg">Sab Kuch</span>
    </div>
  );
}
