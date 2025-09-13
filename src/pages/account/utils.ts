import { supabase } from "@/integrations/supabase/client";
import { EmailSubscriptionService } from "@/services/emailSubscriptionService";
import EmailNotificationService from "../../services/emailNotificationService";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Product, PartWithSpecs, PartSpecifications } from "./types";

// Helper function to check if user has admin access
export const hasAdminAccess = (userInfo: any) => {
  return userInfo.is_admin && 
         (userInfo.role === "admin" || 
          (userInfo.is_seller && userInfo.role === "admin"));
};

export const fetchUserAddresses = async (userId: string, setAddresses: (addresses: any[]) => void) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!error) setAddresses(data || []);
};

export const fetchUserOrders = async (userId: string, setOrders: (orders: any[]) => void) => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, order_number, status, total_amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!error && data) {
    setOrders(
      data.map((order) => ({
        id: order.id,
          date: new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        orderNumber: order.order_number,
        status: order.status,
        total: order.total_amount,
      }))
    );
  }
};

export const fetchUserProfile = async (
  userId: string, 
  setUserInfo: (userInfo: any) => void,
  setSellerExistsForAdmin: (exists: boolean) => void,
  setEmailSubscription: (subscription: any) => void
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, is_admin, is_seller, role")
    .eq("user_id", userId)
    .single();
  
  if (!error && data) {
    setUserInfo({
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      phone: data.phone || "",
      is_admin: data.is_admin || false,
      is_seller: data.is_seller || false,
      role: data.role || "user",
    });
    setSellerExistsForAdmin(data.is_seller || false);

    // Fetch email subscription preferences
    try {
      const subscription = await EmailSubscriptionService.getUserSubscription(userId);
      if (subscription) {
        setEmailSubscription({
          subscribed: subscription.subscribed_to_new_products,
          loading: false,
          exists: true,
        });
      } else {
        setEmailSubscription({
          subscribed: false,
          loading: false,
          exists: false,
        });
      }
    } catch (subscriptionError) {
      console.error("Error fetching email subscription:", subscriptionError);
      setEmailSubscription({
        subscribed: false,
        loading: false,
        exists: false,
      });
    }
  } else {
    console.error("Account: Error fetching profile or no data:", error, "User ID:", userId);
    
    // If profile doesn't exist, try to create one from auth user data
    if (error && error.code === 'PGRST116') { // No rows returned
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: createError } = await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              first_name: user.user_metadata?.first_name || "",
              last_name: user.user_metadata?.last_name || "",
              email: user.email || "",
              phone: user.user_metadata?.phone || "",
              is_admin: false,
              is_seller: false,
            },
            { onConflict: "user_id" }
          );
          
          if (!createError) {
            // Retry fetching the profile
            fetchUserProfile(userId, setUserInfo, setSellerExistsForAdmin, setEmailSubscription);
          } else {
            console.error("Account: Failed to create profile:", createError);
          }
        }
      } catch (createProfileError) {
        console.error("Account: Error creating profile:", createProfileError);
      }
    }
  }
};

export const checkSellerExists = async (
  userId: string, 
  setSellerExistsForAdmin: (exists: boolean) => void,
  setSellerId: (id: string | null) => void
) => {
  const { count, error } = await supabase
    .from("profiles")
    .select("is_seller", { count: "exact" })
    .eq("is_seller", true);
  if (!error) {
    setSellerExistsForAdmin((count || 0) > 0);
    if ((count || 0) > 0) {
      const { data: sellerInfoData } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (sellerInfoData) setSellerId(sellerInfoData.id);
    }
  }
};

export const fetchAndSetUserData = async (
  userId: string,
  setIsLoading: (loading: boolean) => void,
  setUserInfo: (userInfo: any) => void,
  setSellerExistsForAdmin: (exists: boolean) => void,
  setEmailSubscription: (subscription: any) => void,
  setAddresses: (addresses: any[]) => void,
  setOrders: (orders: any[]) => void,
  setSellerId: (id: string | null) => void
) => {
  setIsLoading(true);
  await fetchUserProfile(userId, setUserInfo, setSellerExistsForAdmin, setEmailSubscription);
  await fetchUserAddresses(userId, setAddresses);
  await fetchUserOrders(userId, setOrders);
  await checkSellerExists(userId, setSellerExistsForAdmin, setSellerId);
  setIsLoading(false);
};

export const handleSaveProfile = async (userInfo: any, setIsEditing: (editing: boolean) => void) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: userInfo.firstName,
      last_name: userInfo.lastName,
      phone: userInfo.phone,
    })
    .eq("user_id", session.user.id);
  if (!error) setIsEditing(false);
};

export const handleEmailSubscriptionChange = async (
  subscribed: boolean,
  emailSubscription: any,
  userInfo: any,
  setEmailSubscription: (subscription: any) => void
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  setEmailSubscription(prev => ({ ...prev, loading: true }));

  try {
    if (emailSubscription.exists) {
      // Update existing subscription
      await EmailSubscriptionService.updateSubscription(session.user.id, subscribed);
    } else {
      // Create new subscription
      await EmailSubscriptionService.upsertSubscription(
        session.user.id, 
        userInfo.email, 
        subscribed
      );
    }

    setEmailSubscription({
      subscribed,
      loading: false,
      exists: true,
    });
  } catch (error) {
    console.error("Error updating email subscription:", error);
    setEmailSubscription(prev => ({ ...prev, loading: false }));
  }
};

export const sendNotificationsAsync = async (
  currentSellerId: string,
  isPart: boolean,
  priceValue: number,
  finalImageUrls: string[],
  productInfo: any,
  toast: any
) => {
  try {
    // Get seller name for the notification
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("name")
      .eq("id", currentSellerId)
      .single();

    const sellerName = sellerData?.name || "Unknown Seller";

    // Send email notifications to subscribed users
    const notificationResult = await EmailNotificationService.sendNewProductNotifications({
      productName: productInfo.name,
      productDescription: productInfo.description,
      price: priceValue,
      sellerName,
      productType: isPart ? "part" : "product",
      imageUrl: finalImageUrls[0], // Use first image if available
      sellerId: currentSellerId,
    });

    // Show appropriate success message for notifications
    if (notificationResult.notificationsSent > 0) {
      toast({
        title: "Notifications Sent",
        description: `Email notifications have been sent to ${notificationResult.notificationsSent} subscribed users!`,
      });
    }
  } catch (notificationError) {
    console.error("Error sending notifications:", notificationError);
    // Show a warning toast but don't fail the main action
    toast({
      title: "Notification Warning",
      description: "Your product was listed successfully, but there was an issue sending email notifications. Check the browser console for detailed error information.",
      variant: "default",
    });
  }
};

export const cleanupAndRefetch = (
  setEditingProductId: (id: string | null) => void,
  setProductInfo: (info: any) => void,
  setProductFiles: (files: File[]) => void,
  queryClient: any
) => {
  setEditingProductId(null);
  setProductInfo({
    name: "",
    description: "",
    price: "",
    stock_quantity: 0,
    image_urls: [],
    specifications: "",
    category: "",
    make: "",
    model: "",
    year: "",
    vin: "",
  });
  setProductFiles([]);
  queryClient.invalidateQueries({ queryKey: ["seller-products"] });
  queryClient.invalidateQueries({ queryKey: ["seller-parts"] });
};

export const handleEditProduct = (
  product: Product,
  setEditingProductId: (id: string | null) => void,
  setListingType: (type: "part" | "product") => void,
  setProductInfo: (info: any) => void,
  setShowManageProducts: (show: boolean) => void
) => {
  setEditingProductId(product.id);
  setListingType("product");
  let specs: PartSpecifications = {};
  if (product.specifications) {
    if (typeof product.specifications === "string") {
      try {
        specs = JSON.parse(product.specifications);
      } catch {
        specs = { additional: product.specifications };
      }
    } else if (typeof product.specifications === "object") {
      specs = product.specifications as PartSpecifications;
    }
  }
  setProductInfo({
    name: product.name,
    description: product.description || "",
    price: product.price?.toString() || "",
    stock_quantity: product.stock_quantity || 0,
    image_urls: product.image_urls || [],
    specifications: specs.additional || "",
    category: product.category || specs.category || "",
    make: specs.make || "",
    model: specs.model || "",
    year: specs.year || "",
    vin: specs.vin || "",
  });
  setShowManageProducts(true);
};

export const handleEditPart = (
  part: PartWithSpecs,
  setEditingProductId: (id: string | null) => void,
  setListingType: (type: "part" | "product") => void,
  setProductInfo: (info: any) => void,
  setShowManageProducts: (show: boolean) => void
) => {
  setEditingProductId(part.id);
  const specs = part.specifications;
  setListingType("part");
  setProductInfo({
    name: part.name,
    description: part.description || "",
    price: part.price?.toString() || "",
    stock_quantity: part.stock_quantity || 0,
    image_urls: part.image_urls || [],
    specifications: specs?.additional || "",
    category: specs?.category || "",
    make: part.brand || specs?.make || "",
    model: specs?.model || "",
    year: specs?.year || "",
    vin: specs?.vin || "",
  });
  setShowManageProducts(true);
};

// Address utilities
export const handleEditAddress = (
  address: any,
  setEditingAddressId: (id: string | null) => void,
  setFormAddress: (address: any) => void,
  setShowAddressForm: (show: boolean) => void
) => {
  setEditingAddressId(address.id);
  setFormAddress(address);
  setShowAddressForm(true);
};

export const handleDeleteAddress = async (id: string, fetchUserAddresses: any, userId: string) => {
  await supabase.from("addresses").delete().eq("id", id);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) fetchUserAddresses(session.user.id);
};

export const handleSetDefaultAddress = async (addressId: string, fetchUserAddresses: any) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", session.user.id);
  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId);
  fetchUserAddresses(session.user.id);
};

export const handleAddressFormSubmit = async (
  e: any,
  formAddress: any,
  editingAddressId: string | null,
  setShowAddressForm: (show: boolean) => void,
  setEditingAddressId: (id: string | null) => void,
  setFormAddress: (address: any) => void,
  fetchUserAddresses: any
) => {
  e.preventDefault();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  if (formAddress.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", session.user.id);
  }

  const toSave = { ...formAddress, user_id: session.user.id };
  if (editingAddressId) {
    await supabase
      .from("addresses")
      .update(toSave)
      .eq("id", editingAddressId);
  } else {
    await supabase.from("addresses").insert([toSave]);
  }
  setShowAddressForm(false);
  setEditingAddressId(null);
  setFormAddress({
    first_name: "",
    last_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
    type: "shipping",
    is_default: false,
  });
  fetchUserAddresses(session.user.id);
};

export const handleLogout = async (setIsLoggedIn: (loggedIn: boolean) => void, navigate: any) => {
  await supabase.auth.signOut();
  setIsLoggedIn(false);
  navigate("/");
};