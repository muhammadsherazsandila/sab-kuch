/**
 * TermsConditionsScreen
 *
 * Terms of Service and user agreement for Sab Kuch food and grocery delivery
 * platform in Hostel City, Islamabad.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ShoppingBag, Truck, CreditCard, Ban, Scale, Mail } from 'lucide-react';

export default function TermsConditionsScreen() {
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
          <h1 className="font-bold text-lg text-gray-900 leading-tight">Terms & Conditions</h1>
          <p className="text-[11px] text-gray-400">Last updated: September 2026</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-12">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
            <FileText size={22} />
          </div>
          <h2 className="text-base font-bold text-gray-900">User Agreement & Terms of Service</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Please read these Terms and Conditions ("Terms") carefully before using the{' '}
            <span className="font-semibold text-gray-900">Sab Kuch</span> delivery web application. 
            By accessing or ordering through Sab Kuch, you agree to be bound by these Terms. If you disagree 
            with any part, you may not access the service.
          </p>
        </div>

        {/* Section 1: Service Area & Scope */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <ShoppingBag size={18} />
            <h3>1. Service Area & Platform Role</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sab Kuch operates exclusively within <span className="font-semibold text-gray-900">Hostel City, Islamabad</span> and 
            connecting university accommodation areas. Sab Kuch connects customers with independent local eateries, restaurants, 
            and marts. Food quality, freshness, and packaging remain the primary responsibility of each respective merchant.
          </p>
        </div>

        {/* Section 2: Ordering & Availability */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Truck size={18} />
            <h3>2. Orders & Delivery Policy</h3>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>
              <span className="font-semibold text-gray-800">Order Acceptance:</span> An order is confirmed once accepted by the vendor. Vendors reserve the right to decline orders due to stock unavailability or peak-hour capacity.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Delivery Address:</span> Customers must provide accurate hostel names, room numbers, or designated gate drop-off instructions.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Delivery Time:</span> Estimated delivery times (e.g. 20–35 minutes) are approximate and may vary depending on kitchen preparation, weather, or hostel access restrictions.
            </li>
          </ul>
        </div>

        {/* Section 3: Pricing & Payments */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <CreditCard size={18} />
            <h3>3. Pricing & Payment</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            All prices listed on Sab Kuch are in Pakistani Rupees (PKR) and include any merchant-specified charges.
          </p>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>
              <span className="font-semibold text-gray-800">Cash on Delivery (COD):</span> You agree to pay the rider the exact order amount upon receiving your order.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Delivery Fees:</span> Delivery charges are calculated and displayed transparently in your cart before checkout.
            </li>
          </ul>
        </div>

        {/* Section 4: Cancellations & Refunds */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Ban size={18} />
            <h3>4. Cancellations & Disputes</h3>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside pl-1">
            <li>
              <span className="font-semibold text-gray-800">Customer Cancellation:</span> You may cancel an order before the vendor begins preparing food. Once food preparation has begun, orders cannot be cancelled.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Incorrect or Missing Items:</span> If an item is missing or incorrect, notify our support within 30 minutes of delivery with photographic evidence for prompt resolution.
            </li>
          </ul>
        </div>

        {/* Section 5: User Conduct & Liability */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-primary-600 font-bold text-sm">
            <Scale size={18} />
            <h3>5. User Conduct & Liability</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Customers must treat delivery riders and merchant staff with respect. Unreasonable refusal to receive orders 
            or abusive conduct may result in immediate suspension or termination of your Sab Kuch account.
          </p>
        </div>

        {/* Contact Us */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Contact Support</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            If you have questions about these Terms, need assistance with an ongoing order, or have feedback:
          </p>
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/70 text-xs text-gray-700 space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-primary-500" />
              <span className="font-semibold">terms@sabkuch.pk</span>
            </div>
            <p className="text-gray-500">Sab Kuch Delivery • Hostel City, Islamabad</p>
          </div>
        </div>
      </div>
    </div>
  );
}
