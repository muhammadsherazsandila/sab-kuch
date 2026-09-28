/**
 * useAuth — request OTP and verify OTP.
 * Wraps the API calls and updates the global auth store.
 */

import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { User, ApiResponse } from '@/types';

export function useAuth() {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Send OTP to the user's email.
   * Returns true on success so the caller can advance the UI to "enter OTP".
   */
  async function requestOtp(email: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/request-otp', { email });
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message || 'Failed to send OTP. Try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Step 2: Verify OTP and log the user in.
   * On success, updates the global auth store and returns true.
   */
  async function verifyOtp(email: string, otp: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
        '/auth/verify-otp',
        { email, otp }
      );
      const { token, user } = res.data.data;
      setAuth(user, token);
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Step 3: Login with Google OAuth credential token
   */
  async function loginWithGoogle(credential: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
        '/auth/google',
        { credential }
      );
      const { token, user } = res.data.data;
      setAuth(user, token);
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Google login failed. Please try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { requestOtp, verifyOtp, loginWithGoogle, loading, error };
}
