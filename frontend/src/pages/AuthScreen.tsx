/**
 * AuthScreen — Email OTP Login
 *
 * Two-step flow:
 *   Step 1: Enter email → Zod-validated client-side → POST /auth/request-otp
 *   Step 2: Enter 6-digit OTP → Zod-validated → POST /auth/verify-otp → JWT
 *
 * After login, redirects to the `?redirect=` query param (e.g. /checkout)
 * or falls back to home.
 *
 * Validation approach:
 *   - Zod schemas (from lib/schemas.ts) run on submit BEFORE the API call
 *   - Field-level errors are shown inline under each input
 *   - API-level errors (wrong OTP, rate limit) are shown as a top-level banner
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  getFieldErrors,
} from '@/lib/schemas';
import { toast } from 'sonner';

export default function AuthScreen() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const { requestOtp, verifyOtp, loginWithGoogle, loading, error } = useAuth();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  // Field-level Zod validation errors (shown inline)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Google OAuth Callback ─────────────────────────────────────────────
  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (credentialResponse.credential) {
      const ok = await loginWithGoogle(credentialResponse.credential);
      if (ok) navigate(redirectTo, { replace: true });
    }
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    // Client-side Zod validation before touching the network
    const result = RequestOtpSchema.safeParse({ email });
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }

    const ok = await requestOtp(result.data.email);
    if (ok) {
      toast.success(`Verification code sent to ${result.data.email}`);
      setStep('otp');
    } else {
      toast.error('Failed to send verification code. Please check your email.');
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    // Validate both fields together
    const result = VerifyOtpSchema.safeParse({ email, otp });
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }

    const ok = await verifyOtp(result.data.email, result.data.otp);
    if (ok) {
      toast.success('Successfully logged in! Welcome to Sab Kuch.');
      navigate(redirectTo, { replace: true });
    } else {
      toast.error('Invalid OTP. Please check the 6-digit code and try again.');
    }
  }


  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto px-5 pt-12">
      {/* Back button */}
      <button
        onClick={() => step === 'otp' ? setStep('email') : navigate(-1)}
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 w-fit mb-6"
      >
        <ArrowLeft size={22} className="text-gray-700" />
      </button>

      {/* Brand mark */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mb-4 shadow-md border border-gray-100 bg-white p-1.5 flex-shrink-0">
          <img
            src="/logo.jpg"
            alt="Sab Kuch"
            className="w-full h-full object-contain aspect-square rounded-xl"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {step === 'email' ? 'Login or Sign up' : 'Enter OTP'}
        </h1>
        <p className="text-gray-500 text-sm mt-1.5">
          {step === 'email'
            ? 'We\'ll send a one-time code to your email'
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {/* ── Email step ────────────────────────────────────────────────── */}
      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-9 ${fieldErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
                  autoFocus
                />
              </div>
              {/* Inline field error */}
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>
  
            {/* API-level error banner */}
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
          </Button>

          {/* ── Or Divider ───────────────────────────────────────────── */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400 font-medium uppercase">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* ── Google OAuth Login Button ────────────────────────────── */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google Sign In Failed')}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              width="340"
            />
          </div>
        </form>
      )}

      {/* ── OTP step ──────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              6-digit OTP
            </label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="• • • • • •"
              className={`text-center text-xl tracking-[0.5em] font-bold h-14 ${fieldErrors.otp ? 'border-red-400' : ''}`}
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.slice(0, 6)); setFieldErrors({}); }}
              autoFocus
            />
            {fieldErrors.otp && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.otp}</p>
            )}
          </div>

          {/* API-level error banner */}
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Verify & Login'}
          </Button>

          {/* Resend */}
          <button
            type="button"
            className="w-full text-center text-sm text-primary-500 font-semibold py-2"
            onClick={() => { setOtp(''); handleSendOtp({ preventDefault: () => {} } as React.FormEvent); }}
          >
            Resend OTP
          </button>
        </form>
      )}

      {/* Terms & Privacy disclaimer */}
      <p className="text-[11px] text-gray-400 text-center mt-6 px-2 leading-relaxed">
        By continuing, you agree to Sab Kuch's{' '}
        <button
          type="button"
          onClick={() => navigate('/terms')}
          className="text-primary-600 font-semibold underline hover:text-primary-700"
        >
          Terms & Conditions
        </button>{' '}
        and{' '}
        <button
          type="button"
          onClick={() => navigate('/privacy')}
          className="text-primary-600 font-semibold underline hover:text-primary-700"
        >
          Privacy Policy
        </button>
        .
      </p>

      {/* Guest option */}
      <div className="mt-auto pb-10 pt-6 text-center">
        <button
          className="text-sm text-gray-400 underline hover:text-gray-600 transition-colors"
          onClick={() => navigate('/')}
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
}
