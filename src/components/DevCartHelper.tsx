import { useCart } from "@/contexts/CartContext";

// Development helper component to add mock items for testing
export const DevCartHelper = () => {
  const { addToCart, cartItems, clearCart } = useCart();

  const addMockItems = () => {
    addToCart({
      id: "mock-item-1",
      name: "Test Brake Pads",
      brand: "TestBrand",
      category: "Brakes",
      price: 45.99,
      image: "https://via.placeholder.com/200",
      is_part: true,
    }, 2);

    addToCart({
      id: "mock-item-2", 
      name: "Test Engine Oil",
      brand: "TestBrand",
      category: "Fluids",
      price: 24.99,
      image: "https://via.placeholder.com/200",
      is_part: false,
    }, 1);
  };

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 9999, 
      backgroundColor: '#333', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px'
    }}>
      <div>DEV TOOLS</div>
      <button 
        onClick={addMockItems}
        style={{ 
          marginRight: '5px', 
          padding: '5px 10px', 
          fontSize: '11px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Add Test Items ({cartItems.length})
      </button>
      <button 
        onClick={clearCart}
        style={{ 
          padding: '5px 10px', 
          fontSize: '11px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Clear Cart
      </button>
    </div>
  );
};