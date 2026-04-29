import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { apiFetch } from '@/lib/apiClient';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
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

  useEffect(() => {
    setOrdersLoading(true);
    apiFetch<any[]>('/orders?limit=200', { auth: true })
      .then((rows) => {
        const list: AdminOrderRow[] = (rows || []).map((o: any) => ({
          id: o.id,
          code: o.code,
          customer: o.customer_id ? `${String(o.customer_id).slice(0, 8)}…` : 'Khách lẻ',
          customerId: o.customer_id || null,
          items: 0,
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
    return products
      .filter((p) => p.stock !== undefined && p.stock < 10)
      .slice(0, 3)
      .map((p) => ({ name: p.name, stock: p.stock, sku: p.sku }));
  }, [products]);

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

  const updateOrderStatusApi = async (orderId: string, newStatus: string) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success('Đã cập nhật trạng thái');
    } catch (e: any) {
      toast.error(`Lỗi cập nhật: ${e?.message || ''}`);
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
        <Button variant="outline" className="w-full justify-start border-black" asChild>
          <Link to="/login">
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Link>
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
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium text-sm">{order.code}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{order.channel}</Badge>
                          </TableCell>
                          <TableCell>{VND(order.total)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  try {
                                    localStorage.setItem('velora_last_order_code', order.code);
                                  } catch {
                                    /* ignore */
                                  }
                                  window.open(`/order-tracking?code=${encodeURIComponent(order.code)}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Select value={order.status} onValueChange={(v) => updateOrderStatusApi(order.id, v)}>
                                <SelectTrigger className="h-8 w-8 border-0 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="placed">Đã đặt</SelectItem>
                                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                  <SelectItem value="packed">Đã đóng gói</SelectItem>
                                  <SelectItem value="shipped">Đang giao</SelectItem>
                                  <SelectItem value="delivered">Đã giao</SelectItem>
                                  <SelectItem value="cancelled">Hủy đơn</SelectItem>
                                  <SelectItem value="returned">Hoàn hàng</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Không tìm thấy đơn hàng phù hợp
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Tổng tồn kho', value: products.reduce((s, p) => s + p.stock, 0), sub: 'sản phẩm' },
                  { label: 'SKU đang quản lý', value: products.length, sub: 'mã sản phẩm' },
                  { label: 'Cảnh báo tồn thấp', value: products.filter(p => p.stock < 10).length, sub: 'cần nhập thêm', red: true },
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

              {/* Low stock alerts */}
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
                        <TableHead className="text-right">Tồn kho</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products
                        .filter((p) => p.stock < 10)
                        .map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">
                              <span className={product.stock === 0 ? 'text-red-600 font-bold' : 'text-yellow-600 font-medium'}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              {product.stock === 0 ? (
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
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Full Inventory */}
              <Card className="velora-card">
                <CardHeader>
                  <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                    Tổng quan tồn kho
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead className="text-right">Tồn kho</TableHead>
                        <TableHead>Tình trạng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-sm">{product.category}</TableCell>
                          <TableCell className="text-right font-semibold">{product.stock}</TableCell>
                          <TableCell>
                            {product.stock === 0 ? (
                              <span className="text-xs text-red-600 border border-red-300 px-2 py-1">Hết hàng</span>
                            ) : product.stock < 10 ? (
                              <span className="text-xs text-yellow-600 border border-yellow-300 px-2 py-1">Tồn thấp</span>
                            ) : (
                              <span className="text-xs border border-border px-2 py-1">Đủ hàng</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
