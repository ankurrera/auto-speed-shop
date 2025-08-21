import { useState } from "react";
import { Search, Wrench, Truck, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";

const Home = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const featuredProducts = [
    {
      id: "1",
      name: "Premium Brake Pads - Ceramic",
      brand: "ACDelco",
      price: 89.99,
      originalPrice: 109.99,
      image: "/placeholder.svg",
      rating: 4.8,
      reviews: 124,
      inStock: true,
      isOnSale: true,
    },
    // ... other products
  ];

  const categories = [
    { name: "Engine", icon: "🔧" },
    { name: "Brakes", icon: "🛞" },
    { name: "Suspension", icon: "🚗" },
    { name: "Electrical", icon: "⚡" },
    { name: "Cooling", icon: "❄️" },
    { name: "Exhaust", icon: "💨" },
    { name: "Filters", icon: "🌪️" },
    { name: "Tools", icon: "🔧" },
  ];

  const years = Array.from({ length: 30 }, (_, i) => 2024 - i);
  const makes = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi", "Nissan"];
  const models = ["Camry", "Accord", "F-150", "Silverado", "3 Series", "C-Class"];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-auto-parts.jpg" // ✅ served from /public
            alt="Auto Parts Hero"
            className="object-cover opacity-20"
            fill
            priority
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Premium Auto Parts
              <br />
              <span className="text-primary">For Every Ride</span>
            </h1>
            <p className="text-xl mb-8 text-gray-200 leading-relaxed">
              Quality parts, competitive prices, and expert support for professionals and enthusiasts.
            </p>
            {/* Vehicle Search ... (rest of code unchanged) */}
          </div>
        </div>
      </section>
      {/* Features, Categories, Products sections remain the same */}
    </div>
  );
};

export default Home;
