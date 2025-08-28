import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Package, ShoppingCart, User, TrendingUp, Archive, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const categories = [
  "Engine Parts",
  "Valvetrain",
  "Fuel supply system",
  "Air intake and exhaust systems",
  "Turbochargers / Superchargers",
  "Ignition system",
  "Engine lubrication components",
  "Engine cooling system",
  "Engine electrical parts",
  "Differential",
  "Axle",
  "AD / ADAS",
  "Telematics / Car navigation",
  "Entertainment / Audio",
  "Keys",
  "ECU",
  "Motors",
  "Interior switch",
  "Sensor",
  "Electrical parts",
  "Cable / Connector",
  "Climate control system",
  "HVAC module",
  "Air conditioner",
  "Heater",
  "EV climate control parts",
  "Climate control peripherals",
  "Instrument panel",
  "Display",
  "Airbag",
  "Seat",
  "Seat belt",
  "Pedal",
  "Interior trim",
  "Interior parts",
  "Lighting",
  "Bumper",
  "Window glass",
  "Exterior parts",
  "Chassis module",
  "Brake",
  "Sub-brake",
  "ABS / TCS / ESC",
  "Steering",
  "Suspension",
  "Tire & wheel",
  "Body panel / Frame",
  "Body reinforcement and protector",
  "Door",
  "Hood",
  "Trunk lid",
  "Sunroof",
  "Convertible roof",
  "Wiper",
  "Window washer",
  "Fuel tank",
  "General Parts",
];

const dashboardNavItems = [
  {
    icon: <Package className="h-4 w-4" />,
    label: "Products",
    href: "products",
  },
  {
    icon: <ShoppingCart className="h-4 w-4" />,
    label: "Orders",
    href: "orders",
  },
  {
    icon: <TrendingUp className="h-4 w-4" />,
    label: "Analytics",
    href: "/analytics",
  },
];

const SellerDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [listingType, setListingType] = useState("part");
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
    stock_quantity: 0,
    image_urls: [],
    specifications: "",
    category: "",
    make: "",
    model: "",
    year_range: "",
    vin: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkUserAndSeller = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        const { data: sellerData, error } = await supabase
          .from("sellers")
          .select("id, name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (sellerData) {
          setIsSeller(true);
          setSellerId(sellerData.id);
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

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

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
    if (!user || !sellerId) return;

    const isActive = productInfo.stock_quantity > 0;

    const productData = {
      name: productInfo.name,
      description: productInfo.description,
      price: productInfo.price,
      stock_quantity: productInfo.stock_quantity,
      is_active: isActive,
      image_urls: productInfo.image_urls,
      specifications: productInfo.specifications,
      is_featured: false,
      brand: sellerInfo.name,
      seller_id: sellerId,
      category: productInfo.category,
      make: productInfo.make,
      model: productInfo.model,
      year_range: productInfo.year_range,
      vin: productInfo.vin,
    };

    if (editingProductId) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProductId);

      if (error) {
        console.error("Error updating product:", error.message);
        toast({
          title: "Error",
          description: "Failed to update product. Please check the form and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Your product has been updated successfully.",
        });
        setEditingProductId(null);
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);

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
      }
    }
    
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
      year_range: "",
      vin: "",
    });
    refetchProducts();
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductInfo({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls,
      specifications: product.specifications,
      category: product.category,
      make: product.make,
      model: product.model,
      year_range: product.year_range,
      vin: product.vin,
    });
    setListingType(product.make ? "part" : "product");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Product has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error) => {
      console.error("Error deleting product:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const archiveProductMutation = useMutation({
    mutationFn: async ({ productId, is_active }: { productId: string, is_active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !is_active })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success!",
        description: `Product has been ${variables.is_active ? 'unarchived' : 'archived'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error) => {
      console.error("Error archiving product:", error.message);
      toast({
        title: "Error",
        description: "Failed to archive product.",
        variant: "destructive",
      });
    },
  });

  const handleArchiveProduct = (productId: string, is_active: boolean) => {
    archiveProductMutation.mutate({ productId, is_active });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setProductInfo({ ...productInfo, image_urls: imageUrls });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "products":
        return (
          <>
            <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">List a New...</h2>
                  <Button
                    variant={listingType === "part" ? "default" : "outline"}
                    onClick={() => setListingType("part")}
                  >
                    Part
                  </Button>
                  <Button
                    variant={listingType === "product" ? "default" : "outline"}
                    onClick={() => setListingType("product")}
                  >
                    Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">
                      {listingType === "part" ? "Part Name" : "Product Name"}
                    </Label>
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
                      <Label htmlFor="product-quantity">Quantity</Label>
                      <Input
                        id="product-quantity"
                        type="number"
                        value={productInfo.stock_quantity.toString()}
                        onChange={(e) =>
                          setProductInfo({ ...productInfo, stock_quantity: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-category">Category</Label>
                    <Select value={productInfo.category} onValueChange={(value) => setProductInfo({ ...productInfo, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {listingType === "part" && (
                    <>
                      <Separator className="my-8" />
                      <h3 className="text-lg font-semibold">Vehicle Compatibility</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="part-make">Make</Label>
                          <Input
                            id="part-make"
                            value={productInfo.make}
                            onChange={(e) =>
                              setProductInfo({ ...productInfo, make: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="part-model">Model</Label>
                          <Input
                            id="part-model"
                            value={productInfo.model}
                            onChange={(e) =>
                              setProductInfo({ ...productInfo, model: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="part-year-range">Year(s)</Label>
                          <Input
                            id="part-year-range"
                            value={productInfo.year_range}
                            onChange={(e) =>
                              setProductInfo({ ...productInfo, year_range: e.target.value })
                            }
                            placeholder="e.g., 2018-2024 or 2020"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="part-vin">VIN (Optional)</Label>
                          <Input
                            id="part-vin"
                            value={productInfo.vin}
                            onChange={(e) =>
                              setProductInfo({ ...productInfo, vin: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

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
                      placeholder={listingType === "part" ? "Additional specifications, e.g., 'Color: Black'" : "List specifications here."}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button type="submit">
                      {editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}
                    </Button>
                    {editingProductId && (
                      <Button type="button" variant="outline" onClick={() => {
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
                          year_range: "",
                          vin: "",
                        });
                      }}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Separator className="my-8" />
            
            <h2 className="text-2xl font-bold mb-4">Your Listed Products</h2>
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  You have no products listed yet.
                </div>
              ) : (
                products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-muted-foreground text-sm">{product.category}</p>
                        <p className="text-lg font-bold">${product.price}</p>
                        <p className="text-sm">In Stock: {product.stock_quantity}</p>
                        <p className={`text-sm font-medium ${product.is_active ? 'text-green-500' : 'text-yellow-500'}`}>
                          Status: {product.is_active ? 'Active' : 'Archived'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleArchiveProduct(product.id, product.is_active)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {product.is_active ? 'Archive' : 'Unarchive'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        );
      case "analytics":
        return null;
      default:
        return null;
    }
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
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-64 flex-shrink-0">
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Dashboard</h2>
          <div className="space-y-2">
            {dashboardNavItems.map((item) => (
              <Link to={item.href} key={item.label}>
                <Button
                  variant={activeTab === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start space-x-2"
                  onClick={() => setActiveTab(item.href)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default SellerDashboard;