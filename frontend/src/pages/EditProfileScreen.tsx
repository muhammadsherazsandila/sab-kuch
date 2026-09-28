/**
 * EditProfileScreen
 *
 * Allows users to edit their profile details and saved Hostel City address:
 * - Full Name
 * - Phone Number
 * - Default Hostel Address (Hostel City, Islamabad, Hostel Name, Street No, Room No)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Mail, CheckCircle2, AlertCircle,
  MapPin, Building, DoorClosed, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { ApiResponse, User as UserType, Address } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function EditProfileScreen() {


  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Hostel Address Fields
  const [existingAddressId, setExistingAddressId] = useState<string | null>(null);
  const [hostelName, setHostelName] = useState('');
  const [streetNo, setStreetNo] = useState('');
  const [roomNo, setRoomNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved address on mount
  useEffect(() => {
    async function loadAddress() {
      try {
        const res = await apiClient.get<ApiResponse<Address[]>>('/users/me/addresses');
        const list = res.data.data;
        if (list && list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setExistingAddressId(def.id);

          // Parse line1 & line2
          // line1 typically: "Iqbal Hostel, Street 4"
          if (def.line1) {
            const parts = def.line1.split(',').map((s) => s.trim());
            setHostelName(parts[0] || '');
            if (parts.length > 1) {
              setStreetNo(parts[1].replace(/street\s*/i, '').trim());
            }
          }
          if (def.line2) {
            setRoomNo(def.line2.replace(/room\s*/i, '').trim());
          }
        }
      } catch {
        // silent fail on address load
      }
    }

    if (user) {
      loadAddress();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-3">👤</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Please Login</h2>
        <p className="text-gray-500 text-sm mb-6">You need to be logged in to edit your profile.</p>
        <Button onClick={() => navigate('/auth?redirect=/settings/profile')}>
          Go to Login
        </Button>
      </div>
    );
  }

  const [showConfirm, setShowConfirm] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      toast.warning('Please enter your name.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  }

  async function executeSaveProfile() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Profile (Name & Phone)
      const res = await apiClient.patch<ApiResponse<UserType>>('/users/me', {
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      // 2. Save / Update Address if hostel details are provided
      if (hostelName.trim()) {
        const addressPayload = {
          hostelName: hostelName.trim(),
          streetNo: streetNo.trim() || undefined,
          roomNo: roomNo.trim() || undefined,
          isDefault: true,
        };

        if (existingAddressId) {
          await apiClient.patch(`/users/me/addresses/${existingAddressId}`, addressPayload);
        } else {
          await apiClient.post('/users/me/addresses', addressPayload);
        }
      }

      if (res.data.data) {
        updateUser(res.data.data);
      } else {
        updateUser({ name: name.trim(), phone: phone.trim() });
      }

      setShowConfirm(false);
      setSuccess('Profile & Address saved successfully!');
      toast.success('Profile and address updated successfully!');
      setTimeout(() => {
        navigate('/settings');
      }, 800);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">Edit Profile & Address</h1>
        </div>
      </div>

      <div className="px-4 py-6 flex-1 max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar preview */}
          <div className="flex flex-col items-center justify-center pb-1">
            <div className="w-18 h-18 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {(name.trim() || user.name).charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono">ID: {user.customerId}</p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl flex items-center gap-2 border border-green-100">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Personal Info Group */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900">Personal Information</h3>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="pl-10 bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-primary-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="pl-10 bg-white border-gray-200"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="pl-10 bg-white border-gray-200"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Used by delivery rider to contact you on arrival</p>
            </div>
          </div>

          {/* Delivery Address Group */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Default Delivery Address</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center gap-1">
                <MapPin size={11} /> Hostel City, Islamabad
              </span>
            </div>

            {/* Hostel Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Hostel Name
              </label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  placeholder="e.g. Al-Razi Boys Hostel, Falcon Hostel"
                  className="pl-10 bg-white border-gray-200"
                />
              </div>
            </div>

            {/* Street No & Room No */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Street / Block No
                </label>
                <div className="relative">
                  <Navigation size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={streetNo}
                    onChange={(e) => setStreetNo(e.target.value)}
                    placeholder="e.g. Street 4"
                    className="pl-9 bg-white border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Room / Floor No
                </label>
                <div className="relative">
                  <DoorClosed size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g. Room 204"
                    className="pl-9 bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              This address will be automatically selected during checkout for quick one-click orders.
            </p>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold shadow-md cursor-pointer"
            >
              {loading ? 'Saving Changes…' : 'Save Profile & Address'}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Custom Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Save Profile & Address Changes?"
        description="Are you sure you want to update your profile details and default hostel delivery address in Hostel City, Islamabad?"
        confirmText="Yes, Save Changes"
        cancelText="Cancel"
        variant="primary"
        theme="light"
        loading={loading}
        onConfirm={executeSaveProfile}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}

