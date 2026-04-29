import { VeloraHeader } from "../components/VeloraHeader";
import { VeloraFooter } from "../components/VeloraFooter";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { apiFetch } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  original_price: number | null;
  category_id: string | null;
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    apiFetch<Product[]>("/catalog/products")
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory === "all") return true;
      return product.category_id === selectedCategory;
    })
    .filter((product) => {
      if (priceRange === "all") return true;
      const price = product.original_price ?? 0;
      if (priceRange === "under50") return price < 50;
      if (priceRange === "50to100") return price >= 50 && price < 100;
      if (priceRange === "over100") return price >= 100;
      return true;
    })
    .sort((a, b) => {
      const ap = a.original_price ?? 0;
      const bp = b.original_price ?? 0;
      if (sortBy === "price-asc") return ap - bp;
      if (sortBy === "price-desc") return bp - ap;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category_id).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-white">
      <VeloraHeader />

      <div className="velora-container py-16">
        {/* Page Title */}
        <div className="mb-16 text-center">
          <h1 className="mb-4">Shop</h1>
          <p className="opacity-60">Explore our complete collection</p>
        </div>

        <div className="flex gap-16">
          {/* Filters Sidebar - Left */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-12">
              {/* Category Filter */}
              <div>
                <h4 className="mb-6 text-sm uppercase tracking-wider pb-3 border-b border-border">
                  Category
                </h4>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block w-full text-left text-sm transition-opacity ${
                        selectedCategory === cat
                          ? "opacity-100"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="mb-6 text-sm uppercase tracking-wider pb-3 border-b border-border">
                  Price Range
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setPriceRange("all")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      priceRange === "all"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    All Prices
                  </button>
                  <button
                    onClick={() => setPriceRange("under50")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      priceRange === "under50"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Under $50
                  </button>
                  <button
                    onClick={() => setPriceRange("50to100")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      priceRange === "50to100"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    $50 - $100
                  </button>
                  <button
                    onClick={() => setPriceRange("over100")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      priceRange === "over100"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Over $100
                  </button>
                </div>
              </div>

              {/* Sort */}
              <div>
                <h4 className="mb-6 text-sm uppercase tracking-wider pb-3 border-b border-border">
                  Sort By
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setSortBy("default")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      sortBy === "default"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setSortBy("price-asc")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      sortBy === "price-asc"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Price: Low to High
                  </button>
                  <button
                    onClick={() => setSortBy("price-desc")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      sortBy === "price-desc"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Price: High to Low
                  </button>
                  <button
                    onClick={() => setSortBy("name")}
                    className={`block w-full text-left text-sm transition-opacity ${
                      sortBy === "name"
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    Name
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid - Right */}
          <div className="flex-1">
            <div className="mb-8 flex justify-between items-center">
              <p className="text-sm opacity-60">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 gap-8">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 mb-4"></div>
                    <div className="h-4 bg-gray-200 mb-2"></div>
                    <div className="h-4 bg-gray-200 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32">
                <p className="opacity-60">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="group velora-product-card"
                  >
                    <div className="aspect-square overflow-hidden mb-4 border border-border bg-white">
                      <ImageWithFallback
                        src={"https://images.unsplash.com/photo-1520975682031-a6ad2f1c2f9b?auto=format&fit=crop&w=800&q=80"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="mb-2 truncate">{product.name}</h4>
                    <p className="opacity-60">
                      {(product.original_price ?? 0).toLocaleString()}₫
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <VeloraFooter />
    </div>
  );
}
