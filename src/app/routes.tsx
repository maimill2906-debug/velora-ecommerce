import { createBrowserRouter } from "react-router";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";

// VELORA FASHION Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { VeloraHomePage } from "./pages/VeloraHomePage";
import { VeloraShopPage } from "./pages/VeloraShopPage";
import { VeloraAdminDashboard } from "./pages/VeloraAdminDashboard";
import { POSPage } from "./pages/POSPage";
import { SalesDashboardPage } from "./pages/SalesDashboardPage";
import { WarehousePage } from "./pages/WarehousePage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { ProfilePage } from "./pages/ProfilePage";
import MarketingPage from "./pages/MarketingPage";
import { StaffRouteGuard } from "./components/StaffRouteGuard";

export const router = createBrowserRouter([
  {
    path: "/marketing",
    element: (
      <StaffRouteGuard allow={["marketing"]}>
        <MarketingPage />
      </StaffRouteGuard>
    ),
  },
  {
    path: "/",
    Component: VeloraHomePage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/shop",
    Component: VeloraShopPage,
  },
  {
    path: "/product/:id",
    Component: ProductDetailPage,
  },
  {
    path: "/cart",
    Component: CartPage,
  },
  {
    path: "/checkout",
    Component: CheckoutPage,
  },
  {
    path: "/order-tracking",
    Component: OrderTrackingPage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/admin",
    element: (
      <StaffRouteGuard allow={["admin"]}>
        <VeloraAdminDashboard />
      </StaffRouteGuard>
    ),
  },
  {
    path: "/sales",
    element: (
      <StaffRouteGuard allow={["sales"]}>
        <SalesDashboardPage />
      </StaffRouteGuard>
    ),
  },
  {
    path: "/pos",
    element: (
      <StaffRouteGuard allow={["sales"]}>
        <POSPage />
      </StaffRouteGuard>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <StaffRouteGuard allow={["warehouse"]}>
        <WarehousePage />
      </StaffRouteGuard>
    ),
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/contact",
    Component: ContactPage,
  },
]);