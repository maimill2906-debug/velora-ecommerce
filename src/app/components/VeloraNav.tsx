import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Search, ShoppingBag, User, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useCart } from '../contexts/CartContext';
import { VeloraLogo } from './VeloraLogo';
import { getAuthToken } from '@/lib/apiClient';

export function VeloraNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean>(() => !!getAuthToken());

  useEffect(() => {
    setAuthed(!!getAuthToken());
    const onStorage = () => setAuthed(!!getAuthToken());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [location.pathname]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleAccountClick = () => {
    if (authed) {
      navigate('/profile');
    } else {
      const cur = `${location.pathname}${location.search}`;
      navigate(`/login?next=${encodeURIComponent(cur)}`);
    }
  };

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/shop' },
    { label: 'Nam', href: '/shop?category=nam' },
    { label: 'Nữ', href: '/shop?category=nu' },
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Liên hệ', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      {/* Top Bar */}
      <div className="border-b border-border">
        <div className="velora-container">
          <div className="h-10 flex items-center justify-center text-xs uppercase tracking-wider">
            Miễn phí vận chuyển cho đơn hàng trên 500.000₫
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="velora-container">
        <div className="h-20 flex items-center justify-between gap-8">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-white">
              <div className="flex flex-col gap-6 mt-8">
                <VeloraLogo size="medium" showUnderline={false} />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-lg hover:underline"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 velora-logo-interactive">
            <VeloraLogo size="small" showSubtitle={false} showUnderline={false} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm uppercase tracking-wider hover:underline transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-black focus:ring-black"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAccountClick}
              className="hover:bg-transparent"
              title={authed ? 'Tài khoản' : 'Đăng nhập'}
            >
              <User className="h-5 w-5" />
              <span className="sr-only">{authed ? 'Tài khoản' : 'Đăng nhập'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cart')}
              className="relative hover:bg-transparent"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">Giỏ hàng</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden border-t border-border">
        <div className="velora-container py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-black"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}