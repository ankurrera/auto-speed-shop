import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  imageSrc?: string;
  imageAlt?: string;
}

const Hero = ({
  title = "Premium Auto Parts",
  subtitle = "for Every Drive",
  description = "Discover high-quality automotive parts and accessories designed for performance, reliability, and style. From everyday maintenance to performance upgrades.",
  ctaText = "Shop Now",
  ctaLink = "/shop",
  imageSrc = "/api/placeholder/600/400",
  imageAlt = "Premium auto part"
}: HeroProps) => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Section - Left Side */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-[400px] md:h-[500px] object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent rounded-lg" />
            </div>
          </div>

          {/* Text Section - Right Side */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-foreground">{title}</span>
                <br />
                <span className="text-foreground">{subtitle}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {description}
              </p>
            </div>

            <div className="pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Link to={ctaLink}>
                  {ctaText}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;