import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { CartProvider } from "./contexts/CartContext";
import { initZodVietnamese } from "../lib/zod-vi";

// Initialize Zod Vietnamese error messages
initZodVietnamese();

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster />
    </CartProvider>
  );
}