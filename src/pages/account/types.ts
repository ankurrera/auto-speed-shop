import { Database } from "@/database.types";

// Database types
export type Product = Database['public']['Tables']['products']['Row'];
export type Part = Database['public']['Tables']['parts']['Row'];

// Part specifications interface
export interface PartSpecifications {
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  additional?: string;
  [key: string]: unknown;
}

// Part with specifications interface
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

// Email subscription state interface
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

// Product info interface for forms
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

// Product categories
export const categories = [
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