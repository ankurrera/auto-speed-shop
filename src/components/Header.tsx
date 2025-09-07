import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Heart, Menu, X, ChevronDown, LogOut, LayoutDashboard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Header: Error fetching user profile:", error.message, error);
      
      // If profile doesn't exist, try to create one from auth user data
      if (error.code === 'PGRST116') { // No rows returned
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
              // Retry fetching the profile
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
          <div className="flex items-center space-x-1">
            {/* Wishlist */}
            <Button variant="ghost" size="sm" asChild className="relative h-10 w-10 p-0 hover:bg-accent/50 hover:shadow-md transition-all duration-300">
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
            <Button variant="ghost" size="sm" asChild className="relative h-10 w-10 p-0 hover:bg-accent/50 hover:shadow-md transition-all duration-300">
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
              className="h-10 w-10 p-0 hover:bg-accent/50 hover:shadow-md transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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

          {/* Action buttons - Desktop */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="relative hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group">
              <Link to="/wishlist">
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                {wishlistCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="relative hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            
            {userSession ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group">
                    <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
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
                        <Link to="/account/analytics-dashboard">
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
              <Button variant="ghost" size="sm" asChild className="relative hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group">
                <Link to="/account">
                  <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </Link>
              </Button>
            )}

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