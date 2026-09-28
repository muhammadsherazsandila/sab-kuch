/**
 * PrivacyPolicyScreen
 *
 * Details data collection, processing, and privacy protections for
 * Sab Kuch users across Hostel City, Islamabad.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Bell, Database, Mail, HelpCircle } from 'lucide-react';

export default function PrivacyPolicyScreen() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-full">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-lg text-gray-900 leading-tight">Privacy Policy</h1>
          <p className="text-[11px] text-gray-400">Last updated: September 2026</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-12">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
            <Shield size={22} />
          </div>
          <h2 className="text-base font-bold text-gray-900">Your Privacy Matters to Us</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Welcome to <span className="font-semibold text-gray-900">Sab Kuch</span> ("we", "our", or "us"). 
            We are dedicated to providing fast and reliable food and grocery delivery specifically designed for 
            students and residents of <span className="font-semibold text-gray-900">Hostel City, Islamabad</span>. 
            This Privacy Policy explains how we collect, use, and protect your personal information when you use our application.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Eye size={18} />
            <h3>1. Information We Collect</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            To provide accurate delivery to your hostel room or gate, we collect minimal and necessary information:
          </p>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>
              <span className="font-semibold text-gray-800">Account Information:</span> Your name, email address, and optional phone number.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Delivery Address:</span> Hostel name, block, street, room number, or special delivery notes.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Order Details:</span> Ordered items, special instructions, order status, and transaction history.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Authentication Data:</span> One-time passwords (OTP) sent to your verified email address or Google OAuth credentials.
            </li>
          </ul>
        </div>

        {/* Section 2: How We Use Your Data */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Lock size={18} />
            <h3>2. How We Use Your Information</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            We use your data solely to deliver quality service and maintain smooth operations:
          </p>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>Processing orders and assigning them to local vendors and riders.</li>
            <li>Notifying you about order confirmation, kitchen preparation, and delivery arrival.</li>
            <li>Authenticating your account securely without requiring passwords.</li>
            <li>Improving platform performance, menu variety, and local delivery times.</li>
          </ul>
        </div>

        {/* Section 3: Data Sharing & Third Parties */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Database size={18} />
            <h3>3. Third-Party Services</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            We do not sell, rent, or trade your personal data. We only share essential details with trusted providers to run the service:
          </p>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>
              <span className="font-semibold text-gray-800">Delivery Riders & Vendors:</span> Provided with your first name, delivery address, and phone number only for the duration of the order.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Email Services:</span> EmailJS and Resend are used strictly to deliver verification OTP emails.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Secure Database:</span> Hosted on encrypted cloud infrastructure with strict access controls.
            </li>
          </ul>
        </div>

        {/* Section 4: Push Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Bell size={18} />
            <h3>4. Push Notifications</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            With your permission, we send real-time browser push notifications to keep you informed when your order is accepted, 
            prepared, or arriving at your hostel. You can enable or disable these notifications anytime in your browser settings or within the Profile tab.
          </p>
        </div>

        {/* Section 5: Your Rights & Contact */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <HelpCircle size={18} />
            <h3>5. Your Rights & Contact Information</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            You have the right to access, edit, or delete your account information at any time. For questions, data requests, or support, please reach out to us:
          </p>
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/70 text-xs text-gray-700 space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-primary-500" />
              <span className="font-semibold">support@sabkuch.pk</span>
            </div>
            <p className="text-gray-500">Service Area: Hostel City, Park Road, Islamabad, Pakistan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
