/**
 * SettingsScreen
 *
 * Layout:
 *   1. User profile card (name, email, phone, customer ID)
 *   2. Account options list:
 *      - My Orders
 *      - Edit Profile
 *      - Your City
 *      - Saved Addresses
 *      - Notifications (toggle switch)
 *   3. Logout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Hash, ShoppingBag, Edit3,
  MapPin, Bookmark, Bell, LogOut, ChevronRight, Download, Smartphone,
  Shield, FileText,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { usePWAInstall } from '@/lib/pwa';

import apiClient from '@/lib/apiClient';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const { canInstall, isStandalone, isIOS, triggerInstallPrompt } = usePWAInstall();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled !== false
  );
  const [hostelAddress, setHostelAddress] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDisableNotificationConfirm, setShowDisableNotificationConfirm] = useState(false);

  useEffect(() => {
    if (user?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(user.notificationsEnabled);
    }
  }, [user?.notificationsEnabled]);

  const applyNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (user) {
      updateUser({ notificationsEnabled: enabled });
      try {
        await apiClient.patch('/users/me', { notificationsEnabled: enabled });
        if (enabled) {
          // Request browser push permissions & sync subscription
          const granted = await subscribeToPushNotifications();
          if (granted) {
            toast.success('Live push notifications enabled!');
          } else {
            toast.info('Notification preference saved.');
          }
        } else {
          toast.info('Order notifications disabled.');
        }
      } catch (err) {
        console.warn('Failed to update notification preferences:', err);
        toast.error('Failed to update notification settings.');
      }
    }
  };


  const handleToggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      // Confirm before disabling
      setShowDisableNotificationConfirm(true);
    } else {
      await applyNotificationToggle(true);
    }
  };


  useEffect(() => {
    async function loadAddress() {
      try {
        const res = await apiClient.get('/users/me/addresses');
        const list = res.data.data;
        if (list && list.length > 0) {
          const def = list.find((a: any) => a.isDefault) || list[0];
          const text = [def.line1, def.line2, 'Hostel City, Islamabad'].filter(Boolean).join(', ');
          setHostelAddress(text);
        }
      } catch {
        // silent
      }
    }
    if (user) loadAddress();
  }, [user]);


  // ── Menu items ────────────────────────────────────────────────────────
  const menuItems = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      sub: 'Track and manage your orders',
      action: () => navigate('/orders'),
    },
    {
      icon: Edit3,
      label: 'Edit Profile & Details',
      sub: 'Update name, phone number',
      action: () => navigate('/settings/profile'),
    },
    {
      icon: MapPin,
      label: 'Hostel Delivery Address',
      sub: hostelAddress || 'Add hostel name, street & room no',
      action: () => navigate('/settings/profile'),
    },
    {
      icon: Bookmark,
      label: 'Operating Area',
      sub: 'Hostel City, Islamabad (Fixed)',
      action: () => {},
    },
    {
      icon: Shield,
      label: 'Privacy Policy',
      sub: 'How we protect your hostel & order data',
      action: () => navigate('/privacy'),
    },
    {
      icon: FileText,
      label: 'Terms & Conditions',
      sub: 'User agreement, ordering & delivery rules',
      action: () => navigate('/terms'),
    },
  ];

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900">Profile</h1>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-10">
        {/* ── Profile Card ──────────────────────────────────────────────── */}
        {user ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{user.name}</h2>
                <span className="text-xs bg-primary-100 text-primary-600 px-2.5 py-0.5 rounded-full font-semibold">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Profile details */}
            <div className="space-y-3">
              <ProfileRow icon={Mail}  label="Email"       value={user.email} />
              <ProfileRow icon={Phone} label="Phone"       value={user.phone ?? 'Not added'} muted={!user.phone} />
              <ProfileRow icon={Hash}  label="Customer ID" value={user.customerId} mono />
            </div>
          </div>
        ) : (
          /* Guest state */
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <User size={28} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">You're browsing as a guest</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Login to save your orders and addresses</p>
            <button
              className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
              onClick={() => navigate('/auth')}
            >
              Login / Sign Up
            </button>
          </div>
        )}

        {/* ── Account Options ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {menuItems.map(({ icon: Icon, label, sub, action }, idx) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
                idx < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}

          {/* Notifications toggle — inline row, no chevron */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />

          </div>
        </div>

        {/* ── Install App (if not already installed) ────────────────────── */}
        {!isStandalone && (
          <button
            onClick={async () => {
              if (isIOS) {
                toast.info('On iOS Safari: Tap Share → "Add to Home Screen"');
              } else if (canInstall) {
                const accepted = await triggerInstallPrompt();
                if (accepted) toast.success('Sab Kuch installed successfully!');
              } else {
                toast.info('Look for the install icon ⊕ in your browser address bar.');
              }
            }}
            className="w-full bg-gradient-to-r from-primary-500 to-amber-500 text-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Sab Kuch"
                  className="w-full h-full object-contain aspect-square rounded-lg"
                />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-white">Install App</p>
                <p className="text-xs text-white/85">Add to home screen for instant ordering</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-1.5">
              <Download size={16} className="text-white" />
            </div>
          </button>
        )}

        {/* ── Logout ───────────────────────────────────────────────────── */}
        {user && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="font-semibold text-red-500 text-sm">Log Out</span>
          </button>
        )}

        {/* App version & logo */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4 gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/80 shadow-xs p-1 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.jpg"
              alt="Sab Kuch"
              className="w-full h-full object-contain aspect-square rounded-lg"
            />
          </div>
          <p className="text-center text-xs text-gray-400 font-medium">Sab Kuch v1.0.0</p>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-1">
            <button
              onClick={() => navigate('/terms')}
              className="hover:text-primary-600 transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/privacy')}
              className="hover:text-primary-600 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* ── Logout Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out of Sab Kuch?"
        description="Are you sure you want to log out from this device? You can log back in anytime with your phone or email."
        confirmText="Log Out"
        cancelText="Cancel"
        variant="danger"
        theme="light"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />

      {/* ── Disable Notifications Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={showDisableNotificationConfirm}
        title="Disable Order Notifications?"
        description="You will not receive live push notifications on this device when your order is accepted, prepared, or out for delivery."
        confirmText="Turn Off"
        cancelText="Keep Enabled"
        variant="warning"
        theme="light"
        onConfirm={async () => {
          setShowDisableNotificationConfirm(false);
          await applyNotificationToggle(false);
        }}
        onClose={() => setShowDisableNotificationConfirm(false)}
      />
    </div>
  );
}


// ── Profile row helper ────────────────────────────────────────────────────────

function ProfileRow({
  icon: Icon,
  label,
  value,
  muted = false,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm truncate ${muted ? 'text-gray-400 italic' : 'text-gray-800 font-medium'} ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
