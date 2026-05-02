import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

type HomeProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=600&q=80';

export function VeloraHomePage() {
  const categories = [
    {
      title: 'Thời trang Nam',
      description: 'Phong cách tối giản, sang trọng',
      link: '/shop?category=nam',
      image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80',
    },
    {
      title: 'Thời trang Nữ',
      description: 'Thanh lịch, hiện đại',
      link: '/shop?category=nu',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    },
  ];

  const [newArrivals, setNewArrivals] = useState<HomeProduct[]>([]);

  useEffect(() => {
    apiFetch<any[]>('/catalog/products?limit=4')
      .then((rows) => {
        const items: HomeProduct[] = (rows || []).map((p: any) => {
          const ps: number[] = (p.variants || [])
            .map((v: any) => v.price)
            .filter((x: any) => typeof x === 'number');
          const minPrice = ps.length ? Math.min(...ps) : (p.original_price || 0);
          const image =
            (p.images && p.images[0] && p.images[0].url) || FALLBACK_IMAGE;
          return {
            id: p.id,
            name: p.name,
            price: minPrice,
            image,
          };
        });
        setNewArrivals(items);
      })
      .catch(() => setNewArrivals([]));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      {/* Hero Section */}
      <section className="relative h-[calc(100vh-160px)] min-h-[600px] bg-gray-100 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 
            className="mb-6 velora-heading" 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em'
            }}
          >
            VELORA FASHION
          </h1>
          <p 
            className="mb-8 text-lg md:text-xl max-w-2xl mx-auto" 
            style={{ fontFamily: 'var(--font-body)', fontWeight: 300, letterSpacing: '0.05em' }}
          >
            SINCE 2025
          </p>
          <p className="mb-12 text-base md:text-lg max-w-xl mx-auto opacity-90">
            Thiết kế tối giản, chất lượng vượt thời gian
          </p>
          <Button 
            asChild
            className="bg-white text-black hover:bg-gray-100 h-14 px-12 text-base"
          >
            <Link to="/shop">
              Khám phá ngay
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="velora-section">
        <div className="velora-container">
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="group relative h-[500px] overflow-hidden velora-card"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${category.image})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all" />
                </div>
                <div className="relative h-full flex flex-col justify-end p-8 text-white">
                  <h3 
                    className="mb-2 velora-heading" 
                    style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}
                  >
                    {category.title}
                  </h3>
                  <p className="mb-4 text-sm uppercase tracking-wider">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm uppercase tracking-wider group-hover:gap-4 transition-all">
                    Xem thêm <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="velora-section bg-secondary">
        <div className="velora-container">
          <div className="text-center mb-12">
            <h2 
              className="mb-4 velora-heading" 
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
            >
              Hàng mới về
            </h2>
            <p className="text-muted-foreground">Bộ sưu tập mới nhất của VELORA</p>
          </div>

          {newArrivals.length === 0 ? (
            <p className="text-center text-muted-foreground">Đang tải sản phẩm...</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group"
                >
                  <div className="aspect-[3/4] mb-4 overflow-hidden bg-white velora-card">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="mb-2 text-sm md:text-base font-medium group-hover:underline">
                    {product.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {product.price.toLocaleString('vi-VN')}₫
                  </p>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              asChild 
              variant="outline" 
              className="border-black hover:bg-black hover:text-white h-12 px-8"
            >
              <Link to="/shop">Xem tất cả sản phẩm</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="velora-section">
        <div className="velora-container max-w-4xl text-center">
          <h2 
            className="mb-6 velora-heading" 
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
          >
            Triết lý VELORA
          </h2>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              VELORA tin vào vẻ đẹp của sự tối giản. Mỗi thiết kế đều được chăm chút 
              tỉ mỉ, từ chất liệu đến đường may, để tạo nên những sản phẩm vượt thời gian.
            </p>
            <p>
              Chúng tôi không theo đuổi xu hướng nhất thời, mà hướng đến phong cách 
              bền vững, thanh lịch và tinh tế cho người hiện đại.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-black text-white py-16">
        <div className="velora-container max-w-2xl text-center">
          <h3 
            className="mb-4 velora-heading" 
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}
          >
            Nhận tin mới nhất
          </h3>
          <p className="mb-8 text-sm text-gray-300">
            Đăng ký để nhận thông tin về bộ sưu tập mới và ưu đãi đặc biệt
          </p>
          <form className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-4 py-3 bg-white text-black border-0 focus:ring-2 focus:ring-white"
              required
            />
            <Button type="submit" className="bg-white text-black hover:bg-gray-100">
              Đăng ký
            </Button>
          </form>
        </div>
      </section>

      <VeloraFooterNew />
    </div>
  );
}
