import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Edit2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, clearAuthSession } from '@/lib/apiClient';

interface Order {
  id: string;
  date: string | null;
  total: number;
  status: string;
}

interface WishlistItem {
  id: string; // product_id
  name: string;
  price: number;
  image: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Thị Minh',
    email: 'minh.nguyen@email.com',
    phone: '0912345678',
    birthDate: '1995-06-15',
    gender: 'Nữ',
    address: '47 Tràng Tiền, Hoàn Kiếm, Hà Nội',
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const NOTIFICATION_CHANNELS = useMemo(
    () => [
      { key: 'email_order_updates', label: 'Email thông báo đơn hàng' },
      { key: 'email_promotions', label: 'Khuyến mãi và ưu đãi' },
      { key: 'email_new_collections', label: 'Bộ sưu tập mới' },
      { key: 'sms_shipping_updates', label: 'SMS thông báo vận chuyển' },
    ],
    []
  );

  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => ({
    email_order_updates: true,
    email_promotions: true,
    email_new_collections: false,
    sms_shipping_updates: true,
  }));
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [changingPw, setChangingPw] = useState(false);

  const productBriefCache = useMemo(() => new Map<string, WishlistItem>(), []);
  const getWishlistItemFromProductId = async (productId: string): Promise<WishlistItem> => {
    const cached = productBriefCache.get(productId);
    if (cached) return cached;

    const p = await apiFetch<any>(`/catalog/products/${encodeURIComponent(productId)}`);
    const img =
      (p.images && p.images[0] && p.images[0].url) ||
      'https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=400&q=80';
    const ps: number[] = (p.variants || []).map((v: any) => v.price).filter((x: any) => typeof x === 'number');
    const price = ps.length ? Math.min(...ps) : (p.original_price || 0);
    const item: WishlistItem = { id: p.id || productId, name: p.name || productId, price, image: img };
    productBriefCache.set(productId, item);
    return item;
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: 'Nháp', className: 'border border-border text-muted-foreground' },
      placed: { label: 'Đã đặt', className: 'border border-border text-muted-foreground' },
      confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800' },
      packed: { label: 'Đã đóng gói', className: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Đang giao hàng', className: 'bg-yellow-100 text-yellow-800' },
      delivered: { label: 'Đã giao', className: 'bg-black text-white' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
      returned: { label: 'Hoàn trả', className: 'bg-red-100 text-red-800' },
    };
    return config[status] || { label: status, className: 'border border-border text-muted-foreground' };
  };

  const handleSaveProfile = async () => {
    try {
      const res = await apiFetch<any>('/customers/me', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          full_name: profile.fullName,
          email: profile.email,
          phone: profile.phone,
        }),
      });
      setProfile((prev) => ({
        ...prev,
        fullName: res.full_name || prev.fullName,
        email: res.email || prev.email,
        phone: res.phone || prev.phone,
      }));
      setEditMode(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    try {
      localStorage.removeItem('velora_last_order_code');
    } catch {
      // ignore storage errors
    }
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  const handleRemoveWishlist = async (productId: string) => {
    const prev = wishlist;
    setWishlist((cur) => cur.filter((x) => x.id !== productId));
    try {
      await apiFetch(`/customers/me/wishlist/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        auth: true,
      });
      toast.success('Đã bỏ yêu thích');
    } catch (e: any) {
      setWishlist(prev);
      toast.error(e?.message || 'Bỏ yêu thích thất bại');
    }
  };

  useEffect(() => {
    // Load my profile + orders (requires login)
    apiFetch<any>('/customers/me', { auth: true })
      .then((p) => {
        setProfile((prev) => ({
          ...prev,
          fullName: p.full_name || prev.fullName,
          email: p.email || prev.email,
          phone: p.phone || prev.phone,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingOrders(true);
    apiFetch<any[]>('/orders/me', { auth: true })
      .then((rows) => {
        setOrders(
          (rows || []).map((o) => ({
            id: o.code,
            date: o.placed_at || null,
            total: o.total_amount || 0,
            status: o.status,
          }))
        );
      })
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    setLoadingWishlist(true);
    apiFetch<any[]>('/customers/me/wishlist', { auth: true })
      .then(async (rows) => {
        const productIds = (rows || []).map((r) => r.product_id).filter(Boolean) as string[];
        const items = await Promise.all(
          productIds.map(async (pid) => {
            try {
              return await getWishlistItemFromProductId(pid);
            } catch {
              return {
                id: pid,
                name: pid,
                price: 0,
                image:
                  'https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=400&q=80',
              } as WishlistItem;
            }
          })
        );
        setWishlist(items);
      })
      .catch(() => setWishlist([]))
      .finally(() => setLoadingWishlist(false));
  }, [getWishlistItemFromProductId]);

  useEffect(() => {
    setLoadingPrefs(true);
    apiFetch<Array<{ channel: string; enabled: boolean }>>('/customers/me/notification-preferences', { auth: true })
      .then((rows) => {
        const next = { ...notificationPrefs };
        for (const r of rows || []) {
          if (typeof r?.channel === 'string') next[r.channel] = !!r.enabled;
        }
        // Ensure our known channels always exist in state
        for (const ch of NOTIFICATION_CHANNELS) {
          if (typeof next[ch.key] !== 'boolean') next[ch.key] = false;
        }
        setNotificationPrefs(next);
      })
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [NOTIFICATION_CHANNELS]);

  const handleSaveNotificationPrefs = async () => {
    if (savingPrefs) return;
    setSavingPrefs(true);
    try {
      const payload: Record<string, boolean> = {};
      for (const ch of NOTIFICATION_CHANNELS) payload[ch.key] = !!notificationPrefs[ch.key];
      await apiFetch('/customers/me/notification-preferences', {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      });
      toast.success('Đã lưu cài đặt thông báo');
    } catch (e: any) {
      toast.error(e?.message || 'Lưu cài đặt thất bại');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (changingPw) return;
    if (!pwForm.current || !pwForm.next) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (pwForm.next.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }

    setChangingPw(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          current_password: pwForm.current,
          new_password: pwForm.next,
        }),
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      toast.error(e?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangingPw(false);
    }
  };

  const totalSpent = useMemo(
    () => orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === 'delivered').length,
    [orders]
  );

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      <div className="velora-container py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-8 border-b border-border gap-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black text-white flex items-center justify-center flex-shrink-0">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1
                className="velora-heading mb-1"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}
              >
                {profile.fullName}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge variant="outline" className="mt-2 border-black text-xs">
                Thành viên VELORA
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-black hover:bg-black hover:text-white"
            onClick={handleLogout}
          >
            <span className="inline-flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tổng đơn hàng', value: orders.length, icon: <Package className="h-5 w-5" /> },
            { label: 'Đơn đã giao', value: deliveredOrders, icon: <Package className="h-5 w-5" /> },
            { label: 'Tổng chi tiêu', value: totalSpent.toLocaleString('vi-VN') + '₫', icon: <Package className="h-5 w-5" /> },
            { label: 'Yêu thích', value: wishlist.length, icon: <Heart className="h-5 w-5" /> },
          ].map((stat, index) => (
            <Card key={index} className="velora-card">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {stat.label}
                </p>
                <p
                  className="velora-heading"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="orders">
          <TabsList className="mb-8 border-b border-border w-full justify-start rounded-none bg-transparent h-auto p-0 gap-8">
            {[
              { value: 'orders', label: 'Đơn hàng', icon: <Package className="h-4 w-4" /> },
              { value: 'wishlist', label: 'Yêu thích', icon: <Heart className="h-4 w-4" /> },
              { value: 'profile', label: 'Thông tin', icon: <User className="h-4 w-4" /> },
              { value: 'settings', label: 'Cài đặt', icon: <Settings className="h-4 w-4" /> },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent pb-3 px-0 text-muted-foreground data-[state=active]:text-black"
              >
                {tab.icon}
                <span className="text-sm uppercase tracking-wider">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="text-muted-foreground">Đang tải đơn hàng...</div>
              ) : orders.length === 0 ? (
                <div className="text-muted-foreground">Chưa có đơn hàng (hoặc bạn chưa đăng nhập).</div>
              ) : (
                orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <div
                      key={order.id}
                      className="border border-border p-6 hover:border-black transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono font-medium text-sm">#{order.id}</span>
                            <span className={`text-xs px-2 py-1 ${statusConfig.className}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs border border-border px-2 py-1 text-muted-foreground">
                              Website
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className="velora-heading"
                            style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}
                          >
                            {order.total.toLocaleString('vi-VN')}₫
                          </span>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-black hover:bg-black hover:text-white"
                          >
                            <Link to={`/order-tracking?code=${encodeURIComponent(order.id)}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Theo dõi
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            {loadingWishlist ? (
              <div className="text-muted-foreground">Đang tải wishlist...</div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground mb-4">Danh sách yêu thích trống</p>
                <Button asChild variant="outline" className="border-black hover:bg-black hover:text-white">
                  <Link to="/shop">Khám phá sản phẩm</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlist.map((item) => (
                  <div key={item.id} className="group">
                    <div className="relative aspect-[3/4] mb-3 overflow-hidden bg-gray-100 velora-card">
                      <Link to={`/product/${item.id}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ filter: 'grayscale(100%)' }}
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleRemoveWishlist(item.id)}
                        className="absolute top-3 right-3 w-10 h-10 border border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                        aria-label="Bỏ yêu thích"
                        title="Bỏ yêu thích"
                      >
                        <Heart className="h-4 w-4 fill-black group-hover:fill-black" />
                      </button>
                    </div>
                    <Link to={`/product/${item.id}`} className="block">
                      <h4 className="font-medium text-sm mb-1 group-hover:underline">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toLocaleString('vi-VN')}₫
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="velora-card max-w-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle
                  className="velora-heading"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Thông tin cá nhân
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-black hover:bg-black hover:text-white"
                  onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {editMode ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      disabled={!editMode}
                      className={editMode ? 'border-black' : 'border-border'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!editMode}
                      className={editMode ? 'border-black' : 'border-border'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!editMode}
                    className={editMode ? 'border-black' : 'border-border'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày sinh</Label>
                    <Input
                      type={editMode ? 'date' : 'text'}
                      value={editMode ? profile.birthDate : new Date(profile.birthDate).toLocaleDateString('vi-VN')}
                      onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                      disabled={!editMode}
                      className={editMode ? 'border-black' : 'border-border'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giới tính</Label>
                    <Input
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      disabled={!editMode}
                      className={editMode ? 'border-black' : 'border-border'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Địa chỉ mặc định</Label>
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!editMode}
                    className={editMode ? 'border-black' : 'border-border'}
                  />
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Lưu thay đổi
                    </Button>
                    <Button
                      variant="outline"
                      className="border-black"
                      onClick={() => setEditMode(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl space-y-6">
              {/* Change Password */}
              <Card className="velora-card">
                <CardHeader>
                  <CardTitle
                    className="velora-heading"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Đổi mật khẩu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mật khẩu hiện tại</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="border-black"
                      value={pwForm.current}
                      onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <Input
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      className="border-black"
                      value={pwForm.next}
                      onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      className="border-black"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={() => void handleChangePassword()}
                    disabled={changingPw}
                  >
                    {changingPw ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="velora-card">
                <CardHeader>
                  <CardTitle
                    className="velora-heading"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Thông báo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPrefs ? (
                    <div className="text-muted-foreground">Đang tải cài đặt thông báo...</div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {NOTIFICATION_CHANNELS.map((item) => (
                          <div key={item.key} className="flex justify-between items-center">
                            <span className="text-sm">{item.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!notificationPrefs[item.key]}
                                onChange={(e) =>
                                  setNotificationPrefs((prev) => ({
                                    ...prev,
                                    [item.key]: e.target.checked,
                                  }))
                                }
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-black rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="pt-5">
                        <Button
                          className="bg-black text-white hover:bg-gray-800"
                          onClick={handleSaveNotificationPrefs}
                          disabled={savingPrefs}
                        >
                          {savingPrefs ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="velora-card border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700" style={{ fontFamily: 'var(--font-heading)' }}>
                    Vùng nguy hiểm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn và không thể khôi phục.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => toast.error('Chức năng này yêu cầu xác nhận qua email.')}
                  >
                    Xóa tài khoản
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <VeloraFooterNew />
    </div>
  );
}
