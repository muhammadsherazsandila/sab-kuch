/**
 * OEMBrowserGuideModal
 *
 * Defensive PWA Visual Guide for OEM built-in browsers (Xiaomi/MIUI, Vivo, Oppo,
 * Infinix, Huawei, etc.) and in-app browsers (Instagram, Facebook, TikTok, WhatsApp).
 *
 * Provides:
 * 1. 1-tap redirect to Google Chrome via Android Intent.
 * 2. 1-tap URL copy button for pasting into Chrome, Firefox, or Safari.
 * 3. Step-by-step visual illustrated instructions tailored to Android vs iOS.
 * 4. Dismissible option so customers can continue shopping if desired.
 */

import { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  X,
  Compass,
  Share2,
  Smartphone,
  ArrowRight,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getEnvironmentInfo,
  redirectToChrome,
  getFirefoxIntentUrl,
} from '@/lib/browserDetection';
import { toast } from 'sonner';

interface OEMBrowserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetUrl?: string;
}

export default function OEMBrowserGuideModal({
  isOpen,
  onClose,
  initialTargetUrl,
}: OEMBrowserGuideModalProps) {
  const [copied, setCopied] = useState(false);
  const env = getEnvironmentInfo();
  const currentUrl =
    initialTargetUrl || (typeof window !== 'undefined' ? window.location.href : '');

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback for older OEM browsers
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('App URL copied to clipboard! Paste it into Chrome or Safari.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy. Please manually copy the URL from your address bar.');
    }
  };

  const handleOpenChrome = () => {
    toast.info('Opening Google Chrome...');
    redirectToChrome(currentUrl);
  };

  const handleOpenFirefox = () => {
    if (typeof window !== 'undefined') {
      window.location.href = getFirefoxIntentUrl(currentUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-slide-up border border-gray-100">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100 shadow-xs">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                {env.isOEMBrowser
                  ? 'Built-in Browser Detected'
                  : 'In-App Browser Detected'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                PWA installation requires a standard browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Environment Detection Badge ───────────────────────────────────── */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <Smartphone size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            <span className="font-semibold text-gray-800 block truncate">
              {env.browserName}
            </span>
            <span className="text-gray-500 text-[11px] block truncate">
              Running on {env.deviceBrand}
            </span>
          </div>
          <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider px-2">
            Limited PWA
          </Badge>
        </div>

        {/* ── Explanation ─────────────────────────────────────────────────── */}
        <p className="text-xs text-gray-600 leading-relaxed">
          {env.isOEMBrowser ? (
            <>
              Your device&apos;s pre-installed browser restricts full app installation.
              Open in <strong>Google Chrome</strong> or <strong>Firefox</strong> to install
              Sab Kuch on your home screen with push notifications and fast offline ordering.
            </>
          ) : (
            <>
              You are opening this link inside an in-app viewer. For full app installation,
              open in <strong>Safari (iOS)</strong> or <strong>Google Chrome (Android)</strong>.
            </>
          )}
        </p>

        {/* ── Primary Action: Open in Chrome (Android) ────────────────────── */}
        {env.isAndroid && (
          <div className="space-y-2">
            <button
              onClick={handleOpenChrome}
              className="w-full gradient-primary text-white font-bold py-3.5 px-4 rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink size={18} />
              <span>Open in Google Chrome</span>
            </button>
            <p className="text-[11px] text-center text-gray-400">
              Directly launches Google Chrome on your device
            </p>
          </div>
        )}

        {/* ── Secondary / Fallback: Copy URL Section ──────────────────────── */}
        <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Globe size={14} className="text-primary-500" />
              If Chrome is not installed, copy link:
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 min-w-0 text-[11px] text-gray-600 bg-transparent outline-hidden font-mono px-1 select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Visual Step-by-Step Instructions ─────────────────────────────── */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Visual Guide: How to Install
          </h4>

          {env.isIOS ? (
            /* iOS Instructions */
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 space-y-2.5 text-xs text-blue-950">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share2 size={13} className="inline mx-1 text-blue-600" /> or <strong>···</strong> menu in this app.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Choose <strong>&quot;Open in Safari&quot;</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  In Safari, tap <strong>Share</strong> at bottom &rarr; select <strong>&quot;Add to Home Screen&quot;</strong>.
                </span>
              </div>
            </div>
          ) : (
            /* Android Instructions */
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 space-y-2.5 text-xs text-gray-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap <strong>&quot;Open in Google Chrome&quot;</strong> above (or copy link).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Open <strong>Google Chrome</strong> or <strong>Firefox</strong> and paste the link in the address bar.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap the <strong>Install</strong> banner or tap menu (<strong>⋮</strong>) &rarr; <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Secondary options: Firefox or Continue in browser ─────────────── */}
        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
          {env.isAndroid && (
            <button
              onClick={handleOpenFirefox}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold py-1 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Have Firefox installed? Open in Firefox</span>
              <ArrowRight size={12} />
            </button>
          )}

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-xs text-gray-500 hover:text-gray-700 py-2"
          >
            Continue in current browser without installing
          </Button>
        </div>
      </div>
    </div>
  );
}
