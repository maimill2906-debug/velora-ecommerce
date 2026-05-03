import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Minus, Plus, ShoppingBag, Heart, ChevronRight, Star } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { apiFetch } from '@/lib/apiClient';
import { getColorBackground, isLightColor } from '@/lib/colors';

type BackendProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  material: string | null;
  care_instructions: string | null;
  category_id: string | null;
  style_segment: string | null;
  is_active: boolean;
  original_price: number | null;
  images: Array<{ id: string; url: string; sort_order: number }>;
  tags: Array<{ id: string; code: string; label: string }>;
  variants: Array<{ id: string; variant_sku: string; size: string | null; color: string | null; price: number; in_stock?: boolean; qty_on_hand?: number | null }>;
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id || '';
  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    apiFetch<BackendProduct>(`/catalog/products/${encodeURIComponent(productId)}`)
      .then((p) => {
        setProduct(p);
        apiFetch<any[]>('/customers/me/wishlist', { auth: true })
          .then((rows) => {
            const ids = new Set((rows || []).map((r) => r.product_id).filter(Boolean));
            setWishlisted(ids.has(p.id));
          })
          .catch(() => {
            // ignore (not logged in)
          });
        const sizes = Array.from(new Set((p.variants || []).map((v) => v.size).filter(Boolean))) as string[];
        const colors = Array.from(new Set((p.variants || []).map((v) => v.color).filter(Boolean))) as string[];
        setSelectedSize(sizes[0] || '');
        setSelectedColor(colors[0] || '');
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  const sizes = useMemo(
    () => Array.from(new Set((product?.variants || []).map((v) => v.size).filter(Boolean))) as string[],
    [product]
  );
  const colors = useMemo(
    () => Array.from(new Set((product?.variants || []).map((v) => v.color).filter(Boolean))) as string[],
    [product]
  );
  const images = useMemo(() => (product?.images || []).map((i) => i.url).filter(Boolean), [product]);
  const displayImages = images.length ? images : ['https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=900&q=80'];

  /** \u1ea2nh \u0111\u01b0\u1ee3c seed theo th\u1ee9 t\u1ef1 c\u00f9ng v\u1edbi th\u1ee9 t\u1ef1 m\u00e0u xu\u1ea5t hi\u1ec7n trong variants \u2192 map color \u2192 index. */
  const colorImageIndex = useMemo(() => {
    const map: Record<string, number> = {};
    colors.forEach((c, i) => {
      if (i < displayImages.length) map[c] = i;
    });
    return map;
  }, [colors, displayImages]);
  const selectedVariant = useMemo(() => {
    const variants = product?.variants || [];
    if (!variants.length) return null;

    const exact =
      variants.find((v) => (selectedSize ? v.size === selectedSize : true) && (selectedColor ? v.color === selectedColor : true)) ||
      variants.find((v) => (selectedSize ? v.size === selectedSize : true)) ||
      variants.find((v) => (selectedColor ? v.color === selectedColor : true)) ||
      variants[0];

    return exact || null;
  }, [product, selectedSize, selectedColor]);

  const price = useMemo(() => {
    if (selectedVariant?.price != null) return selectedVariant.price;
    const ps = (product?.variants || []).map((v) => v.price).filter((p) => typeof p === 'number');
    return ps.length ? Math.min(...ps) : (product?.original_price || 0);
  }, [product, selectedVariant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <VeloraNav />
        <div className="velora-container py-32 text-center text-muted-foreground">Đang tải sản phẩm...</div>
        <VeloraFooterNew />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <VeloraNav />
        <div className="velora-container py-32 text-center">
          <h2
            className="mb-4 velora-heading"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}
          >
            Không tìm thấy sản phẩm
          </h2>
          <Button asChild className="bg-black text-white">
            <Link to="/shop">Quay lại cửa hàng</Link>
          </Button>
        </div>
        <VeloraFooterNew />
      </div>
    );
  }

  const currentColor = selectedColor || colors[0] || '';

  // undefined → chưa có dữ liệu kho → mặc định còn hàng (tránh block oan)
  const isOutOfStock = selectedVariant?.in_stock === false;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const variantId = selectedVariant?.id;
    const key = `${product.id}:${variantId || 'no-variant'}:${selectedSize || ''}:${selectedColor || ''}`;
    addToCart({
      key,
      productId: product.id,
      variantId,
      title: product.name,
      price: price,
      image: displayImages[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) {
        await apiFetch('/customers/me/wishlist', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ product_id: product.id }),
        });
        toast.success('Đã thêm vào yêu thích');
      } else {
        await apiFetch(`/customers/me/wishlist/${encodeURIComponent(product.id)}`, {
          method: 'DELETE',
          auth: true,
        });
        toast.success('Đã bỏ yêu thích');
      }
    } catch (e: any) {
      setWishlisted(!next);
      toast.error(e?.message || 'Thao tác thất bại (cần đăng nhập)');
    }
  };

  const discountPercent = product.original_price && product.original_price > price
    ? Math.round((1 - price / product.original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      {/* Breadcrumb */}
      <div className="velora-container py-4 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-black transition-colors">Sản phẩm</Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`/shop?category=${product.style_segment || 'all'}`}
            className="hover:text-black transition-colors"
          >
            {product.style_segment || 'Danh mục'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-black">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="velora-container py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div>
            <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 border border-border">
              <img
                src={displayImages[activeImage] || displayImages[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-3">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-24 overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Category */}
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              {product.style_segment || 'VELORA'}
            </p>

            {/* Name */}
            <h1
              className="mb-4 velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}
            >
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= 0
                        ? 'fill-black text-black'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                - (- đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className="velora-heading"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}
              >
                {price.toLocaleString('vi-VN')}₫
              </span>
              {product.original_price && product.original_price > price && (
                <>
                  <span className="text-muted-foreground line-through">
                    {product.original_price.toLocaleString('vi-VN')}₫
                  </span>
                  <Badge className="bg-black text-white">-{discountPercent}%</Badge>
                </>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Color */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-medium mb-3">
                Màu sắc: <span className="text-muted-foreground">{currentColor}</span>
              </p>
              <div className="flex gap-3 flex-wrap">
                {colors.map((color) => {
                  const active = currentColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        const imgIdx = colorImageIndex[color];
                        if (typeof imgIdx === 'number') setActiveImage(imgIdx);
                      }}
                      title={color}
                      aria-label={color}
                      className={`relative w-9 h-9 rounded-full transition-all ring-offset-2 ${
                        active
                          ? 'ring-2 ring-black'
                          : 'ring-1 ring-border hover:ring-black'
                      } ${isLightColor(color) ? 'border border-border' : ''}`}
                      style={{ background: getColorBackground(color) }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs uppercase tracking-wider font-medium">
                  Kích thước: <span className="text-muted-foreground">{selectedSize}</span>
                </p>
                <button className="text-xs underline text-muted-foreground hover:text-black">
                  Hướng dẫn chọn size
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 border text-sm transition-all ${
                      selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-border hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-medium mb-3">Số lượng</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-black">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {isOutOfStock ? (
                  <span className="text-sm text-red-500 font-medium">Hết hàng</span>
                ) : selectedVariant?.qty_on_hand != null ? (
                  <span className={`text-sm ${selectedVariant.qty_on_hand <= 5 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                    Còn {selectedVariant.qty_on_hand} sản phẩm
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Còn hàng</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 h-14 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleWishlist}
                className={`h-14 w-14 border-black ${wishlisted ? 'bg-black text-white' : ''}`}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? 'fill-white' : ''}`} />
              </Button>
            </div>

            {/* SKU */}
            <p className="text-xs text-muted-foreground mb-6">SKU: {product.sku}</p>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-6">
              {(product.tags || []).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs uppercase tracking-wider border border-border px-3 py-1"
                >
                  {tag.label}
                </span>
              ))}
            </div>

            <Separator className="mb-6" />

            {/* Shipping Info */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                <span>Miễn phí vận chuyển cho đơn trên 500.000₫</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                <span>Giao hàng 2-4 ngày làm việc</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                <span>Đổi trả trong 30 ngày nếu còn nguyên tem mác</span>
              </div>
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="border-t border-border">
              <AccordionItem value="description" className="border-b border-border">
                <AccordionTrigger className="text-sm uppercase tracking-wider py-4">
                  Mô tả sản phẩm
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || '-'}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="material" className="border-b border-border">
                <AccordionTrigger className="text-sm uppercase tracking-wider py-4">
                  Chất liệu
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {product.material || '-'}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="care" className="border-b border-border">
                <AccordionTrigger className="text-sm uppercase tracking-wider py-4">
                  Hướng dẫn bảo quản
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {product.care_instructions || '-'}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Related Products */}
      </div>

      <VeloraFooterNew />
    </div>
  );
}
