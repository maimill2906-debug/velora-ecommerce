import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Separator } from '../components/ui/separator';
import { apiFetch } from '@/lib/apiClient';
import { getColorBackground } from '@/lib/colors';

type ShopProduct = {
  id: string;
  name: string;
  category: string; // mapped from style_segment for nam/nu shortcuts
  categoryId: string | null;
  price: number;
  colors: string[];
  sizes: string[];
  image: string;
};

type BackendProduct = {
  id: string;
  name: string;
  category_id?: string | null;
  style_segment: string | null;
  original_price: number | null;
  images?: Array<{ url: string }>;
  variants?: Array<{ size: string | null; color: string | null; price: number }>;
};

type Category = {
  id: string;
  code: string;
  name: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=600&q=80';

function mapToShopProduct(p: BackendProduct): ShopProduct {
  const variants = p.variants || [];
  const prices = variants.map((v) => v.price).filter((v) => typeof v === 'number');
  const minPrice = prices.length ? Math.min(...prices) : (p.original_price || 0);
  const colors = Array.from(
    new Set((variants.map((v) => v.color).filter(Boolean) as string[]))
  );
  const sizes = Array.from(
    new Set((variants.map((v) => v.size).filter(Boolean) as string[]))
  );
  const image = (p.images && p.images[0] && p.images[0].url) || FALLBACK_IMAGE;
  const seg = (p.style_segment || '').toLowerCase();
  let category = '';
  if (seg.includes('men') || seg.includes('nam')) category = 'nam';
  else if (seg.includes('women') || seg.includes('nu') || seg.includes('nữ')) category = 'nu';

  return {
    id: p.id,
    name: p.name,
    category,
    categoryId: p.category_id || null,
    price: minPrice,
    colors,
    sizes,
    image,
  };
}

export function VeloraShopPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const searchFromNav = searchParams.get('search') || '';

  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(searchFromNav);

  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<BackendProduct[]>('/catalog/products?limit=200')
      .then((rows) => setAllProducts((rows || []).map(mapToShopProduct)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<Category[]>('/catalog/categories')
      .then((rows) => setCategories(rows || []))
      .catch(() => setCategories([]));
  }, []);

  const matchingCategory = useMemo(() => {
    if (!category) return null;
    const lower = category.toLowerCase();
    return (
      categories.find((c) => c.code.toLowerCase() === lower) ||
      categories.find((c) => c.name.toLowerCase() === lower) ||
      null
    );
  }, [categories, category]);

  const sortedProducts = useMemo(() => {
    let filtered = allProducts;

    if (category) {
      if (matchingCategory) {
        filtered = filtered.filter((p) => p.categoryId === matchingCategory.id);
      } else {
        // fallback to style_segment shortcut (nam/nu)
        filtered = filtered.filter((p) => p.category === category);
      }
    }
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes.some((size) => selectedSizes.includes(size))
      );
    }
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        p.colors.some((color) => selectedColors.includes(color))
      );
    }
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [allProducts, category, matchingCategory, searchQuery, selectedSizes, selectedColors, priceRange, sortBy]);

  const sizes = ['S', 'M', 'L', 'XL'];
  /** Danh s\u00e1ch m\u00e0u l\u1ea5y t\u1eeb d\u1eef li\u1ec7u th\u1eadt c\u1ee7a t\u1ea5t c\u1ea3 s\u1ea3n ph\u1ea9m \u0111ang load. */
  const colors = useMemo(
    () => Array.from(new Set(allProducts.flatMap((p) => p.colors))).sort(),
    [allProducts]
  );

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 2000000]);
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Kích thước</h3>
        <div className="grid grid-cols-2 gap-2">
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`border p-3 transition-all ${
                selectedSizes.includes(size)
                  ? 'border-black bg-black text-white'
                  : 'border-border hover:border-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Màu sắc</h3>
        <div className="space-y-3">
          {colors.map(color => (
            <div key={color} className="flex items-center gap-3">
              <Checkbox
                id={`color-${color}`}
                checked={selectedColors.includes(color)}
                onCheckedChange={() => toggleColor(color)}
                className="border-black data-[state=checked]:bg-black"
              />
              <Label
                htmlFor={`color-${color}`}
                className="cursor-pointer text-sm flex items-center gap-2"
                style={{ textTransform: 'none' }}
              >
                <span
                  aria-hidden
                  className="inline-block w-4 h-4 rounded-full border border-border"
                  style={{ background: getColorBackground(color) }}
                />
                {color}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Giá</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={2000000}
          step={50000}
          className="mb-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString('vi-VN')}₫</span>
          <span>{priceRange[1].toLocaleString('vi-VN')}₫</span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full border-black hover:bg-black hover:text-white"
        onClick={clearFilters}
      >
        Xóa bộ lọc
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      <div className="velora-container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 
            className="mb-4 velora-heading" 
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
          >
            {searchQuery ? `Kết quả: "${searchQuery}"` :
             matchingCategory ? matchingCategory.name :
             category === 'nam' ? 'Thời trang Nam' :
             category === 'nu' ? 'Thời trang Nữ' :
             'Tất cả sản phẩm'}
          </h1>
          <p className="text-muted-foreground">
            {loading ? 'Đang tải sản phẩm...' : `${sortedProducts.length} sản phẩm`}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden border-black">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Bộ lọc
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sắp xếp:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                    <SelectItem value="name">Tên A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {sortedProducts.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group"
                  >
                    <div className="aspect-[3/4] mb-4 overflow-hidden bg-gray-100 velora-card">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mb-2 font-medium group-hover:underline">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toLocaleString('vi-VN')}₫
                    </p>
                    <div className="flex gap-1.5 mt-2 items-center">
                      {product.colors.slice(0, 5).map((color, i) => (
                        <span
                          key={i}
                          title={color}
                          aria-label={color}
                          className="inline-block w-4 h-4 rounded-full border border-border"
                          style={{ background: getColorBackground(color) }}
                        />
                      ))}
                      {product.colors.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{product.colors.length - 5}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">
                  Không tìm thấy sản phẩm phù hợp
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="border-black hover:bg-black hover:text-white"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <VeloraFooterNew />
    </div>
  );
}