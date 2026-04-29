import { useState } from 'react';
import { Link } from 'react-router';
import { Search, Minus, Plus, Trash2, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
const logoImg =
  'https://dummyimage.com/240x80/000/fff.png&text=VELORA';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock products
  const products = [
    { id: 1, name: 'Áo sơ mi trắng basic', price: 450000, sku: 'VSM-WHT-001', stock: 25 },
    { id: 2, name: 'Quần tây đen ống suông', price: 550000, sku: 'VTR-BLK-001', stock: 18 },
    { id: 3, name: 'Áo khoác dạ cashmere', price: 1200000, sku: 'VKH-CSH-001', stock: 12 },
    { id: 4, name: 'Váy midi đen', price: 680000, sku: 'VMD-BLK-001', stock: 15 },
    { id: 5, name: 'Áo thun basic trắng', price: 250000, sku: 'VTH-WHT-001', stock: 40 },
    { id: 6, name: 'Quần jean xanh', price: 490000, sku: 'VJN-BLU-001', stock: 22 },
  ];

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        sku: product.sku,
      }]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = 0; // Vietnam typically includes VAT in price
  const total = subtotal + tax;

  const handleCheckout = (paymentMethod: string) => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    
    console.log('Checkout with:', paymentMethod, cart);
    alert(`Thanh toán thành công bằng ${paymentMethod}!\nTổng: ${total.toLocaleString('vi-VN')}₫`);
    setCart([]);
  };

  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-16 border-b-2 border-black flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="VELORA" className="h-10 w-auto" />
          <Separator orientation="vertical" className="h-8 bg-border" />
          <h1 className="text-lg uppercase tracking-wider font-medium">Point of Sale</h1>
        </div>
        <Button variant="outline" className="border-black" asChild>
          <Link to="/admin">
            <LogOut className="h-4 w-4 mr-2" />
            Thoát POS
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-black text-base"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="velora-card text-left p-4 hover:bg-secondary transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium pr-2">{product.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {product.stock}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
                  <p className="text-lg font-semibold">{product.price.toLocaleString('vi-VN')}₫</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 border-l-2 border-black flex flex-col bg-secondary">
          {/* Cart Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg uppercase tracking-wider font-medium">
                Giỏ hàng ({cart.length})
              </h2>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Giỏ hàng trống</p>
                <p className="text-sm mt-2">Chọn sản phẩm để thêm vào</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="velora-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.sku}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 border-black"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 border-black"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t-2 border-black p-6 bg-white">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thuế VAT</span>
                  <span className="font-medium">{tax.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-medium">Tổng cộng</span>
                <span className="text-2xl font-semibold velora-heading" style={{ fontFamily: 'var(--font-heading)' }}>
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <Tabs defaultValue="cash" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="cash">Tiền mặt</TabsTrigger>
                <TabsTrigger value="card">Thẻ</TabsTrigger>
                <TabsTrigger value="wallet">Ví</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cash">
                <Button 
                  onClick={() => handleCheckout('Tiền mặt')}
                  className="w-full h-14 bg-black text-white hover:bg-gray-800 text-base"
                  disabled={cart.length === 0}
                >
                  Thanh toán tiền mặt
                </Button>
              </TabsContent>

              <TabsContent value="card">
                <Button 
                  onClick={() => handleCheckout('Thẻ')}
                  className="w-full h-14 bg-black text-white hover:bg-gray-800 text-base"
                  disabled={cart.length === 0}
                >
                  Thanh toán thẻ
                </Button>
              </TabsContent>

              <TabsContent value="wallet">
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleCheckout('MoMo')}
                    variant="outline"
                    className="w-full h-12 border-black hover:bg-black hover:text-white"
                    disabled={cart.length === 0}
                  >
                    MoMo
                  </Button>
                  <Button 
                    onClick={() => handleCheckout('ZaloPay')}
                    variant="outline"
                    className="w-full h-12 border-black hover:bg-black hover:text-white"
                    disabled={cart.length === 0}
                  >
                    ZaloPay
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              className="w-full mt-4 border-gray-300"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Hủy đơn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
