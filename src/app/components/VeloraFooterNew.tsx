import { Link } from 'react-router';
import { Separator } from './ui/separator';
const logoImg =
  'https://dummyimage.com/240x80/000/fff.png&text=VELORA';

export function VeloraFooterNew() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-black mt-20">
      <div className="velora-container">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <img src={logoImg} alt="VELORA FASHION" className="h-16 w-auto" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Thời trang cao cấp, phong cách tối giản. 
              VELORA mang đến những thiết kế tinh tế cho người hiện đại.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
              Mua sắm
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop?category=nam" className="text-sm hover:underline transition-all">
                  Thời trang Nam
                </Link>
              </li>
              <li>
                <Link to="/shop?category=nu" className="text-sm hover:underline transition-all">
                  Thời trang Nữ
                </Link>
              </li>
              <li>
                <Link to="/shop?category=collection" className="text-sm hover:underline transition-all">
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link to="/shop?category=new" className="text-sm hover:underline transition-all">
                  Hàng mới về
                </Link>
              </li>
              <li>
                <Link to="/shop?category=sale" className="text-sm hover:underline transition-all">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
              Hỗ trợ
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/order-tracking" className="text-sm hover:underline transition-all">
                  Theo dõi đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm hover:underline transition-all">
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm hover:underline transition-all">
                  Đổi trả hàng
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="text-sm hover:underline transition-all">
                  Hướng dẫn chọn size
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:underline transition-all">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
              Liên hệ
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Hotline:</strong><br />
                1900 xxxx (8:00 - 22:00)
              </li>
              <li>
                <strong className="text-foreground">Email:</strong><br />
                support@velora.vn
              </li>
              <li>
                <strong className="text-foreground">Địa chỉ:</strong><br />
                Hà Nội, Việt Nam
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Payment Methods */}
        <div className="py-8">
          <h5 className="text-sm uppercase tracking-wider mb-4">Phương thức thanh toán</h5>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="border border-border px-4 py-2">COD</div>
            <div className="border border-border px-4 py-2">MoMo</div>
            <div className="border border-border px-4 py-2">ZaloPay</div>
            <div className="border border-border px-4 py-2">Chuyển khoản</div>
            <div className="border border-border px-4 py-2">Thẻ tín dụng</div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} VELORA FASHION. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:underline transition-all">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="hover:underline transition-all">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
