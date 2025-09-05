import { useState } from "react";
import { Shield, Users, ShoppingCart, Package, TrendingUp, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserInfo } from "./types";
import ProductManagementContent from "./ProductManagementContent";

interface AdminDashboardContentProps {
  userInfo: UserInfo;
}

const AdminDashboardContent = ({ userInfo }: AdminDashboardContentProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'products'>('dashboard');

  if (currentView === 'products') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Product Management</h1>
        </div>
        <ProductManagementContent userInfo={userInfo} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Admin Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome, {userInfo.firstName} {userInfo.lastName} - Administrative controls and overview
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Administrator Status</h3>
              <p className="text-sm text-muted-foreground">
                User Role: {userInfo.is_admin ? 'Administrator' : 'Standard User'}
                {userInfo.is_seller && ' | Seller'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${userInfo.is_admin ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {userInfo.is_admin ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  System users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Available products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quick Actions</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="justify-start h-auto p-4" disabled>
                <Users className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Users</div>
                  <div className="text-xs text-muted-foreground">View and edit user accounts</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setCurrentView('products')}>
                <Package className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Products</div>
                  <div className="text-xs text-muted-foreground">Add, edit, or remove products</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4" disabled>
                <ShoppingCart className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">View Orders</div>
                  <div className="text-xs text-muted-foreground">Monitor and process orders</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Admin Dashboard Status</h4>
            <p className="text-sm text-blue-700">
              This admin dashboard has been successfully extracted from the monolithic Account component. 
              Full administrative functionality with live data integration can be implemented in future iterations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardContent;