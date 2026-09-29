/**
 * Device & Browser Detection for Defensive PWA Installation
 *
 * Specializes in identifying OEM built-in browsers (Xiaomi/MIUI, Vivo, Oppo/HeyTap,
 * Huawei, Honor, Transsion/Phoenix, UC Browser, Android WebViews) and In-App browsers
 * (Instagram, Facebook, TikTok, WhatsApp) which break or restrict native PWA installation.
 */

export type DeviceType = 'android' | 'ios' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceBrand: string;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export interface BrowserInfo {
  isOEMBrowser: boolean;
  isInAppBrowser: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsungInternet: boolean;
  isProblematicForPWA: boolean; // OEM browser or In-App browser where PWA install fails
  browserName: string;
  recommendedBrowser: 'chrome' | 'safari' | 'firefox';
}

export interface EnvironmentInfo extends DeviceInfo, BrowserInfo {}

/**
 * Detect Device and Manufacturer Brand
 */
export function detectDevice(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      deviceBrand: 'Desktop',
      isMobile: false,
      isAndroid: false,
      isIOS: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);

  let deviceType: DeviceType = 'desktop';
  if (isIOS) deviceType = 'ios';
  else if (isAndroid) deviceType = 'android';

  let deviceBrand: string;
  if (isIOS) {
    deviceBrand = 'Apple';
  } else if (isAndroid) {
    if (/xiaomi|redmi|poco|mi\s/i.test(ua) || /miuibrowser/i.test(ua)) {
      deviceBrand = 'Xiaomi / Redmi';
    } else if (/samsung|sm-[a-z0-9]+/i.test(ua) || /samsungbrowser/i.test(ua)) {
      deviceBrand = 'Samsung';
    } else if (/vivo|v2\d{3}|iqoo/i.test(ua) || /vivobrowser/i.test(ua)) {
      deviceBrand = 'Vivo';
    } else if (/oppo|cph\d{4}|realme|rmx\d{4}|oneplus/i.test(ua) || /heytapbrowser/i.test(ua)) {
      deviceBrand = 'Oppo / Realme';
    } else if (/infinix|tecno|itel/i.test(ua) || /phx|phoenix/i.test(ua)) {
      deviceBrand = 'Infinix / Tecno';
    } else if (/huawei|hct|hry|els|ana|jer|tas|lio|clt/i.test(ua) || /huaweibrowser/i.test(ua)) {
      deviceBrand = 'Huawei';
    } else if (/honor/i.test(ua) || /honorbrowser/i.test(ua)) {
      deviceBrand = 'Honor';
    } else {
      deviceBrand = 'Android Device';
    }
  } else {
    deviceBrand = 'Desktop Computer';
  }

  return {
    deviceType,
    deviceBrand,
    isMobile: isIOS || isAndroid,
    isAndroid,
    isIOS,
  };
}

/**
 * Detect Browser, especially OEM built-in browsers and in-app webviews
 */
export function detectBrowser(device?: DeviceInfo): BrowserInfo {
  const currentDevice = device || detectDevice();

  if (typeof navigator === 'undefined') {
    return {
      isOEMBrowser: false,
      isInAppBrowser: false,
      isChrome: false,
      isSafari: false,
      isFirefox: false,
      isEdge: false,
      isSamsungInternet: false,
      isProblematicForPWA: false,
      browserName: 'Unknown',
      recommendedBrowser: 'chrome',
    };
  }

  const ua = navigator.userAgent || '';

  // 1. In-App WebViews (social media apps & messengers)
  const isInstagram = /instagram/i.test(ua);
  const isFacebook = /fban|fbav/i.test(ua);
  const isTikTok = /musical_ly|bytedancewebview|tiktok/i.test(ua);
  const isWhatsApp = /whatsapp/i.test(ua);
  const isTwitter = /twitter/i.test(ua);
  const isLine = /line\//i.test(ua);
  const isWeChat = /micromessenger/i.test(ua);
  const isInAppBrowser = isInstagram || isFacebook || isTikTok || isWhatsApp || isTwitter || isLine || isWeChat;

  // 2. OEM Built-in Browsers on Android (breaking PWA standards)
  const isMiui = /miuibrowser/i.test(ua);
  const isVivo = /vivobrowser/i.test(ua);
  const isHeyTap = /heytapbrowser/i.test(ua);
  const isHuawei = /huaweibrowser/i.test(ua);
  const isHonor = /honorbrowser/i.test(ua);
  const isPhoenix = /phoenix\/|phx\//i.test(ua);
  const isUC = /ucbrowser|ubrowser/i.test(ua);
  const isMint = /mint\sbrowser/i.test(ua);
  const isSamsungInternet = /samsungbrowser/i.test(ua);

  // Generic Android WebView: contains '; wv' or 'Version/X.X Chrome/...' (excluding standalone Samsung Internet)
  const isAndroidWebView =
    currentDevice.isAndroid &&
    (/;\s*wv\b/i.test(ua) || (/Version\/[\d.]+.*Chrome\/[\d.]+/i.test(ua) && !isSamsungInternet));

  const isOEMBrowser =
    isMiui ||
    isVivo ||
    isHeyTap ||
    isHuawei ||
    isHonor ||
    isPhoenix ||
    isUC ||
    isMint ||
    (isAndroidWebView && !isInAppBrowser);

  // 3. Mainstream Standard Browsers
  const isFirefox = /firefox\/\d+|fxios/i.test(ua);
  const isEdge = /edg\/\d+|edgios/i.test(ua);
  const isChrome =
    !isOEMBrowser &&
    !isInAppBrowser &&
    !isSamsungInternet &&
    !isEdge &&
    (/chrome\/\d+/i.test(ua) || /crios/i.test(ua));
  const isSafari =
    currentDevice.isIOS &&
    !isInAppBrowser &&
    !isChrome &&
    !isFirefox &&
    !isEdge &&
    /safari/i.test(ua);

  // Friendly browser name
  let browserName = 'Standard Browser';
  if (isInstagram) browserName = 'Instagram In-App Browser';
  else if (isFacebook) browserName = 'Facebook In-App Browser';
  else if (isTikTok) browserName = 'TikTok In-App Browser';
  else if (isWhatsApp) browserName = 'WhatsApp In-App Browser';
  else if (isTwitter) browserName = 'X (Twitter) In-App Browser';
  else if (isMiui) browserName = 'Xiaomi Mi Browser';
  else if (isVivo) browserName = 'Vivo Browser';
  else if (isHeyTap) browserName = 'Oppo / Realme Browser';
  else if (isHuawei) browserName = 'Huawei Browser';
  else if (isHonor) browserName = 'Honor Browser';
  else if (isPhoenix) browserName = 'Phoenix Browser';
  else if (isUC) browserName = 'UC Browser';
  else if (isSamsungInternet) browserName = 'Samsung Internet';
  else if (isAndroidWebView) browserName = 'Android System WebView';
  else if (isChrome) browserName = 'Google Chrome';
  else if (isSafari) browserName = 'Apple Safari';
  else if (isFirefox) browserName = 'Mozilla Firefox';
  else if (isEdge) browserName = 'Microsoft Edge';

  const isProblematicForPWA = isOEMBrowser || isInAppBrowser;
  const recommendedBrowser = currentDevice.isIOS ? 'safari' : 'chrome';

  return {
    isOEMBrowser,
    isInAppBrowser,
    isChrome,
    isSafari,
    isFirefox,
    isEdge,
    isSamsungInternet,
    isProblematicForPWA,
    browserName,
    recommendedBrowser,
  };
}

/**
 * Full combined detection
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const device = detectDevice();
  const browser = detectBrowser(device);
  return { ...device, ...browser };
}

/**
 * Build Android Intent URI targeting Google Chrome
 */
export function getChromeIntentUrl(targetUrl?: string): string {
  const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  try {
    const urlObj = new URL(currentUrl);
    const hostAndPath = `${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    // Android Chrome package intent scheme with fallback parameter
    return `intent://${hostAndPath}#Intent;scheme=https;package=com.android.chrome;end;`;
  } catch {
    const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
  }
}

/**
 * Build Android Intent URI targeting Mozilla Firefox as alternative
 */
export function getFirefoxIntentUrl(targetUrl?: string): string {
  const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  try {
    const urlObj = new URL(currentUrl);
    const hostAndPath = `${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    return `intent://${hostAndPath}#Intent;scheme=https;package=org.mozilla.firefox;end;`;
  } catch {
    const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
    return `intent://${cleanUrl}#Intent;scheme=https;package=org.mozilla.firefox;end;`;
  }
}

/**
 * Attempt to redirect to Google Chrome on Android.
 * If Chrome is installed, Android handles the intent and opens Chrome.
 * If Chrome is not installed, the intent fails or stays on page.
 */
export function redirectToChrome(targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  const intentUrl = getChromeIntentUrl(targetUrl);
  window.location.href = intentUrl;
}
