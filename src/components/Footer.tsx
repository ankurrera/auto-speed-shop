import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import CarWrenchLogo from "@/assets/car-wrench-logo.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Form submitted with email:", email);
  setIsSubscribing(true);

  if (!email || !email.includes("@")) {
    toast.error("Please enter a valid email address.");
    setIsSubscribing(false);
    return;
  }

  try {
    console.log("Attempting to insert email:", email);
    const { data, error } = await supabase
      .from("subscribers")
      .insert([{ email: email.trim().toLowerCase() }]);

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("Subscription error details:", error.message, error.code, error.details, error);
      if (error.code === '23505') {
        toast.info("You are already subscribed!");
      } else {
        toast.error(`Failed to subscribe: ${error.message || 'Unknown error'}`);
      }
    } else {
      console.log("Successfully subscribed:", data);
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

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3">
              <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-10 w-auto" />
              <div className="whitespace-nowrap flex-shrink-0">
                <h1 className="text-xl font-bold text-foreground">AutoParts Pro</h1>
                <p className="text-sm text-muted-foreground">Premium Auto Parts</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your trusted source for high-quality auto parts, accessories, and tools. Serving professionals and enthusiasts since 2010.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/share/1HWqypCZvo/" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 h-9 w-9">
                  <Facebook className="h-4 w-4" />
                </Button>
              </a>
              <a href="#" target="_self" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 h-9 w-9">
                  <Twitter className="h-4 w-4" />
                </Button>
              </a>
              <a href="https://www.instagram.com/digital_indian16?igsh=cDZ3NWliNGZyZDRp" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 h-9 w-9">
                  <Instagram className="h-4 w-4" />
                </Button>
              </a>
              <a href="https://youtube.com/@digitalindianbusinesssolut108?si=pBt6rFSYOWIU4jEt" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 h-9 w-9">
                  <Youtube className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-3">
              <Link to="/shop" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Shop All Parts
              </Link>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/account" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                My Account
              </Link>
              <Link to="/wishlist" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Wishlist
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Customer Service</h3>
            <div className="space-y-4">
              <a href="tel:+919874139807" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">+91 9874139807</span>
              </a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=sunvisiontech@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">sunvisiontech@gmail.com</span>
              </a>
              <a href="https://www.google.com/maps/place/EN+BLOCK,+EN+-+9,+EN+Block,+Sector+V,+Bidhannagar,+Kolkata,+West+Bengal+700091/@22.5739445,88.4340093,17z/data=!4m14!1m7!3m6!1s0x3a0275d29bfb54f9:0xfe248df0c3f4ab15!2sDIGITAL+CAFFE'-kolkata+coworks!8m2!3d22.5821591!4d88.4342347!16s%2Fg%2F11dfswgyxb!3m5!1s0x3a0275afb2dd949b:0xcaff4cf09f3240cf!8m2!3d22.5736058!4d88.43239!16s%2Fg%2F11rkm75qlp?entry=ttu&g_ep=EgoyMDI1MDgzMC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 group">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  <p>EN-9, SALTLAKE</p>
                  <p>SECTOR-5 KOLKATA-700091</p>
                </div>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest deals and new arrivals straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={isSubscribing}>
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        <Separator className="my-12 bg-border" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 AutoParts Pro. All rights reserved.
          </div>
          <div className="flex items-center space-x-8 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
              Shipping Info
            </Link>
            <Link to="/returns" className="text-muted-foreground hover:text-primary transition-colors">
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;