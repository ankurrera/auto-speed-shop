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