import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const SellerDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [sellerInfo, setSellerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    price: "",
    images: [],
    specifications: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndSeller = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        // Check if user is already a seller
        const { data: sellerData, error } = await supabase
          .from("sellers")
          .select("id, name")
          .eq("user_id", session.user.id)
          .single();
        if (sellerData) {
          setIsSeller(true);
        } else if (error && error.message.includes("rows returned from a single row query")) {
          setIsSeller(false);
        } else if (error) {
          console.error("Error checking seller status:", error.message);
        }
      } else {
        setIsLoggedIn(false);
        navigate("/account");
      }
    };
    checkUserAndSeller();
  }, [navigate]);

  const handleSellerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase.from("sellers").insert([
      {
        name: sellerInfo.name,
        email: user.email,
        phone: sellerInfo.phone,
        address: sellerInfo.address,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Error creating seller account:", error.message);
      toast({
        title: "Error",
        description: "Failed to create seller account. Please try again.",
        variant: "destructive",
      });
    } else {
      setIsSeller(true);
      toast({
        title: "Success!",
        description: "Your seller account has been created successfully.",
      });
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Get seller ID
    const { data: sellerData, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (sellerError || !sellerData) {
      toast({
        title: "Error",
        description: "Could not find your seller profile.",
        variant: "destructive",
      });
      return;
    }

    // Insert new product
    const { data, error } = await supabase.from("products").insert([
      {
        name: productInfo.name,
        description: productInfo.description,
        price: productInfo.price,
        image_urls: productInfo.images.map(img => URL.createObjectURL(img)), // Temporary URL for display
        specifications: productInfo.specifications,
        is_active: true, // Set to active by default
        is_featured: false, // Not featured by default
        brand: sellerInfo.name, // Use seller name as brand for now
        seller_id: sellerData.id, // Link to the seller
      },
    ]);

    if (error) {
      console.error("Error adding product:", error.message);
      toast({
        title: "Error",
        description: "Failed to add product. Please check the form and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your product has been listed successfully.",
      });
      setProductInfo({
        name: "",
        description: "",
        price: "",
        images: [],
        specifications: "",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductInfo({ ...productInfo, images: files });
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg">Please log in to access the seller dashboard.</p>
        <Button className="mt-4" onClick={() => navigate("/account")}>Go to Login</Button>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Become a Seller</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSellerSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-name">Store Name</Label>
                  <Input
                    id="seller-name"
                    placeholder="Enter your store name"
                    value={sellerInfo.name}
                    onChange={(e) =>
                      setSellerInfo({ ...sellerInfo, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-phone">Phone</Label>
                  <Input
                    id="seller-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={sellerInfo.phone}
                    onChange={(e) =>
                      setSellerInfo({ ...sellerInfo, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-address">Address</Label>
                  <Textarea
                    id="seller-address"
                    placeholder="Enter your address"
                    value={sellerInfo.address}
                    onChange={(e) =>
                      setSellerInfo({ ...sellerInfo, address: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Seller Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

      {/* Product Listing Form */}
      <Card>
        <CardHeader>
          <CardTitle>List a New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={productInfo.name}
                onChange={(e) =>
                  setProductInfo({ ...productInfo, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productInfo.description}
                onChange={(e) =>
                  setProductInfo({
                    ...productInfo,
                    description: e.target.value,
                  })
                }
                rows={4}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price ($)</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={productInfo.price}
                  onChange={(e) =>
                    setProductInfo({ ...productInfo, price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-images">Product Images</Label>
                <Input
                  id="product-images"
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-specs">Specifications</Label>
              <Textarea
                id="product-specs"
                value={productInfo.specifications}
                onChange={(e) =>
                  setProductInfo({
                    ...productInfo,
                    specifications: e.target.value,
                  })
                }
                rows={4}
                placeholder="List specifications, e.g., 'Make: Toyota', 'Model: Camry', 'Year: 2018-2024'"
              />
            </div>
            <Button type="submit">List Product</Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="text-center">
        <Link to="/shop">
          <Button variant="outline">View All Products</Button>
        </Link>
      </div>
    </div>
  );
};

export default SellerDashboard;