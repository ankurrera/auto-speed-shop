import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from "react";

import { Link, useNavigate } from "react-router-dom";

import { Box, Package, ShoppingCart, User as UserIcon, TrendingUp, Archive, Edit, Trash2 } from "lucide-react";

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

import type { User } from '@supabase/supabase-js';



// Defines the shape of a product object for type safety

interface Product {

id: string;

name: string;

description: string;

price: number;

stock_quantity: number;

image_urls: string[];

specifications: string;

category: string;

is_active: boolean;

product_type: 'PART' | 'GENERIC';

make?: string;

model?: string;

year_range?: string;

vin?: string;

}



interface PartSpecifications {

category?: string;

make?: string;

model?: string;

year_range?: string;

vin?: string;

additional?: string;

}



interface Part {

id: string;

name: string;

description: string;

price: number;

stock_quantity: number;

image_urls: string[];

specifications: PartSpecifications | null;

brand: string;

is_active: boolean; // ✅ ADDED: is_active property for parts

part_number?: string;

sku?: string;

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



const dashboardNavItems = [

{ icon: <Package className="h-4 w-4" />, label: "Products", href: "products" },

{ icon: <ShoppingCart className="h-4 w-4" />, label: "Orders", href: "orders" },

{ icon: <TrendingUp className="h-4 w-4" />, label: "Analytics", href: "/analytics" },

];



const SellerDashboard = () => {

const [isLoggedIn, setIsLoggedIn] = useState(false);

const [isSeller, setIsSeller] = useState(false);

const [user, setUser] = useState<User | null>(null);

const [sellerId, setSellerId] = useState<string | null>(null);

const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

image_urls: [] as string[],

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



const checkUserAndSeller = useCallback(async () => {

try {

const { data: { session } } = await supabase.auth.getSession();

if (session?.user) {

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

setSellerInfo(prev => ({ ...prev, name: sellerData.name }));

} else if (error) {

console.error("Error checking seller status:", error.message);

}

} else {

setIsLoggedIn(false);

navigate("/account");

}

} catch (error) {

console.error("Error in checkUserAndSeller:", error);

}

}, [navigate]);



useEffect(() => {

checkUserAndSeller();

}, [checkUserAndSeller]);



// Query for products

const { data: products = [] } = useQuery<Product[]>({

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



// Query for parts

const { data: parts = [] } = useQuery<Part[]>({

queryKey: ['seller-parts', sellerId],

queryFn: async () => {

if (!sellerId) return [];

const { data, error } = await supabase

.from('parts')

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



try {

const { error } = await supabase.from("sellers").insert([

{

name: sellerInfo.name,

email: user.email,

phone: sellerInfo.phone,

address: sellerInfo.address,

user_id: user.id

},

]);



if (error) {

console.error("Error creating seller account:", error);

toast({ title: "Error", description: "Failed to create seller account.", variant: "destructive" });

} else {

toast({ title: "Success!", description: "Your seller account has been created." });

checkUserAndSeller();

}

} catch (error) {

console.error("Unexpected error in handleSellerSignup:", error);

toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });

}

};



const handleProductSubmit = async (e: React.FormEvent) => {

e.preventDefault();



if (!user || !sellerId) {

toast({

title: "Please wait",

description: "Your seller information is still loading. Please try again in a moment.",

variant: "destructive",

});

return;

}


const cleanupAndRefetch = () => {

setEditingProductId(null);

setProductInfo({

name: "", description: "", price: "", stock_quantity: 0, image_urls: [],

specifications: "", category: "", make: "", model: "", year_range: "", vin: "",

});

queryClient.invalidateQueries({ queryKey: ['seller-products'] });

queryClient.invalidateQueries({ queryKey: ['seller-parts'] });

window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

};



try {

if (listingType === 'part') {

const partData = {

name: productInfo.name,

description: productInfo.description,

price: parseFloat(productInfo.price) || 0,

stock_quantity: Number(productInfo.stock_quantity) || 0,

brand: sellerInfo.name,

seller_id: sellerId,

// is_active will default to true in the database, no need to set it here on creation

specifications: {

category: productInfo.category,

make: productInfo.make,

model: productInfo.model,

year_range: productInfo.year_range,

vin: productInfo.vin,

additional: productInfo.specifications

},

image_urls: productInfo.image_urls,

};


const { data, error } = await supabase

.from('parts')

.insert([partData])

.select();



if (error) {

console.error('Error saving part:', error);

toast({

title: "Error",

description: `Failed to list part: ${error.message}`,

variant: "destructive"

});

return;

}


toast({ title: "Success!", description: "Your part has been listed." });

cleanupAndRefetch();

return;

}


const productData = {

name: productInfo.name,

description: productInfo.description,

price: parseFloat(productInfo.price) || 0,

stock_quantity: Number(productInfo.stock_quantity) || 0,

is_active: productInfo.stock_quantity > 0,

image_urls: productInfo.image_urls,

specifications: productInfo.specifications,

is_featured: false,

brand: sellerInfo.name,

seller_id: sellerId,

category: productInfo.category,

product_type: 'GENERIC',

};


let error;

if (editingProductId) {

const { error: updateError } = await supabase

.from("products")

.update(productData)

.eq("id", editingProductId)

.eq("seller_id", sellerId);

error = updateError;

} else {

const { error: insertError } = await supabase

.from("products")

.insert([productData]);

error = insertError;

}



if (error) {

console.error('Error saving product:', error);

toast({

title: "Error",

description: `Failed to ${editingProductId ? 'update' : 'add'} product: ${error.message}`,

variant: "destructive"

});

} else {

toast({ title: "Success!", description: `Product ${editingProductId ? 'updated' : 'listed'} successfully.`});

cleanupAndRefetch();

}

} catch (error) {

console.error('Unexpected error:', error);

toast({

title: "Error",

description: "An unexpected error occurred. Please try again.",

variant: "destructive"

});

}

};



const handleEditProduct = (product: Product) => {

setEditingProductId(product.id);

setProductInfo({

name: product.name,

description: product.description,

price: String(product.price),

stock_quantity: product.stock_quantity,

image_urls: product.image_urls || [],

specifications: product.specifications || "",

category: product.category || "",

make: product.make || "",

model: product.model || "",

year_range: product.year_range || "",

vin: product.vin || "",

});

setListingType(product.product_type === "PART" ? "part" : "product");

window.scrollTo({ top: 0, behavior: 'smooth' });

};



const handleEditPart = (part: Part) => {

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

year_range: specs?.year_range || "",

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

if (window.confirm("Are you sure you want to delete this product?")) {

deleteProductMutation.mutate(productId);

}

};



const handleDeletePart = (partId: string) => {

if (window.confirm("Are you sure you want to delete this part?")) {

deletePartMutation.mutate(partId);

}

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


// ✅ ADDED: New mutation and handler for archiving/unarchiving parts

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

<h2 className="text-xl font-bold">{editingProductId ? 'Edit' : 'List a New...'}</h2>

<Button variant={listingType === "part" ? "default" : "outline"} onClick={() => setListingType("part")}>Part</Button>

<Button variant={listingType === "product" ? "default" : "outline"} onClick={() => setListingType("product")}>Product</Button>

</div>

</CardHeader>

<CardContent>

<form onSubmit={handleProductSubmit} className="space-y-6">

{/* Form fields... */}

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

{listingType === "part" && (

<>

<Separator className="my-8" />

<h3 className="text-lg font-semibold">Vehicle Compatibility</h3>

<div className="grid md:grid-cols-2 gap-6">

<div className="space-y-2">

<Label htmlFor="part-make">Make</Label>

<Input id="part-make" value={productInfo.make} onChange={(e) => setProductInfo({ ...productInfo, make: e.target.value })} required />

</div>

<div className="space-y-2">

<Label htmlFor="part-model">Model</Label>

<Input id="part-model" value={productInfo.model} onChange={(e) => setProductInfo({ ...productInfo, model: e.target.value })} required />

</div>

</div>

<div className="grid md:grid-cols-2 gap-6">

<div className="space-y-2">

<Label htmlFor="part-year-range">Year(s)</Label>

<Input id="part-year-range" value={productInfo.year_range} onChange={(e) => setProductInfo({ ...productInfo, year_range: e.target.value })} placeholder="e.g., 2018-2024 or 2020" />

</div>

<div className="space-y-2">

<Label htmlFor="part-vin">VIN (Optional)</Label>

<Input id="part-vin" value={productInfo.vin} onChange={(e) => setProductInfo({ ...productInfo, vin: e.target.value })} />

</div>

</div>

</>

)}

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

specifications: "", category: "", make: "", model: "", year_range: "", vin: "",

});

}}>Cancel Edit</Button>

)}

</div>

</form>

</CardContent>

</Card>

<Separator className="my-8" />


{/* Parts Section */}

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

{/* ✅ ADDED: Display for part status */}

<p className={`text-sm font-medium ${part.is_active ? 'text-green-500' : 'text-yellow-500'}`}>

Status: {part.is_active ? 'Active' : 'Archived'}

</p>

</div>

<div className="flex space-x-2">

<Button variant="outline" size="sm" onClick={() => handleEditPart(part)}><Edit className="h-4 w-4 mr-2" />Edit</Button>

{/* ✅ ADDED: Archive/Unarchive button for parts */}

<Button variant="ghost" size="sm" onClick={() => handleArchivePart(part.id, part.is_active)}>

<Archive className="h-4 w-4 mr-2" />

{part.is_active ? 'Archive' : 'Unarchive'}

</Button>

<Button variant="destructive" size="sm" onClick={() => handleDeletePart(part.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>

</div>

</CardContent>

</Card>

))

)}

</div>



<Separator className="my-8" />


{/* Products Section */}

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

</>

);

case "analytics": return <div>Analytics Coming Soon...</div>;

case "orders": return <div>Order Management Coming Soon...</div>;

default: return <div>Select a tab</div>;

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

<CardHeader className="text-center"><CardTitle className="text-2xl">Become a Seller</CardTitle></CardHeader>

<CardContent>

<form onSubmit={handleSellerSignup} className="space-y-4">

<div className="space-y-2">

<Label htmlFor="seller-name">Store Name</Label>

<Input id="seller-name" placeholder="Enter your store name" value={sellerInfo.name} onChange={(e) => setSellerInfo({ ...sellerInfo, name: e.target.value })} required />

</div>

<div className="space-y-2">

<Label htmlFor="seller-phone">Phone</Label>

<Input id="seller-phone" type="tel" placeholder="Enter your phone number" value={sellerInfo.phone} onChange={(e) => setSellerInfo({ ...sellerInfo, phone: e.target.value })} />

</div>

<div className="space-y-2">

<Label htmlFor="seller-address">Address</Label>

<Textarea id="seller-address" placeholder="Enter your address" value={sellerInfo.address} onChange={(e) => setSellerInfo({ ...sellerInfo, address: e.target.value })} />

</div>

<Button type="submit" className="w-full">Create Seller Account</Button>

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

<Button key={item.label} variant={activeTab === item.href ? "secondary" : "ghost"} className="w-full justify-start space-x-2" onClick={() => setActiveTab(item.href)}>

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