import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import new minimalist components
import MinimalistHeader from "@/components/homepage/MinimalistHeader";
import Hero from "@/components/homepage/Hero";
import VehicleSearch from "@/components/homepage/VehicleSearch";
import Features from "@/components/homepage/Features";
import Categories from "@/components/homepage/Categories";
import ProductGrid from "@/components/homepage/ProductGrid";
import MinimalistFooter from "@/components/homepage/MinimalistFooter";

// Define the type for a product object to ensure type safety
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image_urls: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isOnSale?: boolean;
}

const MinimalistHomePage = () => {
  // Fetch featured products from Supabase
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(8);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return [];
      }

      return (products || []).map((product: Record<string, any>) => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        brand: product.brand || 'Generic',
        price: product.price || 0,
        originalPrice: product.original_price || undefined,
        image: product.image_urls?.[0] || '/api/placeholder/300/200',
        rating: product.rating || 4.5,
        reviewCount: product.reviews || 0,
        inStock: product.in_stock ?? true,
        isOnSale: product.original_price && product.original_price > product.price
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform products data for ProductGrid component
  const transformedProducts = featuredProducts.map(product => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image_urls?.[0] || '/api/placeholder/300/200',
    rating: product.rating,
    reviewCount: product.reviews,
    inStock: product.inStock,
    isOnSale: product.isOnSale
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MinimalistHeader />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero
          title="Premium Auto Parts"
          subtitle="for Every Drive"
          description="Discover high-quality automotive parts and accessories designed for performance, reliability, and style. From everyday maintenance to performance upgrades."
          ctaText="Shop Now"
          ctaLink="/shop"
          imageSrc="/api/placeholder/600/400"
          imageAlt="Premium automotive part"
        />

        {/* Vehicle Search */}
        <VehicleSearch />

        {/* Features Section */}
        <Features
          imageSrc="/api/placeholder/600/400"
          imageAlt="High-quality automotive part detail"
        />

        {/* Categories */}
        <Categories
          title="Top Categories"
          subtitle="Browse our most popular automotive categories"
        />

        {/* Featured Products */}
        <ProductGrid
          products={transformedProducts}
          title="Featured Products"
          subtitle="Top-rated parts chosen by our experts for your car's best performance"
          showViewAll={true}
          viewAllLink="/shop"
          maxProducts={8}
        />
      </main>

      {/* Footer */}
      <MinimalistFooter />
    </div>
  );
};

export default MinimalistHomePage;