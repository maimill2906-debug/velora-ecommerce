import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Package, TrendingUp, TrendingDown, Search, LogOut, Plus, Minus, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiFetch, clearAuthSession, getSessionUserType } from '@/lib/apiClient';
import { toast } from 'sonner';

const logoImg = 'https://dummyimage.com/240x80/000/fff.png&text=VELORA';

type Location = { id: string; code: string; name: string };

type StockItem = {
  id: string;
  location_id: string;
  variant_id: string;
  qty_on_hand: number;
  qty_reserved: number;
};

type Txn = {
  id: string;
  txn_type: string;
  location_id: string;
  variant_id: string;
  quantity: number;
  note: string | null;
  created_at: string | null;
};

type Variant = { id: string; variant_sku: string; size: string | null; color: string | null; price: number };

type ProductBrief = {
  id: string;
  sku: string;
  name: string;
  variants: Variant[];
};

const MIN_STOCK = 10;

export function WarehousePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [products, setProducts] = useState<ProductBrief[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [formIn, setFormIn] = useState({ location_id: '', variant_id: '', quantity: '', note: '' });
  const [formOut, setFormOut] = useState({ location_id: '', variant_id: '', quantity: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [locs, prods] = await Promise.all([
        apiFetch<Location[]>('/inventory/locations', { auth: true }).catch(() => []),
        apiFetch<any[]>('/catalog/products?limit=500').catch(() => []),
      ]);
      setLocations(locs || []);
      setProducts((prods || []).map((p: any) => ({ id: p.id, sku: p.sku, name: p.name, variants: p.variants || [] })));

      const locParam = selectedLocation ? `?location_id=${encodeURIComponent(selectedLocation)}` : '';
      const [items, txns] = await Promise.all([
        apiFetch<StockItem[]>(`/inventory/stock-items${locParam}`, { auth: true }).catch(() => []),
        apiFetch<Txn[]>(`/inventory/stock-transactions${locParam}`, { auth: true }).catch(() => []),
      ]);
      setStockItems(items || []);
      setTransactions(txns || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-fetch stock items + txns when location changes
    setLoading(true);
    const locParam = selectedLocation ? `?location_id=${encodeURIComponent(selectedLocation)}` : '';
    Promise.all([
      apiFetch<StockItem[]>(`/inventory/stock-items${locParam}`, { auth: true }).catch(() => []),
      apiFetch<Txn[]>(`/inventory/stock-transactions${locParam}`, { auth: true }).catch(() => []),
    ])
      .then(([items, txns]) => {
        setStockItems(items || []);
        setTransactions(txns || []);
      })
      .finally(() => setLoading(false));
  }, [selectedLocation]);

  const variantById = useMemo(() => {
    const m = new Map<string, { product: ProductBrief; variant: Variant }>();
    for (const p of products) {
      for (const v of p.variants) {
        m.set(v.id, { product: p, variant: v });
      }
    }
    return m;
  }, [products]);

  const locationById = useMemo(() => {
    const m = new Map<string, Location>();
    for (const l of locations) m.set(l.id, l);
    return m;
  }, [locations]);

  const enrichedStock = useMemo(() => {
    return stockItems.map((it) => {
      const info = variantById.get(it.variant_id);
      const loc = locationById.get(it.location_id);
      return {
        ...it,
        sku: info?.variant.variant_sku || `var:${it.variant_id.slice(0, 6)}`,
        name: info ? `${info.product.name}${info.variant.size ? ` - ${info.variant.size}` : ''}${info.variant.color ? ` / ${info.variant.color}` : ''}` : 'Sản phẩm chưa map',
        category: info?.variant.color || '—',
        locationName: loc ? `${loc.code} · ${loc.name}` : 'Kho mặc định',
      };
    });
  }, [stockItems, variantById, locationById]);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enrichedStock;
    return enrichedStock.filter(
      (it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
    );
  }, [enrichedStock, searchQuery]);

  const lowStockItems = enrichedStock.filter((i) => i.qty_on_hand < MIN_STOCK);
  const totalItems = enrichedStock.reduce((s, i) => s + (i.qty_on_hand || 0), 0);

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Hết hàng', variant: 'destructive' as const };
    if (qty < MIN_STOCK) return { label: 'Tồn thấp', variant: 'outline' as const };
    return { label: 'Đủ hàng', variant: 'secondary' as const };
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Nhập kho';
      case 'out':
        return 'Xuất kho';
      case 'adjust':
        return 'Điều chỉnh';
      case 'reserve':
        return 'Đặt giữ';
      case 'release':
        return 'Trả lại';
      default:
        return type;
    }
  };

  const submitTxn = async (type: 'in' | 'out', state: typeof formIn) => {
    if (!state.location_id) {
      toast.error('Vui lòng chọn kho');
      return;
    }
    if (!state.variant_id) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }
    const q = Number(state.quantity);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/inventory/stock-transactions', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          txn_type: type,
          location_id: state.location_id,
          variant_id: state.variant_id,
          quantity: q,
          note: state.note || undefined,
        }),
      });
      toast.success(type === 'in' ? 'Đã nhập kho' : 'Đã xuất kho');
      if (type === 'in') setFormIn({ location_id: '', variant_id: '', quantity: '', note: '' });
      else setFormOut({ location_id: '', variant_id: '', quantity: '', note: '' });
      await loadAll();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProductOptions = () => {
    const opts: { id: string; label: string }[] = [];
    for (const p of products) {
      for (const v of p.variants) {
        opts.push({
          id: v.id,
          label: `${v.variant_sku} — ${p.name}${v.size ? ` (${v.size}${v.color ? ' / ' + v.color : ''})` : ''}`,
        });
      }
    }
    return opts;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="h-16 border-b-2 border-black flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="VELORA" className="h-10 w-auto" />
          <div className="h-8 w-px bg-border" />
          <h1 className="text-lg uppercase tracking-wider font-medium">Quản lý kho</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-black" onClick={loadAll}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
          {getSessionUserType() === 'admin' ? (
            <Button variant="outline" className="border-black" asChild>
              <Link to="/admin">
                <LogOut className="h-4 w-4 mr-2" />
                Về Admin
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-black"
              onClick={() => {
                clearAuthSession();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          )}
        </div>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="velora-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Tổng số lượng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>{totalItems}</p>
              <p className="text-xs text-muted-foreground mt-1">Sản phẩm trong kho</p>
            </CardContent>
          </Card>

          <Card className="velora-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Loại sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>{enrichedStock.length}</p>
              <p className="text-xs text-muted-foreground mt-1">SKU đang quản lý</p>
            </CardContent>
          </Card>

          <Card className="velora-card border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Cảnh báo tồn kho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl velora-heading text-red-600" style={{ fontFamily: 'var(--font-heading)' }}>{lowStockItems.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Sản phẩm cần nhập thêm</p>
            </CardContent>
          </Card>

          <Card className="velora-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Số kho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>{locations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Vị trí kho</p>
            </CardContent>
          </Card>
        </div>

        {/* Location filter */}
        <div className="mb-6 flex items-center gap-4">
          <Label className="text-sm">Kho:</Label>
          <Select value={selectedLocation || 'all'} onValueChange={(v) => setSelectedLocation(v === 'all' ? '' : v)}>
            <SelectTrigger className="border-black w-[280px]">
              <SelectValue placeholder="Tất cả kho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kho</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.code} · {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!locations.length && (
            <span className="text-xs text-muted-foreground">Chưa có kho nào — admin cần tạo qua API <code>POST /inventory/locations</code>.</span>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
            <TabsTrigger value="stock-in">Nhập kho</TabsTrigger>
            <TabsTrigger value="stock-out">Xuất kho</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm theo tên hoặc SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-black"
                />
              </div>
            </div>

            <Card className="velora-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead className="text-right">Tồn kho</TableHead>
                      <TableHead className="text-right">Đặt giữ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && filteredInventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Chưa có dữ liệu tồn kho. Hãy nhập kho lần đầu ở tab "Nhập kho".
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading &&
                      filteredInventory.map((item) => {
                        const status = getStockStatus(item.qty_on_hand);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.locationName}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{item.qty_on_hand}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.qty_reserved}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-in">
            <Card className="velora-card">
              <CardHeader>
                <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                  Nhập kho mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4 max-w-2xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitTxn('in', formIn);
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kho nhập *</Label>
                      <Select value={formIn.location_id} onValueChange={(v) => setFormIn((s) => ({ ...s, location_id: v }))}>
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.code} · {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sản phẩm (variant) *</Label>
                      <Select value={formIn.variant_id} onValueChange={(v) => setFormIn((s) => ({ ...s, variant_id: v }))}>
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Chọn variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {renderProductOptions().map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Số lượng *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formIn.quantity}
                        onChange={(e) => setFormIn((s) => ({ ...s, quantity: e.target.value }))}
                        className="border-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ghi chú</Label>
                      <Input
                        placeholder="VD: Nhập từ nhà máy"
                        value={formIn.note}
                        onChange={(e) => setFormIn((s) => ({ ...s, note: e.target.value }))}
                        className="border-black"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    {submitting ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-out">
            <Card className="velora-card">
              <CardHeader>
                <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                  Xuất kho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4 max-w-2xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitTxn('out', formOut);
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kho xuất *</Label>
                      <Select value={formOut.location_id} onValueChange={(v) => setFormOut((s) => ({ ...s, location_id: v }))}>
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.code} · {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sản phẩm (variant) *</Label>
                      <Select value={formOut.variant_id} onValueChange={(v) => setFormOut((s) => ({ ...s, variant_id: v }))}>
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Chọn variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {renderProductOptions().map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Số lượng *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formOut.quantity}
                        onChange={(e) => setFormOut((s) => ({ ...s, quantity: e.target.value }))}
                        className="border-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ghi chú</Label>
                      <Input
                        placeholder="VD: Xuất cho đơn hàng VL12345"
                        value={formOut.note}
                        onChange={(e) => setFormOut((s) => ({ ...s, note: e.target.value }))}
                        className="border-black"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="bg-black text-white hover:bg-gray-800">
                    <Minus className="h-4 w-4 mr-2" />
                    {submitting ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="velora-card">
              <CardHeader>
                <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                  Lịch sử giao dịch
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead>Ngày giờ</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Kho</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Chưa có giao dịch nào.
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading &&
                      transactions.map((t) => {
                        const info = variantById.get(t.variant_id);
                        const loc = locationById.get(t.location_id);
                        return (
                          <TableRow key={t.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(t.txn_type)}
                                <span className="text-sm">{getTransactionLabel(t.txn_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {t.created_at ? new Date(t.created_at).toLocaleString('vi-VN') : '—'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {info ? `${info.product.name} (${info.variant.size || ''}${info.variant.color ? '/' + info.variant.color : ''})` : t.variant_id.slice(0, 8) + '…'}
                            </TableCell>
                            <TableCell>{loc ? `${loc.code}` : '—'}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {t.txn_type === 'out' ? '-' : t.txn_type === 'in' ? '+' : ''}
                              {t.quantity}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{t.note || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
