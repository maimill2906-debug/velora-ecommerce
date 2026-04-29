import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
  salePercentage?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart, onWishlistToggle }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleWishlistClick = () => {
    setIsWishlisted(!isWishlisted);
    onWishlistToggle?.(product.id);
  };

  const handleAddToCart = () => {
    onAddToCart?.(product.id);
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge variant="secondary" className="bg-green-500 text-white">
                NEW
              </Badge>
            )}
            {product.isSale && (
              <Badge variant="destructive">
                -{product.salePercentage}%
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 h-8 w-8 p-0 transition-all duration-200 ${
              isWishlisted 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-background/80 hover:bg-background'
            }`}
            onClick={handleWishlistClick}
          >
            <Heart 
              className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} 
            />
          </Button>

          {/* Add to Cart Button - Shows on hover */}
          <div className={`absolute bottom-2 left-2 right-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <Button 
              onClick={handleAddToCart}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}