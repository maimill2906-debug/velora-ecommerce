import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Minus, Plus, Trash2, LogOut, ShoppingCart, Loader2, User, Tag, X, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { apiFetch, clearAuthSession, getSessionUserType } from '@/lib/apiClient';
import { toast } from 'sonner';
import { VeloraLogo } from '../components/VeloraLogo';

type Location = { id: string; code: string; name: string };
type VariantRow = {
  product_id: string;
  product_name: string;
  product_sku: string;
  image_url: string | null;
  variant_id: string;
  variant_sku: string;
  size: string | null;
  color: string | null;
  price: number;
};

type CartItem = {
  variant_id: string;
  product_id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
};

type VoucherInfo = {
  code: string;
  name: string;
  discount_amount: number | null;
  discount_percent: number | null;
  calculated_discount: number;
};

const POS_LOCATION_KEY = 'velora_pos_location_id';

export function POSPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>(() => localStorage.getItem(POS_LOCATION_KEY) || '');
  const [showStoreConfig, setShowStoreConfig] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [stockByVariantId, setStockByVariantId] = useState<Map<string, number>>(new Map());

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Location[]>('/inventory/locations', { auth: true }),
      apiFetch<any[]>('/catalog/products?limit=500'),
    ])
      .then(([locs, products]) => {
        const ls = locs || [];
        setLocations(ls);

        // Kho máy POS: ưu tiên giá trị đã lưu → pos_store* đầu tiên → first location
        const saved = localStorage.getItem(POS_LOCATION_KEY);
        const savedValid = saved && ls.some((l) => l.id === saved);
        if (!savedValid) {
          const posLoc = ls.find((l) => l.code.startsWith('pos_store')) || ls[0];
          if (posLoc) {
            localStorage.setItem(POS_LOCATION_KEY, posLoc.id);
            setLocationId(posLoc.id);
          }
        }

        const rows: VariantRow[] = [];
        for (const p of products || []) {
          const img = (p.images && p.images[0] && p.images[0].url) || null;
          for (const v of (p.variants || [])) {
            rows.push({
              product_id: String(p.id),
              product_name: String(p.name || ''),
              product_sku: String(p.sku || ''),
              image_url: img,
              variant_id: String(v.id),
              variant_sku: String(v.variant_sku || ''),
              size: v.size ?? null,
              color: v.color ?? null,
              price: Number(v.price || 0),
            });
          }
        }
        setVariants(rows);
      })
      .catch((e: any) => {
        const msg = e?.message || 'Không tải được dữ liệu POS';
        toast.error(msg);
        if (msg === 'missing_token' || msg === 'invalid_token') {
          navigate('/login?next=/pos');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!locationId) return;
    apiFetch<any[]>(`/inventory/stock-items?limit=2000&location_id=${encodeURIComponent(locationId)}`, { auth: true })
      .then((rows) => {
        const m = new Map<string, number>();
        for (const r of rows || []) {
          if (r.variant_id) m.set(String(r.variant_id), Number(r.qty_on_hand || 0));
        }
        setStockByVariantId(m);
      })
      .catch(() => setStockByVariantId(new Map()));
  }, [locationId]);

  const addToCart = (row: VariantRow) => {
    const stock = stockByVariantId.get(row.variant_id) ?? 0;
    const existingItem = cart.find(item => item.variant_id === row.variant_id);

    if (existingItem) {
      if (existingItem.quantity < stock) {
        setCart(cart.map(item =>
          item.variant_id === row.variant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error('Không đủ tồn kho');
      }
      return;
    }
    if (stock <= 0) {
      toast.error('Hết hàng');
      return;
    }
    setCart([...cart, {
      variant_id: row.variant_id,
      product_id: row.product_id,
      name: row.product_name,
      price: row.price,
      quantity: 1,
      sku: row.variant_sku,
      size: row.size,
      color: row.color,
    }]);
  };

  const updateQuantity = (variantId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.variant_id === variantId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (variantId: string) => {
    setCart(cart.filter(item => item.variant_id !== variantId));
  };

  // Đóng store-config popover khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setShowStoreConfig(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeStoreLocation = (id: string) => {
    localStorage.setItem(POS_LOCATION_KEY, id);
    setLocationId(id);
    setShowStoreConfig(false);
  };

  const currentLocation = locations.find((l) => l.id === locationId);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = voucherInfo?.calculated_discount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    if (subtotal === 0) { toast.error('Chưa có sản phẩm trong giỏ'); return; }
    setVoucherLoading(true);
    try {
      const res = await apiFetch<VoucherInfo>(
        `/marketing/vouchers/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`,
        { auth: true }
      );
      setVoucherInfo(res);
      toast.success(`Áp dụng "${res.name}" — giảm ${res.calculated_discount.toLocaleString('vi-VN')}₫`);
    } catch (e: any) {
      const msg = e?.message;
      toast.error(msg === 'voucher_not_found' ? 'Mã giảm giá không hợp lệ' : (msg || 'Lỗi kiểm tra mã'));
      setVoucherInfo(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucherInfo(null);
    setVoucherCode('');
  };

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const code = `POS${Date.now().toString().slice(-10)}`;
      const hasCustomer = customerName.trim() || customerPhone.trim();
      const payload: Record<string, unknown> = {
        code,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        shipping_fee: 0,
        total_amount: total,
        location_id: locationId || undefined,
        items: cart.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.price,
        })),
        payment: { method: paymentMethod },
      };
      if (hasCustomer) {
        payload.shipping_address = {
          full_name: customerName.trim() || 'Khách lẻ',
          phone: customerPhone.trim() || '',
          line1: 'Tại cửa hàng',
        };
      }
      const res = await apiFetch<{ id: string; code: string; status: string }>('/orders', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      });
      toast.success(`Thanh toán thành công. Mã đơn: ${res.code}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setVoucherInfo(null);
      setVoucherCode('');
    } catch (e: any) {
      toast.error(e?.message || 'Thanh toán thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) =>
      v.product_name.toLowerCase().includes(q) ||
      v.product_sku.toLowerCase().includes(q) ||
      v.variant_sku.toLowerCase().includes(q) ||
      String(v.color || '').toLowerCase().includes(q) ||
      String(v.size || '').toLowerCase().includes(q)
    );
  }, [variants, searchQuery]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-16 border-b-2 border-black flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <VeloraLogo size="small" showSubtitle={false} showUnderline={false} />
          <Separator orientation="vertical" className="h-8 bg-border" />
          <h1 className="text-lg uppercase tracking-wider font-medium">Point of Sale</h1>
          {/* Store badge + config */}
          <div ref={configRef} className="relative flex items-center gap-1">
            <span className="text-xs font-medium px-2 py-1 border border-black rounded bg-secondary uppercase tracking-wide">
              {currentLocation ? currentLocation.name : '—'}
            </span>
            <button
              onClick={() => setShowStoreConfig((v) => !v)}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Cấu hình kho máy này"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            {showStoreConfig && (
              <div className="absolute top-8 left-0 z-50 bg-white border-2 border-black shadow-lg min-w-[220px]">
                <div className="px-3 py-2 border-b border-border text-xs font-semibold uppercase text-muted-foreground">
                  Chọn kho cho máy này
                </div>
                {locations
                  .filter((l) => l.code.startsWith('pos_store'))
                  .map((l) => (
                    <button
                      key={l.id}
                      onClick={() => changeStoreLocation(l.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center justify-between ${l.id === locationId ? 'font-semibold' : ''}`}
                    >
                      <span>{l.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{l.code}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-black text-base"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center text-muted-foreground py-12">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Đang tải dữ liệu...
                </div>
              ) : (
                filteredVariants.map((v) => {
                  const stock = stockByVariantId.get(v.variant_id) ?? 0;
                  return (
                    <button
                      key={v.variant_id}
                      onClick={() => addToCart(v)}
                      className="velora-card text-left p-4 hover:bg-secondary transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium pr-2 line-clamp-2">{v.product_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {stock}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{v.size || '—'} / {v.color || '—'}</p>
                      <p className="text-sm text-muted-foreground mb-2">SKU: {v.variant_sku}</p>
                      <p className="text-lg font-semibold">{Number(v.price || 0).toLocaleString('vi-VN')}₫</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 border-l-2 border-black flex flex-col bg-secondary">
          {/* Cart Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg uppercase tracking-wider font-medium">
                Giỏ hàng ({cart.length})
              </h2>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Giỏ hàng trống</p>
                <p className="text-sm mt-2">Chọn sản phẩm để thêm vào</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variant_id} className="velora-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.size || '—'} / {item.color || '—'} · {item.sku}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.variant_id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.variant_id, -1)}
                        className="h-8 w-8 border-black"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.variant_id, 1)}
                        className="h-8 w-8 border-black"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Info + Voucher */}
          <div className="border-t border-border px-6 py-4 space-y-3 bg-secondary">
            {/* Customer */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              Thông tin khách (tuỳ chọn)
            </div>
            <Input
              placeholder="Tên khách hàng"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 border-black text-sm"
            />
            <Input
              placeholder="Số điện thoại"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-9 border-black text-sm"
            />

            {/* Voucher */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-2 mb-1">
              <Tag className="h-4 w-4" />
              Mã giảm giá
            </div>
            {voucherInfo ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{voucherInfo.code}</span>
                  <span className="text-xs text-muted-foreground">— {voucherInfo.name}</span>
                </div>
                <button onClick={removeVoucher} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyVoucher()}
                  className="h-9 border-black text-sm uppercase"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-black px-4 shrink-0"
                  onClick={applyVoucher}
                  disabled={!voucherCode.trim() || voucherLoading}
                >
                  {voucherLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Áp dụng'}
                </Button>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t-2 border-black p-6 bg-white">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({voucherInfo?.code})</span>
                  <span className="font-medium">−{discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-medium">Tổng cộng</span>
                <span className="text-2xl font-semibold velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <Tabs defaultValue="cash" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="cash">Tiền mặt</TabsTrigger>
                <TabsTrigger value="card">Thẻ</TabsTrigger>
                <TabsTrigger value="wallet">Ví</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cash">
                <Button 
                  onClick={() => handleCheckout('cod')}
                  className="w-full h-14 bg-black text-white hover:bg-gray-800 text-base"
                  disabled={cart.length === 0 || submitting}
                >
                  Thanh toán tiền mặt
                </Button>
              </TabsContent>

              <TabsContent value="card">
                <Button 
                  onClick={() => handleCheckout('card')}
                  className="w-full h-14 bg-black text-white hover:bg-gray-800 text-base"
                  disabled={cart.length === 0 || submitting}
                >
                  Thanh toán thẻ
                </Button>
              </TabsContent>

              <TabsContent value="wallet">
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleCheckout('momo')}
                    variant="outline"
                    className="w-full h-12 border-black hover:bg-black hover:text-white"
                    disabled={cart.length === 0 || submitting}
                  >
                    MoMo
                  </Button>
                  <Button 
                    onClick={() => handleCheckout('zalopay')}
                    variant="outline"
                    className="w-full h-12 border-black hover:bg-black hover:text-white"
                    disabled={cart.length === 0 || submitting}
                  >
                    ZaloPay
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              className="w-full mt-4 border-gray-300"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Hủy đơn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
