import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/apiClient';
import { Order, ApiResponse, OrderStatus } from '@/types';

const STATUS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING',    label: 'Placed'    },
  { status: 'CONFIRMED',  label: 'Confirmed' },
  { status: 'PREPARING',  label: 'Preparing' },
  { status: 'ON_THE_WAY', label: 'On the way'},
  { status: 'DELIVERED',  label: 'Delivered' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY_FOR_PICKUP: 2,
  ON_THE_WAY: 3, DELIVERED: 4, CANCELLED: -1, REFUNDED: -1,
};

export default function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 pt-12 pb-4"><div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" /></div>
        <div className="px-4 space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
        <Package size={48} className="text-gray-300 mb-4" />
        <p className="font-semibold text-gray-700">Order not found</p>
        <button onClick={() => navigate('/orders')} className="text-primary-500 text-sm font-semibold mt-4">Back to Orders</button>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER[order.status];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Order Details</h1>
            <button
              onClick={() => {
                navigator.clipboard.writeText(order.orderNumber);
                toast.success('Order number copied to clipboard!');
              }}
              className="flex items-center gap-1 text-xs text-gray-400 font-mono hover:text-gray-700 transition-colors"
              title="Copy order number"
            >
              <span>#{order.orderNumber.slice(-8).toUpperCase()}</span>
              <Copy size={11} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-10">
        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-gray-900">{order.vendor?.name ?? 'Custom Order'}</h2>
            <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'destructive' : 'default'}>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          {/* Step tracker */}
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const done = i < currentStepIndex;
              const active = i === currentStepIndex;
              const isLast = i === STATUS_STEPS.length - 1;
              return (
                <div key={step.status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      done ? 'bg-primary-500 text-white' :
                      active ? 'bg-primary-500 text-white ring-2 ring-primary-200' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 text-center ${active ? 'text-primary-500 font-semibold' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && <div className={`flex-1 h-0.5 mx-0.5 mb-3 ${i < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        {order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.product.name} ×{item.quantity}</span>
                  <span className="font-medium">Rs. {item.totalPrice}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom order description */}
        {order.customRequest && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-sm text-gray-900 mb-2">Order Description</h3>
            <p className="text-sm text-gray-600">{order.customRequest.description}</p>
            {order.customRequest.preferredShop && (
              <p className="text-xs text-gray-400 mt-2">Preferred shop: {order.customRequest.preferredShop}</p>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>Rs. {order.subtotal}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span>Rs. {order.deliveryFee}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600">-Rs. {order.discount}</span></div>}
          <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2"><span>Total</span><span className="text-primary-500">Rs. {order.total}</span></div>
        </div>
      </div>
    </div>
  );
}
