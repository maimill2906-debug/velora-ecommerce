import { useState, useMemo } from "react";
import { ProductCard } from "./ProductCard";
import { FilterPanel } from "./FilterPanel";
import { SortDropdown, SortOption } from "./SortDropdown";
import { Button } from "./ui/button";
import { Filter, Grid, List } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  salePercentage?: number;
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
}

// Mock product data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 199,
    originalPrice: 249,
    rating: 4.5,
    reviewCount: 128,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop",
    category: "electronics",
    isSale: true,
    salePercentage: 20,
  },
  {
    id: "2",
    name: "Designer Cotton T-Shirt",
    price: 29,
    rating: 4.2,
    reviewCount: 85,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    category: "clothing",
    isNew: true,
  },
  {
    id: "3",
    name: "JavaScript: The Definitive Guide",
    price: 45,
    rating: 4.8,
    reviewCount: 234,
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop",
    category: "books",
  },
  {
    id: "4",
    name: "Smart Home Security Camera",
    price: 89,
    originalPrice: 120,
    rating: 4.3,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=500&fit=crop",
    category: "electronics",
    isSale: true,
    salePercentage: 26,
  },
  {
    id: "5",
    name: "Organic Garden Planter Set",
    price: 34,
    rating: 4.6,
    reviewCount: 92,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=500&fit=crop",
    category: "home",
    isNew: true,
  },
  {
    id: "6",
    name: "Professional Running Shoes",
    price: 124,
    rating: 4.4,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    category: "sports",
  },
  {
    id: "7",
    name: "Luxury Skincare Set",
    price: 78,
    originalPrice: 98,
    rating: 4.7,
    reviewCount: 143,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop",
    category: "beauty",
    isSale: true,
    salePercentage: 20,
  },
  {
    id: "8",
    name: "Vintage Denim Jacket",
    price: 69,
    rating: 4.1,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
    category: "clothing",
  },
];

export function ProductCatalogue() {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    minRating: 0,
  });
  
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...mockProducts];

    // Apply filters
    if (filters.categories.length > 0) {
      result = result.filter(product => filters.categories.includes(product.category));
    }

    result = result.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    if (filters.minRating > 0) {
      result = result.filter(product => product.rating >= filters.minRating);
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low-high":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return result;
  }, [filters, sortBy]);

  const handleAddToCart = (productId: string) => {
    toast.success("Product added to cart!");
  };

  const handleWishlistToggle = (productId: string) => {
    toast.success("Wishlist updated!");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Desktop Filter Panel */}
        <div className="hidden lg:block flex-shrink-0">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h1>Products ({filteredAndSortedProducts.length})</h1>
              
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="p-4">
                    <FilterPanel
                      filters={filters}
                      onFiltersChange={setFilters}
                      isMobile={true}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Products Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your filters.</p>
              <Button variant="outline" onClick={() => setFilters({
                categories: [],
                priceRange: [0, 1000],
                minRating: 0,
              })} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredAndSortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}