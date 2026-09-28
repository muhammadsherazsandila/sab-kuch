/**
 * Global TypeScript types for Sab Kuch frontend.
 * These mirror the Prisma schema on the backend.
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'VENDOR_OWNER' | 'RIDER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderType = 'STANDARD' | 'CUSTOM';
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

// ── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  customerId: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  notificationsEnabled?: boolean;
  city?: City;
  addresses?: Address[];
  createdAt: string;
}


// ── Vendor ─────────────────────────────────────────────────────────────────

export interface VendorType {
  id: string;
  name: string;
  icon?: string;
}

export interface OperatingHours {
  id: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  openTime: string;  // "HH:MM"
  closeTime: string;
  isClosed: boolean;
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  address?: string;
  status: VendorStatus;
  averageRating: number;
  totalRatings: number;
  estimatedDeliveryMinutes: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  vendorType: VendorType;
  city: City;
  operatingHours: OperatingHours[];
  categories?: Category[];
}

// ── Product ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  discountedPrice?: number;
  unit?: string;
  status: ProductStatus;
  isFeatured: boolean;
  vendor?: Pick<Vendor, 'id' | 'name' | 'slug' | 'logoUrl'>;
  category?: Category;
}

// ── Order ──────────────────────────────────────────────────────────────────

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CustomOrderRequest {
  description: string;
  preferredShop?: string;
  estimatedBudget?: number;
  deliveryFee: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  vendor?: Pick<Vendor, 'id' | 'name' | 'slug' | 'logoUrl'>;
  items: OrderItem[];
  customRequest?: CustomOrderRequest;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

// ── Misc ───────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  state?: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: City;
  isDefault: boolean;
}

// ── Cart (local-only, not persisted to backend until checkout) ─────────────

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

// ── API Response envelope ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchTag {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

