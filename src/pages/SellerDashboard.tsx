import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Package, ShoppingCart, TrendingUp, Archive, Edit, Trash2 } from "lucide-react";
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
// Note: You will need to add a multi-select component for vehicle selection.
// This is a placeholder for where you would import it.
// import { MultiSelect } from "@/components/ui/multi-select";

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

const dashboardNavItems = [
  { icon: <Package className="h-4 w-4" />, label: "Products", href: "products" },
  { icon: <ShoppingCart className="h-4 w-4" />, label: "Orders", href: "orders" },
  { icon: <TrendingUp className="h-4 w-4" />, label: "Analytics", href: "/analytics" },
];

const SellerDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  
  const [activeTab, setActiveTab] = useState("products");
  const [listingType, setListingType] = useState("part");

  const [sellerInfo, setSellerInfo] = useState({ name: "", email: "", phone: "", address: "" });

  const initialPartState = {
    name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
    specifications: "", category: "", brand: "", part_number: "", sku: "", selected_vehicles: [],
  };
  const [partInfo, setPartInfo] = useState(initialPartState);

  const initialProductState = {
    name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
    specifications: "", category: "", brand: "",
  };
  const [productInfo, setProductInfo] = useState(initialProductState);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkUserAndSeller = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id, name")
          .eq("user_id", session.user.id)
          .single();
        if (sellerData) {
          setIsSeller(true);
          setSellerId(sellerData.id);
          setSellerInfo(prev => ({ ...prev, name: sellerData.name }));
        }
      } else {
        setIsLoggedIn(false);
        navigate("/account");
      }
    };
    checkUserAndSeller();
  }, [navigate]);

  // --- DATA FETCHING ---
  const { data: parts = [] } = useQuery({
    queryKey: ['seller-parts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('parts').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });
  
  const { data: vehicles = [] } = useQuery({
    queryKey: ['all-vehicles-for-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('id, year, make, model');
      if (error) throw error;
      return data.map(v => ({ value: v.id, label: `${v.year} ${v.make} ${v.model}` }));
    }
  });

  // --- HANDLERS & MUTATIONS ---
  const handleSellerSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      const { error } = await supabase.from("sellers").insert([{ 
          name: sellerInfo.name, email: user.email, phone: sellerInfo.phone, 
          address: sellerInfo.address, user_id: user.id 
      }]);
      if (error) {
          toast({ title: "Error", description: "Failed to create seller account.", variant: "destructive" });
      } else {
          setIsSeller(true);
          toast({ title: "Success!", description: "Your seller account has been created." });
      }
  };

  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sellerId) return;

    const { selected_vehicles, ...partDetails } = partInfo;
    
    const partDataForRpc = {
      name: partDetails.name,
      description: partDetails.description,
      part_number: partDetails.part_number,
      sku: partDetails.sku,
      price: parseFloat(partDetails.price),
      stock_quantity: Number(partDetails.stock_quantity),
      brand: partDetails.brand || sellerInfo.name,
      image_urls: partDetails.image_urls,
      specifications: partDetails.specifications ? JSON.parse(partDetails.specifications) : null,
      seller_id: sellerId,
    };
    
    const { error } = await supabase.rpc('publish_new_part_standalone', {
      part_data: partDataForRpc,
      vehicle_ids: selected_vehicles,
    });

    if (error) {
      toast({ title: "Error", description: `Failed to list part: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your part has been listed successfully." });
      setPartInfo(initialPartState);
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    }
  };
  
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sellerId) return;
    
    const productData = {
        ...productInfo,
        price: parseFloat(productInfo.price),
        stock_quantity: Number(productInfo.stock_quantity),
        is_active: productInfo.stock_quantity > 0,
        seller_id: sellerId,
        brand: productInfo.brand || sellerInfo.name,
    };

    const { error } = await supabase.from("products").insert([productData]);
    if (error) {
        toast({ title: "Error", description: `Failed to list product: ${error.message}`, variant: "destructive" });
    } else {
        toast({ title: "Success!", description: "Your product has been listed successfully." });
        setProductInfo(initialProductState);
        queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const imageUrls = files.map((file: File) => URL.createObjectURL(file));
    
    if (listingType === 'part') {
      setPartInfo(prev => ({ ...prev, image_urls: imageUrls }));
    } else {
      setProductInfo(prev => ({ ...prev, image_urls: imageUrls }));
    }
  };
  
  const renderContent = () => {
    if (!isSeller) {
      return (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center"><CardTitle className="text-2xl">Become a Seller</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSellerSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-name">Store Name</Label>
                  <Input id="seller-name" value={sellerInfo.name} onChange={(e) => setSellerInfo({ ...sellerInfo, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-phone">Phone</Label>
                  <Input id="seller-phone" type="tel" value={sellerInfo.phone} onChange={(e) => setSellerInfo({ ...sellerInfo, phone: e.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-address">Address</Label>
                  <Textarea id="seller-address" value={sellerInfo.address} onChange={(e) => setSellerInfo({ ...sellerInfo, address: e.target.value })}/>
                </div>
                <Button type="submit" className="w-full">Create Seller Account</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <>
        <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">List a New...</h2>
              <Button variant={listingType === "part" ? "default" : "outline"} onClick={() => setListingType("part")}>Part</Button>
              <Button variant={listingType === "product" ? "default" : "outline"} onClick={() => setListingType("product")}>Product</Button>
            </div>
          </CardHeader>
          <CardContent>
            {listingType === 'part' ? (
              <form onSubmit={handlePartSubmit} className="space-y-6">
                <div className="space-y-2"><Label>Part Name</Label><Input value={partInfo.name} onChange={e => setPartInfo({...partInfo, name: e.target.value})} required/></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={partInfo.description} onChange={e => setPartInfo({...partInfo, description: e.target.value})} required/></div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={partInfo.price} onChange={e => setPartInfo({...partInfo, price: e.target.value})} required/></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={partInfo.stock_quantity} onChange={e => setPartInfo({...partInfo, stock_quantity: parseInt(e.target.value, 10) || 0})} required/></div>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Compatibility</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <p className="text-sm text-muted-foreground">This is where you would place a multi-select component to choose compatible vehicles.</p>
                  </div>
                </div>
                <div className="space-y-2"><Label>Images</Label><Input type="file" multiple onChange={handleImageUpload}/></div>
                <Button type="submit">List Part</Button>
              </form>
            ) : (
              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="space-y-2"><Label>Product Name</Label><Input value={productInfo.name} onChange={e => setProductInfo({...productInfo, name: e.target.value})} required/></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={productInfo.description} onChange={e => setProductInfo({...productInfo, description: e.target.value})} required/></div>
                 <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={productInfo.price} onChange={e => setProductInfo({...productInfo, price: e.target.value})} required/></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={productInfo.stock_quantity} onChange={e => setProductInfo({...productInfo, stock_quantity: parseInt(e.target.value, 10) || 0})} required/></div>
                </div>
                <div className="space-y-2"><Label>Images</Label><Input type="file" multiple onChange={handleImageUpload}/></div>
                <Button type="submit">List Product</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Separator className="my-8" />
        <h2 className="text-2xl font-bold mb-4">Your Listed Parts</h2>
        {parts.map(part => (
          <Card key={part.id} className="mb-4"><CardContent className="p-4 flex justify-between items-center"><p>{part.name}</p></CardContent></Card>
        ))}

        <Separator className="my-8" />
        <h2 className="text-2xl font-bold mb-4">Your Listed Products</h2>
        {products.map(product => (
          <Card key={product.id} className="mb-4"><CardContent className="p-4 flex justify-between items-center"><p>{product.name}</p></CardContent></Card>
        ))}
      </>
    );
  };
  
  if (!isLoggedIn) {
      return <div className="text-center p-8"><p>Please log in to view the dashboard.</p></div>
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-64 flex-shrink-0">
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Dashboard</h2>
          <div className="space-y-2">
            {dashboardNavItems.map((item) => (
              <Button
                key={item.label}
                variant={activeTab === item.href ? "secondary" : "ghost"}
                className="w-full justify-start space-x-2"
                onClick={() => setActiveTab(item.href)}
              >
                {item.icon}<span>{item.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
};

export default SellerDashboard;