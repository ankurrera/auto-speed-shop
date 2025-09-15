import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, User, Shield } from 'lucide-react';

/**
 * TicketIdentityDemo - Demonstrates the ticket identity consistency fix
 * 
 * This component allows testing the fix for the customer support ticket identity issue.
 * It simulates a support conversation and shows how the ticket identity remains consistent
 * even when admins reply.
 */
const TicketIdentityDemo = () => {
  const [testUserId, setTestUserId] = useState('');
  const [testAdminId, setTestAdminId] = useState('');
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('john.doe@example.com');
  const [adminName, setAdminName] = useState('Admin Support');
  const [adminEmail, setAdminEmail] = useState('admin.support@company.com');
  const [userMessage, setUserMessage] = useState('Hello, I need help with my order #12345');
  const [adminMessage, setAdminMessage] = useState('Hello! I am here to help you with your order.');
  const [conversationData, setConversationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTestProfiles = async () => {
    setLoading(true);
    try {
      const userId = `test-user-${Date.now()}`;
      const adminId = `test-admin-${Date.now()}`;

      // Create test user profile
      const { error: userError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: userName.split(' ')[0],
          last_name: userName.split(' ').slice(1).join(' '),
          email: userEmail,
          is_admin: false
        });

      if (userError) throw userError;

      // Create test admin profile
      const { error: adminError } = await supabase
        .from('profiles')
        .insert({
          user_id: adminId,
          first_name: adminName.split(' ')[0],
          last_name: adminName.split(' ').slice(1).join(' '),
          email: adminEmail,
          is_admin: true
        });

      if (adminError) throw adminError;

      setTestUserId(userId);
      setTestAdminId(adminId);
      
      toast({
        title: 'Success',
        description: 'Test profiles created successfully'
      });
    } catch (error: any) {
      console.error('Error creating test profiles:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateConversation = async () => {
    if (!testUserId || !testAdminId) {
      toast({
        title: 'Error',
        description: 'Please create test profiles first',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. User sends initial message
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: testUserId,
          message: userMessage,
          is_from_admin: false,
          sender_type: 'user'
        });

      if (userMsgError) throw userMsgError;

      // 2. Admin replies
      const { error: adminMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: testUserId,
          admin_id: testAdminId,
          message: adminMessage,
          is_from_admin: true,
          sender_type: 'admin'
        });

      if (adminMsgError) throw adminMsgError;

      // 3. Get the conversation data to verify the fix
      await loadConversationData();

      toast({
        title: 'Success',
        description: 'Test conversation created successfully'
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversationData = async () => {
    if (!testUserId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          admin_id,
          message,
          is_from_admin,
          sender_type,
          first_name,
          last_name,
          email,
          created_at
        `)
        .eq('user_id', testUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversationData(data || []);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation data',
        variant: 'destructive'
      });
    }
  };

  const clearTestData = async () => {
    if (!testUserId && !testAdminId) return;

    setLoading(true);
    try {
      // Delete messages
      if (testUserId) {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', testUserId);
      }

      // Delete profiles
      if (testUserId) {
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', testUserId);
      }
      if (testAdminId) {
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', testAdminId);
      }

      setTestUserId('');
      setTestAdminId('');
      setConversationData([]);

      toast({
        title: 'Success',
        description: 'Test data cleared successfully'
      });
    } catch (error: any) {
      console.error('Error clearing test data:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ticket Identity Consistency Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This demo verifies the fix for customer support ticket identity consistency. 
            The ticket name and email should always show the original user's information, 
            even when admins reply.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Test User Profile
              </h3>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Message</Label>
                <Textarea 
                  value={userMessage} 
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Hello, I need help..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Test Admin Profile
              </h3>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={adminName} 
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin Support"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.support@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Reply Message</Label>
                <Textarea 
                  value={adminMessage} 
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Hello! I am here to help..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={createTestProfiles} 
              disabled={loading || (testUserId && testAdminId)}
            >
              1. Create Test Profiles
            </Button>
            <Button 
              onClick={simulateConversation} 
              disabled={loading || !testUserId || !testAdminId}
              variant="outline"
            >
              2. Simulate Conversation
            </Button>
            <Button 
              onClick={loadConversationData} 
              disabled={loading || !testUserId}
              variant="outline"
            >
              3. Refresh Data
            </Button>
            <Button 
              onClick={clearTestData} 
              disabled={loading}
              variant="destructive"
            >
              Clear Test Data
            </Button>
          </div>

          {/* Status */}
          {(testUserId || testAdminId) && (
            <div className="flex gap-2">
              {testUserId && <Badge variant="secondary">User ID: {testUserId.slice(-8)}</Badge>}
              {testAdminId && <Badge variant="secondary">Admin ID: {testAdminId.slice(-8)}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {conversationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation Data Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Verify that ALL messages show the same user identity in the denormalized fields, 
              regardless of who sent the message.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversationData.map((msg, index) => (
                <div key={msg.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={msg.is_from_admin ? "default" : "secondary"}>
                      {msg.sender_type === 'admin' ? 'Admin Reply' : 'User Message'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="mb-3 p-2 bg-muted rounded">{msg.message}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Denormalized Identity:</strong>
                      <div className="text-muted-foreground">
                        Name: {msg.first_name} {msg.last_name}<br/>
                        Email: {msg.email}
                      </div>
                    </div>
                    <div>
                      <strong>Message Info:</strong>
                      <div className="text-muted-foreground">
                        From Admin: {msg.is_from_admin ? 'Yes' : 'No'}<br/>
                        Sender Type: {msg.sender_type}
                      </div>
                    </div>
                  </div>
                  
                  {/* Success/Warning indicator */}
                  <div className="mt-2">
                    {msg.first_name === userName.split(' ')[0] && 
                     msg.last_name === userName.split(' ').slice(1).join(' ') && 
                     msg.email === userEmail ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Correct: Shows user identity
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        ✗ Error: Shows wrong identity
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Test Results Summary:</h4>
              <p className="text-sm">
                <strong>Expected Behavior:</strong> Both messages should show the user's identity 
                ({userName}, {userEmail}) in the denormalized fields, even though one message 
                is from the admin.
              </p>
              <p className="text-sm mt-2">
                <strong>What This Proves:</strong> The ticket identity remains consistent regardless 
                of who replies, fixing the original issue where admin replies would change the 
                displayed ticket name and email.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketIdentityDemo;