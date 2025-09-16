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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, ShoppingCart, User, Package, DollarSign, Calendar, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from "recharts";

interface LocationData {
  location: string;
  count: number;
}

interface BestProduct {
  product_name: string;
  total_quantity: number;
  sale: string;
  revenue: string;
}

interface RecentOrder {
  order_number: string;
  customer_name: string;
  customer_location: string;
  total_amount: string;
  status: string;
}

const AnalyticsDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");

  useEffect(() => {
    console.log("AnalyticsDashboard component is rendering.");
  }, []);

  // Get current user for admin check
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    }
  });

  // Fetch KPIs
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('get_analytics_kpis', {
        requesting_user_id: session.user.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  // Fetch sales chart data
  const { data: salesChartData, isLoading: salesChartLoading } = useQuery({
    queryKey: ['analytics-sales-chart', chartPeriod],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('get_analytics_sales_chart', {
        requesting_user_id: session.user.id,
        days_back: parseInt(chartPeriod)
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  // Fetch best selling products
  const { data: bestProducts, isLoading: bestProductsLoading } = useQuery({
    queryKey: ['analytics-best-products'],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('get_analytics_best_products', {
        requesting_user_id: session.user.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: recentOrdersLoading } = useQuery({
    queryKey: ['analytics-recent-orders'],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('get_analytics_recent_orders', {
        requesting_user_id: session.user.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  // Fetch user analytics
  const { data: userAnalytics, isLoading: userAnalyticsLoading } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('get_analytics_users', {
        requesting_user_id: session.user.id
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!session?.user?.id
  });

  // Format sales chart data for Recharts
  const formattedSalesData = salesChartData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: parseFloat(item.sales),
    orders: item.orders
  })).reverse() || [];

  // Prepare user location data for pie chart
  const locationData = userAnalytics?.top_locations?.map((location: LocationData, index: number) => ({
    name: location.location,
    value: location.count,
    fill: `hsl(${index * 60}, 70%, 60%)`
  })) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (!session?.user) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Please log in to access the analytics dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your sales performance and key metrics for Auto Speed Shop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={chartPeriod} onValueChange={setChartPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiLoading ? "..." : formatCurrency(kpiData?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {!kpiLoading && kpiData?.salesChange !== undefined && (
                <>
                  {kpiData.salesChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {formatPercentage(kpiData.salesChange)} from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiLoading ? "..." : formatCurrency(kpiData?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {!kpiLoading && kpiData?.revenueChange !== undefined && (
                <>
                  {kpiData.revenueChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {formatPercentage(kpiData.revenueChange)} from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiLoading ? "..." : (kpiData?.totalOrders || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {!kpiLoading && kpiData?.ordersChange !== undefined && (
                <>
                  {kpiData.ordersChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {formatPercentage(kpiData.ordersChange)} from last month
                </>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAnalyticsLoading ? "..." : (userAnalytics?.total_users || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All non-admin users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Users
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAnalyticsLoading ? "..." : (userAnalytics?.new_users_this_month || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {!userAnalyticsLoading && userAnalytics?.new_users_change !== undefined && (
                <>
                  {userAnalytics.new_users_change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {formatPercentage(userAnalytics.new_users_change)} from last month
                </>
              )}
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
          {salesChartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedSalesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-blue-600">
                            Sales: {formatCurrency(payload[0].value as number)}
                          </p>
                          <p className="text-green-600">
                            Orders: {payload[1]?.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row with tables and charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
            <p className="text-sm text-muted-foreground">Top products by sales in the last 30 days</p>
          </CardHeader>
          <CardContent>
            {bestProductsLoading ? (
              <p className="text-muted-foreground">Loading products...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Sale</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestProducts?.map((product: BestProduct, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell className="text-right">{product.total_quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(product.sale))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(product.revenue))}</TableCell>
                    </TableRow>
                  ))}
                  {(!bestProducts || bestProducts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No product data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Locations & Recent Orders */}
        <div className="space-y-6">
          {/* User Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Customer Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAnalyticsLoading ? (
                <p className="text-muted-foreground">Loading location data...</p>
              ) : locationData.length > 0 ? (
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {locationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 ml-4">
                    {locationData.map((location, index) => (
                      <div key={index} className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: location.fill }}
                          />
                          <span>{location.name}</span>
                        </div>
                        <span className="font-medium">{location.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No location data available</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrdersLoading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.slice(0, 5).map((order: RecentOrder, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(parseFloat(order.total_amount))}</p>
                        <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <p className="text-center text-muted-foreground">No recent orders</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;