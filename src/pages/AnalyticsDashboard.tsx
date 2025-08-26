import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartColumn,
  ChartLegend,
  ChartLegendContent,
  ChartAxis,
  ChartAxisY,
  ChartGrid
} from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, User, Package, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const salesData = [
  { month: "Jan", "Product A": 186, "Product B": 100 },
  { month: "Feb", "Product A": 305, "Product B": 150 },
  { month: "Mar", "Product A": 237, "Product B": 200 },
  { month: "Apr", "Product A": 73, "Product B": 120 },
  { month: "May", "Product A": 209, "Product B": 180 },
  { month: "Jun", "Product A": 214, "Product B": 250 },
];

const AnalyticsDashboard = () => {

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">
        Monitor your sales performance and key metrics.
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Customers
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+29</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            "Product A": {
              label: "Product A",
              color: "hsl(var(--primary))",
            },
            "Product B": {
              label: "Product B",
              color: "hsl(var(--secondary))",
            }
          }}
          className="min-h-[300px]"
          >
            <RechartsPrimitive.BarChart data={salesData}>
              <ChartGrid />
              <ChartAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartAxisY tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <ChartColumn
                dataKey="Product A"
                fill="var(--color-Product-A)"
                radius={[4, 4, 0, 0]}
              />
              <ChartColumn
                dataKey="Product B"
                fill="var(--color-Product-B)"
                radius={[4, 4, 0, 0]}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RechartsPrimitive.BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;