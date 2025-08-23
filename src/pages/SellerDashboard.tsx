import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const SellerDashboard = () => {
  const [isSeller, setIsSeller] = useState(false);
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

  const handleSellerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate seller signup
    console.log("Seller Signup:", sellerInfo);
    setIsSeller(true);
    // In a real app, this would involve a Supabase call to create a seller profile
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would involve a Supabase call to insert the new product
    console.log("New Product:", productInfo);
    alert("Product added successfully!");
    setProductInfo({
      name: "",
      description: "",
      price: "",
      images: [],
      specifications: "",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simulate image upload
    const files = Array.from(e.target.files || []);
    console.log("Uploading images:", files);
    setProductInfo({ ...productInfo, images: files });
  };

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
                  <Label htmlFor="seller-email">Email</Label>
                  <Input
                    id="seller-email"
                    type="email"
                    placeholder="Enter your email"
                    value={sellerInfo.email}
                    onChange={(e) =>
                      setSellerInfo({ ...sellerInfo, email: e.target.value })
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
          <Button variant="outline">View My Products</Button>
        </Link>
      </div>
    </div>
  );
};

export default SellerDashboard;