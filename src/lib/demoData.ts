// Demo data for when the database is not accessible
export const demoProducts = [
  {
    id: "demo-product-1",
    name: "High Performance Brake Pads - Ceramic",
    brand: "Wagner",
    price: 89.99,
    compare_at_price: 119.99,
    description: "Premium ceramic brake pads designed for superior stopping power and reduced brake dust.",
    image_urls: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      "https://images.unsplash.com/photo-1600885682506-f6795f0f5b9a?w=500"
    ],
    stock_quantity: 25,
    is_active: true,
    is_featured: true,
    category: "Brake Parts",
    created_at: "2024-01-15T00:00:00.000Z",
    updated_at: "2024-01-15T00:00:00.000Z",
    part_number: "WG-BP-CER-001",
    sku: "BP001CER",
    specifications: "Compatible with Toyota Camry 2018-2024",
    type: "product" as const
  },
  {
    id: "demo-product-2", 
    name: "Cold Air Intake System",
    brand: "K&N",
    price: 249.99,
    compare_at_price: 299.99,
    description: "High-flow cold air intake system increases horsepower and torque while improving fuel efficiency.",
    image_urls: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500",
      "https://images.unsplash.com/photo-1558049461-c7aa3d17b0b0?w=500"
    ],
    stock_quantity: 15,
    is_active: true,
    is_featured: true,
    category: "Performance Parts",
    created_at: "2024-01-14T00:00:00.000Z",
    updated_at: "2024-01-14T00:00:00.000Z",
    part_number: "KN-CAI-57-3510",
    sku: "CAI003KN",
    specifications: "Compatible with Honda Civic 2016-2023",
    type: "product" as const
  },
  {
    id: "demo-product-3",
    name: "LED Headlight Bulb Kit - H11",
    brand: "Philips",
    price: 159.99,
    compare_at_price: 199.99,
    description: "Ultra-bright LED headlight conversion kit with 10,000 lumens output.",
    image_urls: [
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=500",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500"
    ],
    stock_quantity: 40,
    is_active: true,
    is_featured: true,
    category: "Lighting",
    created_at: "2024-01-13T00:00:00.000Z",
    updated_at: "2024-01-13T00:00:00.000Z",
    part_number: "PH-LED-H11-X3",
    sku: "LED001PH",
    specifications: "Compatible with Ford F-150 2015-2024",
    type: "product" as const
  },
  {
    id: "demo-product-4",
    name: "Performance Exhaust System",
    brand: "Borla",
    price: 899.99,
    compare_at_price: 1199.99,
    description: "Cat-back exhaust system with stainless steel construction.",
    image_urls: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500",
      "https://images.unsplash.com/photo-1558618047-0c8e1c4ac7e5?w=500"
    ],
    stock_quantity: 8,
    is_active: true,
    is_featured: true,
    category: "Exhaust Parts",
    created_at: "2024-01-12T00:00:00.000Z",
    updated_at: "2024-01-12T00:00:00.000Z",
    part_number: "BOR-ATAK-140735",
    sku: "EXH001BOR",
    specifications: "Compatible with Chevrolet Silverado 2019-2024",
    type: "product" as const
  },
  {
    id: "demo-part-1",
    name: "Oil Filter - Premium",
    brand: "Fram",
    price: 12.99,
    compare_at_price: 16.99,
    description: "High-quality oil filter with advanced filtration technology.",
    image_urls: [
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=500"
    ],
    stock_quantity: 100,
    is_active: true,
    is_featured: false,
    part_number: "FR-PH3593A",
    sku: "OF001FR",
    specifications: {
      category: "Engine Parts",
      make: "Toyota",
      model: "Corolla",
      year: "2014-2024",
      additional: "Compatible with all engine types"
    },
    created_at: "2024-01-11T00:00:00.000Z",
    updated_at: "2024-01-11T00:00:00.000Z",
    type: "part" as const
  },
  {
    id: "demo-part-2", 
    name: "Spark Plugs - Iridium (Set of 4)",
    brand: "NGK",
    price: 59.99,
    compare_at_price: 79.99,
    description: "Long-lasting iridium spark plugs designed for improved fuel efficiency.",
    image_urls: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500"
    ],
    stock_quantity: 50,
    is_active: true,
    is_featured: false,
    part_number: "NGK-ILTR6A13G",
    sku: "SP001NGK",
    specifications: {
      category: "Ignition Parts",
      make: "Honda",
      model: "Accord",
      year: "2013-2023",
      additional: "2.4L gasoline engines"
    },
    created_at: "2024-01-10T00:00:00.000Z",
    updated_at: "2024-01-10T00:00:00.000Z",
    type: "part" as const
  }
];

export const isDemoMode = () => {
  // Check if we're in demo mode (e.g., when database is not accessible)
  return import.meta.env.VITE_DEMO_MODE === 'true' || 
         localStorage.getItem('demo-mode') === 'true';
};

export const enableDemoMode = () => {
  localStorage.setItem('demo-mode', 'true');
  window.location.reload();
};

export const disableDemoMode = () => {
  localStorage.removeItem('demo-mode');
  window.location.reload();
};