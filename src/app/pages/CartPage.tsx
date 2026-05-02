import { VeloraNav } from "../components/VeloraNav";
import { VeloraFooterNew } from "../components/VeloraFooterNew";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";

export function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <VeloraNav />
        <div className="velora-container py-32 text-center">
          <ShoppingBag className="h-24 w-24 mx-auto mb-6 opacity-20" />
          <h2 className="mb-4 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            Giỏ hàng trống
          </h2>
          <p className="mb-12 text-muted-foreground">Khám phá bộ sưu tập VELORA ngay</p>
          <Button asChild className="bg-black text-white hover:bg-gray-800 h-12 px-8">
            <Link to="/shop">
              Tiếp tục mua sắm
            </Link>
          </Button>
        </div>
        <VeloraFooterNew />
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      <div className="velora-container py-12">
        <h1 
          className="mb-12 text-center velora-heading" 
          style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
        >
          Giỏ hàng
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.key} className="flex gap-6 pb-6 border-b border-border">
                  {/* Product Image */}
                  <div className="w-32 h-32 border border-border bg-white flex-shrink-0 overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h4 className="mb-2 font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.size ? `Size: ${item.size}` : null}
                      {item.size && item.color ? ' · ' : null}
                      {item.color ? `Màu: ${item.color}` : null}
                    </p>
                    <p className="text-lg font-medium">
                      {item.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.key)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="h-10 w-10 border-black"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="h-10 w-10 border-black"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-lg font-semibold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-2 border-black p-8 h-fit sticky top-24 bg-white">
            <h3 
              className="mb-8 pb-6 border-b border-border velora-heading" 
              style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
            >
              Tổng đơn hàng
            </h3>

            <div className="space-y-4 mb-8 pb-8 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vận chuyển</span>
                <span className="font-medium">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between mb-8 text-lg">
              <span className="font-medium">Tổng cộng</span>
              <span 
                className="text-2xl font-semibold velora-heading" 
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {total.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <Button asChild className="w-full bg-black text-white hover:bg-gray-800 h-14 mb-4">
              <Link to="/checkout">
                Thanh toán
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full border-black hover:bg-secondary"
            >
              <Link to="/shop">
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <VeloraFooterNew />
    </div>
  );
}