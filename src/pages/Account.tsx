/* eslint-disable @typescript-eslint/no-explicit-any */
// Updated Admin Dashboard layout with "Manage Products" modal
// Moves the existing part/product listing + management UI behind the "Manage Products" quick action
// Preserves prior profile / addresses / orders logic

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import {
  User as UserIcon,
  MapPin,
  Package,
  LogOut,
  Edit,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Search,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Users,
  X,
  Plus,
  RefreshCcw,
  Car,
  FileText,
  Star,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/database.types";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import AdminUserManagement from "@/components/AdminUserManagement";
import AdminOrderManagement from "@/components/AdminOrderManagement";
import AdminInvoiceManagement from "@/components/AdminInvoiceManagement";
import AdminPaymentManagement from "@/components/AdminPaymentManagement";
import AdminPayoutManagement from "@/components/AdminPayoutManagement";
import AdminInventoryManagement from "@/components/AdminInventoryManagement";
import AdminDiscountCouponManagement from "@/components/AdminDiscountCouponManagement";
import AdminCustomerSupportTools from "@/components/AdminCustomerSupportTools";
import { EmailSubscriptionService } from "@/services/emailSubscriptionService";
import { EmailNotificationService } from "@/services/emailNotificationService";
import { ORDER_STATUS } from "@/types/order";

type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

interface PartSpecifications {
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  additional?: string;
  [key: string]: unknown;
}

interface PartWithSpecs extends Omit<Part, 'specifications'> {
  specifications: PartSpecifications | null;
}

const categories = [
  "Engine Parts", "Valvetrain", "Fuel supply system", "Air intake and exhaust systems",
  "Turbochargers / Superchargers", "Ignition system", "Engine lubrication components",
  "Engine cooling system", "Engine electrical parts", "Differential", "Axle", "AD / ADAS",
  "Telematics / Car navigation", "Entertainment / Audio", "Keys", "ECU", "Motors",
  "Interior switch", "Sensor", "Electrical parts", "Cable / Connector", "Climate control system",
  "HVAC module", "Air conditioner", "Heater", "EV climate control parts", "Climate control peripherals",
  "Instrument panel", "Display", "Airbag", "Seat", "Seat belt", "Pedal", "Interior trim",
  "Interior parts", "Lighting", "Bumper", "Window glass", "Exterior parts", "Chassis module",
  "Brake", "Sub-brake", "ABS / TCS / ESC", "Steering", "Suspension", "Tire & wheel",
  "Body panel / Frame", "Body reinforcement and protector", "Door", "Hood", "Trunk lid",
  "Sunroof", "Convertible roof", "Wiper", "Window washer", "Fuel tank", "General Parts",
];

const Account = () => {
  // Helper function to check if user has admin access (shared access)
  const hasAdminAccess = (userInfo: any) => {
    return userInfo.is_admin && 
           (userInfo.role === "admin" || 
            (userInfo.is_seller && userInfo.role === "admin"));
  };

  // Auth / profile
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showPaymentManagement, setShowPaymentManagement] = useState(false);
  const [showPayoutManagement, setShowPayoutManagement] = useState(false);
  const [showInventoryManagement, setShowInventoryManagement] = useState(false);
  const [showDiscountCouponManagement, setShowDiscountCouponManagement] = useState(false);
  const [showCustomerSupportTools, setShowCustomerSupportTools] = useState(false);

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMode, setLoginMode] = useState<"user" | "admin">("user");
  const [adminExists, setAdminExists] = useState(true);
  const [showSellerCreationAfterAdmin, setShowSellerCreationAfterAdmin] = useState(false);

  // Seller creation (admin)
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerAddress, setNewSellerAddress] = useState("");
  const [newSellerPhoneNumber, setNewSellerPhoneNumber] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");
  const [newSellerPassword, setNewSellerPassword] = useState("");
  const [sellerExistsForAdmin, setSellerExistsForAdmin] = useState(false);

  // User info
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
    role: "user",
  });

  // Email subscription state
  const [emailSubscription, setEmailSubscription] = useState({
    subscribed: false,
    loading: false,
    exists: false,
  });

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState({
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

  // Orders (user personal)
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin product management
  const [listingType, setListingType] = useState<"part" | "product">("part");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: 0,
    image_urls: [] as string[],
    specifications: "",
    category: "",
    make: "",
    model: "",
    year: "",
    vin: "",
  });
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [showManageProducts, setShowManageProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Routing / utilities
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();

  // Vehicle dropdown queries
  const { data: vehicleYears = [] } = useQuery({
    queryKey: ["vehicle-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_years")
        .select("year")
        .order("year", { ascending: false });
      if (error) throw error;
      return data.map((item) => item.year);
    },
  });

  const { data: vehicleMakes = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["vehicle-makes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_makes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleModels = [] } = useQuery<{ name: string }[]>({
    queryKey: ["vehicle-models", productInfo.make],
    queryFn: async () => {
      const makeId = vehicleMakes.find(
        (make) => make.name === productInfo.make
      )?.id;
      if (!makeId) return [];
      const { data, error } = await supabase
        .from("vehicle_models")
        .select("name")
        .eq("make_id", makeId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!productInfo.make,
  });

  // Products & parts (seller-specific)
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["seller-products", sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: parts = [] } = useQuery<PartWithSpecs[]>({
    queryKey: ["seller-parts", sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PartWithSpecs[];
    },
    enabled: !!sellerId,
  });

  // Admin metrics (totals)
  const { data: adminMetrics } = useQuery({
    queryKey: ["admin-metrics"],
    enabled: hasAdminAccess(userInfo),
    queryFn: async () => {
      // Get current user for admin functions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [{ count: orderItemsCount }, productRes, partRes, allOrdersRes] =
        await Promise.all([
          // Count from order_items table instead of orders table
          supabase.from("order_items").select("*", { count: "exact", head: true }),
          supabase.from("products").select("id, price, stock_quantity, is_active"),
          supabase.from("parts").select("id, price, stock_quantity, is_active"),
          // Use admin function to get all orders for revenue calculation
          supabase.rpc('get_all_orders_for_admin', {
            requesting_user_id: user.id
          })
        ]);

      let revenue = 0;
      if (allOrdersRes.data) {
        // Only include confirmed orders in revenue calculation
        revenue = allOrdersRes.data
          .filter((row: { status: string }) => row.status === 'confirmed')
          .reduce(
            (sum: number, row: { total_amount: number }) => sum + (row.total_amount || 0),
            0
          );
      }

      return {
        orders: orderItemsCount ?? 0, // Now showing count from order_items table
        productsActive: [
          ...(productRes.data || []),
          ...(partRes.data || []),
        ].filter((p: any) => p.is_active).length,
        revenue,
      };
    },
  });

  // Utility fetchers
  const fetchUserAddresses = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setAddresses(data || []);
  }, []);

  const fetchUserOrders = useCallback(async (userId: string) => {
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
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
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
              fetchUserProfile(userId);
            } else {
              console.error("Account: Failed to create profile:", createError);
            }
          }
        } catch (createProfileError) {
          console.error("Account: Error creating profile:", createProfileError);
        }
      }
    }
  }, []);

  const checkSellerExists = useCallback(async (userId: string) => {
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
  }, []);

  const fetchAndSetUserData = useCallback(
    async (userId: string) => {
      setIsLoading(true);
      await fetchUserProfile(userId);
      await fetchUserAddresses(userId);
      await fetchUserOrders(userId);
      await checkSellerExists(userId);
      setIsLoading(false);
    },
    [fetchUserProfile, fetchUserAddresses, fetchUserOrders, checkSellerExists]
  );

  // Save profile
  const handleSaveProfile = async () => {
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

  // Handle email subscription changes
  const handleEmailSubscriptionChange = async (subscribed: boolean) => {
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

      // Show success message
      toast({
        title: "Preferences Updated",
        description: subscribed 
          ? "You will now receive email notifications about new products and parts!" 
          : "You have been unsubscribed from email notifications.",
      });

    } catch (error) {
      console.error("Error updating email subscription:", error);
      setEmailSubscription(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Error",
        description: "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auth listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // could show a reset view if desired
        }
        if (session) {
          setIsLoggedIn(true);
          fetchAndSetUserData(session.user.id);
        } else {
          setIsLoggedIn(false);
          setUserInfo({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            is_admin: false,
            is_seller: false,
            role: "user",
          });
          setAddresses([]);
          setOrders([]);
          setIsLoading(false);
        }
      }
    );

    const checkAdminExists = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("is_admin", { count: "exact" })
        .eq("is_admin", true);
      setAdminExists((count || 0) > 0);
    };

    const initial = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initial();
    checkAdminExists();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSetUserData]);

  // Auth handlers
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert("Login failed: " + error.message);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", data.user.id)
      .single();

    if (profileError) {
      alert("Could not retrieve profile info");
      await supabase.auth.signOut();
      return;
    }
    if (profileData?.is_admin && loginMode === "admin") {
      setIsLoggedIn(true);
      fetchAndSetUserData(data.user.id);
      // Navigate to admin dashboard after successful admin login
      navigate("/account/admin-dashboard");
    } else if (!profileData?.is_admin && loginMode === "user") {
      setIsLoggedIn(true);
      fetchAndSetUserData(data.user.id);
    } else {
      alert("Invalid login mode for this account.");
      await supabase.auth.signOut();
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    if (loginMode === "admin" && adminExists) {
      alert("Admin already exists.");
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { first_name: firstName, last_name: lastName, phone: phone || "" },
        },
      });
      
      if (error) {
        console.error("Signup error:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes("User already registered")) {
          alert("An account with this email already exists. Please try logging in instead, or use a different email address.");
          setView("login");
          return;
        } else if (error.message && error.message.includes("Email rate limit exceeded")) {
          alert("Too many signup attempts. Please wait a moment before trying again.");
          return;
        } else if (error.message && error.message.includes("Invalid email")) {
          alert("Please enter a valid email address.");
          return;
        } else {
          alert("Signup failed: " + error.message);
          return;
        }
      }

      // Create profile record in profiles table with retry logic
      if (data.user) {
        let profileCreated = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!profileCreated && retryCount < maxRetries) {
          try {
            const { error: profileError } = await supabase.from("profiles").upsert(
              {
                user_id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || "",
                is_admin: loginMode === "admin",
                is_seller: false,
              },
              { onConflict: "user_id" }
            );
            
            if (profileError) {
              console.error(`Profile creation attempt ${retryCount + 1} failed:`, profileError);
              
              // Handle specific profile creation errors
              if (profileError.code === "23505") { // Unique constraint violation
                console.log("Profile already exists, continuing...");
                profileCreated = true;
              } else if (profileError.code === "42501") { // RLS policy violation
                console.error("Profile creation denied by RLS policy:", profileError);
                throw new Error("Profile creation failed due to permissions. Please contact support.");
              } else if (retryCount === maxRetries - 1) {
                throw new Error(`Profile creation failed after ${maxRetries} attempts: ${profileError.message}`);
              }
            } else {
              profileCreated = true;
              console.log("Profile created successfully");
            }
          } catch (profileErr: any) {
            console.error(`Profile creation error on attempt ${retryCount + 1}:`, profileErr);
            if (retryCount === maxRetries - 1) {
              // Log the error but don't prevent signup completion
              console.error("Profile creation failed completely, but user account was created");
            }
          }
          
          retryCount++;
          if (!profileCreated && retryCount < maxRetries) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Explicit update to ensure all fields are set correctly (fixes race condition with auth trigger)
      if (data.user) {
        try {
          await supabase
            .from("profiles")
            .update({
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: phone || "",
              is_admin: loginMode === "admin",
              is_seller: false,
              role: loginMode === "admin" ? "admin" : "user",
            })
            .eq("user_id", data.user.id);
          console.log("Profile updated successfully with all fields");
        } catch (updateError) {
          console.error("Failed to update profile after signup:", updateError);
          // Continue anyway since the user was created
        }
      }

      if (loginMode === "admin") {
        setAdminExists(true);
        alert("Admin account created successfully. Please log in to access your admin dashboard.");
        setShowSellerCreationAfterAdmin(true); // Show seller creation form
      } else {
        alert("Account created successfully! Please check your email to confirm your account before logging in.");
      }
      
      // Clear form and switch to login
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setView("login");
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      
      // Handle network/connection errors
      if (error.message && error.message.includes("Failed to fetch")) {
        alert("Network error: Please check your internet connection and try again.");
      } else {
        alert("An unexpected error occurred during signup: " + (error.message || "Unknown error"));
      }
    }
  };

  // Seller creation
  const handleCreateSellerAccount = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newSellerName || !newSellerEmail || !newSellerPassword) {
      alert("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    
    if (newSellerPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    try {
      let userId: string | null = null;

      const { data: newUserData, error: signUpError } = await supabase.auth.signUp(
        {
          email: newSellerEmail,
          password: newSellerPassword,
          options: {
            data: { first_name: newSellerName, is_seller: true },
          },
        }
      );

      if (signUpError) {
        console.error("Seller signup error:", signUpError);
        
        if (signUpError.message.includes("User already registered")) {
          // Check if user exists in profiles table
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id, is_seller")
            .eq("email", newSellerEmail)
            .maybeSingle();
            
          if (existingProfile) {
            if (existingProfile.is_seller) {
              alert("This email is already associated with a seller account.");
              return;
            }
            userId = existingProfile.user_id;
            console.log("Found existing user profile, will update to seller status");
          } else {
            // Try to authenticate to get user ID
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: newSellerEmail,
                password: newSellerPassword,
              });
            if (signInError) {
              alert("User exists but authentication failed. Please check the password or use a different email.");
              return;
            }
            userId = signInData.user.id;
            // Sign out immediately since we were just testing the credentials
            await supabase.auth.signOut();
          }
        } else {
          alert("Seller account creation failed: " + signUpError.message);
          return;
        }
      } else {
        userId = newUserData?.user?.id || null;
      }

      if (!userId) {
        alert("Could not resolve user ID. Please try again.");
        return;
      }

      // Update or create profile with seller status
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          is_seller: true,
          email: newSellerEmail,
          first_name: newSellerName,
        },
        { onConflict: "user_id" }
      );
      
      if (upsertError) {
        console.error("Profile upsert error:", upsertError);
        alert("Failed to update user profile: " + upsertError.message);
        return;
      }

      // Create seller record
      const { error: sellerInsertError } = await supabase.from("sellers").insert({
        user_id: userId,
        name: newSellerName,
        address: newSellerAddress || "",
        email: newSellerEmail,
        phone: newSellerPhoneNumber || "",
      });
      
      if (sellerInsertError) {
        console.error("Seller insert error:", sellerInsertError);
        
        // Handle specific seller creation errors
        if (sellerInsertError.code === "23505") { // Unique constraint violation
          alert("A seller account with this information already exists.");
        } else {
          alert("Failed to create seller record: " + sellerInsertError.message);
        }
        return;
      }

      // Ensure profile is marked as seller (redundant but safe)
      await supabase
        .from("profiles")
        .update({ is_seller: true })
        .eq("user_id", userId);

      alert("Seller account created successfully!");
      
      // Clear form
      setNewSellerName("");
      setNewSellerAddress("");
      setNewSellerEmail("");
      setNewSellerPassword("");
      setNewSellerPhoneNumber("");

      // If this was after admin creation, redirect to login
      if (showSellerCreationAfterAdmin) {
        setShowSellerCreationAfterAdmin(false);
        setView("login");
        alert("Seller account created! Please log in with your admin credentials to access the admin dashboard.");
      } else {
        // Refresh user data if admin is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) fetchAndSetUserData(session.user.id);
      }
      
    } catch (error: any) {
      console.error("Unexpected seller creation error:", error);
      
      // Handle network/connection errors
      if (error.message && error.message.includes("Failed to fetch")) {
        alert("Network error: Please check your internet connection and try again.");
      } else {
        alert("An unexpected error occurred while creating seller account: " + (error.message || "Unknown error"));
      }
    }
  };

  // Product/Part submission
  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in.",
          variant: "destructive",
        });
        return;
      }

      let currentSellerId = sellerId;
      if (!currentSellerId) {
        const { data: sellerData, error: sellerError } = await supabase
          .from("sellers")
          .select("id")
          .eq("user_id", session.user.id)
          .single();
        if (sellerError) {
          toast({
            title: "Error",
            description: "Seller ID not found.",
            variant: "destructive",
          });
          return;
        }
        currentSellerId = sellerData.id;
        setSellerId(currentSellerId);
      }

      // Show initial progress
      toast({
        title: "Processing...",
        description: "Uploading images and saving your listing...",
      });

      const uploadedImageUrls: string[] = [];
      if (productFiles.length > 0) {
        const bucketName =
          listingType === "part" ? "part_images" : "products_images";
        for (const f of productFiles) {
          const ext = f.name.split(".").pop();
          const filePath = `${session.user.id}/${uuidv4()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, f, { upsert: true });
          if (uploadError) {
            toast({
              title: "Error",
              description: "Image upload failed.",
              variant: "destructive",
            });
            return;
          }
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          uploadedImageUrls.push(publicUrlData.publicUrl);
        }
      }

      const finalImageUrls = editingProductId
        ? [...productInfo.image_urls, ...uploadedImageUrls]
        : uploadedImageUrls;

      // Vehicle compatibility (optional)
      let vehicleId: string | null = null;
      if (productInfo.year && productInfo.make && productInfo.model) {
        try {
          const makeId = vehicleMakes.find(
            (m) => m.name === productInfo.make
          )?.id;
          if (!makeId) throw new Error("Make not found");
          const { data: yearRow } = await supabase
            .from("vehicle_years")
            .select("id")
            .eq("year", parseInt(productInfo.year, 10))
            .single();
          const { data: modelRow } = await supabase
            .from("vehicle_models")
            .select("id")
            .eq("name", productInfo.model)
            .eq("make_id", makeId)
            .single();
          const { data: existingVehicle, error: exErr } = await supabase
            .from("vehicles_new")
            .select("id")
            .eq("make_id", makeId)
            .eq("model_id", modelRow?.id)
            .eq("year_id", yearRow?.id)
            .maybeSingle();
          if (exErr && exErr.code !== "PGRST116") throw exErr;
          if (existingVehicle) {
            vehicleId = existingVehicle.id;
          } else {
            const { data: newVehicle, error: vehicleInsertError } =
              await supabase
                .from("vehicles_new")
                .insert({
                  make_id: makeId,
                  model_id: modelRow?.id,
                  year_id: yearRow?.id,
                })
                .select("id")
                .single();
            if (vehicleInsertError) throw vehicleInsertError;
            vehicleId = newVehicle.id;
          }
        } catch (err: any) {
          toast({
            title: "Error",
            description:
              "Vehicle compatibility failed: " + (err.message || "Unknown"),
            variant: "destructive",
          });
          return;
        }
      }

      const isPart = listingType === "part";
      const priceValue = parseFloat(productInfo.price);
      const stockValue = Number(productInfo.stock_quantity);
      if (isNaN(priceValue) || isNaN(stockValue)) {
        toast({
          title: "Error",
          description: "Price / quantity invalid",
          variant: "destructive",
        });
        return;
      }

      const specificationsPayload = {
        category: productInfo.category,
        make: productInfo.make,
        model: productInfo.model,
        year: productInfo.year,
        vin: productInfo.vin,
        additional: productInfo.specifications,
      };

      let payload: any;
      if (isPart) {
        payload = {
          name: productInfo.name,
          description: productInfo.description,
          price: priceValue,
          stock_quantity: stockValue,
          brand: productInfo.make,
          seller_id: currentSellerId,
          specifications: specificationsPayload,
          image_urls: finalImageUrls,
          is_active: stockValue > 0,
          is_featured: false,
        };
      } else {
        payload = {
          name: productInfo.name,
          description: productInfo.description,
          price: priceValue,
          stock_quantity: stockValue,
          seller_id: currentSellerId,
          image_urls: finalImageUrls,
          is_active: stockValue > 0,
          is_featured: false,
          category: productInfo.category,
          product_type: "GENERIC",
        };
      }

      const table = isPart ? "parts" : "products";
      const { data: savedItem, error } = editingProductId
        ? await supabase
            .from(table)
            .update(payload)
            .eq("id", editingProductId)
            .select()
            .single()
        : await supabase.from(table).insert([payload]).select().single();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (savedItem && vehicleId) {
        const fitmentTable = isPart ? "part_fitments" : "product_fitments";
        const fitmentPayload = isPart
          ? { part_id: savedItem.id, vehicle_id: vehicleId }
          : { product_id: savedItem.id, vehicle_id: vehicleId };
        await supabase.from(fitmentTable).upsert([fitmentPayload]);
      }

      // Show success immediately
      toast({
        title: "Success",
        description: `${isPart ? "Part" : "Product"} ${
          editingProductId ? "updated" : "listed"
        } successfully!`,
      });

      // Clean up form immediately for better UX
      cleanupAndRefetch();

      // Send email notifications asynchronously for new listings (not updates)
      if (!editingProductId && savedItem) {
        // Don't await this - let it run in background
        sendNotificationsAsync(currentSellerId, isPart, priceValue, finalImageUrls);
      }

    } catch (error: any) {
      console.error("Error in product submission:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Async function to handle email notifications without blocking UI
  const sendNotificationsAsync = async (
    currentSellerId: string, 
    isPart: boolean, 
    priceValue: number, 
    finalImageUrls: string[]
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
        description: "Your product was listed successfully, but there was an issue sending email notifications.",
        variant: "default",
      });
    }
  };

  const cleanupAndRefetch = () => {
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

  const handleEditProduct = (product: Product) => {
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

  const handleEditPart = (part: PartWithSpecs) => {
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

  // Deletion / archive mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Verify user has a sellerId
      if (!sellerId) {
        throw new Error("No seller ID found. Please contact support.");
      }
      
      // First verify the product belongs to this seller
      const { data: productCheck, error: checkError } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", productId)
        .single();
      
      if (checkError) {
        throw new Error(`Product not found: ${checkError.message}`);
      }
      
      if (productCheck.seller_id !== sellerId) {
        throw new Error("You can only delete your own products.");
      }
      
      // Delete related records first to avoid foreign key constraint errors
      // Delete from cart_items where product_id references this product
      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("product_id", productId);
      if (cartError) throw cartError;
      
      // Delete from wishlist where product_id references this product
      const { error: wishlistError } = await supabase
        .from("wishlist")
        .delete()
        .eq("product_id", productId);
      if (wishlistError) throw wishlistError;
      
      // Finally delete the product itself
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
    },
    onMutate: async (productId) => {
      // Cancel any outgoing refetches to prevent optimistic updates from being overwritten
      await queryClient.cancelQueries({ queryKey: ["seller-products"] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["seller-products"]);

      // Optimistically remove the product from the list
      queryClient.setQueryData(["seller-products"], (old: any) => {
        if (!old) return old;
        return old.filter((product: any) => product.id !== productId);
      });

      // Show immediate feedback
      toast({ 
        title: "Deleting...", 
        description: "Removing product from your listings..." 
      });

      return { previousProducts };
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Product removed successfully." });
    },
    onError: (error: any, productId, context) => {
      // Rollback to previous data on error
      if (context?.previousProducts) {
        queryClient.setQueryData(["seller-products"], context.previousProducts);
      }
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      // Verify user has a sellerId
      if (!sellerId) {
        throw new Error("No seller ID found. Please contact support.");
      }
      
      // First verify the part belongs to this seller
      const { data: partCheck, error: checkError } = await supabase
        .from("parts")
        .select("seller_id")
        .eq("id", partId)
        .single();
      
      if (checkError) {
        throw new Error(`Part not found: ${checkError.message}`);
      }
      
      if (partCheck.seller_id !== sellerId) {
        throw new Error("You can only delete your own parts.");
      }
      
      // Delete related records first to avoid foreign key constraint errors
      // Delete from cart_items where part_id references this part
      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("part_id", partId);
      if (cartError) throw cartError;
      
      // Delete from wishlist where part_id references this part
      const { error: wishlistError } = await supabase
        .from("wishlist")
        .delete()
        .eq("part_id", partId);
      if (wishlistError) throw wishlistError;
      
      // Delete from part_fitments where part_id references this part
      const { error: fitmentError } = await supabase
        .from("part_fitments")
        .delete()
        .eq("part_id", partId);
      if (fitmentError) throw fitmentError;
      
      // Finally delete the part itself
      const { error } = await supabase
        .from("parts")
        .delete()
        .eq("id", partId);
      if (error) throw error;
    },
    onMutate: async (partId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["seller-parts"] });

      // Snapshot the previous value
      const previousParts = queryClient.getQueryData(["seller-parts"]);

      // Optimistically remove the part from the list
      queryClient.setQueryData(["seller-parts"], (old: any) => {
        if (!old) return old;
        return old.filter((part: any) => part.id !== partId);
      });

      // Show immediate feedback
      toast({ 
        title: "Deleting...", 
        description: "Removing part from your listings..." 
      });

      return { previousParts };
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Part removed successfully." });
    },
    onError: (error: any, partId, context) => {
      // Rollback to previous data on error
      if (context?.previousParts) {
        queryClient.setQueryData(["seller-parts"], context.previousParts);
      }
      toast({
        title: "Error",
        description: `Failed to delete part: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["seller-parts"] });
    },
  });

  const archiveProductMutation = useMutation({
    mutationFn: async ({
      productId,
      is_active,
    }: {
      productId: string;
      is_active: boolean;
    }) => {
      // Verify user has a sellerId
      if (!sellerId) {
        throw new Error("No seller ID found. Please contact support.");
      }
      
      // First verify the product belongs to this seller
      const { data: productCheck, error: checkError } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", productId)
        .single();
      
      if (checkError) {
        throw new Error(`Product not found: ${checkError.message}`);
      }
      
      if (productCheck.seller_id !== sellerId) {
        throw new Error("You can only modify your own products.");
      }
      
      const { error } = await supabase
        .from("products")
        .update({ is_active: !is_active })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Updated",
        description: `Product ${
          variables.is_active ? "archived" : "unarchived"
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to archive/unarchive product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const archivePartMutation = useMutation({
    mutationFn: async ({
      partId,
      is_active,
    }: {
      partId: string;
      is_active: boolean;
    }) => {
      // Verify user has a sellerId
      if (!sellerId) {
        throw new Error("No seller ID found. Please contact support.");
      }
      
      // First verify the part belongs to this seller
      const { data: partCheck, error: checkError } = await supabase
        .from("parts")
        .select("seller_id")
        .eq("id", partId)
        .single();
      
      if (checkError) {
        throw new Error(`Part not found: ${checkError.message}`);
      }
      
      if (partCheck.seller_id !== sellerId) {
        throw new Error("You can only modify your own parts.");
      }
      
      const { error } = await supabase
        .from("parts")
        .update({ is_active: !is_active })
        .eq("id", partId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Updated",
        description: `Part ${
          variables.is_active ? "archived" : "unarchived"
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["seller-parts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to archive/unarchive part: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Feature toggle mutations - admin only
  const toggleProductFeatureMutation = useMutation({
    mutationFn: async ({
      productId,
      is_featured,
    }: {
      productId: string;
      is_featured: boolean;
    }) => {
      // Check if user is admin
      if (!hasAdminAccess(userInfo)) {
        throw new Error("Only administrators can feature/unfeature products.");
      }
      
      const { data, error } = await supabase
        .from("products")
        .update({ is_featured })
        .eq("id", productId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      toast({
        title: "Success",
        description: "Product feature status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update product feature status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const togglePartFeatureMutation = useMutation({
    mutationFn: async ({
      partId,
      is_featured,
    }: {
      partId: string;
      is_featured: boolean;
    }) => {
      // Check if user is admin
      if (!hasAdminAccess(userInfo)) {
        throw new Error("Only administrators can feature/unfeature parts.");
      }
      
      const { data, error } = await supabase
        .from("parts")
        .update({ is_featured })
        .eq("id", partId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-parts"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      toast({
        title: "Success",
        description: "Part feature status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update part feature status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Delete this product?")) deleteProductMutation.mutate(id);
  };
  const handleDeletePart = (id: string) => {
    if (window.confirm("Delete this part?")) deletePartMutation.mutate(id);
  };
  const handleArchiveProduct = (id: string, active: boolean) =>
    archiveProductMutation.mutate({ productId: id, is_active: active });
  const handleArchivePart = (id: string, active: boolean) =>
    archivePartMutation.mutate({ partId: id, is_active: active });
  const handleToggleProductFeature = (id: string, featured: boolean) =>
    toggleProductFeatureMutation.mutate({ productId: id, is_featured: featured });
  const handleTogglePartFeature = (id: string, featured: boolean) =>
    togglePartFeatureMutation.mutate({ partId: id, is_featured: featured });

  // Image handling
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductFiles(files);
    const previewUrls = files.map((f) => URL.createObjectURL(f));
    setProductInfo((prev) => ({
      ...prev,
      image_urls: [...prev.image_urls, ...previewUrls],
    }));
  };
  const removeImage = (index: number) => {
    setProductInfo((prev) => {
      const nu = [...prev.image_urls];
      nu.splice(index, 1);
      return { ...prev, image_urls: nu };
    });
    setProductFiles((prev) => {
      const nf = [...prev];
      nf.splice(index, 1);
      return nf;
    });
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/");
  };

  // Address CRUD
  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setFormAddress(address);
    setShowAddressForm(true);
  };
  const handleDeleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) fetchUserAddresses(session.user.id);
  };
  const handleSetDefaultAddress = async (addressId: string) => {
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
  const handleAddressFormSubmit = async (e: FormEvent) => {
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

  // Unauthenticated screens
  if (!isLoggedIn) {
    // Show seller creation form after admin signup
    if (showSellerCreationAfterAdmin) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">
                    Create Seller Account
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Now that you've created an admin account, create a seller account to manage products and inventory.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSellerAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newSellerName}
                        onChange={(e) => setNewSellerName(e.target.value)}
                        placeholder="Enter seller name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newSellerEmail}
                        onChange={(e) => setNewSellerEmail(e.target.value)}
                        placeholder="Enter seller email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newSellerPassword}
                        onChange={(e) => setNewSellerPassword(e.target.value)}
                        placeholder="Enter seller password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address (Optional)</Label>
                      <Input
                        value={newSellerAddress}
                        onChange={(e) => setNewSellerAddress(e.target.value)}
                        placeholder="Enter seller address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <Input
                        type="tel"
                        value={newSellerPhoneNumber}
                        onChange={(e) => setNewSellerPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        Create Seller
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowSellerCreationAfterAdmin(false);
                          setView("login");
                        }}
                        className="flex-1"
                      >
                        Skip for Now
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {view === "login" ? "Login to Your Account" : "Create Account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {view === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="flex justify-center space-x-2">
                      <Button
                        type="button"
                        variant={loginMode === "user" ? "default" : "outline"}
                        onClick={() => setLoginMode("user")}
                      >
                        User Login
                      </Button>
                      <Button
                        type="button"
                        variant={loginMode === "admin" ? "default" : "outline"}
                        onClick={() => setLoginMode("admin")}
                      >
                        Admin Login
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword((p) => !p)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                    <div className="text-center mt-4 space-y-2 text-sm">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => {
                          const emailInput = prompt("Enter your email:");
                          if (emailInput) {
                            supabase.auth
                              .resetPasswordForEmail(emailInput, {
                                redirectTo: `${window.location.origin}/reset-password`,
                              })
                              .then(({ error }) => {
                                if (error)
                                  alert("Failed: " + error.message);
                                else
                                  alert(
                                    "Password reset email sent. Check inbox."
                                  );
                              });
                          }
                        }}
                      >
                        Forgot password?
                      </Button>
                      <p>
                        No account?{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => setView("signup")}
                        >
                          Sign up
                        </Button>
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="flex justify-center space-x-2 mb-4">
                      <Button
                        type="button"
                        variant={loginMode === "user" ? "default" : "outline"}
                        onClick={() => setLoginMode("user")}
                      >
                        User Signup
                      </Button>
                      {!adminExists && (
                        <Button
                          type="button"
                          variant={loginMode === "admin" ? "default" : "outline"}
                          onClick={() => setLoginMode("admin")}
                        >
                          Admin Signup
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword((p) => !p)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Sign Up
                    </Button>
                    <div className="text-center text-sm mt-4">
                      Already have an account?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setView("login")}
                      >
                        Log in
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Determine section by URL (still preserve old routes)
  const currentPath = location.pathname.split("/").pop();

  const renderContent = () => {
    if (showOrderManagement) {
      return <AdminOrderManagement onBack={() => setShowOrderManagement(false)} />;
    }
    if (showInvoiceManagement) {
      return <AdminInvoiceManagement onBack={() => setShowInvoiceManagement(false)} />;
    }
    if (showPaymentManagement) {
      return <AdminPaymentManagement onBack={() => setShowPaymentManagement(false)} />;
    }
    if (showPayoutManagement) {
      return <AdminPayoutManagement onBack={() => setShowPayoutManagement(false)} />;
    }
    if (showInventoryManagement) {
      return <AdminInventoryManagement onBack={() => setShowInventoryManagement(false)} />;
    }
    if (showDiscountCouponManagement) {
      return <AdminDiscountCouponManagement onBack={() => setShowDiscountCouponManagement(false)} />;
    }
    if (showCustomerSupportTools) {
      return <AdminCustomerSupportTools onBack={() => setShowCustomerSupportTools(false)} />;
    }
    switch (currentPath) {
      case "addresses":
        return renderAddressesContent();
      case "orders":
        return renderOrdersContent();
      case "admin-dashboard":
        return renderAdminDashboardContent();
      case "analytics-dashboard":
        return <AnalyticsDashboard />;
      default:
        return renderProfileContent();
    }
  };

  // --- NEW ADMIN DASHBOARD DESIGN ---
  const renderAdminDashboardContent = () => {
    return (
      <div className="space-y-10">
        {showUserManagement ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setShowUserManagement(false)}>
              <X className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <AdminUserManagement />
          </div>
        ) : (
          <>
            {/* Main Admin Card */}
            <div className="bg-card text-card-foreground rounded-xl border border-border p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    Admin Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {userInfo.firstName || "Administrator"} - Administrative controls and
                    overview
                  </p>
                </div>
              </div>

              <div className="bg-muted/60 rounded-lg p-4 flex items-center justify-between mb-8">
                <div>
                  <p className="font-medium">Administrator Status</p>
                  <p className="text-sm text-muted-foreground">
                    User Role: {hasAdminAccess(userInfo) ? "Administrator" : "User"}
                    {userInfo.is_seller ? " | Seller" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Active
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
                <StatCard
                  title="Total Orders"
                  value={
                    adminMetrics
                      ? Intl.NumberFormat().format(adminMetrics.orders)
                      : "--"
                  }
                  subtitle="All time orders"
                  icon={<Package className="h-5 w-5" />}
                />
                <StatCard
                  title="Products"
                  value={
                    adminMetrics
                      ? Intl.NumberFormat().format(adminMetrics.productsActive)
                      : "--"
                  }
                  subtitle="Available products"
                  icon={<Boxes className="h-5 w-5" />}
                />
                <StatCard
                  title="Total Revenue"
                  value={
                    adminMetrics
                      ? "$" +
                        Intl.NumberFormat().format(
                          Math.round(adminMetrics.revenue)
                        )
                      : "--"
                  }
                  subtitle="Confirmed orders revenue"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <ActionCard
                    title="Manage Users"
                    description="View and edit user accounts"
                    icon={<Users className="h-5 w-5" />}
                    onClick={() => setShowUserManagement(true)}
                  />
                  <ActionCard
                    title="Manage Products"
                    description="Add, edit, or remove products"
                    icon={<Boxes className="h-5 w-5" />}
                    onClick={() => {
                      if (!userInfo.is_seller) {
                        toast({
                          title: "Access Denied",
                          description: "You need to be a seller to manage products.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!sellerId) {
                        toast({
                          title: "Error",
                          description: "Seller ID not found. Please contact support.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setShowManageProducts(true);
                    }}
                  />
                  <ActionCard
                    title="View Orders"
                    description="Monitor and process orders"
                    icon={<Package className="h-5 w-5" />}
                    onClick={() => setShowOrderManagement(true)}
                  />
                  <ActionCard
                    title="Invoice Management"
                    description="Create and send invoices to customers"
                    icon={<FileText className="h-5 w-5" />}
                    onClick={() => setShowInvoiceManagement(true)}
                  />
                  <ActionCard
                    title="Payment Management"
                    description="Review customer payment and verify payments"
                    icon={<FileText className="h-5 w-5" />}
                    onClick={() => setShowPaymentManagement(true)}
                  />
                  <ActionCard
                    title="Inventory Management"
                    description="Stock alerts and disable out-of-stock products"
                    icon={<Package className="h-5 w-5" />}
                    onClick={() => setShowInventoryManagement(true)}
                  />
                </div>
                
                {/* Seller Management Section */}
                {userInfo.is_seller && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Seller Management</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ActionCard
                        title="Seller Dashboard"
                        description="Manage your seller profile and information"
                        icon={<Car className="h-5 w-5" />}
                        onClick={() => navigate("/seller-dashboard")}
                      />
                      <ActionCard
                        title="Discount & Coupon Management"
                        description="Create promo codes, seasonal discounts, referral rewards"
                        icon={<Star className="h-5 w-5" />}
                        onClick={() => setShowDiscountCouponManagement(true)}
                      />
                      <ActionCard
                        title="Customer Support Tools"
                        description="Support tickets and chat/message logs"
                        icon={<Users className="h-5 w-5" />}
                        onClick={() => setShowCustomerSupportTools(true)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Creation (if admin and no seller exists yet) */}
            {userInfo.is_admin && !sellerExistsForAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Seller Account (Admin)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create a new seller account to start managing products and inventory.
                  </p>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleCreateSellerAccount}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="space-y-1 md:col-span-1">
                      <Label>Name</Label>
                      <Input
                        value={newSellerName}
                        onChange={(e) => setNewSellerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label>Address</Label>
                      <Input
                        value={newSellerAddress}
                        onChange={(e) => setNewSellerAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={newSellerPhoneNumber}
                        onChange={(e) =>
                          setNewSellerPhoneNumber(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newSellerEmail}
                        onChange={(e) => setNewSellerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newSellerPassword}
                        onChange={(e) => setNewSellerPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        Create Seller
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };


  // Profile Content
  const renderProfileContent = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Profile Information
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing((p) => !p)}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={userInfo.firstName}
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={userInfo.lastName}
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, lastName: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userInfo.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={userInfo.phone}
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, phone: e.target.value })
              }
            />
          </div>
        </div>
        
        {/* Email Preferences Section */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Email Preferences</h3>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="email-notifications"
              checked={emailSubscription.subscribed}
              disabled={emailSubscription.loading}
              onCheckedChange={(checked) => handleEmailSubscriptionChange(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="email-notifications" className="text-sm font-medium cursor-pointer">
                Notify me about new products and parts
              </Label>
              <p className="text-xs text-muted-foreground">
                Get email notifications when sellers list new products and auto parts that might interest you.
              </p>
            </div>
          </div>
          {emailSubscription.loading && (
            <p className="text-xs text-muted-foreground">Updating preferences...</p>
          )}
        </div>

        {isEditing && (
          <div className="flex space-x-4">
            <Button onClick={handleSaveProfile}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Addresses
  const renderAddressesContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Saved Addresses
        </h2>
        <Button
          onClick={() => {
            setShowAddressForm(true);
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
          }}
        >
          Add New Address
        </Button>
      </div>

      {showAddressForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAddressId ? "Edit Address" : "Add New Address"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddressFormSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formAddress.first_name}
                    onChange={(e) =>
                      setFormAddress({
                        ...formAddress,
                        first_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formAddress.last_name}
                    onChange={(e) =>
                      setFormAddress({
                        ...formAddress,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  value={formAddress.address_line_1}
                  onChange={(e) =>
                    setFormAddress({
                      ...formAddress,
                      address_line_1: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input
                  value={formAddress.address_line_2}
                  onChange={(e) =>
                    setFormAddress({
                      ...formAddress,
                      address_line_2: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formAddress.city}
                    onChange={(e) =>
                      setFormAddress({ ...formAddress, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formAddress.state}
                    onChange={(e) =>
                      setFormAddress({ ...formAddress, state: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={formAddress.postal_code}
                    onChange={(e) =>
                      setFormAddress({
                        ...formAddress,
                        postal_code: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formAddress.phone}
                  onChange={(e) =>
                    setFormAddress({ ...formAddress, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formAddress.is_default}
                  onCheckedChange={(checked) =>
                    setFormAddress({ ...formAddress, is_default: !!checked })
                  }
                />
                <Label htmlFor="is_default">Set as default address</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAddressId ? "Save Changes" : "Add Address"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg capitalize">
                    {address.type} Address
                  </CardTitle>
                  {address.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {address.first_name} {address.last_name}
                    </p>
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && (
                      <p>{address.address_line_2}</p>
                    )}
                    <p>
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && (
                      <p className="mt-2 text-muted-foreground">
                        {address.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      Delete
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefaultAddress(address.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground py-8">
              No saved addresses yet.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Helper function to transform order status for user display
  const getUserDisplayStatus = (status: string) => {
    if (status === ORDER_STATUS.INVOICE_SENT) {
      return "Invoice Received";
    }
    return status;
  };

  // Orders
  const renderOrdersContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="divide-y">
            {orders.map((order, i) => (
              <div
                key={order.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-sm text-muted-foreground">
                      {order.date}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "delivered"
                          ? "bg-green-200 text-green-800"
                          : order.status === "shipped"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {getUserDisplayStatus(order.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                  <div className="flex gap-2 mt-2">
                    {(order.status === ORDER_STATUS.INVOICE_SENT || 
                      order.status === ORDER_STATUS.INVOICE_ACCEPTED ||
                      order.status === ORDER_STATUS.PAYMENT_PENDING ||
                      order.status === ORDER_STATUS.PAYMENT_SUBMITTED ||
                      order.status === ORDER_STATUS.PAYMENT_VERIFIED ||
                      order.status === ORDER_STATUS.CONFIRMED ||
                      order.status === ORDER_STATUS.SHIPPED ||
                      order.status === ORDER_STATUS.DELIVERED) && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/order/${order.id}`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Show Invoice
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}/tracking`}>
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No orders yet.
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Filter & display inside Manage Products modal
  const lowercasedQuery = searchQuery.toLowerCase();
  const filteredParts = parts.filter((part) => {
    const specStr = JSON.stringify(part.specifications || {});
    return (
      `${part.name} ${part.brand} ${part.part_number} ${specStr}`
        .toLowerCase()
        .includes(lowercasedQuery)
    );
  });
  const filteredProducts = products.filter((p) => {
    return (
      `${p.name} ${p.brand} ${p.category} ${p.part_number} ${
        p.sku
      } ${p.specifications || ""}`
        .toLowerCase()
        .includes(lowercasedQuery)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your account information and orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasAdminAccess(userInfo) && currentPath !== "admin-dashboard" && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/account/admin-dashboard")}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-8">{renderContent()}</div>
      </div>

      {/* Manage Products Modal (Overlay) */}
      {showManageProducts && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-card rounded-xl border border-border shadow-2xl my-10">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  Manage Products & Parts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add, edit, archive or remove your listings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={listingType === "part" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setListingType("part");
                    setEditingProductId(null);
                    cleanupAndRefetch();
                  }}
                >
                  Part
                </Button>
                <Button
                  variant={listingType === "product" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setListingType("product");
                    setEditingProductId(null);
                    cleanupAndRefetch();
                  }}
                >
                  Product
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowManageProducts(false);
                    cleanupAndRefetch();
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-10">
              {!sellerId ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      Loading seller information...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      If this persists, please contact support.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Listing Form */}
                  <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {editingProductId ? "Edit Listing" : "Create New Listing"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form
                    onSubmit={handleProductSubmit}
                    className="space-y-6"
                    id="listing-form"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>
                          {listingType === "part" ? "Part Name" : "Product Name"}
                        </Label>
                        <Input
                          value={productInfo.name}
                          onChange={(e) =>
                            setProductInfo({
                              ...productInfo,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        {listingType === "product" ? (
                          <Input
                            placeholder="e.g., Performance"
                            value={productInfo.category}
                            onChange={(e) =>
                              setProductInfo({
                                ...productInfo,
                                category: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <Select
                            value={productInfo.category}
                            onValueChange={(value) =>
                              setProductInfo({
                                ...productInfo,
                                category: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={4}
                        value={productInfo.description}
                        onChange={(e) =>
                          setProductInfo({
                            ...productInfo,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={productInfo.price}
                          onChange={(e) =>
                            setProductInfo({
                              ...productInfo,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={productInfo.stock_quantity}
                          onChange={(e) =>
                            setProductInfo({
                              ...productInfo,
                              stock_quantity:
                                parseInt(e.target.value, 10) || 0,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Images</Label>
                        <Input
                          type="file"
                          multiple
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>

                    {productInfo.image_urls.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {productInfo.image_urls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group w-24 h-24 rounded border border-neutral-700 overflow-hidden"
                          >
                            <img
                              src={url}
                              alt=""
                              className="object-cover w-full h-full"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-400 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {listingType === "part" && (
                      <div className="space-y-4 border rounded-lg p-4 border-neutral-700">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                          Vehicle Compatibility
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Year</Label>
                            <Select
                              value={productInfo.year}
                              onValueChange={(value) =>
                                setProductInfo({
                                  ...productInfo,
                                  year: value,
                                  make: "",
                                  model: "",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {vehicleYears.map((y) => (
                                  <SelectItem
                                    key={y.toString()}
                                    value={y.toString()}
                                  >
                                    {y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Make</Label>
                            <Select
                              value={productInfo.make}
                              onValueChange={(value) =>
                                setProductInfo({
                                  ...productInfo,
                                  make: value,
                                  model: "",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Make" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {vehicleMakes.map((m) => (
                                  <SelectItem key={m.id} value={m.name}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Model</Label>
                            <Select
                              disabled={!productInfo.make}
                              value={productInfo.model}
                              onValueChange={(value) =>
                                setProductInfo({
                                  ...productInfo,
                                  model: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Model" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {vehicleModels.map((m) => (
                                  <SelectItem key={m.name} value={m.name}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Specifications / Notes</Label>
                      <Textarea
                        rows={4}
                        placeholder={
                          listingType === "part"
                            ? "Additional specs (e.g., Color: Black, Material: Steel)"
                            : "Product specifications..."
                        }
                        value={productInfo.specifications}
                        onChange={(e) =>
                          setProductInfo({
                            ...productInfo,
                            specifications: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            {editingProductId ? "Updating..." : "Listing..."}
                          </>
                        ) : (
                          <>
                            {editingProductId ? "Update" : "List"}{" "}
                            {listingType === "part" ? "Part" : "Product"}
                          </>
                        )}
                      </Button>
                      {editingProductId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingProductId(null);
                            cleanupAndRefetch();
                          }}
                        >
                          Cancel Edit
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={cleanupAndRefetch}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset Form
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Listings Section */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h4 className="text-lg font-semibold">
                    Your Parts & Products
                  </h4>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {filteredParts.length === 0 && filteredProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                    No listings match your search.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredParts.map((part) => (
                      <ListingRow
                        key={part.id}
                        title={`${part.name} (Part)`}
                        metaLeft={part.brand}
                        metaRight={`$${part.price}`}
                        quantity={part.stock_quantity}
                        active={part.is_active}
                        featured={part.is_featured}
                        disabled={!sellerId || deletePartMutation.isPending || archivePartMutation.isPending}
                        isAdmin={hasAdminAccess(userInfo)}
                        onEdit={() => handleEditPart(part)}
                        onArchive={() =>
                          handleArchivePart(part.id, part.is_active)
                        }
                        onDelete={() => handleDeletePart(part.id)}
                        onToggleFeature={() => handleTogglePartFeature(part.id, !part.is_featured)}
                      />
                    ))}
                    {filteredProducts.map((product) => (
                      <ListingRow
                        key={product.id}
                        title={`${product.name} (Product)`}
                        metaLeft={product.category}
                        metaRight={`$${product.price}`}
                        quantity={product.stock_quantity}
                        active={product.is_active}
                        featured={product.is_featured}
                        disabled={!sellerId || deleteProductMutation.isPending || archiveProductMutation.isPending}
                        isAdmin={hasAdminAccess(userInfo)}
                        onEdit={() => handleEditProduct(product)}
                        onArchive={() =>
                          handleArchiveProduct(product.id, product.is_active)
                        }
                        onDelete={() => handleDeleteProduct(product.id)}
                        onToggleFeature={() => handleToggleProductFeature(product.id, !product.is_featured)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Small presentational components ---------- */

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <div className="text-muted-foreground">{icon}</div>
    </div>
    <div className="text-3xl font-bold tracking-tight">{value}</div>
    <span className="mt-2 text-xs text-muted-foreground">{subtitle}</span>
  </div>
);

const ActionCard = ({
  title,
  description,
  icon,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`text-left rounded-lg border border-border bg-card p-5 group transition relative ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-muted cursor-pointer"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-muted/80 transition">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </button>
);

const ListingRow = ({
  title,
  metaLeft,
  metaRight,
  quantity,
  active,
  featured,
  onEdit,
  onArchive,
  onDelete,
  onToggleFeature,
  disabled = false,
  isAdmin = false,
}: {
  title: string;
  metaLeft?: string;
  metaRight?: string;
  quantity: number;
  active: boolean;
  featured?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleFeature?: () => void;
  disabled?: boolean;
  isAdmin?: boolean;
}) => (
  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-border rounded-lg bg-card/40">
    <div className="flex-1 space-y-1">
      <div className="flex items-center gap-2">
        <h5 className="font-semibold">{title}</h5>
        {featured && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {metaLeft && <span>{metaLeft}</span>}
        {metaRight && <span>{metaRight}</span>}
        <span>In Stock: {quantity}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            active ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {active ? "Active" : "Archived"}
        </span>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
      {isAdmin && onToggleFeature && (
        <Button 
          variant={featured ? "default" : "outline"} 
          size="sm" 
          onClick={onToggleFeature} 
          disabled={disabled}
          className={featured ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
        >
          <Star className={`h-4 w-4 mr-1 ${featured ? "fill-current" : ""}`} />
          {featured ? "Unfeature" : "Feature"}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onArchive} disabled={disabled}>
        <Archive className="h-4 w-4 mr-1" />
        {active ? "Archive" : "Unarchive"}
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    </div>
  </div>
);
export default Account;