// Constants used across Account components

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

export const defaultFormAddress = {
  first_name: "",
  last_name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  phone: "",
  type: "shipping",
  is_default: false,
};

export const defaultProductInfo = {
  name: "",
  description: "",
  price: "",
  stock_quantity: 0,
  image_urls: [] as string[],
  specifications: "",
  category: "",
  make: "",
  model: "",
  year: "",
  vin: "",
};

export const defaultUserInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  is_admin: false,
  is_seller: false,
};