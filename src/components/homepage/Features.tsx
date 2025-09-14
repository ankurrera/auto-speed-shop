import { Truck, Shield, Wrench, Clock } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesProps {
  imageSrc?: string;
  imageAlt?: string;
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Fast Shipping",
    description: "Free shipping on orders over $75, nationwide delivery within 2-3 business days."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Quality Guarantee",
    description: "All parts are backed by comprehensive warranty and rigorous quality testing."
  },
  {
    icon: <Wrench className="h-6 w-6" />,
    title: "Expert Support",
    description: "Professional advice from experienced technicians and automotive specialists."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Easy Returns",
    description: "Hassle-free 30-day return policy with no questions asked guarantee."
  }
];

const Features = ({
  imageSrc = "/api/placeholder/600/400",
  imageAlt = "Premium auto part detail",
  features = defaultFeatures
}: FeaturesProps) => {
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
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent rounded-lg" />
            </div>
          </div>

          {/* Features Section - Right Side */}
          <div className="order-1 lg:order-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Why Choose Our Parts
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Experience the difference with premium quality, expert service, and unmatched reliability.
                </p>
              </div>

              <div className="grid gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;