import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ChatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id?: string;
  user_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface TestResults {
  conversations?: Conversation[];
  count?: number;
  timestamp?: string;
  error?: string;
}

const ChatTestHelper = () => {
  const [testUserId, setTestUserId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testUserName, setTestUserName] = useState('');
  const [testUserEmail, setTestUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const { toast } = useToast();

  const createTestUser = async () => {
    if (!testUserName || !testUserEmail) {
      toast({ title: 'Error', description: 'Please provide name and email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Generate a test user ID
      const userId = `test-user-${Date.now()}`;
      
      // Create a test profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: testUserName.split(' ')[0] || testUserName,
          last_name: testUserName.split(' ').slice(1).join(' ') || '',
          email: testUserEmail,
          is_admin: false
        });

      if (profileError) {
        throw new Error(`Failed to create test profile: ${profileError.message}`);
      }

      setTestUserId(userId);
      toast({ title: 'Success', description: `Test user created with ID: ${userId}` });
    } catch (error) {
      console.error('Error creating test user:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testUserId || !testMessage) {
      toast({ title: 'Error', description: 'Please create a user and enter a message', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Send a user message
      const message = await ChatService.sendMessage({
        userId: testUserId,
        message: testMessage,
        isFromAdmin: false
      });

      toast({ title: 'Success', description: 'Test message sent successfully' });
      setTestMessage('');
      console.log('Test message sent:', message);
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const testGetConversations = async () => {
    setLoading(true);
    try {
      const conversations = await ChatService.getAllConversations();
      setResults({
        conversations,
        count: conversations.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('Test conversations retrieved:', conversations);
      toast({ title: 'Success', description: `Retrieved ${conversations.length} conversations` });
    } catch (error) {
      console.error('Error getting conversations:', error);
      setResults({ error: error.message });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!testUserId) {
      toast({ title: 'Error', description: 'No test user to clear', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Delete test messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', testUserId);

      // Delete test profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testUserId);

      setTestUserId('');
      setResults(null);
      toast({ title: 'Success', description: 'Test data cleared' });
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chat Functionality Test Helper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Test User */}
        <div className="space-y-2">
          <Label>Test User Name</Label>
          <Input
            value={testUserName}
            onChange={(e) => setTestUserName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label>Test User Email</Label>
          <Input
            type="email"
            value={testUserEmail}
            onChange={(e) => setTestUserEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <Button onClick={createTestUser} disabled={loading || !!testUserId}>
          {testUserId ? `Test User Created: ${testUserId}` : 'Create Test User'}
        </Button>

        {/* Send Test Message */}
        {testUserId && (
          <>
            <div className="space-y-2">
              <Label>Test Message</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello, I need help with my order..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={sendTestMessage} disabled={loading}>
                Send Test Message
              </Button>
              <Button onClick={testGetConversations} disabled={loading} variant="outline">
                Test Get Conversations
              </Button>
              <Button onClick={clearTestData} disabled={loading} variant="destructive">
                Clear Test Data
              </Button>
            </div>
          </>
        )}

        {/* Results */}
        {results && (
          <div className="mt-4">
            <Label>Test Results:</Label>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatTestHelper;