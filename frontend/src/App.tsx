/**
 * App.tsx — Root Application Component
 *
 * Responsibilities:
 * 1. Capture the beforeinstallprompt event EARLY so we can defer it to checkout.
 * 2. Set up React Router with all routes.
 * 3. Wrap everything in GoogleOAuthProvider and Router.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { captureInstallPrompt } from '@/lib/pwa';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Layouts
import AppLayout from '@/components/layout/AppLayout';

// Pages
import AppStoreMimic     from '@/pages/AppStoreMimic';
import AuthScreen        from '@/pages/AuthScreen';
import AdminDashboard    from '@/pages/AdminDashboard';
import HomeScreen        from '@/pages/HomeScreen';
import ShopsScreen       from '@/pages/ShopsScreen';
import VendorDetailScreen from '@/pages/VendorDetailScreen';
import ProductDetailScreen from '@/pages/ProductDetailScreen';
import MyOrdersScreen    from '@/pages/MyOrdersScreen';
import OrderDetailScreen from '@/pages/OrderDetailScreen';
import CheckoutScreen    from '@/pages/CheckoutScreen';
import SettingsScreen    from '@/pages/SettingsScreen';
import EditProfileScreen from '@/pages/EditProfileScreen';
import SearchScreen      from '@/pages/SearchScreen';
import PrivacyPolicyScreen from '@/pages/PrivacyPolicyScreen';
import TermsConditionsScreen from '@/pages/TermsConditionsScreen';
import NotFoundScreen    from '@/pages/NotFoundScreen';
import { Toaster }        from 'sonner';

export default function App() {
  useEffect(() => {
    captureInstallPrompt();
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Toaster
        richColors
        position="top-center"
        closeButton
        toastOptions={{
          style: {
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: 500,
          },
        }}
      />
      <BrowserRouter>
        <Routes>

          {/* ── QR-code landing page (no shell) ──────────────────────────── */}
          <Route path="/get-app" element={<AppStoreMimic />} />
          <Route path="/install" element={<AppStoreMimic />} />

          {/* ── Auth (no shell) ──────────────────────────────────────────── */}
          <Route path="/auth" element={<AuthScreen />} />

          {/* ── Admin (no shell, own layout) ─────────────────────────────── */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* ── Main app shell with sticky bottom nav & swipe navigation ─── */}
          <Route element={<AppLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="search"       element={<SearchScreen />} />
            <Route path="shops"        element={<ShopsScreen />} />
            <Route path="shops/:slug"  element={<VendorDetailScreen />} />
            <Route path="products/:id" element={<ProductDetailScreen />} />
            <Route path="checkout"     element={<CheckoutScreen />} />
            <Route path="cart"         element={<CheckoutScreen />} />
            <Route path="orders"       element={<MyOrdersScreen />} />
            <Route path="orders/:id"   element={<OrderDetailScreen />} />
            <Route path="settings"     element={<SettingsScreen />} />

            {/* Custom order redirect to cart/checkout */}
            <Route path="custom"       element={<Navigate to="/checkout" replace />} />

            {/* Settings sub-pages */}
            <Route path="settings/profile"   element={<EditProfileScreen />} />
            <Route path="settings/city"      element={<SettingsScreen />} />
            <Route path="settings/addresses" element={<EditProfileScreen />} />

            {/* Legal pages */}
            <Route path="privacy"            element={<PrivacyPolicyScreen />} />
            <Route path="privacy-policy"     element={<Navigate to="/privacy" replace />} />
            <Route path="terms"              element={<TermsConditionsScreen />} />
            <Route path="terms-and-conditions" element={<Navigate to="/terms" replace />} />
          </Route>

          {/* ── 404 catch-all ─────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
