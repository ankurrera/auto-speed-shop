import { Link } from "react-router-dom";
import { 
  Wrench, 
  Car, 
  Zap, 
  Shield, 
  Gauge, 
  Headphones,
  Settings,
  Battery
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

interface CategoriesProps {
  categories?: Category[];
  title?: string;
  subtitle?: string;
}

const defaultCategories: Category[] = [
  {
    id: "engine",
    name: "Engine Parts",
    icon: <Settings className="h-8 w-8" />,
    href: "/shop?category=engine",
    description: "Performance & maintenance"
  },
  {
    id: "brakes",
    name: "Brake System",
    icon: <Shield className="h-8 w-8" />,
    href: "/shop?category=brakes",
    description: "Safety & stopping power"
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: <Zap className="h-8 w-8" />,
    href: "/shop?category=electrical",
    description: "Lights & electronics"
  },
  {
    id: "battery",
    name: "Batteries",
    icon: <Battery className="h-8 w-8" />,
    href: "/shop?category=battery",
    description: "Power & charging"
  },
  {
    id: "performance",
    name: "Performance",
    icon: <Gauge className="h-8 w-8" />,
    href: "/shop?category=performance",
    description: "Speed & upgrades"
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: <Wrench className="h-8 w-8" />,
    href: "/shop?category=maintenance",
    description: "Tools & fluids"
  },
  {
    id: "exterior",
    name: "Exterior",
    icon: <Car className="h-8 w-8" />,
    href: "/shop?category=exterior",
    description: "Body & styling"
  },
  {
    id: "audio",
    name: "Audio & Tech",
    icon: <Headphones className="h-8 w-8" />,
    href: "/shop?category=audio",
    description: "Sound & navigation"
  }
];

const Categories = ({
  categories = defaultCategories,
  title = "Top Categories",
  subtitle = "Browse our most popular automotive categories"
}: CategoriesProps) => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={category.href}
              className="group"
            >
              <div className="bg-card rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 border border-border hover:border-primary/20">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {category.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;