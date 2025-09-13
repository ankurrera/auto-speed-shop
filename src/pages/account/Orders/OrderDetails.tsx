// Placeholder for OrderDetails component
// This would be used for showing detailed view of a single order

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderDetailsProps {
  orderId: string;
}

const OrderDetails = ({ orderId }: OrderDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details - {orderId}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Order details component - would show detailed order information, items, shipping, etc.
        </p>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;