// src/pages/NewArrivals.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { ProductCardProps } from "@/components/ProductCard";

const NewArrivals = () => {
  const [newProducts, setNewProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching new arrivals:", error);
      } else {
        const formattedProducts = data.map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand || 'N/A',
          price: product.price,
          originalPrice: product.compare_at_price,
          image_urls: product.image_urls || [],
          rating: 4.5, // Placeholder
          reviews: 150, // Placeholder
          inStock: product.stock_quantity > 0,
          isOnSale: !!product.compare_at_price && product.compare_at_price > product.price,
        }));
        setNewProducts(formattedProducts);
      }
      setLoading(false);
    };

    fetchNewArrivals();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">New Arrivals</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {newProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewArrivals;