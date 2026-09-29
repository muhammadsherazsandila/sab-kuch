import React, { useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '@/lib/pwa';
import OEMBrowserGuideModal from '@/components/pwa/OEMBrowserGuideModal';
import { toast } from 'sonner';

export default function InstallBanner() {
  const {
    canInstall,
    isStandalone,
    isIOS,
    isAndroid,
    isProblematicPWA,
    browserName,
    triggerInstallPrompt,
    redirectToChrome,
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showOEMGuide, setShowOEMGuide] = useState(false);

  // If already installed as PWA or user dismissed this session, don't show
  if (isStandalone || dismissed) {
    return null;
  }

  // Show if native install prompt ready, or on iOS, or on problematic OEM/In-App browser
  if (!canInstall && !isIOS && !isProblematicPWA) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isProblematicPWA) {
      setShowOEMGuide(true);
      if (isAndroid) {
        redirectToChrome();
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (canInstall) {
      const accepted = await triggerInstallPrompt();
      if (accepted) {
        toast.success('Thank you for installing Sab Kuch!');
        setDismissed(true);
      }
    } else {
      toast.info('Look for the install icon ⊕ in your browser address bar.');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <>
      <div className="bg-gradient-to-r from-orange-600 via-primary-500 to-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs z-30 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm bg-white p-0.5 border border-white/20">
            <img src="/logo.jpg" alt="Sab Kuch" className="w-full h-full object-contain aspect-square" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-[13px] leading-tight">Install Sab Kuch</p>
            <p className="text-white/90 text-[11px] truncate">1-tap order tracking & offline access</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-white text-primary-600 font-bold px-3 py-1.5 rounded-full shadow hover:bg-orange-50 active:scale-95 transition-all text-[11px] flex items-center gap-1"
          >
            <Download size={13} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Share size={18} className="text-primary-500" />
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Apple Safari requires adding web apps to your home screen manually:
            </p>

            <ol className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                <span>Tap the <strong className="text-gray-900">Share</strong> button at bottom of Safari</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                <span>Scroll down and select <strong className="text-gray-900"><PlusSquare size={13} className="inline mx-0.5" /> Add to Home Screen</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                <span>Tap <strong className="text-primary-600">Add</strong> in the top right corner</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* OEM / In-App Browser Defensive Installation Guide Modal */}
      <OEMBrowserGuideModal
        isOpen={showOEMGuide}
        onClose={() => setShowOEMGuide(false)}
      />
    </>
  );
}
