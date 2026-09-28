/**
 * AdminDashboard — Big Screen Desktop Admin Portal
 *
 * Full-screen desktop layout designed for desktop monitors & workstations.
 * Features:
 *  - Overview KPI metrics & stats
 *  - Manage Shops: Add, edit, remove, activate/close status toggle
 *  - Manage Menu for individual shops: Categories & Products (add, update, remove)
 *  - Manage Orders: View all orders with customer details, items, date, and advance status
 *  - Customer Details: View customers with their full order history and dates
 *  - All currency formatted in Pakistani Rupees (Rs.)
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, Store, ShoppingBag, TrendingUp, RefreshCw, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Clock, ChevronRight, Search, ArrowLeft, Eye,
  UtensilsCrossed, AlertCircle, Phone, Mail, Calendar, DollarSign,
  Package, Shield, ExternalLink, Filter, MapPin, X, Check, Sparkles, Tag,
  LogOut, Layers, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { Order, Vendor, User, OrderStatus, ApiResponse, SearchTag, BannerCard } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';




interface Stats {
  totalUsers: number;
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface VendorType {
  id: string;
  name: string;
  icon?: string;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  vendor?: { name: string; slug?: string };
  items?: { product?: { name: string }; quantity: number; unitPrice: number }[];
}

interface CustomerUser extends User {
  orders: CustomerOrder[];
  totalOrders: number;
  totalSpent: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Guard: non-admins
  useEffect(() => {
    if (user && user.role !== 'ADMIN') navigate('/', { replace: true });
    if (!user) navigate('/auth?redirect=/admin', { replace: true });
  }, [user, navigate]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'orders' | 'customers' | 'tags' | 'banners'>('overview');

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [searchTags, setSearchTags] = useState<SearchTag[]>([]);
  const [bannerCards, setBannerCards] = useState<BannerCard[]>([]);
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerCard | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    gradient: 'from-orange-500 to-amber-500',
    sortOrder: 0,
    isActive: true,
  });
  const [newTagName, setNewTagName] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & searches
  const [shopSearch, setShopSearch] = useState('');
  const [shopFilter, setShopFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');

  const [customerSearch, setCustomerSearch] = useState('');

  // Menu editor sub-state
  const [managingShop, setManagingShop] = useState<Vendor | null>(null);
  const [shopMenu, setShopMenu] = useState<{ categories: any[]; products: any[] } | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // Modals
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [editingShop, setEditingShop] = useState<Vendor | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [inspectingCustomer, setInspectingCustomer] = useState<CustomerUser | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<any | null>(null);

  // Custom Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const requestConfirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      ...options,
    });
  };


  // Forms
  const [shopForm, setShopForm] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    email: '',
    address: 'Hostel City, Islamabad',
    vendorTypeId: '',
    deliveryFee: 30,
    estimatedDeliveryMinutes: 25,
    minimumOrderAmount: 0,
    logoUrl: '',
    coverImageUrl: '',
    status: 'ACTIVE' as const,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    categoryId: '',
    imageUrl: '',
    unit: 'portion',
    status: 'AVAILABLE' as const,
    isFeatured: false,
  });

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, o, v, vt, c, t, b] = await Promise.allSettled([
        apiClient.get<ApiResponse<Stats>>('/admin/stats'),
        apiClient.get<ApiResponse<Order[]>>('/admin/orders'),
        apiClient.get<ApiResponse<Vendor[]>>('/admin/vendors'),
        apiClient.get<ApiResponse<VendorType[]>>('/admin/vendor-types'),
        apiClient.get<ApiResponse<CustomerUser[]>>('/admin/customers'),
        apiClient.get<ApiResponse<SearchTag[]>>('/admin/tags'),
        apiClient.get<ApiResponse<BannerCard[]>>('/admin/banners'),
      ]);

      if (s.status === 'fulfilled') setStats(s.value.data.data);
      if (o.status === 'fulfilled') setOrders(o.value.data.data);
      if (v.status === 'fulfilled') setVendors(v.value.data.data);
      if (vt.status === 'fulfilled') {
        const types = vt.value.data.data;
        setVendorTypes(types);
        if (types.length > 0 && !shopForm.vendorTypeId) {
          setShopForm((prev) => ({ ...prev, vendorTypeId: types[0].id }));
        }
      }
      if (c.status === 'fulfilled') setCustomers(c.value.data.data);
      if (t.status === 'fulfilled') setSearchTags(t.value.data.data || []);
      if (b.status === 'fulfilled') setBannerCards(b.value.data.data || []);
    } catch (err) {

      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
    if (type === 'error') {
      toast.error(text);
    } else {
      toast.success(text);
    }
  };


  // ── Shop Actions ──────────────────────────────────────────────────────────

  const handleToggleShopStatus = async (shop: Vendor) => {
    const nextStatus = shop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/vendors/${shop.id}/status`, { status: nextStatus });
      setVendors((prev) =>
        prev.map((v) => (v.id === shop.id ? { ...v, status: nextStatus } : v))
      );
      if (managingShop?.id === shop.id) {
        setManagingShop({ ...managingShop, status: nextStatus });
      }
      showNotification(`Shop ${shop.name} is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Closed'}`);
    } catch {
      showNotification('Failed to update shop status', 'error');
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingShop) {
        const res = await apiClient.patch(`/admin/vendors/${editingShop.id}`, shopForm);
        setVendors((prev) =>
          prev.map((v) => (v.id === editingShop.id ? res.data.data : v))
        );
        showNotification('Shop updated successfully');
      } else {
        const res = await apiClient.post('/admin/vendors', shopForm);
        setVendors((prev) => [res.data.data, ...prev]);
        showNotification('New shop created successfully');
      }
      setShowAddShopModal(false);
      setEditingShop(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save shop';
      showNotification(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShop = (shop: Vendor) => {
    requestConfirm({
      title: `Remove Shop "${shop.name}"?`,
      description: `Are you sure you want to permanently delete "${shop.name}" from Hostel City? All menu items and categories will also be deleted.`,
      confirmText: 'Yes, Delete Shop',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/vendors/${shop.id}`);
          setVendors((prev) => prev.filter((v) => v.id !== shop.id));
          showNotification(`Shop "${shop.name}" removed successfully`);
          if (managingShop?.id === shop.id) setManagingShop(null);
        } catch {
          showNotification('Failed to remove shop', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };


  const openEditShop = (shop: Vendor) => {
    setEditingShop(shop);
    setShopForm({
      name: shop.name,
      slug: shop.slug,
      description: shop.description || '',
      phone: shop.phone || '',
      email: (shop as any).email || '',
      address: shop.address || 'Hostel City, Islamabad',
      vendorTypeId: shop.vendorType?.id || vendorTypes[0]?.id || '',
      deliveryFee: shop.deliveryFee,
      estimatedDeliveryMinutes: shop.estimatedDeliveryMinutes,
      minimumOrderAmount: shop.minimumOrderAmount,
      logoUrl: shop.logoUrl || '',
      coverImageUrl: shop.coverImageUrl || '',
      status: (shop.status as any) || 'ACTIVE',
    });
    setShowAddShopModal(true);
  };

  // ── Menu Management ───────────────────────────────────────────────────────

  const openShopMenu = async (shop: Vendor) => {
    setManagingShop(shop);
    setMenuLoading(true);
    try {
      const res = await apiClient.get(`/admin/vendors/${shop.id}/menu`);
      setShopMenu(res.data.data);
      if (res.data.data.categories?.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: res.data.data.categories[0].id }));
      }
    } catch {
      showNotification('Failed to load shop menu', 'error');
    } finally {
      setMenuLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingShop) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/vendors/${managingShop.id}/categories`, categoryForm);
      setShopMenu((prev) => prev ? {
        ...prev,
        categories: [...prev.categories, { ...res.data.data, products: [] }],
      } : prev);
      setShowAddCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      showNotification('Category added successfully');
    } catch {
      showNotification('Failed to add category', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    requestConfirm({
      title: 'Delete Menu Category?',
      description: 'Are you sure you want to delete this category and all its menu items? This action cannot be undone.',
      confirmText: 'Delete Category',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/categories/${catId}`);
          setShopMenu((prev) =>
            prev
              ? {
                  ...prev,
                  categories: prev.categories.filter((c) => c.id !== catId),
                  products: prev.products.filter((p) => p.categoryId !== catId),
                }
              : prev
          );
          showNotification('Category deleted successfully');
        } catch {
          showNotification('Failed to delete category', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingShop) return;
    setActionLoading(true);
    try {
      if (editingProduct) {
        const res = await apiClient.patch(`/admin/products/${editingProduct.id}`, productForm);
        setShopMenu((prev) => {
          if (!prev) return prev;
          const updated = res.data.data;
          return {
            ...prev,
            products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
            categories: prev.categories.map((c) => ({
              ...c,
              products: c.products?.map((p: any) => (p.id === updated.id ? updated : p)) || [],
            })),
          };
        });
        showNotification('Menu item updated');
      } else {
        const res = await apiClient.post(`/admin/vendors/${managingShop.id}/products`, productForm);
        const created = res.data.data;
        setShopMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: [created, ...prev.products],
            categories: prev.categories.map((c) =>
              c.id === created.categoryId
                ? { ...c, products: [...(c.products || []), created] }
                : c
            ),
          };
        });
        showNotification('Menu item added successfully');
      }
      setShowAddProductModal(false);
      setEditingProduct(null);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    requestConfirm({
      title: 'Remove Menu Product?',
      description: 'Are you sure you want to delete this product from the shop menu?',
      confirmText: 'Delete Product',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/products/${productId}`);
          setShopMenu((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              products: prev.products.filter((p) => p.id !== productId),
              categories: prev.categories.map((c) => ({
                ...c,
                products: c.products?.filter((p: any) => p.id !== productId) || [],
              })),
            };
          });
          showNotification('Product removed successfully');
        } catch {
          showNotification('Failed to remove product', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };


  // ── Order Management ──────────────────────────────────────────────────────

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (inspectingOrder && inspectingOrder.id === orderId) {
        setInspectingOrder((prev: any) => (prev ? { ...prev, status } : prev));
      }
      showNotification(`Order status updated to ${status}`);
    } catch {
      showNotification('Failed to update order status', 'error');
    }
  };

  // ── Search Tags Management ────────────────────────────────────────────────

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newTagName.trim();
    if (!name) {
      showNotification('Please enter a tag name (e.g. Chai, Samosa)', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post('/admin/tags', { name });
      const createdTag = res.data.data;
      setSearchTags((prev) => {
        const withoutOld = prev.filter(
          (t) => t.id !== createdTag.id && t.name.toLowerCase() !== createdTag.name.toLowerCase()
        );
        return [createdTag, ...withoutOld];
      });
      setNewTagName('');
      showNotification(`Tag "${name}" added successfully`);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to add tag', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const handleToggleTag = async (tag: SearchTag) => {
    try {
      const res = await apiClient.patch(`/admin/tags/${tag.id}`, { isActive: !tag.isActive });
      setSearchTags((prev) => prev.map((t) => (t.id === tag.id ? res.data.data : t)));
      showNotification(`Tag "${tag.name}" ${!tag.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      showNotification('Failed to update tag status', 'error');
    }
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    requestConfirm({
      title: `Delete Search Tag "#${tagName}"?`,
      description: `Are you sure you want to remove the tag "#${tagName}" from the popular tags suggested to customers on the search page?`,
      confirmText: 'Delete Tag',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/tags/${tagId}`);
          setSearchTags((prev) => prev.filter((t) => t.id !== tagId));
          showNotification(`Tag "${tagName}" deleted`);
        } catch {
          showNotification('Failed to delete tag', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ── Banner / Promotional Cards Management ──────────────────────────────────
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      gradient: 'from-orange-500 to-amber-500',
      sortOrder: bannerCards.length,
      isActive: true,
    });
    setShowAddBannerModal(true);
  };

  const handleOpenEditBanner = (banner: BannerCard) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      gradient: banner.gradient || 'from-orange-500 to-amber-500',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setShowAddBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      showNotification('Banner title is required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (editingBanner) {
        const res = await apiClient.patch(`/admin/banners/${editingBanner.id}`, bannerForm);
        setBannerCards((prev) => prev.map((item) => (item.id === editingBanner.id ? res.data.data : item)));
        showNotification('Banner card updated successfully');
      } else {
        const res = await apiClient.post('/admin/banners', bannerForm);
        setBannerCards((prev) => [...prev, res.data.data]);
        showNotification('Banner card created successfully');
      }
      setShowAddBannerModal(false);
      setEditingBanner(null);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to save banner', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBannerStatus = async (banner: BannerCard) => {
    try {
      const res = await apiClient.patch(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      setBannerCards((prev) => prev.map((b) => (b.id === banner.id ? res.data.data : b)));
      showNotification(`Banner ${!banner.isActive ? 'activated' : 'hidden'}`);
    } catch (err: any) {
      showNotification('Failed to update banner status', 'error');
    }
  };

  const handleDeleteBanner = (bannerId: string, bannerTitle: string) => {
    requestConfirm({
      title: `Delete Banner "${bannerTitle}"?`,
      description: 'Are you sure you want to delete this promotional card? It will be removed from customer home screens.',
      confirmText: 'Delete Card',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/banners/${bannerId}`);
          setBannerCards((prev) => prev.filter((b) => b.id !== bannerId));
          showNotification('Banner deleted successfully');
        } catch (err: any) {
          showNotification('Failed to delete banner', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleLogout = () => {
    requestConfirm({
      title: 'Log Out of Admin Portal?',
      description: 'Are you sure you want to log out from the admin portal? You can sign back in anytime.',
      confirmText: 'Log Out',
      variant: 'danger',
      onConfirm: () => {
        logout();
        toast.success('Logged out from admin portal');
        navigate('/auth', { replace: true });
      },
    });
  };


  // ── Filtered items ────────────────────────────────────────────────────────


  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
      v.slug.toLowerCase().includes(shopSearch.toLowerCase());
    const matchesStatus = shopFilter === 'ALL' ? true :
      shopFilter === 'ACTIVE' ? v.status === 'ACTIVE' : v.status !== 'ACTIVE';
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'ALL' || o.status === orderFilter;
    const matchesSearch = !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o as any).customer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o as any).vendor?.name?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.customerId && c.customerId.toLowerCase().includes(q))
    );
  });

  const filteredTags = searchTags.filter((t) =>
    !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );


  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex font-sans text-xs">
      {/* ── Left Sidebar (Desktop Navigation) ─────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed top-0 bottom-0 left-0 z-30 text-xs">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-orange-600/20 flex-shrink-0 overflow-hidden border border-slate-700">
            <img
              src="/logo.jpg"
              alt="Sab Kuch"
              className="w-full h-full object-contain aspect-square rounded-lg"
            />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">SabKuch</h1>
            <p className="text-[11px] text-orange-400 font-medium">Hostel City Admin</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setManagingShop(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'overview' && !managingShop
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp size={17} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('shops'); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'shops'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Store size={17} />
              <span>Shops & Menus</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {vendors.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setManagingShop(null); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={17} />
              <span>Orders</span>
            </div>
            {stats && stats.pendingOrders > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                {stats.pendingOrders} new
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('customers'); setManagingShop(null); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'customers'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users size={17} />
              <span>Customers</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('tags'); setManagingShop(null); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'tags'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={17} />
              <span>Search Tags</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {searchTags.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('banners'); setManagingShop(null); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'banners'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers size={17} />
              <span>Updates & Banners</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {bannerCards.length}
            </span>
          </button>
        </nav>

        {/* Bottom user & switch to customer app */}
        <div className="p-3.5 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={13} /> Open Customer App
            </span>
            <span className="text-[10px] text-orange-400 font-semibold">Live</span>
          </Link>

          <div className="flex items-center justify-between pt-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Log out of Admin Portal"
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Area ──────────────────────────────────────────────── */}
      <div className="flex-1 ml-64 min-h-screen bg-slate-950 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-14 px-6 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Admin Portal</span>
              <span>/</span>
              <span className="text-orange-400 font-medium capitalize">
                {managingShop ? `Shops / ${managingShop.name} / Menu` :
                 activeTab === 'tags' ? 'Search Tags' :
                 activeTab === 'banners' ? 'App Updates & Banners' :
                 activeTab}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {managingShop ? managingShop.name :
               activeTab === 'overview' ? 'Executive Dashboard' :
               activeTab === 'shops' ? 'Shop & Menu Management' :
               activeTab === 'orders' ? 'Orders Fulfillment' :
               activeTab === 'customers' ? 'Customer Directory & History' :
               activeTab === 'tags' ? 'Search Tags & Quick Filters' :
               'App Updates & Promotional Banners'}
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'shops' && !managingShop && (
              <button
                onClick={() => {
                  setEditingShop(null);
                  setShopForm({
                    name: '',
                    slug: '',
                    description: '',
                    phone: '',
                    email: '',
                    address: 'Hostel City, Islamabad',
                    vendorTypeId: vendorTypes[0]?.id || '',
                    deliveryFee: 30,
                    estimatedDeliveryMinutes: 25,
                    minimumOrderAmount: 0,
                    logoUrl: '',
                    coverImageUrl: '',
                    status: 'ACTIVE',
                  });
                  setShowAddShopModal(true);
                }}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all"
              >
                <Plus size={15} /> Add New Shop
              </button>
            )}

            {activeTab === 'banners' && (
              <button
                onClick={handleOpenAddBanner}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
              >
                <Plus size={15} /> Create Banner
              </button>
            )}

            {managingShop && (
              <>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Plus size={15} /> Add Category
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      description: '',
                      price: '',
                      discountedPrice: '',
                      categoryId: shopMenu?.categories[0]?.id || '',
                      imageUrl: '',
                      unit: 'portion',
                      status: 'AVAILABLE',
                      isFeatured: false,
                    });
                    setShowAddProductModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all"
                >
                  <Plus size={15} /> Add Menu Item
                </button>
              </>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-orange-400' : ''} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-semibold text-xs cursor-pointer"
              title="Log Out of Admin Portal"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Global Notification Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
              statusMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' : 'bg-red-950/80 text-red-300 border-b border-red-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Workspace Body */}
        <main className="p-6 flex-1 min-w-0">
          {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && !managingShop && (
            <div className="space-y-6">
              {/* 4 Big KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-2xl font-extrabold text-white mt-1.5">
                        Rs. {stats ? stats.totalRevenue.toLocaleString() : '0'}
                      </h3>
                      <p className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                        <span>●</span> Delivered in Islamabad
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
                      <h3 className="text-2xl font-extrabold text-white mt-1.5">
                        {stats?.totalOrders ?? 0}
                      </h3>
                      <p className="text-[11px] text-amber-400 font-medium mt-1.5 flex items-center gap-1">
                        <span>●</span> {stats?.pendingOrders ?? 0} pending
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Shops</p>
                      <h3 className="text-2xl font-extrabold text-white mt-1.5">
                        {stats?.activeVendors ?? 0} / {stats?.totalVendors ?? 0}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                        Operating in Islamabad
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                      <Store size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered Customers</p>
                      <h3 className="text-2xl font-extrabold text-white mt-1.5">
                        {stats?.totalUsers ?? 0}
                      </h3>
                      <p className="text-[11px] text-blue-400 font-medium mt-1.5 flex items-center gap-1">
                        Hostel residents
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Orders Split Grid */}
              <div className="grid grid-cols-3 gap-5">
                {/* Recent Orders List (2 Cols) */}
                <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Latest activity across all shops</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                    >
                      View All Orders ({orders.length}) <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400 font-bold">
                            📦
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white font-mono">
                                #{order.orderNumber.slice(-8).toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-300 font-medium">
                                {(order as any).vendor?.name || 'Custom Order'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Customer: {(order as any).customer?.name || (order as any).customer?.email} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-white">
                            Rs. {order.total.toLocaleString()}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Shops Spotlight (1 Col) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-white">Shops Directory</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Quick active/closed control</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('shops')}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="space-y-3.5 flex-1">
                    {vendors.slice(0, 5).map((vendor) => (
                      <div key={vendor.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-lg">
                            🏪
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white">{vendor.name}</p>
                            <p className="text-xs text-slate-400">{vendor.vendorType?.name} · Delivery Rs. {vendor.deliveryFee}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleShopStatus(vendor)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            vendor.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300'
                              : 'bg-slate-700 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                          }`}
                        >
                          {vendor.status === 'ACTIVE' ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: SHOPS & MENUS MANAGEMENT ──────────────────────────────── */}
          {activeTab === 'shops' && !managingShop && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-3 w-96 relative">
                  <Search size={16} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search shops by name, slug..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter size={13} /> Filter:
                  </span>
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setShopFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        shopFilter === filter
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter === 'ALL' ? 'All Shops' : filter === 'ACTIVE' ? 'Active Only' : 'Closed / Inactive'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Desktop Data Table — Simplified to Shop Name, Status, and Edit/Delete icons */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Shop Name</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No shops found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((shop) => (
                        <tr
                          key={shop.id}
                          onClick={() => openShopMenu(shop)}
                          className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              {shop.coverImageUrl ? (
                                <img
                                  src={shop.coverImageUrl}
                                  alt=""
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 group-hover:border-orange-500/60 transition-colors"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center text-lg font-bold group-hover:bg-orange-600/30 transition-colors">
                                  🏪
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-white text-sm leading-tight group-hover:text-orange-400 transition-colors flex items-center gap-2">
                                  {shop.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                    {shop.vendorType?.name || 'General'}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {shop.address || 'Hostel City, Islamabad'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleShopStatus(shop);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                shop.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                              }`}
                              title="Click to toggle active/closed status"
                            >
                              {shop.status === 'ACTIVE' ? (
                                <>
                                  <CheckCircle size={12} /> Active / Open
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> Closed / Inactive
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openShopMenu(shop);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-colors"
                                title="Open & Manage Shop Menu"
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShop(shop);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Delete Shop"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUB-VIEW: MENU MANAGEMENT FOR A SPECIFIC SHOP ──────────────── */}
          {activeTab === 'shops' && managingShop && (
            <div className="space-y-6">
              {/* Back button & Shop Header */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setManagingShop(null)}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-extrabold text-white">{managingShop.name} Menu & Settings</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          managingShop.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {managingShop.status === 'ACTIVE' ? 'Open for Orders' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Add, update and organize items offered to students and hostel residents in Islamabad.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditShop(managingShop)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Edit shop name, phone, delivery fee, address"
                  >
                    <Edit2 size={14} /> Edit Shop Info
                  </button>
                  <button
                    onClick={() => handleToggleShopStatus(managingShop)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      managingShop.status === 'ACTIVE'
                        ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                        : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {managingShop.status === 'ACTIVE' ? 'Close Shop' : 'Open Shop'}
                  </button>
                </div>
              </div>

              {/* Categories & Products Listing */}
              {menuLoading ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                  <RefreshCw className="animate-spin text-orange-400 mb-3" size={24} />
                  Loading shop menu items...
                </div>
              ) : !shopMenu || shopMenu.products.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                  <UtensilsCrossed size={48} className="mx-auto text-slate-600 mb-4" />
                  <h4 className="text-lg font-bold text-white">No Menu Items Yet</h4>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    This shop has not published any items to their menu yet. Click "Add Menu Item" above to add products like Biryani, Chai, Parathas, or groceries.
                  </p>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        description: '',
                        price: '',
                        discountedPrice: '',
                        categoryId: shopMenu?.categories[0]?.id || '',
                        imageUrl: '',
                        unit: 'portion',
                        status: 'AVAILABLE',
                        isFeatured: false,
                      });
                      setShowAddProductModal(true);
                    }}
                    className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    <Plus size={16} /> Add First Menu Item
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Sections */}
                  {shopMenu.categories.map((category) => {
                    const catProducts = shopMenu.products.filter((p) => p.categoryId === category.id);
                    return (
                      <div key={category.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white text-base">{category.name}</h4>
                            {category.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">
                              {catProducts.length} item{catProducts.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium"
                            >
                              Delete Category
                            </button>
                          </div>
                        </div>

                        {catProducts.length === 0 ? (
                          <p className="p-6 text-sm text-slate-500 text-center">
                            No products in this category yet.
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-800/80">
                            {catProducts.map((product) => (
                              <div key={product.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-orange-600/10 text-orange-400 flex items-center justify-center text-2xl font-bold">
                                      🍲
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-white text-base">{product.name}</h5>
                                      {product.isFeatured && (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                                          FEATURED
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{product.description || 'No description provided'}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <span className="text-sm font-extrabold text-orange-400">
                                        Rs. {product.price}
                                      </span>
                                      {product.discountedPrice && (
                                        <span className="text-xs text-slate-500 line-through">
                                          Rs. {product.discountedPrice}
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-500">· Unit: {product.unit || 'per portion'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      product.status === 'AVAILABLE'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}
                                  >
                                    {product.status}
                                  </span>

                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setProductForm({
                                        name: product.name,
                                        description: product.description || '',
                                        price: String(product.price),
                                        discountedPrice: product.discountedPrice ? String(product.discountedPrice) : '',
                                        categoryId: product.categoryId,
                                        imageUrl: product.imageUrl || '',
                                        unit: product.unit || 'portion',
                                        status: product.status,
                                        isFeatured: product.isFeatured || false,
                                      });
                                      setShowAddProductModal(true);
                                    }}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                    title="Edit Product"
                                  >
                                    <Edit2 size={15} />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: ORDERS MANAGEMENT ─────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 w-80 relative">
                  <Search size={16} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by order #, customer, shop..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        orderFilter === st
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table — Clean, Uncluttered Layout */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Order #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Shop</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No orders found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr
                            key={order.id}
                            onClick={() => setInspectingOrder(order)}
                            className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 px-4 font-mono font-bold text-white group-hover:text-orange-400 transition-colors">
                              #{order.orderNumber.slice(-8).toUpperCase()}
                            </td>

                            <td className="py-2.5 px-4 font-medium text-slate-200">
                              {(order as any).customer?.name || (order as any).customer?.email?.split('@')[0] || 'Customer'}
                            </td>

                            <td className="py-2.5 px-4 font-medium text-orange-400">
                              {(order as any).vendor?.name || 'Custom Order'}
                            </td>

                            <td className="py-2.5 px-4 text-[11px] text-slate-400">
                              {dateFormatted}
                            </td>

                            <td className="py-2.5 px-4 font-bold text-white">
                              Rs. {order.total.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-block ${
                                  order.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  order.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectingOrder(order);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-colors"
                                title="Open & Manage Order"
                              >
                                <Edit2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 4: CUSTOMERS & ORDER HISTORY ─────────────────────────────── */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 w-80 relative">
                  <Search size={15} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name, email, phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="text-[11px] text-slate-400">
                  Showing <span className="font-bold text-white">{filteredCustomers.length}</span> registered customers in Islamabad
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Member Since</th>
                      <th className="py-2.5 px-4">Total Orders</th>
                      <th className="py-2.5 px-4">Total Spent</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr
                          key={cust.id}
                          onClick={() => setInspectingCustomer(cust)}
                          className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-orange-400 border border-slate-700 flex items-center justify-center font-bold text-xs group-hover:border-orange-500/50">
                                {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <span className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                {cust.name || 'Anonymous User'}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-4 text-slate-300 text-[11px]">
                            {cust.phone || cust.email}
                          </td>

                          <td className="py-2.5 px-4 text-[11px] text-slate-400">
                            {new Date(cust.createdAt).toLocaleDateString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-2.5 px-4 font-semibold text-white">
                            {cust.totalOrders} order{cust.totalOrders !== 1 ? 's' : ''}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-emerald-400">
                            Rs. {(cust.totalSpent || 0).toLocaleString()}
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingCustomer(cust);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-colors"
                              title="Open Customer Order History"
                            >
                              <Edit2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* TAB: SEARCH TAGS MANAGEMENT                                           */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              {/* Header / Add Tag Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-orange-400" />
                      Manage App Search Tags
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      These tags appear on the customer search screen (e.g. Paratha, Roti, Biryani) to help hostel students find food fast.
                    </p>
                  </div>

                  {/* Add Tag Form */}
                  <form onSubmit={handleAddTag} className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="New tag (e.g. Chai, Samosa)..."
                      className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500 w-56 sm:w-64"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 whitespace-nowrap shrink-0 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={15} className="shrink-0" />
                      <span className="whitespace-nowrap">Add Tag</span>
                    </button>
                  </form>
                </div>


                {/* Quick Add Suggestions */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2">Quick Add Suggestions for Hostel City:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Paratha', 'Roti', 'Biryani', 'Chai', 'Burger', 'Shawarma', 'Samosa', 'Roll Paratha', 'Cold Drinks', 'Grocery', 'Karahi', 'Naan', 'Lassi', 'Fries'].map((preset) => {
                      const exists = searchTags.some((t) => t.name.toLowerCase() === preset.toLowerCase());
                      if (exists) return null;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await apiClient.post('/admin/tags', { name: preset });
                              setSearchTags((prev) => [res.data.data, ...prev]);
                              showNotification(`Tag "${preset}" added`);
                            } catch (err: any) {
                              showNotification(err.response?.data?.message || 'Failed to add tag', 'error');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700/60 flex items-center gap-1"
                        >
                          <Plus size={11} className="text-orange-400" /> {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tag Controls & Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 w-80 relative">
                  <Search size={15} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search existing tags..."
                    className="w-full bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Showing <span className="font-bold text-white">{filteredTags.length}</span> of {searchTags.length} tags
                </div>
              </div>

              {/* Tags Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Tag Name</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Display Priority</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredTags.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          {searchTags.length === 0 ? 'No search tags defined yet. Add some above!' : 'No matching tags found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTags.map((tag) => (
                        <tr key={tag.id} className="hover:bg-slate-800/60 transition-colors group">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-orange-600/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold text-xs">
                                #
                              </div>
                              <span className="font-bold text-white text-xs">{tag.name}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleTag(tag)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                tag.isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                              }`}
                            >
                              {tag.isActive ? 'Active (Visible)' : 'Hidden (Inactive)'}
                            </button>
                          </td>

                          <td className="py-2.5 px-4 text-slate-400 text-xs">
                            Order: #{tag.sortOrder || 0}
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTag(tag.id, tag.name)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Search Tag"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: APP UPDATES & BANNER CARDS MANAGEMENT ───────────────────── */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Layers size={18} />
                      </div>
                      <h3 className="text-base font-bold text-white">App Updates & Promotional Banners</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Manage the horizontal carousel cards that appear at the top of the Customer App home screen.
                      Each card can have a title, promotional description, background image with gradient fallback, and optional navigation link.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddBanner}
                    className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/25 transition-all self-start md:self-auto cursor-pointer"
                  >
                    <Plus size={16} /> Create Banner Card
                  </button>
                </div>
              </div>

              {/* Banners Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bannerCards.map((banner) => (
                  <div
                    key={banner.id}
                    className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                      banner.isActive ? 'border-slate-800 shadow-sm' : 'border-slate-800/50 opacity-60'
                    }`}
                  >
                    {/* Live Preview Card */}
                    <div className="p-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Customer App Preview</span>
                        <span>Priority #{banner.sortOrder}</span>
                      </p>
                      <div
                        className={`w-full h-32 rounded-xl relative overflow-hidden p-4 flex flex-col justify-end shadow-inner select-none ${
                          !banner.imageUrl ? (banner.gradient ? `bg-gradient-to-r ${banner.gradient}` : 'bg-gradient-to-r from-orange-500 to-amber-500') : ''
                        }`}
                      >
                        {banner.imageUrl && (
                          <>
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                          </>
                        )}
                        <div className="relative z-10">
                          <p className="text-white font-bold text-sm leading-tight drop-shadow-xs">{banner.title}</p>
                          {banner.description && (
                            <p className="text-white/90 text-xs mt-1 leading-snug drop-shadow-xs line-clamp-2">
                              {banner.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Meta & Controls */}
                    <div className="p-3.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            banner.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {banner.isActive ? 'Active' : 'Hidden'}
                        </span>
                        {banner.linkUrl && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={banner.linkUrl}>
                            🔗 {banner.linkUrl}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleBannerStatus(banner)}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title={banner.isActive ? 'Hide from customer app' : 'Publish to customer app'}
                        >
                          {banner.isActive ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => handleOpenEditBanner(banner)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Banner Card"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id, banner.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Banner Card"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {bannerCards.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                    <Layers size={36} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-white font-semibold text-sm">No promotional banners yet</p>
                    <p className="text-slate-400 text-xs mt-1">Create your first banner card to show on the customer home screen.</p>
                    <button
                      onClick={handleOpenAddBanner}
                      className="mt-4 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
                    >
                      <Plus size={15} /> Add First Banner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

      </div>

      {/* ── MODAL: CUSTOMER ORDERS DRAWER / INSPECTION ───────────────────────── */}
      {inspectingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-lg">
                  {inspectingCustomer.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{inspectingCustomer.name || 'Customer'}</h3>
                  <p className="text-xs text-slate-400">
                    {inspectingCustomer.email} · Phone: {inspectingCustomer.phone || 'N/A'} · ID: {inspectingCustomer.customerId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase">
                <span>Customer Orders History with Dates</span>
                <span>Total Spent: Rs. {(inspectingCustomer.totalSpent || 0).toLocaleString()}</span>
              </div>

              {!inspectingCustomer.orders || inspectingCustomer.orders.length === 0 ? (
                <p className="py-12 text-center text-slate-400 text-sm">
                  This customer has not placed any orders yet.
                </p>
              ) : (
                inspectingCustomer.orders.map((ord) => {
                  const dateStr = new Date(ord.createdAt).toLocaleDateString('en-PK', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        const fullOrder = orders.find((o) => o.id === ord.id) || (ord as any);
                        setInspectingOrder(fullOrder);
                      }}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-mono group-hover:text-orange-400 transition-colors">
                            #{ord.orderNumber.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">from</span>
                          <span className="text-xs font-semibold text-orange-400">
                            {ord.vendor?.name || 'Custom Order'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              ord.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' :
                              ord.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                              'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {ord.status}
                          </span>
                          <span className="text-xs text-orange-400 group-hover:underline flex items-center gap-0.5">
                            Manage <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} /> {dateStr}
                      </p>

                      {ord.items && ord.items.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/50 space-y-1">
                          {ord.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-slate-300">
                              <span>{item.quantity}× {item.product?.name || 'Item'}</span>
                              <span className="font-medium text-slate-400">Rs. {item.unitPrice * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center text-sm font-bold text-white border-t border-slate-700/50">
                        <span>Total Paid</span>
                        <span className="text-orange-400">Rs. {ord.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ORDER DETAILS & STATUS MANAGEMENT ─────────────────────────── */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xl">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white font-mono">
                      #{inspectingOrder.orderNumber ? inspectingOrder.orderNumber.slice(-8).toUpperCase() : inspectingOrder.id.slice(-8)}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inspectingOrder.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        inspectingOrder.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        inspectingOrder.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}
                    >
                      {inspectingOrder.status ? inspectingOrder.status.replace(/_/g, ' ') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(inspectingOrder.createdAt).toLocaleDateString('en-PK', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Order Status Controller */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Update Order Fulfillment Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'CONFIRMED', label: 'Confirmed' },
                    { id: 'PREPARING', label: 'Preparing' },
                    { id: 'READY_FOR_PICKUP', label: 'Ready' },
                    { id: 'ON_THE_WAY', label: 'On The Way' },
                    { id: 'DELIVERED', label: 'Delivered' },
                    { id: 'CANCELLED', label: 'Cancelled' },
                  ].map((s) => {
                    const isCurrent = inspectingOrder.status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateOrderStatus(inspectingOrder.id, s.id as OrderStatus)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                          isCurrent
                            ? s.id === 'DELIVERED'
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                              : s.id === 'CANCELLED'
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                              : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-400'
                            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                        }`}
                      >
                        {isCurrent && <Check size={12} strokeWidth={3} />}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
                  <p className="text-sm font-bold text-white">
                    {inspectingOrder.customer?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" />
                    {inspectingOrder.customer?.email || 'N/A'}
                  </p>
                  {inspectingOrder.customer?.phone && (
                    <p className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {inspectingOrder.customer.phone}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hostel Delivery Address</h4>
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <MapPin size={13} className="text-orange-400" />
                    {inspectingOrder.deliveryAddress?.hostelName || inspectingOrder.deliveryAddress?.addressLine1 || 'Hostel City'}
                  </p>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    {inspectingOrder.deliveryAddress?.roomNumber && (
                      <p>Room: <span className="font-semibold text-white">{inspectingOrder.deliveryAddress.roomNumber}</span></p>
                    )}
                    {inspectingOrder.deliveryAddress?.street && (
                      <p>Street: <span className="font-semibold text-white">{inspectingOrder.deliveryAddress.street}</span></p>
                    )}
                    <p className="text-slate-400">Hostel City, Islamabad</p>
                  </div>
                </div>
              </div>

              {/* Shop & Note */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Order Placed From:</span>
                  <p className="text-sm font-bold text-orange-400">
                    {inspectingOrder.vendor?.name || 'Custom Order'}
                  </p>
                </div>
                {inspectingOrder.notes && (
                  <div className="text-right max-w-xs">
                    <span className="text-xs text-slate-400">Special Instructions:</span>
                    <p className="text-xs text-amber-300 italic">"{inspectingOrder.notes}"</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items</h4>
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl divide-y divide-slate-800">
                  {inspectingOrder.items && inspectingOrder.items.length > 0 ? (
                    inspectingOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-orange-600/20 text-orange-400 font-bold text-xs flex items-center justify-center">
                            {item.quantity}×
                          </span>
                          <span className="font-medium text-white">{item.product?.name || 'Menu Item'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-white">Rs. {(item.unitPrice * item.quantity).toLocaleString()}</span>
                          <span className="text-xs text-slate-400 block">(Rs. {item.unitPrice} each)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-400">
                      {inspectingOrder.customRequest?.description || 'Custom Order details'}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Subtotal</span>
                  <span>Rs. {(inspectingOrder.subtotal || inspectingOrder.total - (inspectingOrder.deliveryFee || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Hostel Delivery Fee</span>
                  <span>Rs. {(inspectingOrder.deliveryFee ?? 30).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-slate-700/60">
                  <span>Total Amount</span>
                  <span className="text-orange-400">Rs. {inspectingOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT SHOP ───────────────────────────────────────────── */}
      {showAddShopModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingShop ? `Edit Shop: ${editingShop.name}` : 'Add New Shop in Hostel City'}
              </h3>
              <button
                onClick={() => setShowAddShopModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.name}
                    onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                    placeholder="e.g. Al-Madina Biryani Point"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category / Shop Type *</label>
                  <select
                    required
                    value={shopForm.vendorTypeId}
                    onChange={(e) => setShopForm({ ...shopForm, vendorTypeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {vendorTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                  placeholder="Fresh food, late night delivery for hostels..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    value={shopForm.deliveryFee}
                    onChange={(e) => setShopForm({ ...shopForm, deliveryFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Delivery Time (Mins)</label>
                  <input
                    type="number"
                    value={shopForm.estimatedDeliveryMinutes}
                    onChange={(e) => setShopForm({ ...shopForm, estimatedDeliveryMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Order (Rs.)</label>
                  <input
                    type="number"
                    value={shopForm.minimumOrderAmount}
                    onChange={(e) => setShopForm({ ...shopForm, minimumOrderAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Status</label>
                  <select
                    value={shopForm.status}
                    onChange={(e) => setShopForm({ ...shopForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ACTIVE">ACTIVE (Open)</option>
                    <option value="INACTIVE">INACTIVE (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cover Image URL</label>
                <input
                  type="text"
                  value={shopForm.coverImageUrl}
                  onChange={(e) => setShopForm({ ...shopForm, coverImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddShopModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30"
                >
                  {actionLoading ? 'Saving...' : editingShop ? 'Update Shop' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CATEGORY ──────────────────────────────────────────────── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Menu Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Fast Food, Biryani, Shakes"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white"
                >
                  {actionLoading ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT PRODUCT ────────────────────────────────────────── */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingProduct ? 'Edit Menu Item' : 'Add Item to Menu'}
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Special Chicken Karahi"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
                <select
                  required
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {shopMenu?.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="250"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount Price (Rs.)</label>
                  <input
                    type="number"
                    value={productForm.discountedPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountedPrice: e.target.value })}
                    placeholder="Optional sale price"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ingredients, serving size..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Availability Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                    <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                    <option value="HIDDEN">HIDDEN</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-600 bg-slate-800 border-slate-700 focus:ring-0"
                    />
                    <span>Mark as Featured Item</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30"
                >
                  {actionLoading ? 'Saving...' : editingProduct ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT BANNER CARD ───────────────────────────────────── */}
      {showAddBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <h3 className="font-bold text-white text-base">
                  {editingBanner ? 'Edit Banner Card' : 'Create New Banner Card'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddBannerModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Live Preview within Modal */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Live Preview
                </label>
                <div
                  className={`w-full h-28 rounded-2xl relative overflow-hidden p-4 flex flex-col justify-end shadow-inner border border-slate-700 ${
                    !bannerForm.imageUrl ? (bannerForm.gradient ? `bg-gradient-to-r ${bannerForm.gradient}` : 'bg-gradient-to-r from-orange-500 to-amber-500') : ''
                  }`}
                >
                  {bannerForm.imageUrl && (
                    <>
                      <img
                        src={bannerForm.imageUrl}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    </>
                  )}
                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm leading-tight drop-shadow-xs">
                      {bannerForm.title || 'Banner Title Goes Here'}
                    </p>
                    <p className="text-white/90 text-xs mt-1 leading-snug drop-shadow-xs">
                      {bannerForm.description || 'Description subtitle goes here...'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% OFF your first order"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Use code WELCOME50 or On all orders above Rs. 300"
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Background Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or hosted image URL"
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to use a solid gradient theme.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gradient Color Theme (Fallback or Image Tint)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Orange / Amber', val: 'from-orange-500 to-amber-500' },
                    { label: 'Red / Orange', val: 'from-red-500 to-orange-500' },
                    { label: 'Primary / Red', val: 'from-primary-500 to-red-500' },
                    { label: 'Emerald / Teal', val: 'from-emerald-500 to-teal-600' },
                    { label: 'Blue / Indigo', val: 'from-blue-500 to-indigo-600' },
                    { label: 'Purple / Pink', val: 'from-purple-600 to-pink-500' },
                  ].map((grad) => (
                    <button
                      key={grad.val}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, gradient: grad.val })}
                      className={`h-8 rounded-lg bg-gradient-to-r ${grad.val} text-[10px] font-bold text-white shadow-xs transition-transform cursor-pointer ${
                        bannerForm.gradient === grad.val ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {grad.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link / Route (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="/shops or /custom-order"
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Priority / Sort
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bannerForm.sortOrder}
                    onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bannerIsActive"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 bg-slate-800 border-slate-700 focus:ring-orange-500"
                />
                <label htmlFor="bannerIsActive" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Active (show this banner to customers on the app)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddBannerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM CONFIRM DIALOG ──────────────────────────────────────────── */}
      <ConfirmDialog

        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        theme="dark"
        loading={actionLoading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

