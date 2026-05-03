import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiFetch, clearAuthSession } from '@/lib/apiClient';
import {
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  Search,
  Eye,
  CheckCircle,
  Archive,
  XCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { VeloraLogo } from '../components/VeloraLogo';

// ── Types ──────────────────────────────────────────────────────────────────

type TabValue = 'orders' | 'customers';

interface SaleOrderRow {
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
  channel?: string;
  sales_channel?: string | null;
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

interface CustomerRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ thanh toán',
  authorized: 'Đã ủy quyền',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Hoàn tiền',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-700 border-orange-200',
  authorized: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-300',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Tiền mặt (COD)',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  bank: 'Chuyển khoản',
  card: 'Thẻ',
};

const VND = (n: number) => `${Number(n || 0).toLocaleString('vi-VN')}₫`;

const formatDateVN = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
};

const formatDateTimeVN = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('vi-VN'); } catch { return iso; }
};

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Nháp',          cls: 'border border-border text-muted-foreground' },
  placed:    { label: 'Đã đặt',        cls: 'bg-amber-100 text-amber-800 border-0' },
  confirmed: { label: 'Đã xác nhận',   cls: 'bg-blue-100 text-blue-800 border-0' },
  packed:    { label: 'Đã đóng gói',   cls: 'bg-indigo-100 text-indigo-800 border-0' },
  shipped:   { label: 'Đang giao',     cls: 'bg-yellow-100 text-yellow-800 border-0' },
  delivered: { label: 'Đã giao',       cls: 'bg-black text-white border-0' },
  cancelled: { label: 'Đã hủy',        cls: 'bg-red-100 text-red-800 border-0' },
  returned:  { label: 'Hoàn hàng',     cls: 'bg-red-100 text-red-800 border-0' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] ?? { label: status, cls: 'border border-border text-muted-foreground' };
  return <span className={`text-xs px-2 py-1 font-medium ${c.cls}`}>{c.label}</span>;
}

// ── Sidebar nav items ─────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabValue; label: string; Icon: React.ElementType }[] = [
  { id: 'orders',    label: 'Đơn hàng',   Icon: ShoppingCart },
  { id: 'customers', label: 'Khách hàng', Icon: Users },
];

const STATUS_FILTERS = [
  { value: 'all',       label: 'Tất cả' },
  { value: 'placed',    label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'packed',    label: 'Đã đóng gói' },
  { value: 'shipped',   label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

// ── Main component ────────────────────────────────────────────────────────

export function SalesDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('orders');

  // Orders
  const [orders, setOrders] = useState<SaleOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order detail dialog
  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail]             = useState<OrderDetail | null>(null);
  const [noteDraft, setNoteDraft]       = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Customers
  const [customers, setCustomers]           = useState<CustomerRow[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [editCustomer, setEditCustomer]     = useState<CustomerRow | null>(null);
  const [editDraft, setEditDraft]           = useState<Partial<CustomerRow>>({});
  const [savingCustomer, setSavingCustomer] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────

  const reloadOrders = () => {
    setOrdersLoading(true);
    apiFetch<any[]>('/orders?limit=200', { auth: true })
      .then((rows) => {
        setOrders(
          (rows || []).map((o: any) => ({
            id: o.id,
            code: o.code,
            customer: o.customer?.full_name || (o.customer_id ? `${String(o.customer_id).slice(0, 8)}…` : 'Khách lẻ'),
            customerId: o.customer_id || null,
            items: o.items_count ?? 0,
            total: o.total_amount || 0,
            status: o.status || 'placed',
            channel: typeof o.channel === 'string' ? o.channel : 'Chưa gán kênh',
            date: formatDateVN(o.placed_at || o.created_at),
            rawDate: o.placed_at || o.created_at || null,
          }))
        );
      })
      .catch(() => { setOrders([]); toast.error('Không tải được danh sách đơn hàng'); })
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => { reloadOrders(); }, []);

  useEffect(() => {
    if (activeTab !== 'customers') return;
    setCustomersLoading(true);
    apiFetch<CustomerRow[]>('/customers', { auth: true })
      .then((rows) => setCustomers(rows || []))
      .catch(() => { setCustomers([]); toast.error('Không tải được danh sách khách hàng'); })
      .finally(() => setCustomersLoading(false));
  }, [activeTab]);

  // ── Order actions ────────────────────────────────────────────────────────

  const openDetail = async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setNoteDraft('');
    try {
      const data = await apiFetch<OrderDetail>(`/orders/${orderId}`, { auth: true });
      setDetail(data);
    } catch (e: any) {
      toast.error(`Không tải được chi tiết đơn: ${e?.message || ''}`);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadDetail = async (orderId: string) => {
    try {
      const data = await apiFetch<OrderDetail>(`/orders/${orderId}`, { auth: true });
      setDetail(data);
    } catch {}
  };

  const doAction = async (endpoint: string, successMsg: string, nextStatus: string) => {
    if (!detail) return;
    setSavingAction(true);
    try {
      await apiFetch(`/orders/${detail.id}/${endpoint}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ note: noteDraft.trim() || null }),
      });
      toast.success(successMsg);
      setOrders((arr) => arr.map((o) => (o.id === detail.id ? { ...o, status: nextStatus } : o)));
      setNoteDraft('');
      await reloadDetail(detail.id);
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || ''}`);
    } finally {
      setSavingAction(false);
    }
  };

  const handleConfirm = () => doAction('confirm', 'Đã xác nhận đơn hàng', 'confirmed');
  const handlePack    = () => doAction('pack',    'Đã đóng gói đơn hàng', 'packed');
  const handleCancel  = async () => {
    if (!detail) return;
    const reason = window.prompt('Lý do hủy đơn:', 'Hủy theo yêu cầu');
    if (reason === null) return;
    setSavingAction(true);
    try {
      await apiFetch(`/orders/${detail.id}/cancel`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ note: reason || 'Hủy đơn' }),
      });
      toast.success('Đã hủy đơn — kho đã được hoàn lại');
      setOrders((arr) => arr.map((o) => (o.id === detail.id ? { ...o, status: 'cancelled' } : o)));
      await reloadDetail(detail.id);
    } catch (e: any) {
      toast.error(`Lỗi hủy đơn: ${e?.message || ''}`);
    } finally {
      setSavingAction(false);
    }
  };

  // Quick actions from the table (no detail open)
  const quickConfirm = async (orderId: string) => {
    try {
      await apiFetch(`/orders/${orderId}/confirm`, { method: 'POST', auth: true,
        body: JSON.stringify({ note: 'Xác nhận nhanh' }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o)));
      toast.success('Đã xác nhận đơn');
    } catch (e: any) { toast.error(`Lỗi: ${e?.message || ''}`); }
  };

  const quickPack = async (orderId: string) => {
    try {
      await apiFetch(`/orders/${orderId}/pack`, { method: 'POST', auth: true,
        body: JSON.stringify({ note: 'Đóng gói nhanh' }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: 'packed' } : o)));
      toast.success('Đã đóng gói đơn');
    } catch (e: any) { toast.error(`Lỗi: ${e?.message || ''}`); }
  };

  const quickCancel = async (orderId: string) => {
    const reason = window.prompt('Lý do hủy đơn:', 'Hủy theo yêu cầu');
    if (reason === null) return;
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: 'POST', auth: true,
        body: JSON.stringify({ note: reason || 'Hủy đơn' }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      toast.success('Đã hủy đơn — kho đã được hoàn lại');
    } catch (e: any) { toast.error(`Lỗi: ${e?.message || ''}`); }
  };

  // ── Customer actions ─────────────────────────────────────────────────────

  const openEditCustomer = (c: CustomerRow) => {
    setEditCustomer(c);
    setEditDraft({ full_name: c.full_name, email: c.email ?? '', phone: c.phone ?? '' });
  };

  const saveCustomer = async () => {
    if (!editCustomer) return;
    setSavingCustomer(true);
    try {
      const updated = await apiFetch<CustomerRow>(`/customers/${editCustomer.id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(editDraft),
      });
      setCustomers((arr) => arr.map((c) => (c.id === editCustomer.id ? { ...c, ...updated } : c)));
      setEditCustomer(null);
      toast.success('Đã cập nhật thông tin khách hàng');
    } catch (e: any) {
      toast.error(`Lỗi cập nhật: ${e?.message || ''}`);
    } finally {
      setSavingCustomer(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch =
      !orderSearch ||
      o.code.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const orderStats = {
    total:     orders.length,
    placed:    orders.filter((o) => o.status === 'placed').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    packed:    orders.filter((o) => o.status === 'packed').length,
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => { clearAuthSession(); navigate('/login'); };

  // ── Sidebar content ───────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <Link to="/"><VeloraLogo size="small" showSubtitle={false} /></Link>
        <p className="text-xs text-muted-foreground mt-1">Sale Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              activeTab === id
                ? 'bg-black text-white'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <Separator className="my-3" />
        <Link
          to="/pos"
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <ShoppingCart size={16} />
          Bán hàng (POS)
          <ChevronRight size={14} className="ml-auto" />
        </Link>
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-white shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-white border-b border-border">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu size={20} /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-56">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <VeloraLogo size="small" showSubtitle={false} />
        <span className="text-xs text-muted-foreground ml-1">Sale</span>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="p-6 max-w-6xl mx-auto">

          {/* ── ORDERS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold tracking-tight">Quản lý đơn hàng</h1>
                <Button variant="outline" size="sm" onClick={reloadOrders} disabled={ordersLoading}>
                  <RefreshCw size={14} className={ordersLoading ? 'animate-spin mr-1' : 'mr-1'} />
                  Làm mới
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tổng đơn',      value: orderStats.total,     cls: 'bg-gray-50' },
                  { label: 'Chờ xác nhận',  value: orderStats.placed,    cls: 'bg-amber-50' },
                  { label: 'Đã xác nhận',   value: orderStats.confirmed, cls: 'bg-blue-50' },
                  { label: 'Đã đóng gói',   value: orderStats.packed,    cls: 'bg-indigo-50' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`${cls} p-4 border border-border`}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã đơn, tên khách..."
                    className="pl-8"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {STATUS_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        statusFilter === value
                          ? 'bg-black text-white border-black'
                          : 'border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {ordersLoading ? (
                <div className="py-20 text-center text-muted-foreground text-sm">Đang tải đơn hàng…</div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-sm">Không có đơn nào</div>
              ) : (
                <div className="border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-32">Mã đơn</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead className="w-28">Ngày</TableHead>
                        <TableHead className="w-28">Kênh</TableHead>
                        <TableHead className="w-24 text-right">Tổng tiền</TableHead>
                        <TableHead className="w-32">Trạng thái</TableHead>
                        <TableHead className="w-48 text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((o) => (
                        <TableRow key={o.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs">{o.code}</TableCell>
                          <TableCell className="text-sm">{o.customer}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{o.date}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{o.channel}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{VND(o.total)}</TableCell>
                          <TableCell><StatusBadge status={o.status} /></TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {/* View detail */}
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7"
                                onClick={() => openDetail(o.id)}
                                title="Xem chi tiết"
                              >
                                <Eye size={13} />
                              </Button>
                              {/* Quick confirm */}
                              {o.status === 'placed' && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => quickConfirm(o.id)}
                                  title="Xác nhận đơn"
                                >
                                  <CheckCircle size={12} className="mr-1" />
                                  Xác nhận
                                </Button>
                              )}
                              {/* Quick pack */}
                              {o.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                  onClick={() => quickPack(o.id)}
                                  title="Đóng gói đơn"
                                >
                                  <Archive size={12} className="mr-1" />
                                  Đóng gói
                                </Button>
                              )}
                              {/* Quick cancel */}
                              {!['cancelled', 'returned', 'shipped', 'delivered'].includes(o.status) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => quickCancel(o.id)}
                                  title="Hủy đơn"
                                >
                                  <XCircle size={13} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOMERS TAB ──────────────────────────────────────────── */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h1 className="text-xl font-semibold tracking-tight">Khách hàng</h1>

              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, SĐT, email..."
                  className="pl-8"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              {customersLoading ? (
                <div className="py-20 text-center text-muted-foreground text-sm">Đang tải khách hàng…</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-sm">Không tìm thấy khách hàng</div>
              ) : (
                <div className="border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Họ tên</TableHead>
                        <TableHead className="w-36">Điện thoại</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-28">Ngày tạo</TableHead>
                        <TableHead className="w-24 text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">{c.full_name || '—'}</TableCell>
                          <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.email || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateVN(c.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline" size="sm"
                              className="h-7 text-xs"
                              onClick={() => openEditCustomer(c)}
                            >
                              Sửa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── ORDER DETAIL DIALOG ───────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail ? `Đơn hàng ${detail.code}` : 'Chi tiết đơn hàng'}
            </DialogTitle>
          </DialogHeader>

          {detailLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">Đang tải…</div>
          )}

          {!detailLoading && detail && (
            <div className="space-y-5 text-sm">

              {/* Status + Date */}
              <div className="flex items-center gap-4">
                <StatusBadge status={detail.status} />
                <span className="text-muted-foreground text-xs">{formatDateTimeVN(detail.placed_at)}</span>
                {detail.channel && (
                  <span className="text-xs border border-border px-2 py-0.5">{detail.channel}</span>
                )}
              </div>

              {/* Customer */}
              {detail.customer && (
                <div className="border border-border p-3 space-y-0.5">
                  <p className="font-medium">{detail.customer.full_name}</p>
                  {detail.customer.phone && <p className="text-muted-foreground">{detail.customer.phone}</p>}
                  {detail.customer.email && <p className="text-muted-foreground">{detail.customer.email}</p>}
                </div>
              )}

              {/* Shipping address */}
              {detail.shipping_address && (
                <div className="border border-border p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Địa chỉ giao hàng</p>
                  <p className="font-medium">{detail.shipping_address.full_name}</p>
                  <p className="text-muted-foreground">{detail.shipping_address.phone}</p>
                  <p className="text-muted-foreground">
                    {[detail.shipping_address.line1, detail.shipping_address.ward, detail.shipping_address.district, detail.shipping_address.province]
                      .filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sản phẩm</p>
                <div className="border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead className="w-16 text-center">SL</TableHead>
                        <TableHead className="w-24 text-right">Đơn giá</TableHead>
                        <TableHead className="w-24 text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center text-muted-foreground">{item.line_no}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.variant_id ? item.variant_id.slice(0, 8) : '—'}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{VND(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{VND(item.line_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-2 gap-8 text-xs text-muted-foreground">
                  <span>Tạm tính: {VND(detail.subtotal_amount)}</span>
                  {detail.discount_amount > 0 && <span>Giảm: -{VND(detail.discount_amount)}</span>}
                  {detail.shipping_fee > 0 && <span>Vận chuyển: {VND(detail.shipping_fee)}</span>}
                  <span className="text-foreground font-semibold text-sm">Tổng: {VND(detail.total_amount)}</span>
                </div>
              </div>

              {/* Payments */}
              {detail.payments?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Thanh toán</p>
                  <div className="space-y-1">
                    {detail.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border border-border px-3 py-2">
                        <span>{PAYMENT_METHOD_LABELS[p.method] || p.method}</span>
                        <span className={`text-xs px-2 py-0.5 border ${PAYMENT_STATUS_COLORS[p.status] || ''}`}>
                          {PAYMENT_STATUS_LABELS[p.status] || p.status}
                        </span>
                        <span className="font-medium">{VND(p.amount)}</span>
                        {p.paid_at && <span className="text-xs text-muted-foreground">{formatDateVN(p.paid_at)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!['cancelled', 'returned', 'delivered'].includes(detail.status) && (
                <div className="border border-border p-4 space-y-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Xử lý đơn hàng</p>
                  <Textarea
                    placeholder="Ghi chú (tuỳ chọn)…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {detail.status === 'placed' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleConfirm}
                        disabled={savingAction}
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Xác nhận đơn
                      </Button>
                    )}
                    {detail.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handlePack}
                        disabled={savingAction}
                      >
                        <Archive size={14} className="mr-1" />
                        Đóng gói
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleCancel}
                      disabled={savingAction}
                    >
                      <XCircle size={14} className="mr-1" />
                      Hủy đơn (hoàn kho)
                    </Button>
                  </div>
                </div>
              )}

              {/* Status history */}
              {detail.status_history?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Lịch sử trạng thái</p>
                  <div className="space-y-2">
                    {detail.status_history.map((h, idx) => (
                      <div key={h.id} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                          {idx < detail.status_history.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[16px]" />
                          )}
                        </div>
                        <div className="pb-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={h.status} />
                            <span className="text-xs text-muted-foreground">{formatDateTimeVN(h.created_at)}</span>
                          </div>
                          {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── EDIT CUSTOMER DIALOG ─────────────────────────────────────── */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => { if (!open) setEditCustomer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật khách hàng</DialogTitle>
          </DialogHeader>
          {editCustomer && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Họ tên</Label>
                <Input
                  value={editDraft.full_name ?? ''}
                  onChange={(e) => setEditDraft((d) => ({ ...d, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Số điện thoại</Label>
                <Input
                  value={editDraft.phone ?? ''}
                  onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={editDraft.email ?? ''}
                  onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditCustomer(null)}>Huỷ</Button>
                <Button onClick={saveCustomer} disabled={savingCustomer}>
                  {savingCustomer ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
