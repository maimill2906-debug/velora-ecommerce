import { Link } from "react-router";
import { VeloraHeader } from "../components/VeloraHeader";
import { VeloraFooter } from "../components/VeloraFooter";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { apiFetch } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  original_price: number | null;
}

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Product[]>("/catalog/products?limit=8")
      .then((data) => setFeaturedProducts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <VeloraHeader />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1594901023837-bd14178769f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMG1vZGVsJTIwYmxhY2slMjB3aGl0ZXxlbnwxfHx8fDE3NzYzMzc2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="VELORA Collection"
            className="w-full h-full object-cover filter grayscale"
          />
          <div className="absolute inset-0 bg-white bg-opacity-30"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <h1 className="mb-8 text-black">Timeless Elegance</h1>
          <p className="mb-12 text-lg opacity-80 max-w-md mx-auto">
            Discover the new collection of minimal luxury fashion
          </p>
          <Link to="/shop" className="velora-button-primary inline-block">
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="velora-container py-32">
        <div className="grid grid-cols-3 gap-8">
          <Link to="/shop?category=women" className="group">
            <div className="aspect-[3/4] overflow-hidden mb-4 border border-border">
              <img
                src="https://images.unsplash.com/photo-1751818397262-040cddef4390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwcGhvdG9ncmFwaHklMjBncmF5c2NhbGV8ZW58MXx8fHwxNzc2MzM3Njg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Women's Collection"
                className="w-full h-full object-cover filter grayscale group-hover:opacity-85 transition-opacity"
              />
            </div>
            <h3 className="text-center">Women's Collection</h3>
          </Link>

          <Link to="/shop?category=men" className="group">
            <div className="aspect-[3/4] overflow-hidden mb-4 border border-border">
              <img
                src="https://images.unsplash.com/photo-1761635491372-271565760322?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWluaW1hbCUyMGNsb3RoaW5nJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc3NjMzNzY5MHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Men's Collection"
                className="w-full h-full object-cover filter grayscale group-hover:opacity-85 transition-opacity"
              />
            </div>
            <h3 className="text-center">Men's Collection</h3>
          </Link>

          <Link to="/shop?category=accessories" className="group">
            <div className="aspect-[3/4] overflow-hidden mb-4 border border-border">
              <img
                src="https://images.unsplash.com/photo-1766299231533-27fb998d1a6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwZmFzaGlvbiUyMHBvcnRyYWl0JTIwbW9ub2Nocm9tZXxlbnwxfHx8fDE3NzYzMzc2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Accessories"
                className="w-full h-full object-cover filter grayscale group-hover:opacity-85 transition-opacity"
              />
            </div>
            <h3 className="text-center">Accessories</h3>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="velora-container py-32 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="mb-4">Featured Products</h2>
          <p className="opacity-60">Curated selection from our latest collection</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 mb-4"></div>
                <div className="h-4 bg-gray-200 mb-2"></div>
                <div className="h-4 bg-gray-200 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
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

        <div className="text-center mt-16">
          <Link to="/shop" className="velora-button-secondary">
            View All Products
          </Link>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="velora-container py-32 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-8">Our Philosophy</h2>
          <p className="text-lg leading-relaxed mb-8 opacity-80">
            At VELORA, we believe in the power of simplicity. Each piece in our collection
            is thoughtfully designed to transcend seasons and trends, offering you timeless
            elegance that speaks to refined taste and sophisticated style.
          </p>
          <p className="opacity-60">
            Since 2025, we have been committed to creating fashion that endures.
          </p>
        </div>
      </section>

      <VeloraFooter />
    </div>
  );
}
