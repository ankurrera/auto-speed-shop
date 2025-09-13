// OrderDetails component - placeholder for future implementation
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderDetailsProps {
  orderId: string;
}

export const OrderDetails = ({ orderId }: OrderDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Order details for order: {orderId}</p>
        <p className="text-muted-foreground">This component is a placeholder for future detailed order view implementation.</p>
      </CardContent>
    </Card>
  );
};