import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, User, UserCog, TestTube, Database } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MockChatWindow, MockAdminDashboard } from './MockChatComponents';
import ChatTestHelper from '@/components/ChatTestHelper';
import ChatDebugHelper from '@/components/ChatDebugHelper';

/**
 * MockChatDemo - A demonstration component that shows both user and admin chat interfaces
 * with working mock functionality for testing without database connectivity.
 */
const MockChatDemo = () => {
  const [demoMode, setDemoMode] = useState<'user' | 'admin' | 'test' | 'debug' | null>(null);
  const [userChatOpen, setUserChatOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isMobile = useIsMobile();

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
                This demonstrates the user chat interface. Test both logged-in and logged-out states.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  variant={isLoggedIn ? "default" : "outline"}
                  onClick={() => setIsLoggedIn(true)}
                >
                  Simulate Login
                </Button>
                <Button 
                  variant={!isLoggedIn ? "default" : "outline"}
                  onClick={() => setIsLoggedIn(false)}
                >
                  Simulate Logout
                </Button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current State:</strong> {isLoggedIn ? 'Logged In - Can send/receive messages' : 'Logged Out - Must sign in to chat'}
                </p>
              </div>
              
              {/* Simulated chat button */}
              {!userChatOpen && (
                <Button
                  onClick={() => setUserChatOpen(true)}
                  className={`shadow-lg hover:scale-105 transition-transform ${
                    isMobile 
                      ? 'h-16 w-16 rounded-full' 
                      : 'h-14 w-14 rounded-full'
                  }`}
                  size="icon"
                >
                  <MessageCircle className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`} />
                </Button>
              )}
              
              <p className="text-sm text-muted-foreground">
                Click the chat button above to open the user chat interface
              </p>
            </div>
            
            {/* Chat window */}
            <MockChatWindow 
              isOpen={userChatOpen} 
              onClose={() => setUserChatOpen(false)}
              isLoggedIn={isLoggedIn}
            />
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
              <MockAdminDashboard onBack={() => setDemoMode(null)} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (demoMode === 'test') {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Chat Functionality Test Helper
              </CardTitle>
              <Button variant="outline" onClick={() => setDemoMode(null)}>
                Back to Demo Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChatTestHelper />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (demoMode === 'debug') {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Debug Information
              </CardTitle>
              <Button variant="outline" onClick={() => setDemoMode(null)}>
                Back to Demo Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChatDebugHelper />
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
                  <li>• Authentication state handling</li>
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
                  <li>• Mock conversation data</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Try Admin Interface
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Test Helper */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDemoMode('test')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-purple-500" />
                  Test Helper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the real database functionality with:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Create test users and messages</li>
                  <li>• Test conversation retrieval</li>
                  <li>• Verify database operations</li>
                  <li>• Clean up test data</li>
                </ul>
                <Button className="w-full mt-4" variant="secondary">
                  Open Test Helper
                </Button>
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDemoMode('debug')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-500" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View database state and debug information:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Raw database queries</li>
                  <li>• Message and profile data</li>
                  <li>• Error diagnostics</li>
                  <li>• System health checks</li>
                </ul>
                <Button className="w-full mt-4" variant="destructive">
                  View Debug Info
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
                  <li>• Authentication integration</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-foreground">For Admins:</h5>
                <ul className="space-y-1">
                  <li>• Centralized customer support</li>
                  <li>• Multiple conversation management</li>
                  <li>• Real-time customer assistance</li>
                  <li>• Search and filtering capabilities</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Demo Features:</h4>
            <p className="text-sm text-muted-foreground">
              This demonstration includes mock data and simulated real-time functionality to showcase 
              how the chat system works without requiring database connectivity. Features include:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Working message sending and receiving</li>
              <li>• Simulated typing indicators</li>
              <li>• Multiple conversation threads</li>
              <li>• Authentication state simulation</li>
              <li>• Responsive design for all screen sizes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockChatDemo;