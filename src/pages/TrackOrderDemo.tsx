import OrderProgressTracker from "@/components/OrderProgressTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TrackOrderDemo = () => {
  const demoStatuses = [
    'pending_admin_review',
    'invoice_sent',
    'invoice_accepted',
    'paypal_shared',
    'payment_submitted',
    'payment_verified',
    'confirmed',
    'cancelled',
    'invoice_declined'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center">Track Order Feature Demo</h1>
          
          {demoStatuses.map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle>Status: {status}</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderProgressTracker 
                  currentStatus={status}
                  paymentStatus="pending"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderDemo;