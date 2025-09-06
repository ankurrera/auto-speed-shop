import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAddresses } from "@/hooks/useAddresses";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AddressForm } from "@/components/addresses/AddressForm";
import { AddressList } from "@/components/addresses/AddressList";
import { OrderList } from "@/components/orders/OrderList";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductList } from "@/components/admin/ProductList";
import { SellerAccountForm } from "@/components/admin/SellerAccountForm";
import PasswordResetForm from "@/components/PasswordResetForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/database.types";

type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

const Account = () => {
  const [view, setView] = useState("login");
  const [adminExists, setAdminExists] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerExistsForAdmin, setSellerExistsForAdmin] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const { isLoggedIn, isLoading, user, login, signup, logout, resetPassword } = useAuth();
  const { userInfo, setUserInfo, isEditing, setIsEditing, fetchUserProfile, updateProfile } = useProfile();
  const { addresses, showAddressForm, setShowAddressForm, editingAddressId, formAddress, setFormAddress, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress, editAddress } = useAddresses();
  const { orders, fetchOrders } = useOrders();
  const products = useProducts(sellerId);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView("reset");
      }
    });

    const checkAdminExists = async () => {
      const { data, count } = await supabase
        .from('profiles')
        .select('is_admin', { count: 'exact' })
        .eq('is_admin', true);
      setAdminExists(count > 0);
    };

    checkAdminExists();
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
      fetchAddresses(user.id);
      fetchOrders(user.id);
      checkSellerExists(user.id);
    }
  }, [user, fetchUserProfile, fetchAddresses, fetchOrders]);

  const checkSellerExists = async (userId: string) => {
    const { data: sellerData } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (sellerData) {
      setSellerId(sellerData.id);
      setSellerExistsForAdmin(true);
    }
  };

  if (view === "reset") {
    return <PasswordResetForm />;
  }

  if (!isLoggedIn) {
    return view === "login" ? (
      <LoginForm 
        onLogin={login}
        onSwitchToSignup={() => setView("signup")}
        onForgotPassword={resetPassword}
      />
    ) : (
      <SignupForm 
        onSignup={signup}
        onSwitchToLogin={() => setView("login")}
        adminExists={adminExists}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <div className="h-4 w-80 bg-muted rounded"></div>
            <div className="h-12 w-full bg-muted rounded"></div>
            <div className="h-48 w-full bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname.split('/').pop();

  const renderContent = () => {
    switch (currentPath) {
      case 'addresses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Addresses</h2>
              <Button onClick={() => setShowAddressForm(true)}>Add New Address</Button>
            </div>
            {showAddressForm && (
              <AddressForm
                formAddress={formAddress}
                setFormAddress={setFormAddress}
                editingAddressId={editingAddressId}
                onSave={() => saveAddress(user!.id)}
                onCancel={() => {
                  setShowAddressForm(false);
                  setFormAddress({
                    first_name: "", last_name: "", address_line_1: "", address_line_2: "",
                    city: "", state: "", postal_code: "", country: "US", phone: "", 
                    type: "shipping", is_default: false
                  });
                }}
              />
            )}
            <AddressList
              addresses={addresses}
              onEdit={editAddress}
              onDelete={(id) => deleteAddress(id, user!.id)}
              onSetDefault={(id) => setDefaultAddress(id, user!.id)}
            />
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Orders</h2>
            <OrderList orders={orders} />
          </div>
        );
      case 'admin-dashboard':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <Button onClick={logout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            {!sellerExistsForAdmin && <SellerAccountForm onSellerCreated={() => checkSellerExists(user!.id)} />}
            <ProductForm 
              listingType={products.listingType}
              setListingType={products.setListingType}
              editingProductId={products.editingProductId}
              productInfo={products.productInfo}
              setProductInfo={products.setProductInfo}
              vehicleYears={products.vehicleYears}
              vehicleMakes={products.vehicleMakes}
              vehicleModels={products.vehicleModels}
              onImageUpload={products.handleImageUpload}
              onRemoveImage={products.removeImage}
              onSubmit={handleProductSubmit} 
            />
            <ProductList 
              products={products.products}
              parts={products.parts}
              searchQuery={products.searchQuery}
              setSearchQuery={products.setSearchQuery}
              onEditProduct={products.handleEditProduct}
              onEditPart={(part) => products.handleEditProduct(part as Product | Part)}
              onDeleteProduct={products.handleDeleteProduct}
              onDeletePart={products.handleDeletePart}
              onArchiveProduct={products.handleArchiveProduct}
              onArchivePart={products.handleArchivePart}
            />
          </div>
        );
      case 'analytics-dashboard':
        return <AnalyticsDashboard />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Account</h2>
              <Button onClick={logout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <ProfileForm
              userInfo={userInfo}
              setUserInfo={setUserInfo}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onSave={(updates) => updateProfile(user!.id, updates)}
            />
          </div>
        );
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("User ID not found. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append('name', products.productInfo.name);
    formData.append('description', products.productInfo.description);
    formData.append('price', products.productInfo.price);
    formData.append('stock_quantity', products.productInfo.stock_quantity.toString());
    formData.append('category', products.productInfo.category);
    formData.append('specifications', products.productInfo.specifications);

    products.productFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });

      if (response.ok) {
        alert('Product listed successfully!');
        products.cleanupAndRefetch();
      } else {
        // Handle potential JSON parsing errors
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Unknown error';
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        alert(`Failed to list product: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error listing product:", error);
      alert("Failed to list product. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Account;
