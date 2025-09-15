import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Chat Test Helper Component
 * This component helps test the chat functionality by providing:
 * 1. Test message sending for both user and admin
 * 2. Real-time subscription testing
 * 3. Conversation listing verification
 * 
 * Only use this for testing purposes - remove in production
 */
const ChatTestHelper = () => {
  const [testUserId, setTestUserId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendTestMessage = async () => {
    if (!testUserId || !testMessage) {
      toast({
        title: 'Error',
        description: 'Please enter both user ID and message',
        variant: 'destructive'
      });
      return;
    }

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast({
          title: 'Error',
          description: 'Not authenticated',
          variant: 'destructive'
        });
        return;
      }

      await ChatService.sendMessage({
        userId: testUserId,
        message: testMessage,
        isFromAdmin: isAdmin,
        adminId: isAdmin ? currentUser.data.user.id : undefined
      });

      toast({
        title: 'Success',
        description: `Test ${isAdmin ? 'admin' : 'user'} message sent successfully`,
      });

      setTestMessage('');
    } catch (error) {
      console.error('Test message failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test message',
        variant: 'destructive'
      });
    }
  };

  const handleLoadConversations = async () => {
    setLoading(true);
    try {
      const convs = await ChatService.getAllConversations();
      setConversations(convs);
      console.log('Test: Loaded conversations:', convs);
      toast({
        title: 'Success',
        description: `Loaded ${convs.length} conversations`,
      });
    } catch (error) {
      console.error('Test conversation loading failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Chat Test Helper</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test chat functionality - development only
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test User ID:</label>
          <Input
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            placeholder="Enter user UUID"
            className="mt-1"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Test Message:</label>
          <Input
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message"
            className="mt-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isAdmin"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <label htmlFor="isAdmin" className="text-sm">Send as Admin</label>
        </div>

        <div className="space-y-2">
          <Button onClick={handleSendTestMessage} className="w-full">
            Send Test Message
          </Button>
          
          <Button 
            onClick={handleLoadConversations} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Test Load Conversations'}
          </Button>
        </div>

        {conversations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Test Results:</p>
            <div className="text-xs bg-muted p-2 rounded mt-1">
              Found {conversations.length} conversations
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatTestHelper;