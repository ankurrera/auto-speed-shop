import { useState, useEffect, useCallback } from "react";
import { User, MapPin, Package, LogOut, Edit, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import PasswordResetForm from "@/components/PasswordResetForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // State for the new part form (with vehicle fitment)
  const [partName, setPartName] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [partPrice, setPartPrice] = useState("");
  const [partQuantity, setPartQuantity] = useState("");
  const [partCategory, setPartCategory] = useState("");
  const [partSpecifications, setPartSpecifications] = useState("");
  const [partImages, setPartImages] = useState(null);
  const [partBrand, setPartBrand] = useState("");
  const [partYear, setPartYear] = useState("");
  const [partMake, setPartMake] = useState("");
  const [partModel, setPartModel] = useState("");

  // State for the new generic product form (without vehicle fitment)
  const [genericProductName, setGenericProductName] = useState("");
  const [genericProductDescription, setGenericProductDescription] = useState("");
  const [genericProductPrice, setGenericProductPrice] = useState("");
  const [genericProductQuantity, setGenericProductQuantity] = useState("");
  const [genericProductCategory, setGenericProductCategory] = useState("");
  const [genericProductSpecifications, setGenericProductSpecifications] = useState("");
  const [genericProductImages, setGenericProductImages] = useState(null);
  const [genericProductBrand, setGenericProductBrand] = useState("");

  // State to manage view within the admin dashboard
  const [adminView, setAdminView] = useState("menu"); // 'menu', 'part', 'product'

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
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

  // Fetching vehicle data for the new part form
  const { data: vehicleYears = [] } = useQuery({
    queryKey: ['vehicle-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_years')
        .select('year')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data.map(item => item.year);
    }
  });

  const { data: vehicleMakes = [] } = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicle-models', partMake],
    queryFn: async () => {
      const makeId = vehicleMakes.find(make => make.name === partMake)?.id;
      
      if (!makeId) {
        return [];
      }

      const { data, error } = await supabase
        .from('vehicle_models')
        .select('name')
        .eq('make_id', makeId)
        .order('name');
      
      if (error) throw error;
      return data.map(item => item.name);
    },
    enabled: !!partMake,
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
      alert("Failed to update profile.");
    } else {
      console.log("Profile updated successfully!");
      setIsEditing(false);
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
        setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false });
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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
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
        alert("Login failed: Could not retrieve profile information.");
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
        alert("Invalid login mode selected.");
        await supabase.auth.signOut();
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (loginMode === "admin" && adminExists) {
      alert("Admin account has already been created. Please log in.");
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
      alert("Signup failed: " + error.message);
    } else {
      console.log('Signup successful, user:', data.user);
      
      if (loginMode === "admin") {
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('user_id', data.user.id);
        setAdminExists(true);
        alert("Admin account created. Please log in to your account page.");
      } else {
        alert("Please check your email to confirm your account!");
      }
      setView("login");
    }
  };

  const handleCreateSellerAccount = async (e) => {
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
        alert("Failed to create seller account. User exists but profile could not be retrieved.");
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
          alert("A user with this email exists, but we couldn't sign in. Please log in directly.");
          return;
        }
        userId = signedInData.user.id;
      }
    } else if (signUpError) {
      console.error('Seller account creation error:', signUpError.message);
      alert("Failed to create seller account: " + signUpError.message);
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
            alert('Error updating profiles table. Please try again.');
            return;
        }
    } else {
        alert("User ID could not be determined. Seller creation failed.");
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
      alert('Error creating seller account. Please try again.');
      return;
    }
    
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('user_id', userId);

    if (profileUpdateError) {
      console.error("Error updating profile with seller status:", profileUpdateError.message);
    }
    
    alert(`Seller account created successfully for ${newSellerEmail}!`);
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
  
  const handlePublishNewPart = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in to publish a part.");
      return;
    }
    
    if (!partYear || !partMake || !partModel) {
      alert("Please select a Year, Make, and Model for the part.");
      return;
    }

    const imageUrls = [];
    if (partImages) {
        for (const image of partImages) {
            const fileExt = image.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `product_images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products-images')
                .upload(filePath, image);

            if (uploadError) {
                console.error("Error uploading image:", uploadError.message);
                alert("Failed to upload part image. Please try again.");
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('products-images')
                .getPublicUrl(filePath);

            if (publicUrlData) {
                imageUrls.push(publicUrlData.publicUrl);
            }
        }
    }
    
    const { data, error: rpcError } = await supabase.rpc('publish_new_part_standalone', {
        p_name: partName,
        p_description: partDescription,
        p_price: parseFloat(partPrice),
        p_stock_quantity: parseInt(partQuantity),
        p_specifications: partSpecifications,
        p_seller_id: session.user.id,
        p_image_urls: imageUrls,
        p_brand: partBrand,
        p_year: partYear,
        p_make: partMake,
        p_model: partModel,
    });
    
    if (rpcError) {
      console.error("Error publishing part:", rpcError.message);
      alert("Failed to publish part. Please try again.");
    } else {
      alert("Part published successfully!");
      setPartName("");
      setPartDescription("");
      setPartPrice("");
      setPartQuantity("");
      setPartCategory("");
      setPartSpecifications("");
      setPartImages(null);
      setPartBrand("");
      setPartYear("");
      setPartMake("");
      setPartModel("");
      setAdminView("menu");
    }
  };

  const handlePublishGenericProduct = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in to publish a product.");
      return;
    }
    
    const imageUrls = [];
    if (genericProductImages) {
        for (const image of genericProductImages) {
            const fileExt = image.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `product_images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products-images')
                .upload(filePath, image);

            if (uploadError) {
                console.error("Error uploading image:", uploadError.message);
                alert("Failed to upload product image. Please try again.");
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('products-images')
                .getPublicUrl(filePath);

            if (publicUrlData) {
                imageUrls.push(publicUrlData.publicUrl);
            }
        }
    }
    
    const { error } = await supabase
      .from('products')
      .insert({
        name: genericProductName,
        description: genericProductDescription,
        price: parseFloat(genericProductPrice),
        stock_quantity: parseInt(genericProductQuantity),
        category: genericProductCategory,
        specifications: genericProductSpecifications,
        seller_id: session.user.id,
        image_urls: imageUrls,
        brand: genericProductBrand,
    });
    
    if (error) {
      console.error("Error publishing product:", error.message);
      alert("Failed to publish product. Please try again.");
    } else {
      alert("Product published successfully!");
      setGenericProductName("");
      setGenericProductDescription("");
      setGenericProductPrice("");
      setGenericProductQuantity("");
      setGenericProductCategory("");
      setGenericProductSpecifications("");
      setGenericProductImages(null);
      setGenericProductBrand("");
      setAdminView("menu");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false });
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
      alert("Failed to delete address.");
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserAddresses(session.user.id);
      }
    }
  };

  const handleAddressFormSubmit = async (e) => {
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
        alert("Failed to update address.");
      }
    } else {
      const { error } = await supabase
        .from("addresses")
        .insert([addressToSave]);

      if (error) {
        console.error("Error adding address:", error.message);
        alert("Failed to add new address.");
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
                              alert("Error sending password reset email: " + error.message);
                            } else {
                              alert("Password reset email sent. Please check your inbox!");
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
            {userInfo.is_admin && sellerExistsForAdmin && (
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
                    <div className="col-span-2 text-center text-muted-foreground py-8">
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
                            alert("Error sending password reset email: " + error.message);
                          } else {
                            alert("Password reset email sent. Please check your inbox!");
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

          {userInfo.is_admin && sellerExistsForAdmin && (
            <TabsContent value="admin-dashboard">
              {adminView === 'menu' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <p className="text-muted-foreground">Select an action to perform.</p>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <Button onClick={() => setAdminView('part')} size="lg">
                      <Package className="mr-2 h-4 w-4" /> List a New Part
                    </Button>
                    <Button onClick={() => setAdminView('product')} size="lg">
                      <Package className="mr-2 h-4 w-4" /> List a New Product
                    </Button>
                  </CardContent>
                </Card>
              )}

              {adminView === 'part' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>List a New Part</CardTitle>
                      <Button variant="outline" onClick={() => setAdminView('menu')}>Back to Menu</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePublishNewPart} className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="part-year">Vehicle Year</Label>
                          <Select value={partYear} onValueChange={setPartYear}>
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
                          <Select value={partMake} onValueChange={setPartMake}>
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
                          <Select value={partModel} onValueChange={setPartModel}>
                            <SelectTrigger>
                              <SelectValue placeholder="Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleModels.map(model => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-name">Part Name</Label>
                        <Input id="part-name" value={partName} onChange={(e) => setPartName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-description">Description</Label>
                        <textarea id="part-description" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={partDescription} onChange={(e) => setPartDescription(e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="part-price">Price ($)</Label>
                          <Input id="part-price" type="number" step="0.01" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="part-quantity">Quantity</Label>
                          <Input id="part-quantity" type="number" value={partQuantity} onChange={(e) => setPartQuantity(e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-brand">Brand</Label>
                        <select id="part-brand" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={partBrand} onChange={(e) => setPartBrand(e.target.value)} required >
                          <option value="" disabled>Select a brand</option>
                          <option value="Wagner">Wagner</option>
                          <option value="K&N">K&N</option>
                          <option value="Philips">Philips</option>
                          <option value="Borla">Borla</option>
                          <option value="Fram">Fram</option>
                          <option value="NGK">NGK</option>
                          <option value="Monroe">Monroe</option>
                          <option value="Mishimoto">Mishimoto</option>
                          <option value="Optima">Optima</option>
                          <option value="StopTech">StopTech</option>
                          <option value="Deatschwerks">Deatschwerks</option>
                          <option value="BC Racing">BC Racing</option>
                          <option value="Garrett Motion">Garrett Motion</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-category">Category</Label>
                        <select id="part-category" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={partCategory} onChange={(e) => setPartCategory(e.target.value)} required >
                          <option value="" disabled>Select a category</option>
                          <option value="Engine">Engine</option>
                          <option value="Brakes">Brakes</option>
                          <option value="Suspension">Suspension</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Cooling">Cooling</option>
                          <option value="Exhaust">Exhaust</option>
                          <option value="Filters">Filters</option>
                          <option value="Tools">Tools</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-images">Part Images</Label>
                        <Input id="part-images" type="file" onChange={(e) => setPartImages(e.target.files)} multiple />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="part-specs">Specifications</Label>
                        <textarea id="part-specs" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={partSpecifications} onChange={(e) => setPartSpecifications(e.target.value)} />
                      </div>
                      <Button type="submit" className="w-full">Publish New Part</Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {adminView === 'product' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>List a New Product</CardTitle>
                      <Button variant="outline" onClick={() => setAdminView('menu')}>Back to Menu</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePublishGenericProduct} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input id="product-name" value={genericProductName} onChange={(e) => setGenericProductName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description">Description</Label>
                        <textarea id="product-description" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={genericProductDescription} onChange={(e) => setGenericProductDescription(e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price ($)</Label>
                          <Input id="product-price" type="number" step="0.01" value={genericProductPrice} onChange={(e) => setGenericProductPrice(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-quantity">Quantity</Label>
                          <Input id="product-quantity" type="number" value={genericProductQuantity} onChange={(e) => setGenericProductQuantity(e.target.value)} required />
                        </div>
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="product-brand">Brand</Label>
                        <select id="product-brand" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={genericProductBrand} onChange={(e) => setGenericProductBrand(e.target.value)} required >
                          <option value="" disabled>Select a brand</option>
                          <option value="Wagner">Wagner</option>
                          <option value="K&N">K&N</option>
                          <option value="Philips">Philips</option>
                          <option value="Borla">Borla</option>
                          <option value="Fram">Fram</option>
                          <option value="NGK">NGK</option>
                          <option value="Monroe">Monroe</option>
                          <option value="Mishimoto">Mishimoto</option>
                          <option value="Optima">Optima</option>
                          <option value="StopTech">StopTech</option>
                          <option value="Deatschwerks">Deatschwerks</option>
                          <option value="BC Racing">BC Racing</option>
                          <option value="Garrett Motion">Garrett Motion</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category">Category</Label>
                        <select id="product-category" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={genericProductCategory} onChange={(e) => setGenericProductCategory(e.target.value)} required >
                          <option value="" disabled>Select a category</option>
                          <option value="Engine">Engine</option>
                          <option value="Brakes">Brakes</option>
                          <option value="Suspension">Suspension</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Cooling">Cooling</option>
                          <option value="Exhaust">Exhaust</option>
                          <option value="Filters">Filters</option>
                          <option value="Tools">Tools</option>
                          <option value="Merchandise">Merchandise</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-images">Product Images</Label>
                        <Input id="product-images" type="file" onChange={(e) => setGenericProductImages(e.target.files)} multiple />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-specs">Specifications</Label>
                        <textarea id="product-specs" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={genericProductSpecifications} onChange={(e) => setGenericProductSpecifications(e.target.value)} />
                      </div>
                      <Button type="submit" className="w-full">Publish New Product</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {userInfo.is_admin && sellerExistsForAdmin && (
            <TabsContent value="analytics-dashboard">
              <AnalyticsDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Account;