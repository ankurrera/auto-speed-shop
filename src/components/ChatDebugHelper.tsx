import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id?: string;
  sender_type?: string;
  is_from_admin?: boolean;
  message?: string;
  created_at?: string;
  user_id?: string;
}

interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_admin?: boolean;
}

interface DebugInfo {
  allMessages: ChatMessage[];
  messagesError: unknown;
  allProfiles: UserProfile[];
  profilesError: unknown;
  distinctUsers: string[];
  distinctError: unknown;
  totalMessages: number;
  totalProfiles: number;
  messageSummary: Record<string, number>;
}

const ChatDebugHelper = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebugQueries = async () => {
    setLoading(true);
    try {
      // Get all chat messages
      const { data: allMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, is_admin')
        .limit(10);

      // Get distinct user_ids from messages
      const { data: distinctUsers, error: distinctError } = await supabase
        .from('chat_messages')
        .select('user_id')
        .not('user_id', 'is', null);

      const uniqueUserIds = distinctUsers ? [...new Set(distinctUsers.map(item => item.user_id))] : [];

      setDebugInfo({
        allMessages: allMessages || [],
        messagesError,
        allProfiles: allProfiles || [],
        profilesError,
        distinctUsers: uniqueUserIds,
        distinctError,
        totalMessages: allMessages?.length || 0,
        totalProfiles: allProfiles?.length || 0,
        messageSummary: allMessages?.reduce((acc, msg) => {
          const type = msg.sender_type || (msg.is_from_admin ? 'admin' : 'user');
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      });
    } catch (error) {
      console.error('Debug query error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugQueries();
  }, []);

  return (
    <Card className="max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Chat Debug Information</CardTitle>
        <Button onClick={runDebugQueries} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Debug Info'}
        </Button>
      </CardHeader>
      <CardContent>
        {debugInfo ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Summary:</h3>
              <p>Total Messages: {debugInfo.totalMessages}</p>
              <p>Total Profiles: {debugInfo.totalProfiles}</p>
              <p>Distinct User IDs: {debugInfo.distinctUsers?.length || 0}</p>
              <p>Message Types: {JSON.stringify(debugInfo.messageSummary)}</p>
            </div>

            {debugInfo.messagesError && (
              <div className="text-red-500">
                <h3 className="font-semibold">Messages Error:</h3>
                <pre>{JSON.stringify(debugInfo.messagesError, null, 2)}</pre>
              </div>
            )}

            {debugInfo.profilesError && (
              <div className="text-red-500">
                <h3 className="font-semibold">Profiles Error:</h3>
                <pre>{JSON.stringify(debugInfo.profilesError, null, 2)}</pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold">Recent Messages:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded max-h-60 overflow-auto">
                {JSON.stringify(debugInfo.allMessages, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">User Profiles:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded max-h-60 overflow-auto">
                {JSON.stringify(debugInfo.allProfiles, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Distinct User IDs:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(debugInfo.distinctUsers, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p>Loading debug information...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatDebugHelper;