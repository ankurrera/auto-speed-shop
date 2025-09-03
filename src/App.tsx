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
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import { ThemeProvider } from "./components/ThemeProvider";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import ScrollToTop from "./components/ScrollToTop";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const queryClient = new QueryClient();

// Use the environment variable for the client ID
const paypalOptions = {
  "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID,
  "currency": "USD",
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <PayPalScriptProvider options={paypalOptions}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <CartProvider>
              <WishlistProvider>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/account/addresses" element={<Account />} />
                      <Route path="/account/orders" element={<Account />} />
                      <Route path="/account/admin-dashboard" element={<Account />} />
                      <Route path="/account/analytics-dashboard" element={<AnalyticsDashboard />} />
                      <Route path="/account/reset-password" element={<ResetPassword />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/products/:id" element={<ProductDetails />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </WishlistProvider>
            </CartProvider>
          </BrowserRouter>
        </TooltipProvider>
      </PayPalScriptProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;