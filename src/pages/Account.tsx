import { useState, useEffect } from "react";
import { User, MapPin, Package, LogOut, Edit, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import PasswordResetForm from "@/components/PasswordResetForm";

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

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
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

  const orders = [
    {
      id: "#ORD-001",
      date: "Dec 15, 2024",
      status: "Delivered",
      total: 189.98,
      items: 3
    },
    {
      id: "#ORD-002",
      date: "Dec 10, 2024",
      status: "Shipped",
      total: 67.99,
      items: 2
    },
    {
      id: "#ORD-003",
      date: "Dec 5, 2024",
      status: "Processing",
      total: 124.50,
      items: 1
    }
  ];

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
    } else if (data) {
      setUserInfo({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || ""
      });
    }
  };

  const fetchUserAddresses = async (userId: string) => {
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
  };

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchUserProfile(session.user.id);
        fetchUserAddresses(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserInfo({ firstName: "", lastName: "", email: "", phone: "" });
        setAddresses([]);
      }
    };
    checkUserSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
    } else {
      console.log("Login successful!");
      setIsLoggedIn(true);
      fetchUserProfile(data.user.id);
      fetchUserAddresses(data.user.id);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setView("login");
      alert("Please check your email to confirm your account!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
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

    // Reset form state and refetch addresses
    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress({
      first_name: "", last_name: "", address_line_1: "", address_line_2: "",
      city: "", state: "", postal_code: "", country: "US", phone: "", type: "shipping"
    });
    fetchUserAddresses(session.user.id);
  };

  if (!isLoggedIn) {
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
                      <Button variant="link" className="text-sm" onClick={() => setView("reset")}>
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
                          Login here
                        </Button>
                      </p>
                    </div>
                  </>
                ) : (
                  <PasswordResetForm onBackToLogin={() => setView("login")} />
                )}
              </CardContent>
            </Card>
          </div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                      disabled={!isEditing}
                      onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
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
                    <Button onClick={() => setIsEditing(false)}>
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
                      No saved addresses. Add a new one to get started.
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
                  {orders.map((order, index) => (
                    <div key={order.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">{order.id}</span>
                            <span className="text-sm text-muted-foreground">{order.date}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              order.status === 'Delivered' ? 'bg-success text-success-foreground' :
                              order.status === 'Shipped' ? 'bg-primary text-primary-foreground' :
                              'bg-warning text-warning-foreground'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.items} item{order.items !== 1 ? 's' : ''}
                          </p>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">Password Reset</h3>
                  <p className="text-muted-foreground mb-4">
                    Forgot your password? We'll send a reset link to your email.
                  </p>
                  <Button variant="outline">Send Password Reset Email</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;