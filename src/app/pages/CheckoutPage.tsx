import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { CheckCircle, ChevronRight, Truck, CreditCard, Wallet } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { apiFetch } from '@/lib/apiClient';

type Step = 'shipping' | 'payment' | 'confirm';
type PaymentMethod = 'cod' | 'momo' | 'zalopay' | 'bank' | 'card';

const provinces = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

const districtsByProvince: Record<string, string[]> = {
  'Hà Nội': ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên', 'Quận Cầu Giấy', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân', 'Huyện Đông Anh'],
  'TP. Hồ Chí Minh': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú'],
  'Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang'],
};

const wardsByDistrict: Record<string, string[]> = {
  'Quận Ba Đình': ['Phường Phúc Xá', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc', 'Phường Cống Vị', 'Phường Liễu Giai', 'Phường Nguyễn Trung Trực', 'Phường Quán Thánh', 'Phường Ngọc Hà', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Ngọc Khánh', 'Phường Kim Mã', 'Phường Giảng Võ', 'Phường Thành Công'],
  'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định'],
  'Quận Hải Châu': ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Phước Ninh', 'Phường Hòa Thuận Tây', 'Phường Hòa Thuận Đông', 'Phường Nam Dương', 'Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
};

export function CheckoutPage() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderCode] = useState(`VL${Date.now().toString().slice(-7)}`);
  const [backendOrderId, setBackendOrderId] = useState<string | null>(null);

  /** Chỉ các field map tới `addresses` (full_name, phone, line1, ward, district, province, country; line2 = ghi chú). Email thuộc `customer_profiles`, không nằm trong địa chỉ. */
  const initialShipping = useMemo(() => {
    try {
      const raw = localStorage.getItem('velora_checkout_shipping_v1');
      if (!raw) {
        return {
          fullName: '',
          phone: '',
          province: '',
          district: '',
          ward: '',
          address: '',
          note: '',
        };
      }
      const parsed = JSON.parse(raw) || {};
      return {
        fullName: String(parsed.fullName || ''),
        phone: String(parsed.phone || ''),
        province: String(parsed.province || ''),
        district: String(parsed.district || ''),
        ward: String(parsed.ward || ''),
        address: String(parsed.address || ''),
        note: String(parsed.note || ''),
      };
    } catch {
      return {
        fullName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        address: '',
        note: '',
      };
    }
  }, []);

  const [shipping, setShipping] = useState(initialShipping);
  /** Email tài khoản (customer_profiles) — chỉ hiển thị, cập nhật tại Hồ sơ */
  const [accountEmail, setAccountEmail] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('velora_checkout_shipping_v1', JSON.stringify(shipping));
    } catch {
      // ignore storage errors
    }
  }, [shipping]);

  useEffect(() => {
    apiFetch<any>('/customers/me', { auth: true })
      .then((p) => {
        setAccountEmail(typeof p.email === 'string' ? p.email : '');
        setShipping((prev) => ({
          ...prev,
          fullName: prev.fullName || p.full_name || '',
          phone: prev.phone || p.phone || '',
        }));
      })
      .catch(() => {});
  }, []);

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-white">
        <VeloraNav />
        <div className="velora-container py-32 text-center">
          <p className="text-muted-foreground mb-8">Giỏ hàng của bạn đang trống</p>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link to="/shop">Tiếp tục mua sắm</Link>
          </Button>
        </div>
        <VeloraFooterNew />
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const availableDistricts = shipping.province
    ? districtsByProvince[shipping.province] || ['Quận/Huyện 1', 'Quận/Huyện 2', 'Quận/Huyện 3']
    : [];

  const availableWards = shipping.district
    ? wardsByDistrict[shipping.district] || ['Phường/Xã 1', 'Phường/Xã 2', 'Phường/Xã 3']
    : [];

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    if (submitting) return;
    if (!cart.length) return;

    setSubmitting(true);
    try {
      const payload = {
        code: orderCode,
        subtotal_amount: subtotal,
        discount_amount: 0,
        shipping_fee: shippingFee,
        total_amount: total,
        shipping_address: {
          full_name: shipping.fullName,
          phone: shipping.phone,
          line1: shipping.address,
          line2: shipping.note.trim() || undefined,
          ward: shipping.ward,
          district: shipping.district,
          province: shipping.province,
          country: 'VN',
        },
        items: cart.map((it) => ({
          product_id: it.productId,
          variant_id: it.variantId,
          quantity: it.quantity,
          unit_price: it.price,
        })),
        payment: { method: paymentMethod },
      };

      const res = await apiFetch<{ id: string; code: string; status: string }>(
        '/orders',
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        }
      );

      setBackendOrderId(res.id);
      try {
        localStorage.setItem('velora_last_order_code', res.code || orderCode);
        localStorage.removeItem('velora_checkout_shipping_v1');
      } catch {
        // ignore storage errors
      }
      setOrderPlaced(true);
      clearCart();
      setStep('confirm');
      window.scrollTo(0, 0);
      toast.success('Đặt hàng thành công!');
    } catch (e: any) {
      const msg = e?.message || 'Đặt hàng thất bại';
      if (msg === 'missing_token' || msg === 'invalid_token') {
        toast.error('Vui lòng đăng nhập để đặt hàng');
        navigate(`/login?next=${encodeURIComponent('/checkout')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      id: 'cod' as PaymentMethod,
      label: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán tiền mặt khi nhận được hàng',
      icon: <Truck className="h-5 w-5" />,
      badge: 'Phổ biến',
    },
    {
      id: 'momo' as PaymentMethod,
      label: 'Ví MoMo',
      description: 'Thanh toán qua ví điện tử MoMo',
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      id: 'zalopay' as PaymentMethod,
      label: 'ZaloPay',
      description: 'Thanh toán qua ví điện tử ZaloPay',
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      id: 'bank' as PaymentMethod,
      label: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua Internet Banking',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: 'card' as PaymentMethod,
      label: 'Thẻ tín dụng / Ghi nợ',
      description: 'Visa, MasterCard, JCB',
      icon: <CreditCard className="h-5 w-5" />,
    },
  ];

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[
        { key: 'shipping', label: 'Địa chỉ giao hàng', num: 1 },
        { key: 'payment', label: 'Thanh toán', num: 2 },
        { key: 'confirm', label: 'Xác nhận', num: 3 },
      ].map((s, idx) => (
        <div key={s.key} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 flex items-center justify-center border-2 transition-all ${
                step === s.key
                  ? 'bg-black text-white border-black'
                  : (step === 'payment' && s.key === 'shipping') ||
                    (step === 'confirm' && (s.key === 'shipping' || s.key === 'payment'))
                  ? 'bg-black text-white border-black'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {((step === 'payment' && s.key === 'shipping') ||
                (step === 'confirm' && (s.key === 'shipping' || s.key === 'payment'))) ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{s.num}</span>
              )}
            </div>
            <span className={`text-sm hidden sm:block uppercase tracking-wider ${step === s.key ? '' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
          </div>
          {idx < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );

  const OrderSummary = () => (
    <div className="border border-black p-6 sticky top-24">
      <h3
        className="mb-6 pb-4 border-b border-border velora-heading"
        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}
      >
        Đơn hàng của bạn
      </h3>

      <div className="space-y-4 mb-6">
        {cart.map((item) => (
          <div key={item.key} className="flex gap-3">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 overflow-hidden">
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
              {item.color && <p className="text-xs text-muted-foreground">Màu: {item.color}</p>}
              <p className="text-sm mt-1">
                {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold flex-shrink-0">
              {(item.price * item.quantity).toLocaleString('vi-VN')}₫
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính</span>
          <span>{subtotal.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Phí vận chuyển</span>
          <span className={shippingFee === 0 ? 'text-green-600' : ''}>
            {shippingFee === 0 ? 'Miễn phí' : shippingFee.toLocaleString('vi-VN') + '₫'}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between items-center">
        <span className="font-medium">Tổng cộng</span>
        <span
          className="velora-heading"
          style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
        >
          {total.toLocaleString('vi-VN')}₫
        </span>
      </div>

      {shippingFee === 0 && (
        <p className="text-xs text-green-600 mt-2 text-right">
          ✓ Miễn phí vận chuyển cho đơn từ 500.000₫
        </p>
      )}
    </div>
  );

  // Order Confirmed View
  if (step === 'confirm' && orderPlaced) {
    return (
      <div className="min-h-screen bg-white">
        <VeloraNav />
        <div className="velora-container py-20 max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1
              className="mb-4 velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
            >
              Đặt hàng thành công!
            </h1>
            <p className="text-muted-foreground mb-2">
              Cảm ơn bạn đã mua sắm tại VELORA FASHION
            </p>
            <p className="text-muted-foreground">
              Mã đơn hàng của bạn:{' '}
              <strong className="text-black font-mono">{orderCode}</strong>
            </p>
            {backendOrderId && (
              <p className="text-xs text-muted-foreground mt-2">
                Order ID: <span className="font-mono">{backendOrderId}</span>
              </p>
            )}
          </div>

          <Card className="velora-card mb-8 text-left">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Địa chỉ giao hàng</p>
                <p className="font-medium">{shipping.fullName} - {shipping.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {shipping.address}, {shipping.ward}, {shipping.district}, {shipping.province}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Phương thức thanh toán</p>
                <p className="font-medium">
                  {paymentMethods.find(p => p.id === paymentMethod)?.label}
                </p>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Tổng tiền</p>
                <p
                  className="velora-heading"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
                >
                  {total.toLocaleString('vi-VN')}₫
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-secondary p-6 mb-8 text-sm text-muted-foreground">
            <p className="mb-2">
              📧 Thông báo đơn hàng sẽ gửi tới email trong tài khoản
              {accountEmail ? (
                <>
                  : <strong>{accountEmail}</strong>
                </>
              ) : (
                <> (cập nhật email tại Hồ sơ)</>
              )}
            </p>
            <p>📦 Dự kiến giao hàng trong <strong>2-4 ngày làm việc</strong></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              className="border-black hover:bg-black hover:text-white"
            >
              <Link to={`/order-tracking?code=${encodeURIComponent(orderCode)}`}>Theo dõi đơn hàng</Link>
            </Button>
            <Button asChild className="bg-black text-white hover:bg-gray-800">
              <Link to="/shop">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
        <VeloraFooterNew />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      <div className="velora-container py-12">
        <h1
          className="text-center mb-4 velora-heading"
          style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
        >
          Thanh Toán
        </h1>

        <StepIndicator />

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Forms */}
          <div className="lg:col-span-2">
            {/* STEP 1: Shipping */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div>
                  <h2
                    className="mb-6 pb-4 border-b border-border velora-heading"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
                  >
                    Thông tin giao hàng
                  </h2>

                  <div className="rounded-md border border-border bg-secondary/50 p-4 text-sm mb-2">
                    <p className="font-medium text-foreground mb-1">Email liên hệ (hồ sơ khách hàng)</p>
                    <p className="text-muted-foreground">
                      {accountEmail || 'Chưa có email trên hồ sơ — '}
                      <Link to="/profile" className="text-foreground underline underline-offset-2">
                        Cập nhật tại Hồ sơ
                      </Link>
                      {accountEmail ? (
                        <span className="block mt-2 font-mono text-foreground">{accountEmail}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Địa chỉ giao hàng không lưu email — theo schema API chỉ có họ tên, SĐT và địa chỉ.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input
                          id="fullName"
                          placeholder="Nguyễn Văn A"
                          value={shipping.fullName}
                          onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                          required
                          className="border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0912345678"
                          value={shipping.phone}
                          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                          required
                          pattern="[0-9]{10}"
                          className="border-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tỉnh / Thành phố *</Label>
                      <Select
                        value={shipping.province}
                        onValueChange={(val) => setShipping({ ...shipping, province: val, district: '', ward: '' })}
                        required
                      >
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Chọn tỉnh / thành phố" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {provinces.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quận / Huyện *</Label>
                        <Select
                          value={shipping.district}
                          onValueChange={(val) => setShipping({ ...shipping, district: val, ward: '' })}
                          disabled={!shipping.province}
                        >
                          <SelectTrigger className="border-black">
                            <SelectValue placeholder="Chọn quận / huyện" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDistricts.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Phường / Xã *</Label>
                        <Select
                          value={shipping.ward}
                          onValueChange={(val) => setShipping({ ...shipping, ward: val })}
                          disabled={!shipping.district}
                        >
                          <SelectTrigger className="border-black">
                            <SelectValue placeholder="Chọn phường / xã" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableWards.map((w) => (
                              <SelectItem key={w} value={w}>{w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ cụ thể *</Label>
                      <Input
                        id="address"
                        placeholder="Số nhà, tên đường..."
                        value={shipping.address}
                        onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                        required
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">Ghi chú giao hàng (tùy chọn)</Label>
                      <Input
                        id="note"
                        placeholder="Ví dụ: gọi trước khi giao — lưu vào địa chỉ (dòng phụ)"
                        value={shipping.note}
                        onChange={(e) => setShipping({ ...shipping, note: e.target.value })}
                        className="border-black"
                      />
                      <p className="text-xs text-muted-foreground">
                        Được lưu cùng địa chỉ giao hàng (dòng phụ).
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 h-14"
                >
                  Tiếp tục → Chọn thanh toán
                </Button>
              </form>
            )}

            {/* STEP 2: Payment */}
            {step === 'payment' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <h2
                      className="velora-heading"
                      style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
                    >
                      Phương thức thanh toán
                    </h2>
                    <button
                      onClick={() => setStep('shipping')}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      ← Sửa địa chỉ
                    </button>
                  </div>

                  {/* Shipping Summary */}
                  <div className="bg-secondary p-4 mb-6 text-sm">
                    <p className="font-medium">{shipping.fullName} - {shipping.phone}</p>
                    <p className="text-muted-foreground">
                      {shipping.address}{shipping.ward ? `, ${shipping.ward}` : ''}{shipping.district ? `, ${shipping.district}` : ''}{shipping.province ? `, ${shipping.province}` : ''}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'border-black bg-black/5'
                            : 'border-border hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === method.id ? 'border-black' : 'border-border'
                          }`}
                        >
                          {paymentMethod === method.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-black" />
                          )}
                        </div>
                        <div className="text-muted-foreground flex-shrink-0">
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{method.label}</p>
                            {method.badge && (
                              <Badge className="bg-black text-white text-xs py-0">
                                {method.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Card details for card payment */}
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 bg-secondary space-y-4">
                      <div className="space-y-2">
                        <Label>Số thẻ</Label>
                        <Input placeholder="1234 5678 9012 3456" className="border-black bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ngày hết hạn</Label>
                          <Input placeholder="MM/YY" className="border-black bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" className="border-black bg-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tên chủ thẻ</Label>
                        <Input placeholder="NGUYEN VAN A" className="border-black bg-white" />
                      </div>
                    </div>
                  )}

                  {/* Bank transfer info */}
                  {paymentMethod === 'bank' && (
                    <div className="mt-4 p-4 bg-secondary text-sm space-y-2">
                      <p className="font-medium">Thông tin chuyển khoản:</p>
                      <p>Ngân hàng: <strong>Vietcombank</strong></p>
                      <p>Số tài khoản: <strong>1234567890</strong></p>
                      <p>Tên tài khoản: <strong>VELORA FASHION CO., LTD</strong></p>
                      <p className="text-muted-foreground">Nội dung chuyển khoản: <strong>VL + số điện thoại</strong></p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  className="w-full bg-black text-white hover:bg-gray-800 h-14"
                  disabled={submitting}
                >
                  {submitting ? 'Đang đặt hàng...' : `Đặt hàng - ${total.toLocaleString('vi-VN')}₫`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Bằng cách đặt hàng, bạn đồng ý với{' '}
                  <Link to="/terms" className="underline">Điều khoản sử dụng</Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="underline">Chính sách bảo mật</Link>{' '}
                  của VELORA FASHION.
                </p>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div>
            <OrderSummary />
          </div>
        </div>
      </div>

      <VeloraFooterNew />
    </div>
  );
}
