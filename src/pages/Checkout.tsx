import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();

  // Immediately redirect to the custom checkout flow
  useEffect(() => {
    navigate("/custom-checkout", { replace: true });
  }, [navigate]);

  // Return minimal loading state in case of any delay
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to checkout...</p>
      </div>
    </div>
  );
};

export default Checkout;