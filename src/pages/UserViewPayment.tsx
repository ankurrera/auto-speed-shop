import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ViewPayment from "./ViewPayment";

// Wrapper component to handle user-specific payment viewing
const UserViewPayment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is viewing their own payment
    // This component is specifically for user views, so we'll add an isUserView flag
    if (!location.state?.isUserView) {
      navigate(`/account/payments`);
    }
  }, [location.state, navigate]);

  // Pass the same payment record but ensure it's marked as user view
  const stateWithUserFlag = {
    ...location.state,
    isUserView: true
  };

  return <ViewPayment />;
};

export default UserViewPayment;