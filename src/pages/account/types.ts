import { Database } from "@/database.types";

// Database types
export type Product = Database['public']['Tables']['products']['Row'];
export type Part = Database['public']['Tables']['parts']['Row'];

// Part specification interfaces
export interface PartSpecifications {
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  additional?: string;
  [key: string]: unknown;
}

export interface PartWithSpecs extends Omit<Part, 'specifications'> {
  specifications: PartSpecifications | null;
}

// User info interface
export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  is_admin: boolean;
  is_seller: boolean;
  role: string;
}

// Email subscription interface
export interface EmailSubscriptionState {
  subscribed: boolean;
  loading: boolean;
  exists: boolean;
}

// Address form interface
export interface AddressForm {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  type: string;
  is_default: boolean;
}

// Product form interface
export interface ProductInfo {
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  image_urls: string[];
  specifications: string;
  category: string;
  make: string;
  model: string;
  year: string;
  vin: string;
}

// Auth view types
export type AuthView = "login" | "signup";
export type LoginMode = "user" | "admin";
export type ListingType = "part" | "product";

// Admin metrics interface
export interface AdminMetrics {
  orders: number;
  productsActive: number;
  revenue: number;
}

// Vehicle data interfaces
export interface VehicleMake {
  id: string;
  name: string;
}

export interface VehicleModel {
  name: string;
}

// Order interface
export interface Order {
  id: string;
  date: string;
  orderNumber: string;
  status: string;
  total: number;
}