/**
 * CustomOrderScreen
 *
 * Multi-step form (3 steps) for placing a free-text "rider buys anything" order.
 *
 * Step 1 — Describe your order
 *   - Large textarea: "What do you need?"
 *   - Text input: preferred shop/store name
 *   - Timing notice card
 *
 * Step 2 — Delivery address
 *   - Address picker (saved addresses or enter new)
 *
 * Step 3 — Review & confirm
 *   - Summary of description, shop, delivery fee
 *   - "Place Order" button (login gate if guest)
 *
 * Validation:
 *   - Each step is validated with a Zod schema on "Next" / "Submit"
 *   - Field-level errors are shown inline under the relevant input
 *
 * The sticky bottom bar always shows the current delivery fee + Next/Submit CTA.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { placeCustomOrder } from '@/hooks/useOrders';
import {
  CustomOrderStep1Schema,
  CustomOrderStep2Schema,
  getFieldErrors,
} from '@/lib/schemas';

const TOTAL_STEPS = 3;
const DELIVERY_FEE = 50; // mirrors backend env var

interface FormData {
  description: string;
  preferredShop: string;
  estimatedBudget: string;
  // Step 2
  addressLine: string;
}

export default function CustomOrderScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    description: '',
    preferredShop: '',
    estimatedBudget: '',
    addressLine: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  // Per-field Zod validation errors — cleared on any field change
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Field handlers ──────────────────────────────────────────────────────
  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear errors when the user edits any field
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  }

  // ── Step validation using Zod ───────────────────────────────────────────
  function validateStep(): boolean {
    setFieldErrors({});
    if (step === 1) {
      const result = CustomOrderStep1Schema.safeParse({
        description:     form.description,
        preferredShop:   form.preferredShop || undefined,
        estimatedBudget: form.estimatedBudget || undefined,
      });
      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error));
        return false;
      }
    }
    if (step === 2) {
      const result = CustomOrderStep2Schema.safeParse({ addressLine: form.addressLine });
      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error));
        return false;
      }
    }
    return true;
  }

  // ── Navigate steps ──────────────────────────────────────────────────────
  function nextStep() {
    if (!validateStep()) {
      toast.error('Please fill in the required fields correctly');
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }
  function prevStep() {
    if (step > 1) setStep((s) => s - 1);
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    // Run Zod validation on the final step first
    if (!validateStep()) {
      toast.error('Please complete all order details before submitting');
      return;
    }

    // If not logged in, gate here and redirect to auth
    if (!user) {
      toast.info('Please sign in or create an account to place your order');
      navigate('/auth?redirect=/custom');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const order = await placeCustomOrder({
        description: form.description,
        preferredShop: form.preferredShop || undefined,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
      });
      setOrderId(order.id);
      setStep(3); // success state
      toast.success('Custom order placed successfully!');
    } catch {
      setError('Failed to place order. Please try again.');
      toast.error('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (orderId && step === 3) {
    return <SuccessState onViewOrders={() => navigate('/orders')} />;
  }

  return (
    <div className="bg-white min-h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          {step > 1 && (
            <button onClick={prevStep} className="p-1.5 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
          <div>
            <h1 className="font-bold text-lg text-gray-900">Custom Order</h1>
            <p className="text-xs text-gray-400">Step {step} of {TOTAL_STEPS - 1}</p>
          </div>
        </div>

        {/* Step progress bar */}
        <StepProgressBar currentStep={step} total={TOTAL_STEPS - 1} />
      </div>

      {/* ── Step Content ────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-5 pb-28 space-y-5">
        {step === 1 && (
          <Step1
            form={form}
            update={update}
            fieldErrors={fieldErrors}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            update={update}
            fieldErrors={fieldErrors}
          />
        )}
      </div>

      {/* ── Sticky Bottom Bar ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 max-w-md mx-auto"
           style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">Delivery fee</div>
          <div className="font-bold text-gray-900">Rs. {DELIVERY_FEE}</div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        {step < 2 ? (
          <Button
            className="w-full h-12 text-base"
            onClick={nextStep}
          >
            Next Step →
          </Button>
        ) : (
          <Button
            className="w-full h-12 text-base"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Placing order…' : !user ? 'Login & Place Order' : 'Place Order'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Describe your order ───────────────────────────────────────────────

interface StepProps {
  form: FormData;
  update: (f: keyof FormData, v: string) => void;
  fieldErrors: Record<string, string>;
}

function Step1({ form, update, fieldErrors }: StepProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          What do you need? <span className="text-primary-500">*</span>
        </label>
        <Textarea
          placeholder="e.g. 1 litre of Amul Full Cream Milk, 2 packets of Parle-G biscuits, 1 onion (500g)…"
          className={`min-h-[140px] text-sm ${fieldErrors.description ? 'border-red-400' : ''}`}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
        {fieldErrors.description ? (
          <p className="text-xs text-red-500 mt-1.5">{fieldErrors.description}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1.5">
            {form.description.length < 10
              ? `Minimum 10 characters (${form.description.length}/10)`
              : `${form.description.length} characters ✓`}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Preferred shop / store <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Input
          placeholder="e.g. D-Mart, local kirana store…"
          value={form.preferredShop}
          onChange={(e) => update('preferredShop', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Estimated budget <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs">Rs.</span>
          <Input
            type="number"
            placeholder="0.00"
            className={`pl-10 ${fieldErrors.estimatedBudget ? 'border-red-400' : ''}`}
            value={form.estimatedBudget}
            onChange={(e) => update('estimatedBudget', e.target.value)}
          />
        </div>
        {fieldErrors.estimatedBudget && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.estimatedBudget}</p>
        )}
      </div>

      {/* Timing notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Custom order timings</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Custom orders are available daily <strong>9 AM – 9 PM</strong>.
            Delivery time depends on shop location in Islamabad (usually 30–60 min).
          </p>
        </div>
      </div>
    </>
  );
}

// ── Step 2: Delivery address ──────────────────────────────────────────────────

function Step2({ form, update, fieldErrors }: StepProps) {
  return (
    <>
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex gap-3">
        <MapPin size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary-700">
          Delivery is available across all hostels in Hostel City, Islamabad.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Hostel & Room Address <span className="text-primary-500">*</span>
        </label>
        <Textarea
          placeholder="Hostel name, building, room number, floor in Hostel City, Islamabad..."
          className={`min-h-[100px] ${fieldErrors.addressLine ? 'border-red-400' : ''}`}
          value={form.addressLine}
          onChange={(e) => update('addressLine', e.target.value)}
        />
        {fieldErrors.addressLine && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.addressLine}</p>
        )}
      </div>

      {/* Pricing summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800 mb-3">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Item cost</span>
          <span className="text-gray-400">Paid at shop</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Platform fee</span>
          <span className="text-gray-400">Included</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
          <span>Delivery fee</span>
          <span className="text-primary-500">Rs. {DELIVERY_FEE}</span>
        </div>
      </div>
    </>
  );
}

// ── Success State ─────────────────────────────────────────────────────────────

function SuccessState({ onViewOrders }: { onViewOrders: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-white">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-8">
        Your custom order has been placed. A rider will pick up your items shortly.
      </p>
      <Button className="w-full max-w-xs" onClick={onViewOrders}>
        <ShoppingBag size={16} className="mr-2" /> Track My Order
      </Button>
    </div>
  );
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepProgressBar({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < currentStep ? 'bg-primary-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
