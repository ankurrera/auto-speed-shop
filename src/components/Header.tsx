import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SimpleThemeToggle } from "./SimpleThemeToggle";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import CarWrenchLogo from "@/assets/car-wrench-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const brands = [
    { name: "Audi" },
    { name: "BMW" },
    { name: "Chevrolet" },
    { name: "Honda" },
    { name: "Mazda" },
    { name: "Mercedes" },
    { name: "Nissan" },
    { name: "Subaru" },
    { name: "Toyota" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      {/* Main header container */}
      <div className="container mx-auto px-4 py-4">
        {/* Top row for mobile: Logo, mobile menu, and cart/wishlist icons */}
        <div className="flex items-center justify-between md:hidden">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-10 w-auto" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">AutoParts Pro</h1>
              <p className="text-xs text-muted-foreground truncate">Premium Auto Parts</p>
            </div>
          </Link>

          {/* Action buttons (mobile) */}
          <div className="flex items-center space-x-2">
            {/* Wishlist */}
            <Button variant="ghost" size="sm" asChild className="relative h-8 w-8 p-0">
              <Link to="/wishlist">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
            {/* Cart */}
            <Button variant="ghost" size="sm" asChild className="relative h-8 w-8 p-0">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search bar */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-12 h-9"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1 h-7 px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-14 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AutoParts Pro</h1>
              <p className="text-sm text-muted-foreground">Premium Auto Parts</p>
            </div>
          </Link>

          {/* Search bar - Desktop */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search by part name, brand, or part number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-12 h-12 text-base"
              />
              <Button size="sm" className="absolute right-1 top-1 h-10 px-4">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action buttons - Desktop */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link to="/wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link to="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <SimpleThemeToggle />
          </div>
        </div>
      </div>

      {/* Navigation and Mobile Menu */}
      <nav className="bg-secondary border-t border-border">
        <div className="container mx-auto px-4">
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center justify-between py-3">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href)
                      ? "text-primary border-b-2 border-primary pb-3"
                      : "text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                  Shop by Brands
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {brands.map((brand) => (
                    <Link to={`/shop?make=${brand.name}`} key={brand.name}>
                      <DropdownMenuItem className="cursor-pointer">
                        {brand.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                  <Link to="/shop">
                    <DropdownMenuItem className="cursor-pointer">
                      View All Brands
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Deals</span>
            </div>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium ${
                      isActive(item.href) ? "text-primary" : "text-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border">
                  <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                    <Link to="/shop" onClick={() => setIsMenuOpen(false)}>
                      Shop by Brands
                    </Link>
                    <span>Deals</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;