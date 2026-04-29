import { Link, useLocation } from "react-router";
import { useCart } from "../contexts/CartContext";
import { VeloraLogo } from "./VeloraLogo";

export function VeloraHeader() {
  const location = useLocation();
  const { getTotalItems } = useCart();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-white">
      {/* Top announcement bar */}
      <div className="bg-black text-white text-center py-2">
        <p className="text-xs uppercase tracking-wider">Free Shipping on Orders Over $100</p>
      </div>
      
      {/* Main navigation */}
      <div className="velora-container">
        <div className="flex items-center justify-between py-6">
          {/* Left Navigation */}
          <nav className="flex gap-12">
            <Link 
              to="/" 
              className={`text-sm uppercase tracking-wider transition-opacity ${
                isActive("/") ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className={`text-sm uppercase tracking-wider transition-opacity ${
                isActive("/shop") ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              Shop
            </Link>
            <Link 
              to="/about" 
              className={`text-sm uppercase tracking-wider transition-opacity ${
                isActive("/about") ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm uppercase tracking-wider transition-opacity ${
                isActive("/contact") ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Center Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 velora-logo-interactive">
            <VeloraLogo size="small" showSubtitle={false} showUnderline={false} />
          </Link>

          {/* Right Navigation */}
          <div className="flex gap-8">
            <Link 
              to="/admin" 
              className="text-sm uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
            >
              Admin
            </Link>
            <Link 
              to="/cart" 
              className="text-sm uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity relative"
            >
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-3 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}