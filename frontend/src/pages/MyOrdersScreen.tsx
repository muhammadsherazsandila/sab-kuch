/**
 * MyOrdersScreen
 *
 * Two tabs: Active / History
 *
 * Active order card shows:
 *   - Shop name + date + order ID
 *   - Items list (truncated)
 *   - Total price
 *   - Horizontal step-tracker showing current status
 *     (Placed → Confirmed → Preparing → On the way → Delivered)
 *
 * History cards show the same but condensed, with final status badge.
 */

import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronRight, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/layout/NotificationBell';
import { useOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { Order, OrderStatus } from '@/types';

// ── Status step-tracker config ────────────────────────────────────────────────

const STATUS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING',          label: 'Placed'    },
  { status: 'CONFIRMED',        label: 'Confirmed' },
  { status: 'PREPARING',        label: 'Preparing' },
  { status: 'ON_THE_WAY',       label: 'On the way'},
  { status: 'DELIVERED',        label: 'Delivered' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING:          0,
  CONFIRMED:        1,
  PREPARING:        2,
  READY_FOR_PICKUP: 2,
  ON_THE_WAY:       3,
  DELIVERED:        4,
  CANCELLED:        -1,
  REFUNDED:         -1,
};

function getStatusBadgeVariant(status: OrderStatus) {
  if (['DELIVERED'].includes(status)) return 'success' as const;
  if (['CANCELLED', 'REFUNDED'].includes(status)) return 'destructive' as const;
  if (['PENDING'].includes(status)) return 'warning' as const;
  return 'default' as const;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function MyOrdersScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { orders: activeOrders, loading: activeLoading } = useOrders('active');
  const { orders: historyOrders, loading: historyLoading } = useOrders('history');

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-full flex flex-col">
        <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
          <h1 className="font-bold text-xl text-gray-900">My Orders</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Track your orders</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Login or create an account to view and track all your active and past orders.
          </p>
          <Button
            onClick={() => navigate('/auth?redirect=/orders')}
            className="w-full max-w-xs h-11"
          >
            Login / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="font-bold text-xl text-gray-900">My Orders</h1>
        <NotificationBell />
      </div>

      <div className="px-4 pt-4">
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active {activeOrders.length > 0 && `(${activeOrders.length})`}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ── Active Orders ─────────────────────────────────────────── */}
          <TabsContent value="active">
            {activeLoading ? (
              <OrderListSkeleton />
            ) : activeOrders.length === 0 ? (
              <EmptyState message="No active orders" sub="Your current orders will appear here" />
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Order History ─────────────────────────────────────────── */}
          <TabsContent value="history">
            {historyLoading ? (
              <OrderListSkeleton />
            ) : historyOrders.length === 0 ? (
              <EmptyState message="No past orders" sub="Your completed orders will appear here" />
            ) : (
              <div className="space-y-3 pb-4">
                {historyOrders.map((order) => (
                  <HistoryOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Active Order Card (with step tracker) ─────────────────────────────────────

function ActiveOrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const currentStepIndex = STATUS_ORDER[order.status];

  const itemsSummary = order.items
    .slice(0, 2)
    .map((i) => `${i.product.name} ×${i.quantity}`)
    .join(', ');
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      {/* Orange top accent */}
      <div className="h-1 gradient-primary" />

      <div className="p-4">
        {/* Shop + date */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{order.vendor?.name ?? 'Custom Order'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <Badge variant="default" className="text-[10px]">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            <p className="text-xs text-gray-400 mt-1 font-mono">#{order.orderNumber.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Items summary */}
        <p className="text-xs text-gray-500 mb-1">
          {order.type === 'CUSTOM'
            ? order.customRequest?.description.slice(0, 60) + '…'
            : itemsSummary + moreItems}
        </p>

        {/* Total */}
        <p className="text-sm font-bold text-gray-900 mb-4">Rs. {order.total.toFixed(0)}</p>

        {/* ── Step Tracker ───────────────────────────────────────────── */}
        <div className="flex items-center">
          {STATUS_STEPS.map((step, i) => {
            const done    = i < currentStepIndex;
            const active  = i === currentStepIndex;
            const isLast  = i === STATUS_STEPS.length - 1;

            return (
              <div key={step.status} className="flex items-center flex-1">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                      done   ? 'bg-primary-500 text-white' :
                      active ? 'bg-primary-500 text-white ring-2 ring-primary-200' :
                               'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1 text-center leading-tight ${
                    active ? 'text-primary-500 font-semibold' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div className={`flex-1 h-0.5 mx-0.5 mb-3 ${i < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* View details hint */}
        <div className="flex items-center justify-end mt-2 gap-1 text-primary-500">
          <span className="text-xs font-semibold">Track order</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

// ── History Order Card ────────────────────────────────────────────────────────

function HistoryOrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Package size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">
          {order.vendor?.name ?? 'Custom Order'}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock size={11} className="text-gray-400" />
          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs font-semibold text-gray-700">Rs. {order.total.toFixed(0)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px]">
          {order.status.replace(/_/g, ' ')}
        </Badge>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-4xl mb-3">📦</p>
      <p className="font-semibold text-gray-700">{message}</p>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {[1,2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}
