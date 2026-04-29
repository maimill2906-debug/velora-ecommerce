import { VeloraHeader } from "../components/VeloraHeader";
import { VeloraFooter } from "../components/VeloraFooter";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  original_price: number | null;
}

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Product[]>("/catalog/products")
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    totalProducts: products.length,
    totalRevenue: products.reduce((sum, p) => sum + (p.original_price ?? 0), 0),
    avgRating: 0,
    totalOrders: 127,
  };

  return (
    <div className="min-h-screen bg-white">
      <VeloraHeader />

      <div className="velora-container py-16">
        <h1 className="mb-16 text-center">Admin Dashboard</h1>

        <div className="flex gap-16">
          {/* Sidebar Navigation - Text Only */}
          <aside className="w-64 flex-shrink-0">
            <nav className="sticky top-8 space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`block w-full text-left py-3 px-4 text-sm uppercase tracking-wider transition-all ${
                  activeTab === "overview"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`block w-full text-left py-3 px-4 text-sm uppercase tracking-wider transition-all ${
                  activeTab === "products"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`block w-full text-left py-3 px-4 text-sm uppercase tracking-wider transition-all ${
                  activeTab === "orders"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Orders
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-12">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="border border-border p-8">
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-4">
                      Total Products
                    </p>
                    <p className="text-3xl font-serif">{stats.totalProducts}</p>
                  </div>

                  <div className="border border-border p-8">
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-4">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-serif">${stats.totalRevenue.toFixed(0)}</p>
                  </div>

                  <div className="border border-border p-8">
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-4">
                      Avg Rating
                    </p>
                    <p className="text-3xl font-serif">{stats.avgRating.toFixed(1)}</p>
                  </div>

                  <div className="border border-border p-8">
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-4">
                      Total Orders
                    </p>
                    <p className="text-3xl font-serif">{stats.totalOrders}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-border">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-sm uppercase tracking-wider">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {[
                        { action: "New order placed", time: "2 minutes ago" },
                        { action: "Product updated", time: "1 hour ago" },
                        { action: "Customer inquiry", time: "3 hours ago" },
                        { action: "Inventory restocked", time: "1 day ago" },
                      ].map((activity, index) => (
                        <div key={index} className="flex justify-between text-sm pb-4 border-b border-border last:border-0">
                          <span>{activity.action}</span>
                          <span className="opacity-60">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="border border-border">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-sm uppercase tracking-wider">Product Management</h3>
                  <button className="velora-button-primary py-2 px-6 text-xs">
                    Add Product
                  </button>
                </div>

                {loading ? (
                  <div className="p-12 text-center">
                    <p className="opacity-60">Loading products...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                            ID
                          </th>
                          <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                            Product
                          </th>
                          <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                            Category
                          </th>
                          <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                            Price
                          </th>
                          <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 10).map((product) => (
                          <tr key={product.id} className="border-b border-border last:border-0">
                            <td className="p-4 text-sm">{product.id}</td>
                            <td className="p-4 text-sm max-w-xs truncate">{product.name}</td>
                            <td className="p-4 text-sm">-</td>
                            <td className="p-4 text-sm">{(product.original_price ?? 0).toLocaleString()}₫</td>
                            <td className="p-4 text-sm">
                              <button className="opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider text-xs">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-sm uppercase tracking-wider">Order Management</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                          Order ID
                        </th>
                        <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                          Customer
                        </th>
                        <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                          Date
                        </th>
                        <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                          Total
                        </th>
                        <th className="text-left p-4 text-xs uppercase tracking-wider opacity-60">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "ORD-001", customer: "John Smith", date: "2025-04-15", total: 299.99, status: "Shipped" },
                        { id: "ORD-002", customer: "Emma Wilson", date: "2025-04-15", total: 149.99, status: "Processing" },
                        { id: "ORD-003", customer: "Michael Brown", date: "2025-04-14", total: 499.99, status: "Delivered" },
                        { id: "ORD-004", customer: "Sarah Davis", date: "2025-04-14", total: 199.99, status: "Shipped" },
                        { id: "ORD-005", customer: "James Taylor", date: "2025-04-13", total: 349.99, status: "Processing" },
                      ].map((order) => (
                        <tr key={order.id} className="border-b border-border last:border-0">
                          <td className="p-4 text-sm">{order.id}</td>
                          <td className="p-4 text-sm">{order.customer}</td>
                          <td className="p-4 text-sm">{order.date}</td>
                          <td className="p-4 text-sm">${order.total.toFixed(2)}</td>
                          <td className="p-4 text-sm">{order.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <VeloraFooter />
    </div>
  );
}
