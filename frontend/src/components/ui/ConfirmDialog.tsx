/**
 * ConfirmDialog — Reusable Custom Confirmation Modal
 *
 * Replaces ugly browser native window.confirm() dialogs.
 * Supports:
 * - Variants: 'danger' (destructive/delete), 'warning', 'primary' (save/confirm)
 * - Themes: 'dark' (Admin Dashboard) and 'light' (Customer App/Profile)
 * - Loading indicator during async confirmation
 * - Smooth backdrop blur & ESC key dismissal
 */

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  theme?: 'dark' | 'light';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  theme = 'light',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Variant iconography & color schemes
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 size={22} className="text-red-500" />,
          iconBg: isDark ? 'bg-red-500/15 border-red-500/30' : 'bg-red-50 border-red-200',
          confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={22} className="text-amber-500" />,
          iconBg: isDark ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-50 border-amber-200',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30',
        };
      case 'primary':
      default:
        return {
          icon: <HelpCircle size={22} className="text-primary-500" />,
          iconBg: isDark ? 'bg-orange-500/15 border-orange-500/30' : 'bg-orange-50 border-orange-200',
          confirmBtn: 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/25',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all scale-100 animate-in zoom-in-95 duration-150 relative ${
          isDark
            ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-black/80'
            : 'bg-white border border-gray-100 text-gray-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Content Header with Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
          <div className="flex-1 pr-4">
            <h3
              className={`text-base font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {title}
            </h3>
            <p
              className={`text-xs mt-1.5 leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-dashed border-gray-200 dark:border-slate-800">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              await onConfirm();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
