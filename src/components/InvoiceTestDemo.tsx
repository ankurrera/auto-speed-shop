import React, { useState } from 'react';
import InvoiceDisplay from '@/components/InvoiceDisplay';

// Sample order data for testing the invoice display
const sampleOrderDetails = {
  id: 'sample-invoice-order-1',
  order_number: 'ORD-INV-001',
  subtotal: 199.99,
  shipping_amount: 9.99,
  tax_amount: 16.50,
  total_amount: 226.48,
  convenience_fee: 5.00,
  delivery_charge: 10.00,
  created_at: new Date().toISOString(),
  shipping_address: {
    first_name: 'John',
    last_name: 'Doe',
    line1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postal_code: '78701',
    country: 'US'
  },
  order_items: [
    {
      id: 'sample-item-1',
      product_name: 'High Performance Brake Pads',
      quantity: 2,
      unit_price: 89.99,
      total_price: 179.98
    },
    {
      id: 'sample-item-2',
      product_name: 'Cold Air Intake System',
      quantity: 1,
      unit_price: 19.99,
      total_price: 19.99
    }
  ]
};

const InvoiceTestDemo: React.FC = () => {
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAccept = () => {
    setResponding(true);
    setTimeout(() => {
      setResponse('Invoice Accepted! Order will proceed to payment.');
      setResponding(false);
    }, 1000);
  };

  const handleDecline = () => {
    setResponding(true);
    setTimeout(() => {
      setResponse('Invoice Declined. Order has been cancelled.');
      setResponding(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Invoice Display Test</h1>
        <p className="text-gray-600 mb-4">
          This demonstrates the new formal invoice display with PDF generation and accept/decline functionality.
        </p>
        
        {response && (
          <div className={`p-4 rounded-lg mb-6 ${
            response.includes('Accepted') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {response}
          </div>
        )}
      </div>

      <InvoiceDisplay
        orderDetails={sampleOrderDetails}
        onAccept={handleAccept}
        onDecline={handleDecline}
        isResponding={responding}
      />
    </div>
  );
};

export default InvoiceTestDemo;