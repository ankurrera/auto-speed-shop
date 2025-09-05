// Types for Account-related components
import { Database } from "@/database.types";

export type Product = Database['public']['Tables']['products']['Row'];
export type Part = Database['public']['Tables']['parts']['Row'];

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

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  is_admin: boolean;
  is_seller: boolean;
}

export interface Address {
  id?: string;
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
  user_id?: string;
}

export interface Order {
  id: string;
  date: string;
  orderNumber: string;
  status: string;
  total: number;
}

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

export interface VehicleMake {
  id: string;
  name: string;
}

export interface VehicleModel {
  name: string;
}

export type LoginMode = "user" | "admin";
export type ViewType = "login" | "signup" | "reset";
export type ListingType = "part" | "product";