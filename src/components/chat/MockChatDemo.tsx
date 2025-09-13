import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, User, UserCog } from 'lucide-react';
import ChatWindow from './ChatWindow';
import AdminCustomerSupport from '../AdminCustomerSupport';

/**
 * MockChatDemo - A demonstration component that shows both user and admin chat interfaces
 * without requiring database connectivity. This allows testing the UI functionality.
 */
const MockChatDemo = () => {
  const [demoMode, setDemoMode] = useState<'user' | 'admin' | null>(null);
  const [userChatOpen, setUserChatOpen] = useState(false);

  if (demoMode === 'user') {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Chat Interface Demo
              </CardTitle>
              <Button variant="outline" onClick={() => setDemoMode(null)}>
                Back to Demo Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                This demonstrates the user chat interface. In a real environment, 
                users would see a floating chat button when logged in.
              </p>
              
              {/* Simulated chat button */}
              {!userChatOpen && (
                <Button
                  onClick={() => setUserChatOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                  size="icon"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              )}
              
              <p className="text-sm text-muted-foreground">
                Click the chat button above to open the user chat interface
              </p>
            </div>
            
            {/* Chat window overlay */}
            {userChatOpen && (
              <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                <div className="bg-background rounded-lg shadow-2xl w-96 h-[500px]">
                  <ChatWindow 
                    isOpen={userChatOpen} 
                    onClose={() => setUserChatOpen(false)} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (demoMode === 'admin') {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-6xl mx-auto h-[80vh]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Admin Customer Support Interface Demo
              </CardTitle>
              <Button variant="outline" onClick={() => setDemoMode(null)}>
                Back to Demo Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-full">
            <div className="h-full">
              <AdminCustomerSupport />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Customer Support Chat System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              This demo showcases the customer support chat system with both user and admin interfaces. 
              Select an interface below to explore the functionality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Interface Demo */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDemoMode('user')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  User Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Experience the customer-facing chat interface with:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Floating chat button for easy access</li>
                  <li>• Real-time messaging interface</li>
                  <li>• Message history display</li>
                  <li>• Typing indicators</li>
                  <li>• User-friendly message input</li>
                </ul>
                <Button className="w-full mt-4">
                  Try User Interface
                </Button>
              </CardContent>
            </Card>

            {/* Admin Interface Demo */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDemoMode('admin')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-green-500" />
                  Admin Support Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore the admin customer support dashboard with:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Customer conversation list</li>
                  <li>• Search and filter conversations</li>
                  <li>• Individual chat interfaces</li>
                  <li>• Unread message indicators</li>
                  <li>• Real-time message notifications</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Try Admin Interface
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">System Features:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h5 className="font-medium text-foreground">For Users:</h5>
                <ul className="space-y-1">
                  <li>• Always available chat support</li>
                  <li>• Instant message delivery</li>
                  <li>• Professional support experience</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-foreground">For Admins:</h5>
                <ul className="space-y-1">
                  <li>• Centralized customer support</li>
                  <li>• Multiple conversation management</li>
                  <li>• Real-time customer assistance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockChatDemo;