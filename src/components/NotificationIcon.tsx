import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Gift,
  CheckCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'coupon' | 'announcement' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface NotificationIconProps {
  className?: string;
}

const NotificationIcon = ({ className = "" }: NotificationIconProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // For now, using mock data since we don't have a notifications table
      // In a real implementation, you would fetch from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'coupon',
          title: 'New Coupon Received!',
          message: 'You have received a 10% discount coupon for your next purchase.',
          data: { coupon_code: 'WELCOME10', discount: 10 },
          read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'announcement',
          title: 'New Products Available',
          message: 'Check out our latest brake pads collection.',
          read: false,
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'coupon',
          title: 'Summer Sale Coupon',
          message: 'Get 25% off on all auto parts this summer!',
          data: { coupon_code: 'SUMMER25', discount: 25 },
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch notifications";
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real implementation, you would update the database
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark notification as read";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real implementation, you would update all notifications in the database
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read"
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark all notifications as read";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete notification";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coupon':
        return <Gift className="h-4 w-4 text-green-600" />;
      case 'announcement':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-2 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.data?.coupon_code && (
                        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
                          <span className="font-mono font-medium">
                            Code: {notification.data.coupon_code}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="h-auto p-1 text-muted-foreground hover:text-foreground ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationIcon;