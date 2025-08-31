import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import { User, MapPin, Package, LogOut, Edit, Eye, EyeOff, Lock, TrendingUp, Archive, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import PasswordResetForm from "@/components/PasswordResetForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from "@/database.types";
import { v4 as uuidv4 } from 'uuid';

// Define the database types for the application
type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

// Extend the Part type to correctly handle specifications which are stored as JSONB
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

// Predefined categories for parts and products
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMode, setLoginMode] = useState("user");
  const [adminExists, setAdminExists] = useState(true);

  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerAddress, setNewSellerAddress] = useState("");
  const [newSellerPhoneNumber, setNewSellerPhoneNumber] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");
  const [newSellerPassword, setNewSellerPassword] = useState("");
  const [sellerExistsForAdmin, setSellerExistsForAdmin] = useState(false);

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
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
    type: "shipping"
  });

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [listingType, setListingType] = useState("part");
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

  // Queries for Filter Dropdowns
  const { data: vehicleYears = [] } = useQuery({
    queryKey: ['vehicle-years'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicle_years').select('year').order('year', { ascending: false });
      if (error) throw error;
      return data.map(item => item.year);
    }
  });

  const { data: vehicleMakes = [] } = useQuery<{ id: string; name: string; }[]>({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicle_makes').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: vehicleModels = [] } = useQuery<{ id: string; name: string; }[]>({
    queryKey: ['vehicle-models', productInfo.make],
    queryFn: async () => {
      const makeId = vehicleMakes.find(make => make.name === productInfo.make)?.id;
      if (!makeId) return [];
      const { data, error } = await supabase.from('vehicle_models').select('id, name').eq('make_id', makeId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!productInfo.make,
  });

  // Queries for Products and Parts
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: parts = [] } = useQuery<PartWithSpecs[]>({
    queryKey: ['seller-parts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('parts').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const fetchUserOrders = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, order_number, status, total_amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error.message);
    } else {
      setOrders(data.map(order => ({
        id: order.id,
        date: new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
        orderNumber: order.order_number,
        status: order.status,
        total: order.total_amount
      })));
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
    } else if (data) {
      setUserInfo({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        is_admin: data.is_admin || false,
        is_seller: data.is_seller || false,
      });
      setSellerExistsForAdmin(data.is_seller || false);
    }
  }, []);

  const fetchUserAddresses = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error.message);
    } else {
      setAddresses(data);
    }
  }, []);

  const checkSellerExists = useCallback(async (userId) => {
    const { data, count, error } = await supabase
      .from('sellers')
      .select('user_id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.error("Error checking seller status:", error.message);
      setSellerExistsForAdmin(false);
    } else {
      setSellerExistsForAdmin(count > 0);
      if (count > 0) {
        const { data: sellerInfoData, error: sellerInfoError } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (sellerInfoData) setSellerId(sellerInfoData.id);
      }
    }
  }, []);

  const fetchAndSetUserData = useCallback(async (userId) => {
    setIsLoading(true);
    await fetchUserProfile(userId);
    await fetchUserAddresses(userId);
    await fetchUserOrders(userId);
    await checkSellerExists(userId);
    setIsLoading(false);
  }, [fetchUserProfile, fetchUserAddresses, fetchUserOrders, checkSellerExists]);

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        phone: userInfo.phone,
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error updating profile:", error.message);
      // Using toast instead of alert for better UX
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    } else {
      console.log("Profile updated successfully!");
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView("reset");
      }
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
        setAddresses([]);
        setOrders([]);
        setIsLoading(false);
      }
    });

    const checkAdminExists = async () => {
      const { data, count } = await supabase
        .from('profiles')
        .select('is_admin', { count: 'exact' })
        .eq('is_admin', true);
      if (count > 0) {
        setAdminExists(true);
      } else {
        setAdminExists(false);
      }
    };

    const initialCheck = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    initialCheck();
    checkAdminExists();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSetUserData]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", data.user.id)
        .single();

      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        toast({
          title: "Login failed",
          description: "Could not retrieve profile information.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
      } else if (profileData?.is_admin && loginMode === "admin") {
        if (sellerData) {
          navigate("/");
        } else {
          setIsLoggedIn(true);
          fetchAndSetUserData(data.user.id);
        }
      } else if (!profileData?.is_admin && loginMode === "user") {
        setIsLoggedIn(true);
        fetchAndSetUserData(data.user.id);
      } else {
        toast({
          title: "Invalid Login",
          description: "Invalid login mode selected.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
      }
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (loginMode === "admin" && adminExists) {
      toast({
        title: "Account Exists",
        description: "Admin account has already been created. Please log in.",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log('Signup successful, user:', data.user);

      if (loginMode === "admin") {
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('user_id', data.user.id);
        setAdminExists(true);
        toast({
          title: "Admin Account Created",
          description: "Admin account created. Please log in to your account page.",
        });
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to confirm your account!",
        });
      }
      setView("login");
    }
  };

  const handleCreateSellerAccount = async (e: FormEvent) => {
    e.preventDefault();

    let userId = null;
    let signUpError = null;

    const { data: newUserData, error: userSignUpError } = await supabase.auth.signUp({
      email: newSellerEmail,
      password: newSellerPassword,
      options: {
        data: {
          first_name: newSellerName,
          is_seller: true,
        },
      },
    });
    signUpError = userSignUpError;

    if (signUpError && signUpError.message.includes("User already registered")) {
      const { data: existingProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', newSellerEmail)
        .maybeSingle();

      if (profileError) {
        console.error("Error retrieving existing user profile:", profileError.message);
        toast({
          title: "Error",
          description: "Failed to create seller account. User exists but profile could not be retrieved.",
          variant: "destructive"
        });
        return;
      }
      if (existingProfileData) {
        userId = existingProfileData.user_id;
      } else {
        const { data: signedInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: newSellerEmail,
          password: newSellerPassword
        });
        if (signInError) {
          console.error("Failed to sign in existing user:", signInError.message);
          toast({
            title: "Error",
            description: "A user with this email exists, but we couldn't sign in. Please log in directly.",
            variant: "destructive"
          });
          return;
        }
        userId = signedInData.user.id;
      }
    } else if (signUpError) {
      console.error('Seller account creation error:', signUpError.message);
      toast({
        title: "Error",
        description: `Failed to create seller account: ${signUpError.message}`,
        variant: "destructive"
      });
      return;
    } else {
      userId = newUserData?.user?.id;
    }

    if (userId) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          is_seller: true,
          email: newSellerEmail,
          first_name: newSellerName
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error upserting profiles table:', upsertError.message);
        toast({
          title: "Error",
          description: 'Error updating profiles table. Please try again.',
          variant: "destructive"
        });
        return;
      }
    } else {
      toast({
        title: "Error",
        description: "User ID could not be determined. Seller creation failed.",
        variant: "destructive"
      });
      return;
    }

    const { error: sellerInsertError } = await supabase
      .from('sellers')
      .insert({
        user_id: userId,
        name: newSellerName,
        address: newSellerAddress,
        email: newSellerEmail,
        phone: newSellerPhoneNumber,
      });

    if (sellerInsertError) {
      console.error('Error inserting into sellers table:', sellerInsertError.message);
      toast({
        title: "Error",
        description: 'Error creating seller account. Please try again.',
        variant: "destructive"
      });
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('user_id', userId);

    if (profileUpdateError) {
      console.error("Error updating profile with seller status:", profileUpdateError.message);
    }

    toast({
      title: "Success",
      description: `Seller account created successfully for ${newSellerEmail}!`
    });

    setNewSellerName("");
    setNewSellerAddress("");
    setNewSellerEmail("");
    setNewSellerPassword("");
    setNewSellerPhoneNumber("");

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchAndSetUserData(session.user.id);
    }
  };

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Error", description: "You must be logged in to list a product.", variant: "destructive" });
      return;
    }

    if (!sellerId) {
      const { data: sellerData, error } = await supabase.from('sellers').select('id').eq('user_id', session.user.id).single();
      if (error) {
        console.error('Error fetching seller ID:', error);
        toast({ title: "Error", description: "Could not find seller ID.", variant: "destructive" });
        return;
      }
      setSellerId(sellerData.id);
    }

    const imageUrls: string[] = [];
    if (productFiles.length > 0) {
      const bucketName = listingType === 'part' ? 'part_images' : 'product_images';
      try {
        for (const file of productFiles) {
          const fileExtension = file.name.split('.').pop();
          const filePath = `${session.user.id}/${uuidv4()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, { upsert: true });

          if (uploadError) {
            console.error('Image upload failed:', uploadError);
            toast({ title: "Error", description: `Failed to upload image to ${bucketName} bucket.`, variant: "destructive" });
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          imageUrls.push(publicUrlData.publicUrl);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        toast({ title: "Error", description: `An unexpected error occurred during image upload: ${error.message}`, variant: "destructive" });
        return;
      }
    }

    const finalImageUrls = editingProductId ? [...productInfo.image_urls, ...imageUrls] : imageUrls;

    let vehicleId = null;
    if (productInfo.year && productInfo.make && productInfo.model) {
      // Get the UUIDs for the selected make, model, and year
      const makeId = vehicleMakes.find(make => make.name === productInfo.make)?.id;
      const modelId = vehicleModels.find(model => model.name === productInfo.model)?.id;
      
      const { data: yearData, error: yearError } = await supabase
        .from('vehicle_years')
        .select('id')
        .eq('year', parseInt(productInfo.year))
        .single();

      if (yearError) {
        console.error("Error fetching vehicle year:", yearError);
        toast({ title: "Error", description: "Failed to find matching vehicle year.", variant: "destructive" });
        return;
      }
      const yearId = yearData.id;

      // Check if a vehicle combination with these IDs already exists in vehicles_new
      const { data: existingVehicle, error: existingVehicleError } = await supabase
        .from('vehicles_new')
        .select('id')
        .eq('year_id', yearId)
        .eq('make_id', makeId)
        .eq('model_id', modelId)
        .maybeSingle();

      if (existingVehicleError && existingVehicleError.code !== 'PGRST116') {
        console.error("Error checking for existing vehicle:", existingVehicleError);
        toast({ title: "Error", description: "Failed to check for existing vehicle.", variant: "destructive" });
        return;
      }

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        // If no match, insert a new record into vehicles_new
        const { data: newVehicle, error: newVehicleError } = await supabase
          .from('vehicles_new')
          .insert({
            make_id: makeId,
            model_id: modelId,
            year_id: yearId,
          })
          .select('id')
          .single();

        if (newVehicleError) {
          console.error("Error creating new vehicle record:", newVehicleError);
          toast({ title: "Error", description: "Failed to create new vehicle record.", variant: "destructive" });
          return;
        }
        vehicleId = newVehicle.id;
      }
    }

    const cleanupAndRefetch = () => {
      setEditingProductId(null);
      setProductInfo({
        name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
        specifications: "", category: "", make: "", model: "", year: "", vin: "",
      });
      setProductFiles([]);
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    };

    try {
      const isPart = listingType === 'part';
      const specificationsPayload = {
        category: productInfo.category,
        make: productInfo.make,
        model: productInfo.model,
        year: productInfo.year,
        vin: productInfo.vin,
        additional: productInfo.specifications
      };

      const payload = isPart ? {
        name: productInfo.name,
        description: productInfo.description,
        price: parseFloat(productInfo.price) || 0,
        stock_quantity: Number(productInfo.stock_quantity) || 0,
        brand: userInfo.firstName || 'Unknown',
        seller_id: sellerId,
        specifications: specificationsPayload,
        image_urls: finalImageUrls,
      } : {
        name: productInfo.name,
        description: productInfo.description,
        price: parseFloat(productInfo.price) || 0,
        stock_quantity: Number(productInfo.stock_quantity) || 0,
        is_active: productInfo.stock_quantity > 0,
        image_urls: finalImageUrls,
        specifications: specificationsPayload,
        is_featured: false,
        brand: userInfo.firstName || 'Unknown',
        seller_id: sellerId,
        category: productInfo.category,
        product_type: 'GENERIC',
      };

      let itemId = null;
      if (editingProductId) {
        if (isPart) {
          const { error } = await supabase.from('parts').update(payload).eq('id', editingProductId);
          if (error) throw error;
          itemId = editingProductId;
        } else {
          const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
          if (error) throw error;
          itemId = editingProductId;
        }
        toast({ title: "Success!", description: `${isPart ? 'Part' : 'Product'} updated successfully.`});
      } else {
        if (isPart) {
          const { data, error } = await supabase.from('parts').insert([payload]).select().single();
          if (error) throw error;
          itemId = data.id;
        } else {
          const { data, error } = await supabase.from('products').insert([payload]).select().single();
          if (error) throw error;
          itemId = data.id;
        }
        toast({ title: "Success!", description: `${isPart ? 'Part' : 'Product'} listed successfully.`});
      }

      if (itemId && vehicleId) {
        if (isPart) {
          const { error } = await supabase.from('part_vehicle_compatibility').insert([{ part_id: itemId, vehicle_id: vehicleId }]);
          if (error) {
            console.error("Error inserting into part_vehicle_compatibility:", error);
          }
        } else {
          const { error } = await supabase.from('product_fitments').insert([{ product_id: itemId, vehicle_id: vehicleId }]);
          if (error) {
            console.error("Error inserting into product_fitments:", error);
          }
        }
      }

      cleanupAndRefetch();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    let specs: PartSpecifications = {};
    if (typeof product.specifications === 'string' && product.specifications.trim() !== '') {
        try {
            specs = JSON.parse(product.specifications);
        } catch (e) {
            console.error("Failed to parse product specifications as JSON:", e);
        }
    } else if (typeof product.specifications === 'object' && product.specifications !== null) {
        specs = product.specifications;
    }
    setProductInfo({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls || [],
      specifications: specs?.additional || "",
      category: specs?.category || "",
      make: specs?.make || "",
      model: specs?.model || "",
      year: specs?.year || "",
      vin: specs?.vin || "",
    });
    setListingType("product");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPart = (part: PartWithSpecs) => {
    setEditingProductId(part.id);
    const specs = part.specifications;
    setProductInfo({
      name: part.name,
      description: part.description,
      price: String(part.price),
      stock_quantity: part.stock_quantity,
      image_urls: part.image_urls || [],
      specifications: specs?.additional || "",
      category: specs?.category || "",
      make: specs?.make || "",
      model: specs?.model || "",
      year: specs?.year || "",
      vin: specs?.vin || "",
    });
    setListingType("part");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Product has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase.from("parts").delete().eq("id", partId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Part has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete part.", variant: "destructive" });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    // Replaced window.confirm with a custom toast component for a consistent UI
    toast({
      title: "Confirm Deletion",
      description: "Are you sure you want to delete this product?",
      variant: "destructive",
      action: <Button variant="ghost" onClick={() => deleteProductMutation.mutate(productId)}>Delete</Button>
    });
  };

  const handleDeletePart = (partId: string) => {
    // Replaced window.confirm with a custom toast component for a consistent UI
    toast({
      title: "Confirm Deletion",
      description: "Are you sure you want to delete this part?",
      variant: "destructive",
      action: <Button variant="ghost" onClick={() => deletePartMutation.mutate(partId)}>Delete</Button>
    });
  };

  const archiveProductMutation = useMutation({
    mutationFn: async ({ productId, is_active }: { productId: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active: !is_active }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `Product has been ${variables.is_active ? 'archived' : 'unarchived'}.` });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update product status.", variant: "destructive" });
    },
  });

  const handleArchiveProduct = (productId: string, is_active: boolean) => {
    archiveProductMutation.mutate({ productId, is_active });
  };

  const archivePartMutation = useMutation({
    mutationFn: async ({ partId, is_active }: { partId: string; is_active: boolean }) => {
      const { error } = await supabase.from("parts").update({ is_active: !is_active }).eq("id", partId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `Part has been ${variables.is_active ? 'archived' : 'unarchived'}.` });
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update part status.", variant: "destructive" });
    },
  });

  const handleArchivePart = (partId: string, is_active: boolean) => {
    archivePartMutation.mutate({ partId, is_active });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductFiles(files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setProductInfo(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...imageUrls]
    }));
  };

  const removeImage = (index: number) => {
      setProductInfo(prev => {
          const newUrls = [...prev.image_urls];
          newUrls.splice(index, 1);
          return { ...prev, image_urls: newUrls };
      });
      setProductFiles(prev => {
          const newFiles = [...prev];
          newFiles.splice(index, 1);
          return newFiles;
      });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
    setSellerExistsForAdmin(false);
    navigate("/");
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setFormAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      console.error("Error deleting address:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete address.",
        variant: "destructive"
      });
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserAddresses(session.user.id);
        toast({
          title: "Success",
          description: "Address deleted successfully.",
        });
      }
    }
  };

  const handleAddressFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const addressToSave = { ...formAddress, user_id: session.user.id };

    if (editingAddressId) {
      const { error } = await supabase
        .from("addresses")
        .update(addressToSave)
        .eq("id", editingAddressId);

      if (error) {
        console.error("Error updating address:", error.message);
        toast({
          title: "Error",
          description: "Failed to update address.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Address updated successfully.",
        });
      }
    } else {
      const { error } = await supabase
        .from("addresses")
        .insert([addressToSave]);

      if (error) {
        console.error("Error adding address:", error.message);
        toast({
          title: "Error",
          description: "Failed to add new address.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "New address added successfully.",
        });
      }
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress({
      first_name: "", last_name: "", address_line_1: "", address_line_2: "",
      city: "", state: "", postal_code: "", country: "US", phone: "", type: "shipping"
    });
    fetchUserAddresses(session.user.id);
  };

  if (!isLoggedIn || view === "reset") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {view === "login" && "Login to Your Account"}
                  {view === "signup" && "Create a New Account"}
                  {view === "reset" && "Reset Your Password"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {view === "login" ? (
                  <>
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
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        Login
                      </Button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                      <Button variant="link" className="text-sm" onClick={() => {
                        const emailInput = prompt("Please enter your email address to reset your password:");
                        if (emailInput) {
                          supabase.auth.resetPasswordForEmail(emailInput, {
                            redirectTo: 'https://auto-speed-shop-qsal.vercel.app/account',
                          }).then(({ error }) => {
                            if (error) {
                              toast({ title: "Error", description: `Error sending password reset email: ${error.message}`, variant: "destructive" });
                            } else {
                              toast({ title: "Email Sent", description: "Password reset email sent. Please check your inbox!" });
                            }
                          });
                        }
                      }}>
                        Forgot your password?
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setView("signup")}>
                          Sign up here
                        </Button>
                      </p>
                    </div>
                  </>
                ) : view === "signup" ? (
                  <>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-first-name">First Name</Label>
                          <Input
                            id="signup-first-name"
                            placeholder="Enter your first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-last-name">Last Name</Label>
                          <Input
                            id="signup-last-name"
                            placeholder="Enter your last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        Sign Up
                      </Button>
                    </form>
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setView("login")}>
                          Log in here
                        </Button>
                      </p>
                    </div>
                  </>
                ) : (
                  <PasswordResetForm />
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
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-5 w-80 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="h-12 w-full bg-gray-200 rounded-md animate-pulse mb-8"></div>
          <div className="h-[200px] w-full bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your account information and orders
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            {userInfo.is_admin && !sellerExistsForAdmin && <TabsTrigger value="admin-tools">Admin Tools</TabsTrigger>}
            {userInfo.is_admin && userInfo.is_seller && (
              <>
                <TabsTrigger value="admin-dashboard">Admin Dashboard</TabsTrigger>
                <TabsTrigger value="analytics-dashboard">Analytics Dashboard</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userInfo.firstName}
                      disabled={!isEditing}
                      onChange={(e) => setUserInfo({...userInfo, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userInfo.lastName}
                      disabled={!isEditing}
                      onChange={(e) => setUserInfo({...userInfo, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={userInfo.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      disabled={!isEditing}
                      onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className="flex space-x-4">
                    <Button onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Saved Addresses
                </h2>
                <Button onClick={() => {
                  setShowAddressForm(true);
                  setEditingAddressId(null);
                }}>
                  Add New Address
                </Button>
              </div>

              {showAddressForm ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingAddressId ? "Edit Address" : "Add New Address"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddressFormSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address-first-name">First Name</Label>
                          <Input
                            id="address-first-name"
                            value={formAddress.first_name}
                            onChange={(e) => setFormAddress({...formAddress, first_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address-last-name">Last Name</Label>
                          <Input
                            id="address-last-name"
                            value={formAddress.last_name}
                            onChange={(e) => setFormAddress({...formAddress, last_name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address-line-1">Address Line 1</Label>
                        <Input
                          id="address-line-1"
                          value={formAddress.address_line_1}
                          onChange={(e) => setFormAddress({...formAddress, address_line_1: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address-line-2">Address Line 2</Label>
                        <Input
                          id="address-line-2"
                          value={formAddress.address_line_2}
                          onChange={(e) => setFormAddress({...formAddress, address_line_2: e.target.value})}
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formAddress.city}
                            onChange={(e) => setFormAddress({...formAddress, city: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formAddress.state}
                            onChange={(e) => setFormAddress({...formAddress, state: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal-code">Postal Code</Label>
                          <Input
                            id="postal-code"
                            value={formAddress.postal_code}
                            onChange={(e) => setFormAddress({...formAddress, postal_code: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address-phone">Phone Number</Label>
                        <Input
                          id="address-phone"
                          type="tel"
                          value={formAddress.phone}
                          onChange={(e) => setFormAddress({...formAddress, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                        <Button type="submit">{editingAddressId ? "Save Changes" : "Add Address"}</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <Card key={address.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{address.type} Address</CardTitle>
                            {address.is_default && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{address.first_name} {address.last_name}</p>
                            <p>{address.address_line_1}</p>
                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                            <p>{address.city}, {address.state} {address.postal_code}</p>
                            <p>{address.country}</p>
                            {address.phone && <p className="mt-2 text-muted-foreground">{address.phone}</p>}
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => handleEditAddress(address)}>Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteAddress(address.id)}>Delete</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      You have no saved addresses yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((order, index) => (
                      <div key={order.id}>
                        <div className="flex items-center justify-between py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">{order.orderNumber}</span>
                              <span className="text-sm text-muted-foreground">{order.date}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.status === 'delivered' ? 'bg-green-200 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-200 text-blue-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total.toFixed(2)}</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              View Details
                            </Button>
                          </div>
                        </div>
                        {index < orders.length - 1 && <Separator />}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      You have no orders yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Password Reset
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Reset your password using a secure password reset link sent to your email.
                    </p>
                    <Button onClick={() => {
                      const emailInput = prompt("Please enter your email address to reset your password:");
                      if (emailInput) {
                        supabase.auth.resetPasswordForEmail(emailInput, {
                          redirectTo: 'https://auto-speed-shop-qsal.vercel.app/account',
                        }).then(({ error }) => {
                          if (error) {
                            toast({ title: "Error", description: `Error sending password reset email: ${error.message}`, variant: "destructive" });
                          } else {
                            toast({ title: "Email Sent", description: "Password reset email sent. Please check your inbox!" });
                          }
                        });
                      }
                    }}>
                      Send Password Reset Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {userInfo.is_admin && !sellerExistsForAdmin && (
            <TabsContent value="admin-tools">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Create Seller Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSellerAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="seller-name">Seller's Name</Label>
                      <Input
                        id="seller-name"
                        placeholder="Enter seller's business name"
                        value={newSellerName}
                        onChange={(e) => setNewSellerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seller-address">Address</Label>
                      <Input
                        id="seller-address"
                        placeholder="Enter seller's address"
                        value={newSellerAddress}
                        onChange={(e) => setNewSellerAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seller-phone">Phone Number</Label>
                      <Input
                        id="seller-phone"
                        type="tel"
                        placeholder="Enter seller's phone number"
                        value={newSellerPhoneNumber}
                        onChange={(e) => setNewSellerPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seller-email">Email</Label>
                        <Input
                          id="seller-email"
                          type="email"
                          placeholder="Enter seller's email"
                          value={newSellerEmail}
                          onChange={(e) => setNewSellerEmail(e.target.value)}
                          required
                        />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seller-password">Password</Label>
                      <Input
                        id="seller-password"
                        type="password"
                        placeholder="Create a password"
                        value={newSellerPassword}
                        onChange={(e) => setNewSellerPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Seller Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userInfo.is_admin && userInfo.is_seller && (
            <>
              <TabsContent value="admin-dashboard">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold">{editingProductId ? 'Edit' : 'List a New...'}</h2>
                      <Button variant={listingType === "part" ? "default" : "outline"} onClick={() => setListingType("part")}>Part</Button>
                      <Button variant={listingType === "product" ? "default" : "outline"} onClick={() => setListingType("product")}>Product</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">{listingType === "part" ? "Part Name" : "Product Name"}</Label>
                        <Input id="product-name" value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description">Description</Label>
                        <Textarea id="product-description" value={productInfo.description} onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} rows={4} required />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price ($)</Label>
                          <Input id="product-price" type="number" step="0.01" value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-quantity">Quantity</Label>
                          <Input id="product-quantity" type="number" value={productInfo.stock_quantity.toString()} onChange={(e) => setProductInfo({ ...productInfo, stock_quantity: parseInt(e.target.value, 10) || 0 })} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category">Category</Label>
                        <Select value={productInfo.category} onValueChange={(value) => setProductInfo({ ...productInfo, category: value })}>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-images">Product Images</Label>
                        <Input id="product-images" type="file" multiple onChange={handleImageUpload} />
                      </div>
                      {productInfo.image_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {productInfo.image_urls.map((url, index) => (
                                <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      className="absolute top-1 right-1 w-6 h-6 p-0"
                                      onClick={() => removeImage(index)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                          </div>
                      )}
                      <Separator className="my-8" />
                      <h3 className="text-lg font-semibold">Vehicle Compatibility</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="part-year">Vehicle Year</Label>
                          <Select value={productInfo.year} onValueChange={(value) => setProductInfo({ ...productInfo, year: value, make: '', model: '' })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="part-make">Vehicle Make</Label>
                          <Select value={productInfo.make} onValueChange={(value) => setProductInfo({ ...productInfo, make: value, model: '' })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Make" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleMakes.map(make => (
                                <SelectItem key={make.name} value={make.name}>
                                  {make.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="part-model">Vehicle Model</Label>
                          <Select value={productInfo.model} onValueChange={(value) => setProductInfo({ ...productInfo, model: value })} disabled={!productInfo.make}>
                            <SelectTrigger>
                              <SelectValue placeholder="Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleModels.map(model => (
                                <SelectItem key={model.name} value={model.name}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-specs">Specifications</Label>
                        <Textarea id="product-specs" value={productInfo.specifications} onChange={(e) => setProductInfo({ ...productInfo, specifications: e.target.value })} rows={4} placeholder={listingType === "part" ? "Additional specifications, e.g., 'Color: Black'" : "List specifications here."} />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit">{editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}</Button>
                        {editingProductId && (
                          <Button type="button" variant="outline" onClick={() => {
                            setEditingProductId(null);
                            setProductInfo({
                              name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
                              specifications: "", category: "", make: "", model: "", year: "", vin: "",
                            });
                          }}>Cancel Edit</Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Separator className="my-8" />

                <h2 className="text-2xl font-bold mb-4">Your Listed Parts</h2>
                <div className="space-y-4">
                  {parts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">You have no parts listed yet.</div>
                  ) : (
                    parts.map((part) => (
                      <Card key={part.id}>
                        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{part.name} (Part)</h3>
                            <p className="text-muted-foreground text-sm">{part.brand}</p>
                            <p className="text-lg font-bold">${part.price}</p>
                            <p className="text-sm">In Stock: {part.stock_quantity}</p>
                            <p className={`text-sm font-medium ${part.is_active ? 'text-green-500' : 'text-yellow-500'}`}>
                              Status: {part.is_active ? 'Active' : 'Archived'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditPart(part)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleArchivePart(part.id, part.is_active)}><Archive className="h-4 w-4 mr-2" />{part.is_active ? 'Archive' : 'Unarchive'}</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePart(part.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Separator className="my-8" />

                <h2 className="text-2xl font-bold mb-4">Your Listed Products</h2>
                <div className="space-y-4">
                  {products.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">You have no products listed yet.</div>
                  ) : (
                    products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{product.name} (Product)</h3>
                            <p className="text-muted-foreground text-sm">{product.category}</p>
                            <p className="text-lg font-bold">${product.price}</p>
                            <p className="text-sm">In Stock: {product.stock_quantity}</p>
                            <p className={`text-sm font-medium ${product.is_active ? 'text-green-500' : 'text-yellow-500'}`}>Status: {product.is_active ? 'Active' : 'Archived'}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleArchiveProduct(product.id, product.is_active)}><Archive className="h-4 w-4 mr-2" />{product.is_active ? 'Archive' : 'Unarchive'}</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics-dashboard">
                <AnalyticsDashboard />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
