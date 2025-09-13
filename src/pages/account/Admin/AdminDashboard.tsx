import { ShieldCheck, Package, Boxes, TrendingUp, Users, FileText, MessageCircle, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { UserInfo, hasAdminAccess } from "../utils";

interface AdminMetrics {
  orders: number;
  productsActive: number;
  revenue: number;
}

interface AdminDashboardProps {
  userInfo: UserInfo;
  adminMetrics: AdminMetrics | undefined;
  sellerId: string | null;
  sellerExistsForAdmin: boolean;
  onShowUserManagement: () => void;
  onShowOrderManagement: () => void;
  onShowInvoiceManagement: () => void;
  onShowPaymentManagement: () => void;
  onShowInventoryManagement: () => void;
  onShowCustomerSupport: () => void;
  onShowManageProducts: () => void;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <div className="text-muted-foreground">{icon}</div>
    </div>
    <div className="text-3xl font-bold tracking-tight">{value}</div>
    <span className="mt-2 text-xs text-muted-foreground">{subtitle}</span>
  </div>
);

const ActionCard = ({
  title,
  description,
  icon,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group rounded-lg border border-border bg-card p-5 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-muted-foreground group-hover:text-accent-foreground">{icon}</div>
    </div>
    <h4 className="font-semibold mb-2 group-hover:text-accent-foreground">{title}</h4>
    <p className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">{description}</p>
  </button>
);

export const AdminDashboard = ({
  userInfo,
  adminMetrics,
  sellerId,
  sellerExistsForAdmin,
  onShowUserManagement,
  onShowOrderManagement,
  onShowInvoiceManagement,
  onShowPaymentManagement,
  onShowInventoryManagement,
  onShowCustomerSupport,
  onShowManageProducts,
}: AdminDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleManageProducts = () => {
    if (!userInfo.is_seller) {
      toast({
        title: "Access Denied",
        description: "You need to be a seller to manage products.",
        variant: "destructive",
      });
      return;
    }
    if (!sellerId) {
      toast({
        title: "Error",
        description: "Seller ID not found. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    onShowManageProducts();
  };

  return (
    <div className="space-y-10">
      {/* Main Admin Card */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Welcome, {userInfo.firstName || "Administrator"} - Administrative controls and overview
            </p>
          </div>
        </div>

        <div className="bg-muted/60 rounded-lg p-4 flex items-center justify-between mb-8">
          <div>
            <p className="font-medium">Administrator Status</p>
            <p className="text-sm text-muted-foreground">
              User Role: {hasAdminAccess(userInfo) ? "Administrator" : "User"}
              {userInfo.is_seller ? " | Seller" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            Active
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
          <StatCard
            title="Total Orders"
            value={adminMetrics ? Intl.NumberFormat().format(adminMetrics.orders) : "--"}
            subtitle="All time orders"
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Products"
            value={adminMetrics ? Intl.NumberFormat().format(adminMetrics.productsActive) : "--"}
            subtitle="Available products"
            icon={<Boxes className="h-5 w-5" />}
          />
          <StatCard
            title="Total Revenue"
            value={
              adminMetrics
                ? "$" + Intl.NumberFormat().format(Math.round(adminMetrics.revenue))
                : "--"
            }
            subtitle="Confirmed orders revenue"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Manage Users"
              description="View and edit user accounts"
              icon={<Users className="h-5 w-5" />}
              onClick={onShowUserManagement}
            />
            <ActionCard
              title="Manage Products"
              description="Add, edit, or remove products"
              icon={<Boxes className="h-5 w-5" />}
              onClick={handleManageProducts}
            />
            <ActionCard
              title="View Orders"
              description="Monitor and process orders"
              icon={<Package className="h-5 w-5" />}
              onClick={onShowOrderManagement}
            />
            <ActionCard
              title="Invoice Management"
              description="Create and send invoices to customers"
              icon={<FileText className="h-5 w-5" />}
              onClick={onShowInvoiceManagement}
            />
            <ActionCard
              title="Payment Management"
              description="Review customer payment and verify payments"
              icon={<FileText className="h-5 w-5" />}
              onClick={onShowPaymentManagement}
            />
            <ActionCard
              title="Inventory Management"
              description="Stock alerts and disable out-of-stock products"
              icon={<Package className="h-5 w-5" />}
              onClick={onShowInventoryManagement}
            />
            <ActionCard
              title="Customer Support"
              description="Manage customer support messages and conversations"
              icon={<MessageCircle className="h-5 w-5" />}
              onClick={onShowCustomerSupport}
            />
          </div>
          
          {/* Seller Management Section */}
          {userInfo.is_seller && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Seller Management</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <ActionCard
                  title="Seller Dashboard"
                  description="Manage your seller profile and information"
                  icon={<Car className="h-5 w-5" />}
                  onClick={() => navigate("/seller-dashboard")}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seller Creation (if admin and no seller exists yet) */}
      {userInfo.is_admin && !sellerExistsForAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create Seller Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              As an admin, you can create a seller account to manage products.
            </p>
            <Button onClick={() => navigate("/seller-dashboard")}>
              Create Seller Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};