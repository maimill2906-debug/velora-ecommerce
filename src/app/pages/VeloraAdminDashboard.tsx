import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiFetch, clearAuthSession } from '@/lib/apiClient';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Warehouse,
  LogOut,
  Menu,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreHorizontal,
  Megaphone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
const logoImg =
  'https://dummyimage.com/240x80/000/fff.png&text=VELORA';
import { toast } from 'sonner';

type TabValue = 'dashboard' | 'orders' | 'products' | 'inventory' | 'customers' | 'reports';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  sold: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface AdminOrderRow {
  id: string;
  code: string;
  customer: string;
  customerId: string | null;
  items: number;
  total: number;
  status: string;
  channel: string;
  date: string;
  rawDate: string | null;
}

interface OrderDetail {
  id: string;
  code: string;
  status: string;
  customer: { id: string; full_name: string; email: string | null; phone: string | null } | null;
  shipping_address: {
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    ward: string | null;
    district: string | null;
    province: string | null;
    country: string;
  } | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  placed_at: string | null;
  items: Array<{
    id: string;
    line_no: number;
    product_id: string | null;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  payments: Array<{ id: string; method: string; status: string; amount: number; paid_at: string | null }>;
  status_history: Array<{ id: string; status: string; note: string | null; created_at: string | null }>;
}

interface InventoryRow {
  product_id: string;
  sku: string;
  name: string;
  variant_count: number;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  placed: 'Đã đặt',
  confirmed: 'Đã xác nhận',
  packed: 'Đã đóng gói',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  returned: 'Hoàn hàng',
};

/** Trạng thái có thể chuyển kế tiếp (FSM) — khớp ALLOWED_STATUS_TRANSITIONS phía backend. */
const NEXT_STATUSES: Record<string, string[]> = {
  draft: ['placed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

const VND = (n: number) => `${Number(n || 0).toLocaleString('vi-VN')}₫`;
const formatDateVN = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};
const monthShort = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export function VeloraAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Order detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>('');
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Inventory (stock summary)
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    setProductsLoading(true);
    apiFetch<any[]>('/catalog/products?limit=500')
      .then((rows) => {
        const list: Product[] = (rows || []).map((p: any) => {
          const variants = p.variants || [];
          const prices = variants.map((v: any) => v.price).filter((x: any) => typeof x === 'number');
          const minPrice = prices.length ? Math.min(...prices) : (p.original_price || 0);
          return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.style_segment || '—',
            price: minPrice,
            stock: 0,
            status: p.is_active ? 'active' : 'inactive',
            sold: 0,
          } as Product;
        });
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const reloadOrders = () => {
    setOrdersLoading(true);
    apiFetch<any[]>('/orders?limit=200', { auth: true })
      .then((rows) => {
        const list: AdminOrderRow[] = (rows || []).map((o: any) => ({
          id: o.id,
          code: o.code,
          customer: o.customer?.full_name || (o.customer_id ? `${String(o.customer_id).slice(0, 8)}…` : 'Khách lẻ'),
          customerId: o.customer_id || null,
          items: o.items_count ?? 0,
          total: o.total_amount || 0,
          status: o.status || 'placed',
          channel: 'Website',
          date: formatDateVN(o.placed_at || o.created_at),
          rawDate: o.placed_at || o.created_at || null,
        }));
        setOrders(list);
      })
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    reloadOrders();
  }, []);

  const reloadInventory = () => {
    setInventoryLoading(true);
    apiFetch<InventoryRow[]>('/inventory/stock-summary', { auth: true })
      .then((rows) => setInventory(rows || []))
      .catch(() => setInventory([]))
      .finally(() => setInventoryLoading(false));
  };

  useEffect(() => {
    reloadInventory();
  }, []);

  useEffect(() => {
    setCustomersLoading(true);
    apiFetch<any[]>('/admin/users?limit=200', { auth: true })
      .then((rows) => {
        const list: Customer[] = (rows || []).map((u: any) => ({
          id: u.id,
          name: u.full_name || '—',
          email: u.email || '',
          phone: u.phone || '',
          orders: u.order_count || 0,
          totalSpent: u.total_spent || 0,
          joinDate: formatDateVN(u.created_at),
          status: u.status === 'active' ? 'active' : 'inactive',
        }));
        setCustomers(list);
      })
      .catch(() => setCustomers([]))
      .finally(() => setCustomersLoading(false));
  }, []);

  const revenueData = useMemo(() => {
    const now = new Date();
    const buckets: Array<{ id: string; name: string; website: number; shopee: number; store: number; key: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ id: `month-${key}`, name: monthShort[d.getMonth()], website: 0, shopee: 0, store: 0, key });
    }
    for (const o of orders) {
      if (!o.rawDate) continue;
      const k = o.rawDate.slice(0, 7);
      const b = buckets.find((x) => x.key === k);
      if (b) b.website += o.total || 0;
    }
    return buckets;
  }, [orders]);

  const channelPieData = useMemo(() => {
    const total = orders.reduce((s, o) => s + (o.total || 0), 0) || 1;
    return [
      { id: 'channel-website', name: 'Website', value: 100, fill: '#000000' },
      { id: 'channel-other', name: 'Khác', value: 0, fill: '#888888' },
    ].map((x) => ({ ...x, value: x.value }));
    void total;
  }, [orders]);

  const topProducts = useMemo(() => {
    return products.slice(0, 4).map((p, i) => ({
      id: `prod-${i}`,
      name: p.name,
      sold: p.sold || 0,
      revenue: (p.sold || 0) * (p.price || 0),
    }));
  }, [products]);

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((p) => p.qty_available < 10)
      .slice(0, 5)
      .map((p) => ({ name: p.name, stock: p.qty_available, sku: p.sku }));
  }, [inventory]);

  const recentOrders = orders.slice(0, 6);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      placed: { label: 'Đã đặt', className: 'border border-border text-muted-foreground' },
      pending: { label: 'Chờ xác nhận', className: 'border border-border text-muted-foreground' },
      confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-0' },
      packed: { label: 'Đã đóng gói', className: 'bg-blue-100 text-blue-800 border-0' },
      processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800 border-0' },
      shipped: { label: 'Đang giao', className: 'bg-yellow-100 text-yellow-800 border-0' },
      delivered: { label: 'Đã giao', className: 'bg-black text-white border-0' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-0' },
      returned: { label: 'Hoàn hàng', className: 'bg-red-100 text-red-800 border-0' },
    };
    const c = config[status] || { label: status, className: 'border border-border text-muted-foreground' };
    return <span className={`text-xs px-2 py-1 ${c.className}`}>{c.label}</span>;
  };

  const openOrderDetail = async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setNoteDraft('');
    try {
      const data = await apiFetch<OrderDetail>(`/orders/${orderId}`, { auth: true });
      setDetail(data);
      setStatusDraft(data.status);
    } catch (e: any) {
      toast.error(`Không tải được chi tiết đơn: ${e?.message || ''}`);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitStatusChange = async (override?: { status?: string; note?: string; restockReload?: boolean }) => {
    if (!detail) return;
    const status = override?.status ?? statusDraft;
    const note = override?.note ?? noteDraft;
    if (!status) {
      toast.error('Chưa chọn trạng thái');
      return;
    }
    setSavingStatus(true);
    try {
      await apiFetch(`/orders/${detail.id}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status, note: note?.trim() || null }),
      });
      toast.success('Đã cập nhật trạng thái');
      setOrders((arr) => arr.map((o) => (o.id === detail.id ? { ...o, status } : o)));
      // Reload chi tiết để cập nhật history + status
      const updated = await apiFetch<OrderDetail>(`/orders/${detail.id}`, { auth: true });
      setDetail(updated);
      setStatusDraft(updated.status);
      setNoteDraft('');
      // Hủy/hoàn => reload tồn kho
      if (status === 'cancelled' || status === 'returned') {
        reloadInventory();
      }
    } catch (e: any) {
      toast.error(`Lỗi cập nhật: ${e?.message || ''}`);
    } finally {
      setSavingStatus(false);
    }
  };

  const quickConfirm = async (orderId: string) => {
    try {
      await apiFetch(`/orders/${orderId}/confirm`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ note: 'Xác nhận nhanh từ danh sách' }),
      });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o)));
      toast.success('Đã xác nhận đơn');
    } catch (e: any) {
      toast.error(`Lỗi xác nhận: ${e?.message || ''}`);
    }
  };

  const quickCancel = async (orderId: string) => {
    const reason = window.prompt('Nhập lý do hủy đơn (sẽ lưu vào ghi chú trạng thái):', 'Hủy theo yêu cầu');
    if (reason === null) return;
    try {
      await apiFetch(`/orders/${orderId}/cancel`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ note: reason || 'Hủy đơn' }),
      });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      toast.success('Đã hủy đơn — đã hoàn kho');
      reloadInventory();
    } catch (e: any) {
      toast.error(`Lỗi hủy đơn: ${e?.message || ''}`);
    }
  };

  const getProductStatusBadge = (status: Product['status']) => {
    if (status === 'active') return <Badge className="bg-black text-white">Đang bán</Badge>;
    if (status === 'inactive') return <Badge variant="outline" className="border-red-500 text-red-600">Ngừng bán</Badge>;
    return <Badge variant="outline">Nháp</Badge>;
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch =
      !searchQuery ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const sidebarItems: { icon: React.ElementType; label: string; value: TabValue }[] = [
    { icon: LayoutDashboard, label: 'Tổng quan', value: 'dashboard' },
    { icon: ShoppingCart, label: 'Đơn hàng', value: 'orders' },
    { icon: Package, label: 'Sản phẩm', value: 'products' },
    { icon: Warehouse, label: 'Tồn kho', value: 'inventory' },
    { icon: Users, label: 'Khách hàng', value: 'customers' },
    { icon: BarChart3, label: 'Báo cáo', value: 'reports' },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`${
        mobile ? '' : 'hidden lg:flex'
      } w-full lg:w-64 bg-white border-r border-black flex-col flex-shrink-0 h-full`}
    >
      <div className="p-6 border-b border-border">
        <img src={logoImg} alt="VELORA" className="h-10 w-auto" />
        <p className="text-xs uppercase tracking-wider mt-2 text-muted-foreground">Admin Dashboard</p>
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.value}>
              <button
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-all ${
                  activeTab === item.value ? 'bg-black text-white' : ''
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm uppercase tracking-wider">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <div className="space-y-1">
          <Link
            to="/marketing"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-all text-sm uppercase tracking-wider"
          >
            <Megaphone className="h-5 w-5" />
            Marketing
          </Link>
          <Link
            to="/pos"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-all text-sm uppercase tracking-wider"
          >
            <ShoppingCart className="h-5 w-5" />
            POS
          </Link>
          <Link
            to="/warehouse"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-all text-sm uppercase tracking-wider"
          >
            <Warehouse className="h-5 w-5" />
            Quản lý kho
          </Link>
        </div>
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start border-black"
          onClick={() => {
            clearAuthSession();
            navigate('/login');
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-black flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar mobile />
              </SheetContent>
            </Sheet>
            <h1
              className="text-xl velora-heading"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {sidebarItems.find((item) => item.value === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">Admin • 16/04/2026</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ──────────────── DASHBOARD ──────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                  const now = new Date();
                  const ymKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                  const monthOrders = orders.filter((o) => (o.rawDate || '').startsWith(ymKey));
                  const monthRevenue = monthOrders.reduce((s, o) => s + (o.total || 0), 0);
                  const newCustomers = customers.filter((c) => {
                    if (!c.joinDate || c.joinDate === '—') return false;
                    return true;
                  }).length;
                  return [
                    { label: 'Doanh thu tháng', value: VND(monthRevenue), change: ordersLoading ? '...' : `${monthOrders.length} đơn`, up: true },
                    { label: 'Đơn hàng tháng', value: String(monthOrders.length), change: `Tổng ${orders.length}`, up: true },
                    { label: 'Tổng khách hàng', value: String(newCustomers), change: customersLoading ? '...' : `${customers.filter((c) => c.orders > 0).length} đã mua`, up: true },
                    { label: 'Sản phẩm', value: String(products.length), change: productsLoading ? '...' : `${products.filter((p) => p.status === 'active').length} đang bán`, up: true },
                  ];
                })().map((stat, i) => (
                  <Card key={i} className="velora-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                        {stat.value}
                      </p>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stat.change} so với tháng trước
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="velora-card">
                <CardHeader>
                  <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                    Doanh thu theo kênh (6 tháng gần nhất)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData} id="revenue-line-chart">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                      <Tooltip formatter={(v: number) => v.toLocaleString('vi-VN') + '₫'} />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="website" stroke="#000" strokeWidth={2} name="Website" dot={false} />
                      <Line type="monotone" dataKey="shopee" stroke="#555" strokeWidth={2} name="Shopee" dot={false} />
                      <Line type="monotone" dataKey="store" stroke="#aaa" strokeWidth={2} name="Cửa hàng" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="velora-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Sản phẩm bán chạy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topProducts} layout="vertical" id="top-products-bar-chart">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis type="number" stroke="#666" />
                        <YAxis dataKey="name" type="category" stroke="#666" width={130} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="sold" fill="#000" name="Đã bán" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Tỷ lệ kênh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart id="channel-pie-chart">
                        <Pie data={channelPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                          {channelPieData.map((entry) => (
                            <Cell key={entry.id} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => v + '%'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Đơn hàng gần nhất
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Tổng tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.code}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{order.total.toLocaleString('vi-VN')}₫</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                          </TableRow>
                        ))}
                        {!ordersLoading && recentOrders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                              Chưa có đơn hàng nào
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Cảnh báo tồn kho thấp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lowStockItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center pb-4 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-semibold text-red-600">{item.stock}</p>
                            <p className="text-xs text-muted-foreground">Còn lại</p>
                          </div>
                        </div>
                      ))}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full border-black hover:bg-black hover:text-white"
                      >
                        <Link to="/warehouse">Vào quản lý kho →</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ──────────────── ORDERS ──────────────── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-3 flex-wrap">
                  {['all', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatusFilter(s)}
                      className={`px-4 py-2 text-xs uppercase tracking-wider border transition-all ${
                        orderStatusFilter === s
                          ? 'bg-black text-white border-black'
                          : 'border-border hover:border-black'
                      }`}
                    >
                      {s === 'all' ? 'Tất cả' :
                       s === 'placed' ? 'Đã đặt' :
                       s === 'confirmed' ? 'Đã xác nhận' :
                       s === 'packed' ? 'Đã đóng gói' :
                       s === 'shipped' ? 'Đang giao' :
                       s === 'delivered' ? 'Đã giao' :
                       s === 'cancelled' ? 'Đã hủy' : 'Hoàn hàng'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã đơn, khách hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-black w-64"
                  />
                </div>
              </div>

              <Card className="velora-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Kênh</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const canConfirm = order.status === 'placed';
                        const canCancel = !['cancelled', 'returned', 'shipped', 'delivered'].includes(order.status);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-medium text-sm">{order.code}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{order.channel}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{order.items} món</TableCell>
                            <TableCell>{VND(order.total)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Xem chi tiết"
                                  onClick={() => openOrderDetail(order.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canConfirm && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-black text-xs"
                                    onClick={() => quickConfirm(order.id)}
                                  >
                                    Xác nhận
                                  </Button>
                                )}
                                {canCancel && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                                    onClick={() => quickCancel(order.id)}
                                  >
                                    Hủy
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {ordersLoading ? 'Đang tải đơn hàng…' : 'Không tìm thấy đơn hàng phù hợp'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      {detail ? `Đơn hàng ${detail.code}` : 'Chi tiết đơn hàng'}
                    </DialogTitle>
                  </DialogHeader>

                  {detailLoading || !detail ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">Đang tải…</div>
                  ) : (
                    <div className="space-y-6 mt-2">
                      {/* Tổng quan */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wider">Trạng thái</p>
                          <div className="mt-1">{getStatusBadge(detail.status)}</div>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wider">Đặt lúc</p>
                          <p className="text-sm mt-1">{formatDateVN(detail.placed_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wider">Khách hàng</p>
                          <p className="text-sm mt-1 font-medium">{detail.customer?.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {detail.customer?.email || '—'} · {detail.customer?.phone || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wider">Tổng tiền</p>
                          <p className="text-sm mt-1 font-semibold">{VND(detail.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            Tạm tính {VND(detail.subtotal_amount)} · Giảm {VND(detail.discount_amount)} · Phí ship {VND(detail.shipping_fee)}
                          </p>
                        </div>
                      </div>

                      {/* Địa chỉ giao */}
                      {detail.shipping_address && (
                        <div className="border border-border p-3">
                          <p className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Địa chỉ giao hàng</p>
                          <p className="text-sm font-medium">
                            {detail.shipping_address.full_name} · {detail.shipping_address.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {[
                              detail.shipping_address.line1,
                              detail.shipping_address.line2,
                              detail.shipping_address.ward,
                              detail.shipping_address.district,
                              detail.shipping_address.province,
                              detail.shipping_address.country,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Sản phẩm</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Variant</TableHead>
                              <TableHead className="text-right">Số lượng</TableHead>
                              <TableHead className="text-right">Đơn giá</TableHead>
                              <TableHead className="text-right">Thành tiền</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detail.items.map((it) => (
                              <TableRow key={it.id}>
                                <TableCell className="text-sm">{it.line_no}</TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">
                                  {it.variant_id ? it.variant_id.slice(0, 8) + '…' : '—'}
                                </TableCell>
                                <TableCell className="text-right">{it.quantity}</TableCell>
                                <TableCell className="text-right">{VND(it.unit_price)}</TableCell>
                                <TableCell className="text-right font-medium">{VND(it.line_total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Cập nhật trạng thái */}
                      <div className="border border-black p-4 space-y-3">
                        <p className="text-xs uppercase tracking-wider">Cập nhật trạng thái</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Trạng thái mới</Label>
                            <Select value={statusDraft} onValueChange={setStatusDraft}>
                              <SelectTrigger className="border-black">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={detail.status}>
                                  {ORDER_STATUS_LABELS[detail.status] || detail.status} (giữ nguyên)
                                </SelectItem>
                                {(NEXT_STATUSES[detail.status] || []).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {ORDER_STATUS_LABELS[s] || s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ghi chú trạng thái</Label>
                            <Textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="VD: Khách yêu cầu giao trước 17h…"
                              className="border-black h-[40px] min-h-[40px]"
                              rows={1}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            className="bg-black text-white hover:bg-gray-800"
                            disabled={savingStatus}
                            onClick={() => submitStatusChange()}
                          >
                            Lưu cập nhật
                          </Button>
                          {NEXT_STATUSES[detail.status]?.includes('confirmed') && (
                            <Button
                              variant="outline"
                              className="border-black"
                              disabled={savingStatus}
                              onClick={() => submitStatusChange({ status: 'confirmed', note: noteDraft || 'Xác nhận đơn' })}
                            >
                              Xác nhận đơn
                            </Button>
                          )}
                          {NEXT_STATUSES[detail.status]?.includes('cancelled') && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              disabled={savingStatus}
                              onClick={() => submitStatusChange({ status: 'cancelled', note: noteDraft || 'Hủy đơn' })}
                            >
                              Hủy đơn (hoàn kho)
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Lịch sử trạng thái */}
                      <div>
                        <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Lịch sử trạng thái</p>
                        <ol className="space-y-2 border-l-2 border-black pl-4">
                          {detail.status_history.length === 0 && (
                            <li className="text-sm text-muted-foreground">Chưa có lịch sử.</li>
                          )}
                          {detail.status_history.map((h) => (
                            <li key={h.id} className="relative">
                              <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-black" />
                              <p className="text-sm font-medium">
                                {ORDER_STATUS_LABELS[h.status] || h.status}
                                <span className="text-muted-foreground font-normal ml-2 text-xs">
                                  {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : ''}
                                </span>
                              </p>
                              {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" className="border-black" onClick={() => setDetailOpen(false)}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ──────────────── PRODUCTS ──────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm sản phẩm, SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 border-black"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-black">
                    <Filter className="h-4 w-4 mr-2" />
                    Lọc
                  </Button>
                  <Button variant="outline" className="border-black">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-black text-white hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm sản phẩm
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                          Thêm sản phẩm mới
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Tên sản phẩm *</Label>
                          <Input className="border-black" placeholder="VD: Áo sơ mi trắng" />
                        </div>
                        <div className="space-y-2">
                          <Label>SKU *</Label>
                          <Input className="border-black" placeholder="VD: VSM-WHT-001" />
                        </div>
                        <div className="space-y-2">
                          <Label>Danh mục</Label>
                          <Select>
                            <SelectTrigger className="border-black">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ao-so-mi">Áo sơ mi</SelectItem>
                              <SelectItem value="quan">Quần</SelectItem>
                              <SelectItem value="ao-khoac">Áo khoác</SelectItem>
                              <SelectItem value="vay">Váy</SelectItem>
                              <SelectItem value="ao-thun">Áo thun</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Giá bán (₫) *</Label>
                          <Input className="border-black" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Số lượng ban đầu</Label>
                          <Input className="border-black" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Trạng thái</Label>
                          <Select defaultValue="active">
                            <SelectTrigger className="border-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Đang bán</SelectItem>
                              <SelectItem value="inactive">Ngừng bán</SelectItem>
                              <SelectItem value="draft">Nháp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Mô tả sản phẩm</Label>
                          <textarea
                            className="w-full border border-black p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Mô tả chi tiết sản phẩm..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <Button
                          className="bg-black text-white hover:bg-gray-800"
                          onClick={() => toast.success('Sản phẩm đã được thêm!')}
                        >
                          Thêm sản phẩm
                        </Button>
                        <Button variant="outline" className="border-black">Hủy</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Tổng sản phẩm', value: products.length },
                  { label: 'Đang bán', value: products.filter(p => p.status === 'active').length },
                  { label: 'Ngừng bán', value: products.filter(p => p.status === 'inactive').length },
                  { label: 'Tổng đã bán', value: products.reduce((s, p) => s + p.sold, 0) },
                ].map((stat, i) => (
                  <Card key={i} className="velora-card">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="velora-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead className="text-right">Giá bán</TableHead>
                        <TableHead className="text-right">Tồn kho</TableHead>
                        <TableHead className="text-right">Đã bán</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {product.sku}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-sm">{product.category}</TableCell>
                          <TableCell className="text-right">
                            {product.price.toLocaleString('vi-VN')}₫
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            <Link to="/warehouse" className="underline hover:text-black">Xem kho</Link>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            —
                          </TableCell>
                          <TableCell>{getProductStatusBadge(product.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toast.success(`Đang chỉnh sửa ${product.name}`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setProducts(products.filter((p) => p.id !== product.id));
                                  toast.success('Đã xóa sản phẩm');
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──────────────── INVENTORY ──────────────── */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {(() => {
                const totalOnHand = inventory.reduce((s, r) => s + (r.qty_on_hand || 0), 0);
                const totalReserved = inventory.reduce((s, r) => s + (r.qty_reserved || 0), 0);
                const lowStock = inventory.filter((r) => (r.qty_available ?? r.qty_on_hand) < 10);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Tổng tồn (on-hand)', value: totalOnHand.toLocaleString('vi-VN'), sub: 'đơn vị' },
                      { label: 'Đang giữ (reserved)', value: totalReserved.toLocaleString('vi-VN'), sub: 'đơn vị' },
                      { label: 'SKU đang quản lý', value: inventory.length, sub: 'mã sản phẩm' },
                      { label: 'Cảnh báo tồn thấp', value: lowStock.length, sub: 'cần nhập thêm', red: true },
                    ].map((stat, i) => (
                      <Card key={i} className={`velora-card ${stat.red ? 'border-red-200' : ''}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                            {stat.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-3xl velora-heading ${stat.red ? 'text-red-600' : ''}`} style={{ fontFamily: 'var(--font-heading)' }}>
                            {stat.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm SKU, sản phẩm…"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9 border-black"
                  />
                </div>
                <Button variant="outline" className="border-black" onClick={reloadInventory} disabled={inventoryLoading}>
                  {inventoryLoading ? 'Đang tải…' : 'Làm mới'}
                </Button>
              </div>

              {/* Low stock alerts (theo qty_available) */}
              <Card className="velora-card border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700" style={{ fontFamily: 'var(--font-heading)' }}>
                    ⚠ Sản phẩm cần nhập thêm
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">Tồn khả dụng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory
                        .filter((p) => p.qty_available < 10)
                        .map((product) => (
                          <TableRow key={product.product_id}>
                            <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">
                              <span className={product.qty_available <= 0 ? 'text-red-600 font-bold' : 'text-yellow-600 font-medium'}>
                                {product.qty_available}
                              </span>
                            </TableCell>
                            <TableCell>
                              {product.qty_available <= 0 ? (
                                <span className="text-xs text-red-600 border border-red-300 px-2 py-1">Hết hàng</span>
                              ) : (
                                <span className="text-xs text-yellow-600 border border-yellow-300 px-2 py-1">Tồn thấp</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-black hover:bg-black hover:text-white text-xs"
                                asChild
                              >
                                <Link to="/warehouse">Nhập kho</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!inventoryLoading && inventory.filter((p) => p.qty_available < 10).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            Không có sản phẩm tồn thấp.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Full Inventory */}
              <Card className="velora-card">
                <CardHeader>
                  <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                    Tổng quan tồn kho (gộp theo sản phẩm)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">Số variant</TableHead>
                        <TableHead className="text-right">On-hand</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">Khả dụng</TableHead>
                        <TableHead>Tình trạng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory
                        .filter(
                          (p) =>
                            !inventorySearch ||
                            p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(inventorySearch.toLowerCase())
                        )
                        .map((product) => (
                          <TableRow key={product.product_id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right text-sm">{product.variant_count}</TableCell>
                            <TableCell className="text-right">{product.qty_on_hand}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{product.qty_reserved}</TableCell>
                            <TableCell className="text-right font-semibold">{product.qty_available}</TableCell>
                            <TableCell>
                              {product.qty_available <= 0 ? (
                                <span className="text-xs text-red-600 border border-red-300 px-2 py-1">Hết hàng</span>
                              ) : product.qty_available < 10 ? (
                                <span className="text-xs text-yellow-600 border border-yellow-300 px-2 py-1">Tồn thấp</span>
                              ) : (
                                <span className="text-xs border border-border px-2 py-1">Đủ hàng</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      {!inventoryLoading && inventory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                            Chưa có dữ liệu tồn kho.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button asChild className="bg-black text-white hover:bg-gray-800">
                  <Link to="/warehouse">
                    Mở Quản lý kho chi tiết →
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* ──────────────── CUSTOMERS ──────────────── */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng khách hàng', value: customers.length },
                  { label: 'Khách hoạt động', value: customers.filter(c => c.status === 'active').length },
                  { label: 'Khách mới tháng này', value: 12 },
                  { label: 'Doanh thu / KH (avg)', value: Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toLocaleString('vi-VN') + '₫' },
                ].map((stat, i) => (
                  <Card key={i} className="velora-card">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm khách hàng, email, SĐT..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9 border-black"
                  />
                </div>
                <Button variant="outline" className="border-black">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất danh sách
                </Button>
              </div>

              <Card className="velora-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead>Ngày tham gia</TableHead>
                        <TableHead className="text-right">Đơn hàng</TableHead>
                        <TableHead className="text-right">Tổng chi tiêu</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs flex-shrink-0">
                                {customer.name.charAt(0)}
                              </div>
                              <span className="font-medium">{customer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{customer.phone}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {customer.joinDate}
                          </TableCell>
                          <TableCell className="text-right font-medium">{customer.orders}</TableCell>
                          <TableCell className="text-right font-medium">
                            {customer.totalSpent.toLocaleString('vi-VN')}₫
                          </TableCell>
                          <TableCell>
                            {customer.status === 'active' ? (
                              <Badge className="bg-black text-white text-xs">Hoạt động</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Không hoạt động</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toast.success(`Xem hồ sơ ${customer.name}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──────────────── REPORTS ──────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Report Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Doanh thu Q2/2026', value: '303.000.000₫', change: '+14%', up: true },
                  { label: 'Đơn hàng Q2/2026', value: '1.247', change: '+9%', up: true },
                  { label: 'Giá trị đơn TB', value: '243.000₫', change: '+4%', up: true },
                  { label: 'Tỷ lệ hoàn hàng', value: '2.1%', change: '-0.3%', up: false },
                ].map((stat, i) => (
                  <Card key={i} className="velora-card">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{stat.label}</p>
                      <p className="text-xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                        {stat.value}
                      </p>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stat.change} so với Q1
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue by month */}
                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Doanh thu theo tháng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={revenueData} id="revenue-bar-chart">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                        <Tooltip formatter={(v: number) => v.toLocaleString('vi-VN') + '₫'} />
                        <Bar dataKey="website" fill="#000" stackId="a" name="Website" />
                        <Bar dataKey="shopee" fill="#555" stackId="a" name="Shopee" />
                        <Bar dataKey="store" fill="#aaa" stackId="a" name="Cửa hàng" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Channel breakdown */}
                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Phân tích theo kênh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { channel: 'Website', revenue: 328000000, orders: 687, percent: 45 },
                        { channel: 'Shopee', revenue: 219000000, orders: 374, percent: 30 },
                        { channel: 'Cửa hàng (Store)', revenue: 183000000, orders: 186, percent: 25 },
                      ].map((item) => (
                        <div key={item.channel}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">{item.channel}</span>
                            <span className="text-muted-foreground">
                              {item.revenue.toLocaleString('vi-VN')}₫ · {item.orders} đơn
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-none">
                            <div
                              className="h-full bg-black"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-right text-muted-foreground mt-1">{item.percent}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top products */}
                <Card className="velora-card">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                        Top sản phẩm bán chạy
                      </CardTitle>
                      <Button variant="outline" size="sm" className="border-black text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Xuất
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-right">Đã bán</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-muted-foreground font-mono">
                              {String(i + 1).padStart(2, '0')}
                            </TableCell>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-right">{p.sold}</TableCell>
                            <TableCell className="text-right">
                              {p.revenue.toLocaleString('vi-VN')}₫
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Customer analysis */}
                <Card className="velora-card">
                  <CardHeader>
                    <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                      Phân tích khách hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        { label: 'Khách hàng mới', value: 89, change: '+15%', up: true },
                        { label: 'Khách hàng quay lại', value: 145, change: '+8%', up: true },
                        { label: 'Tỷ lệ giữ chân (Retention)', value: '62%', change: '+3%', up: true },
                        { label: 'Giá trị vòng đời (LTV)', value: '1.240.000₫', change: '+12%', up: true },
                      ].map((metric) => (
                        <div key={metric.label} className="flex justify-between items-center pb-4 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{metric.label}</p>
                            <p className={`text-xs flex items-center gap-1 ${metric.up ? 'text-green-600' : 'text-red-600'}`}>
                              {metric.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {metric.change} so với tháng trước
                            </p>
                          </div>
                          <span className="velora-heading text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
