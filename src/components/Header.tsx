import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Heart, Menu, X, ChevronDown, LogOut, LayoutDashboard, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [userSession, setUserSession] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Header: Error fetching user profile:", error.message, error);
      
      if (error.code === 'PGRST116') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error: createError } = await supabase.from("profiles").upsert(
              {
                user_id: user.id,
                first_name: user.user_metadata?.first_name || "",
                last_name: user.user_metadata?.last_name || "",
                email: user.email || "",
                phone: user.user_metadata?.phone || "",
                is_admin: false,
                is_seller: false,
              },
              { onConflict: "user_id" }
            );
            
            if (!createError) {
              fetchUserProfile(userId);
            } else {
              console.error("Header: Failed to create profile:", createError);
            }
          }
        } catch (createProfileError) {
          console.error("Header: Error creating profile:", createProfileError);
        }
      }
    } else if (data) {
      setUserInfo({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        is_admin: data.is_admin || false,
        is_seller: data.is_seller || false,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserInfo({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          is_admin: false,
          is_seller: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  
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
    { name: "Ford" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Mobile Header (Hamburger, Logo, Actions) */}
        <div className="flex items-center justify-between w-full md:hidden">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Link to="/" className="flex items-center space-x-2">
              <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-8 w-auto" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">AutoParts Pro</h1>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
              <Link to="/wishlist">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            {userSession ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User Account Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/account">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/addresses">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact">Customer Care</Link>
                  </DropdownMenuItem>
                  
                  {userInfo.is_admin && userInfo.is_seller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account/admin-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/analytics">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analytics Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
                <Link to="/account">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex md:w-full items-center justify-between">
          {/* Left: Logo & Name */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={CarWrenchLogo} alt="AutoParts Pro Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">AutoParts Pro</h1>
              <p className="text-xs text-muted-foreground">Premium Auto Parts</p>
            </div>
          </Link>
          
          {/* Center: Navigation Links & Search */}
          <div className="flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary text-foreground">
                  Brands
                  <ChevronDown className="h-3 w-3" />
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
            </nav>
            
            {/* Streamlined Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search parts..."
                className="pl-10 pr-4 py-2 w-64 bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
              <Link to="/wishlist">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            
            {userSession ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User Account Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/account">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/addresses">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact">Customer Care</Link>
                  </DropdownMenuItem>
                  
                  {userInfo.is_admin && userInfo.is_seller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account/admin-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/analytics">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analytics Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild className="relative h-9 w-9 p-0">
                <Link to="/account">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <SimpleThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100 py-4 border-t border-border' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search parts..."
              className="pl-10 pr-4 py-2 w-full bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium ${
                    isActive(item.href) ? "text-primary" : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex justify-start items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                  Brands
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
        </div>
      </div>
    </header>
  );
};

export default Header;