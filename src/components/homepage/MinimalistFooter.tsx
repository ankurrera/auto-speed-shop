import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CarWrenchLogo from "@/assets/car-wrench-logo.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MinimalistFooter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      setIsSubscribing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("subscribers")
        .insert([{ email: email.trim().toLowerCase() }]);

      if (error) {
        if (error.code === '23505') {
          toast.info("You are already subscribed!");
        } else {
          toast.error(`Failed to subscribe: ${error.message || 'Unknown error'}`);
        }
      } else {
        toast.success("You have been successfully subscribed!");
        setEmail("");
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const quickLinks = [
    { name: "Shop All Parts", href: "/shop" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "My Account", href: "/account" },
    { name: "Wishlist", href: "/wishlist" }
  ];

  const customerService = [
    { name: "Help Center", href: "/help" },
    { name: "Returns", href: "/returns" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Track Order", href: "/track" },
    { name: "Size Guide", href: "/size-guide" }
  ];

  const legal = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Accessibility", href: "/accessibility" }
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">AutoParts Pro</h1>
                <p className="text-sm text-muted-foreground">Premium Auto Parts</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your trusted source for high-quality auto parts, accessories, and tools. 
              Serving professionals and enthusiasts since 2010.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+919874139807" className="hover:text-foreground transition-colors">
                  +91 9874139807
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:sunvisiontech@gmail.com" className="hover:text-foreground transition-colors">
                  sunvisiontech@gmail.com
                </a>
              </div>
              <div className="flex items-start space-x-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>EN-9, SALTLAKE SECTOR-5<br />KOLKATA-700091</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Customer Service</h3>
            <ul className="space-y-3">
              {customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Stay Updated</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Get the latest deals and new arrivals straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
              <Button
                type="submit"
                disabled={isSubscribing}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 AutoParts Pro. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6">
              {legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MinimalistFooter;