import { useState } from "react";
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
import NewArrivals from "./pages/NewArrivals";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import OrderDetails from "./pages/OrderDetails";
import CustomCheckout from "./pages/CustomCheckout";
import CustomOrderFlowDemo from "./pages/CustomOrderFlowDemo";
import InvoiceDemo from "./pages/InvoiceDemo";
import ShowInvoiceButtonDemo from "./pages/ShowInvoiceButtonDemo";
import TrackOrderDemo from "./pages/TrackOrderDemo";
import SellerDashboard from "./pages/SellerDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import ViewPayment from "./pages/ViewPayment";
import EmailSubscriptionDemo from "./components/EmailSubscriptionDemo";
import { ThemeProvider } from "./components/ThemeProvider";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import ScrollToTop from "./components/ScrollToTop";
import { DevCartHelper } from "./components/DevCartHelper";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const App = () => {
  const [showDevTools, setShowDevTools] = useState(false);

  const AppContent = () => (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
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
                    <Route path="/seller-dashboard" element={<SellerDashboard />} />
                    <Route path="/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/checkout" element={<CustomCheckout />} />
                    <Route path="/custom-checkout" element={<CustomCheckout />} />
                    <Route path="/custom-order-demo" element={<CustomOrderFlowDemo />} />
                    <Route path="/invoice-demo" element={<InvoiceDemo />} />
                    <Route path="/show-invoice-button-demo" element={<ShowInvoiceButtonDemo />} />
                    <Route path="/track-order-demo" element={<TrackOrderDemo />} />
                    <Route path="/admin/view-payment/:orderId" element={<ViewPayment />} />
                    <Route path="/order/:orderId" element={<OrderDetails />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/new-arrivals" element={<NewArrivals />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/orders/:orderId/tracking" element={<OrderTracking />} />
                    <Route path="/email-demo" element={<EmailSubscriptionDemo />} />
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
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;