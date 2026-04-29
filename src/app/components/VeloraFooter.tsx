import { Link } from "react-router";

export function VeloraFooter() {
  return (
    <footer className="border-t border-border bg-white mt-32">
      <div className="velora-container py-16">
        <div className="grid grid-cols-4 gap-16 mb-16">
          {/* Company */}
          <div>
            <h4 className="mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-6 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  All Products
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Sale
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-6 text-sm uppercase tracking-wider">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Shipping Information
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-6 text-sm uppercase tracking-wider">Newsletter</h4>
            <p className="text-sm opacity-60 mb-4">
              Subscribe to receive exclusive updates and offers.
            </p>
            <form className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="velora-input"
              />
              <button
                type="submit"
                className="velora-button-primary py-3 px-8"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex justify-between items-center">
          <p className="text-xs opacity-60 uppercase tracking-wider">
            © 2025 VELORA Fashion. Since 2025.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider">
              Privacy Policy
            </a>
            <a href="#" className="text-xs opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
