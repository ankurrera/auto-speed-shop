import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ProductDetails from "./pages/ProductDetails";
import NewArrivals from "./pages/NewArrivals"; // Import the new component
import { ThemeProvider } from "./components/ThemeProvider";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import ScrollToTop from "./components/ScrollToTop";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { DevCartHelper } from "./components/DevCartHelper";

const queryClient = new QueryClient();

// PayPal configuration - use environment variable or fallback to hardcoded client ID
const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";

const paypalOptions = {
  "clientId": paypalClientId,
  "currency": "USD",
};

const App = () => {
  const AppContent = () => (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <DevCartHelper />
                <main className="flex-1">
                  <Routes>
                    <Route path="/reset-password" element={<ResetPassword />} />
                    {/* All other routes are nested under the main app structure */}
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/account/*" element={<Account />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/new-arrivals" element={<NewArrivals />} /> {/* Add this line */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </WishlistProvider>
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PayPalScriptProvider options={paypalOptions}>
        <AppContent />
      </PayPalScriptProvider>
    </QueryClientProvider>
  );
};

export default App;