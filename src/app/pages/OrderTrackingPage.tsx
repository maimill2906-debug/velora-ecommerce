import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { apiFetch } from '@/lib/apiClient';
import { toast } from 'sonner';

type ProductBrief = {
  id: string;
  name: string;
  image?: string;
};

const productBriefCache = new Map<string, ProductBrief>();

async function getProductBrief(productId: string): Promise<ProductBrief> {
  const cached = productBriefCache.get(productId);
  if (cached) return cached;

  const p = await apiFetch<any>(`/catalog/products/${encodeURIComponent(productId)}`);
  const brief: ProductBrief = {
    id: p.id,
    name: p.name || productId,
    image: (p.images && p.images[0] && p.images[0].url) || undefined,
  };
  productBriefCache.set(productId, brief);
  return brief;
}

interface OrderStatus {
  status: string;
  date: string;
  time: string;
  description: string;
  completed: boolean;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
  timeline: OrderStatus[];
}

export function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Nháp',
      placed: 'Đã đặt',
      confirmed: 'Đã xác nhận',
      packed: 'Đã đóng gói',
      shipped: 'Đang giao hàng',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      returned: 'Hoàn trả',
    };
    return map[status] || status;
  };

  const statusRank = (status: string) => {
    const ranks: Record<string, number> = {
      placed: 1,
      confirmed: 2,
      packed: 3,
      shipped: 4,
      delivered: 5,
      cancelled: 99,
      returned: 99,
    };
    return ranks[status] ?? 0;
  };

  const buildTimeline = (status: string, placedAtIso?: string | null): OrderStatus[] => {
    const placedAt = placedAtIso ? new Date(placedAtIso) : null;
    const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN');
    const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const baseSteps: Array<{ status: string; description: string }> = [
      { status: 'placed', description: 'Đơn hàng đã được đặt' },
      { status: 'confirmed', description: 'Đơn hàng đã được xác nhận' },
      { status: 'packed', description: 'Đơn hàng đã được đóng gói' },
      { status: 'shipped', description: 'Đơn hàng đang được vận chuyển' },
      { status: 'delivered', description: 'Giao hàng thành công' },
    ];

    const currentRank = statusRank(status);
    if (status === 'cancelled') {
      return [
        {
          status: 'cancelled',
          date: placedAt ? fmtDate(placedAt) : '',
          time: placedAt ? fmtTime(placedAt) : '',
          description: 'Đơn hàng đã bị hủy',
          completed: true,
        },
      ];
    }
    if (status === 'returned') {
      return [
        ...baseSteps.map((s) => ({
          status: s.status,
          date: s.status === 'placed' && placedAt ? fmtDate(placedAt) : '',
          time: s.status === 'placed' && placedAt ? fmtTime(placedAt) : '',
          description: s.description,
          completed: statusRank(s.status) <= Math.min(currentRank, statusRank('delivered')),
        })),
        {
          status: 'returned',
          date: '',
          time: '',
          description: 'Đơn hàng đã được hoàn trả',
          completed: true,
        },
      ];
    }

    return baseSteps.map((s) => ({
      status: s.status,
      date: s.status === 'placed' && placedAt ? fmtDate(placedAt) : '',
      time: s.status === 'placed' && placedAt ? fmtTime(placedAt) : '',
      description: s.description,
      completed: statusRank(s.status) <= currentRank,
    }));
  };

  const searchByCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    try {
      const data = await apiFetch<any>(`/orders/track/${encodeURIComponent(code)}`, { auth: true });
      const rawItems = (data.items || []) as Array<any>;

      const briefs = await Promise.all(
        rawItems.map(async (it) => {
          const pid = it.product_id as string | null | undefined;
          if (!pid) return null;
          try {
            return await getProductBrief(pid);
          } catch {
            return null;
          }
        })
      );

      const order: Order = {
        id: data.code,
        date: data.placed_at || new Date().toISOString(),
        total: data.total_amount || 0,
        status: data.status || 'placed',
        items: rawItems.map((it: any, idx: number) => {
          const brief = briefs[idx];
          return {
            name: (brief && brief.name) || it.product_id || 'Sản phẩm',
            quantity: it.quantity || 1,
            price: it.unit_price || 0,
            image:
              (brief && brief.image) ||
              'https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=200&q=80',
          };
        }),
        shipping: {
          name: data.shipping_address?.full_name || '-',
          phone: data.shipping_address?.phone || '-',
          address: [
            data.shipping_address?.line1,
            data.shipping_address?.ward,
            data.shipping_address?.district,
            data.shipping_address?.province,
          ]
            .filter(Boolean)
            .join(', ') || '-',
        },
        timeline: buildTimeline(data.status || 'placed', data.placed_at),
      };
      setSearchedOrder(order);

      try {
        localStorage.setItem('velora_last_order_code', data.code || code);
      } catch {
        // ignore storage errors
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg === 'missing_token' || msg === 'invalid_token') {
        toast.error('Vui lòng đăng nhập để tra cứu đơn hàng');
        navigate(`/login?next=${encodeURIComponent(`/order-tracking?code=${code}`)}`);
      } else if (msg === 'forbidden') {
        toast.error('Bạn không có quyền xem đơn hàng này');
      } else {
        toast.error('Không tìm thấy đơn hàng');
      }
      setSearchedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void searchByCode(orderId);
  };

  useEffect(() => {
    const fromQuery = searchParams.get('code');
    if (fromQuery) {
      setOrderId(fromQuery);
      void searchByCode(fromQuery);
      return;
    }
    try {
      const last = localStorage.getItem('velora_last_order_code');
      if (last) setOrderId(last);
    } catch {
      // ignore storage errors
    }
  }, [searchParams]);

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) {
      return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
    
    switch (status) {
      case 'placed':
        return <CheckCircle className="h-8 w-8 text-black" />;
      case 'confirmed':
        return <CheckCircle className="h-8 w-8 text-black" />;
      case 'packed':
        return <Package className="h-8 w-8 text-black" />;
      case 'shipped':
        return <Truck className="h-8 w-8 text-black" />;
      case 'delivered':
        return <CheckCircle className="h-8 w-8 text-black" />;
      case 'cancelled':
      case 'returned':
        return <Clock className="h-8 w-8 text-black" />;
      default:
        return <Clock className="h-8 w-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      <div className="velora-container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 
              className="mb-4 velora-heading" 
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
            >
              Theo dõi đơn hàng
            </h1>
            <p className="text-muted-foreground">
              Nhập mã đơn hàng để kiểm tra trạng thái
            </p>
          </div>

          {/* Search Form */}
          <Card className="velora-card mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Nhập mã đơn hàng (VD: VL1234567)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="pl-10 h-12 border-black uppercase"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800 h-12 px-8"
                  disabled={loading}
                >
                  {loading ? 'Đang tra cứu...' : 'Tra cứu'}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-4">
                Yêu cầu đăng nhập. Mã đơn được gửi sau khi đặt hàng (ví dụ: VL1234567).
              </p>
            </CardContent>
          </Card>

          {/* Order Details */}
          {searchedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <Card className="velora-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="velora-heading mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        Đơn hàng #{searchedOrder.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Đặt ngày: {new Date(searchedOrder.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <Badge className="bg-black text-white">
                      {getStatusBadge(searchedOrder.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  
                  {/* Products */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium">Sản phẩm đã đặt</h3>
                    {searchedOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div 
                          className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden"
                        >
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{item.price.toLocaleString('vi-VN')}₫</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="mb-6" />

                  {/* Shipping Info */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Thông tin giao hàng</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Người nhận:</strong> {searchedOrder.shipping.name}</p>
                      <p><strong>Số điện thoại:</strong> {searchedOrder.shipping.phone}</p>
                      <p><strong>Địa chỉ:</strong> {searchedOrder.shipping.address}</p>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Tổng cộng</span>
                    <span 
                      className="text-2xl font-semibold velora-heading" 
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {searchedOrder.total.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="velora-card">
                <CardHeader>
                  <CardTitle className="velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                    Trạng thái đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {searchedOrder.timeline.map((step, index) => (
                      <div key={index} className="flex gap-6">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(step.status, step.completed)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8 border-l-2 border-border pl-6 last:border-0 last:pb-0">
                          <div className={step.completed ? '' : 'opacity-50'}>
                            <h4 className="font-medium mb-1">{step.description}</h4>
                            {step.date && (
                              <p className="text-sm text-muted-foreground">
                                {step.date} - {step.time}
                              </p>
                            )}
                            {!step.completed && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Dự kiến trong 1-2 ngày
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <Card className="velora-card bg-secondary">
                <CardContent className="p-6 text-center">
                  <p className="mb-4">Cần hỗ trợ về đơn hàng?</p>
                  <Button variant="outline" className="border-black hover:bg-black hover:text-white">
                    Liên hệ hỗ trợ
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Section */}
          {!searchedOrder && (
            <div className="mt-12 text-center">
              <h3 className="mb-4 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
                Làm thế nào để tìm mã đơn hàng?
              </h3>
              <div className="max-w-2xl mx-auto text-left space-y-4 text-muted-foreground">
                <p>✓ Kiểm tra email xác nhận đơn hàng</p>
                <p>✓ Đăng nhập tài khoản và xem trong phần "Đơn hàng của tôi"</p>
                <p>✓ Liên hệ hotline: <strong>1900 xxxx</strong> để được hỗ trợ</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <VeloraFooterNew />
    </div>
  );
}
