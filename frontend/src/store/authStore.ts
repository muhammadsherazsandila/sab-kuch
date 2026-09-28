/**
 * Auth Store — Zustand
 *
 * Manages authentication state across the app:
 * - user:    decoded user object (or null for guests)
 * - token:   JWT string
 * - isGuest: true when browsing without login
 *
 * Persisted to localStorage so users stay logged in across sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isGuest: boolean;

  /** Set user + token after OTP verification */
  setAuth: (user: User, token: string) => void;

  /** Update user state with new partial/full fields */
  updateUser: (user: Partial<User>) => void;

  /** Mark as guest (browsing without login) */
  setGuest: () => void;

  /** Clear auth state on logout */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isGuest: false,

      setAuth: (user, token) => {
        // Also write token to localStorage for the axios interceptor
        localStorage.setItem('sk_token', token);
        set({ user, token, isGuest: false });
      },

      updateUser: (updatedFields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
      },

      setGuest: () => set({ isGuest: true }),

      logout: () => {
        localStorage.removeItem('sk_token');
        set({ user: null, token: null, isGuest: false });
      },
    }),
    {
      name: 'sk_auth', // localStorage key
      // Only persist user + token, not transient flags
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
