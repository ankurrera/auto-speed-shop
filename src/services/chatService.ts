import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/database.types';

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'] & {
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
export type TypingIndicator = Database['public']['Tables']['typing_indicators']['Row'];

export class ChatService {
  /**
   * Send a chat message
   */
  static async sendMessage(data: {
    userId: string;
    message: string;
    isFromAdmin: boolean;
    adminId?: string;
  }): Promise<ChatMessage> {
    const messageData: ChatMessageInsert = {
      user_id: data.userId,
      message: data.message,
      is_from_admin: data.isFromAdmin,
      admin_id: data.adminId || null,
    };

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select(`
        *,
        user:profiles!chat_messages_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return message as ChatMessage;
  }

  /**
   * Get chat messages for a specific user conversation
   */
  static async getMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:profiles!chat_messages_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data as ChatMessage[];
  }

  /**
   * Get all user conversations (admin view)
   */
  static async getAllConversations(): Promise<{
    userId: string;
    user: { first_name: string; last_name: string; email: string };
    messages: ChatMessage[];
    lastMessage: ChatMessage;
  }[]> {
    // First get all users who have sent messages
    const { data: conversations, error } = await supabase
      .from('chat_messages')
      .select(`
        user_id,
        user:profiles!chat_messages_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Group by user and get messages for each
    const userGroups = conversations.reduce((acc, msg) => {
      if (!acc[msg.user_id]) {
        acc[msg.user_id] = {
          userId: msg.user_id,
          user: msg.user,
        };
      }
      return acc;
    }, {} as Record<string, any>);

    // Get messages for each user
    const conversationsWithMessages = await Promise.all(
      Object.values(userGroups).map(async (group: any) => {
        const messages = await this.getMessages(group.userId);
        return {
          ...group,
          messages,
          lastMessage: messages[messages.length - 1],
        };
      })
    );

    // Sort by last message timestamp
    return conversationsWithMessages
      .filter(conv => conv.lastMessage)
      .sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - 
        new Date(a.lastMessage.created_at).getTime()
      );
  }

  /**
   * Subscribe to real-time messages for a user conversation
   */
  static subscribeToMessages(
    userId: string,
    onMessage: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`chat_messages:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:profiles!chat_messages_user_id_fkey(
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            onMessage(message as ChatMessage);
          }
        }
      )
      .subscribe();
  }

  /**
   * Set typing indicator
   */
  static async setTypingIndicator(userId: string, isTyping: boolean, isAdmin = false): Promise<void> {
    if (isTyping) {
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          conversation_user_id: userId,
          is_typing: true,
          last_typed_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('Error setting typing indicator:', error);
      }
    } else {
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_user_id', userId);
      
      if (error) {
        console.error('Error removing typing indicator:', error);
      }
    }
  }

  /**
   * Subscribe to typing indicators
   */
  static subscribeToTypingIndicators(
    userId: string,
    onTypingChange: (isTyping: boolean, userInfo?: { isAdmin: boolean; name: string }) => void
  ) {
    return supabase
      .channel(`typing_indicators:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Someone is typing
            const typingData = payload.new as TypingIndicator;
            if (typingData.is_typing) {
              // Get user info to show who is typing
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, is_admin')
                .eq('user_id', userId)
                .single();
              
              if (profile) {
                onTypingChange(true, {
                  isAdmin: profile.is_admin || false,
                  name: `${profile.first_name} ${profile.last_name}`.trim(),
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Typing stopped
            onTypingChange(false);
          }
        }
      )
      .subscribe();
  }

  /**
   * Enhanced real-time message subscription with instant delivery
   */
  static subscribeToInstantMessages(
    userId: string,
    onMessage: (message: ChatMessage) => void,
    onTypingChange?: (isTyping: boolean, userInfo?: { isAdmin: boolean; name: string }) => void
  ) {
    const channel = supabase.channel(`instant_chat:${userId}`);

    // Subscribe to new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the complete message with user data immediately
        const { data: message, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            user:profiles!chat_messages_user_id_fkey(
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && message) {
          onMessage(message as ChatMessage);
        }
      }
    );

    // Subscribe to typing indicators if callback provided
    if (onTypingChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingData = payload.new as TypingIndicator;
            if (typingData.is_typing) {
              // Get user info
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, is_admin')
                .eq('user_id', userId)
                .single();
              
              if (profile) {
                onTypingChange(true, {
                  isAdmin: profile.is_admin || false,
                  name: `${profile.first_name} ${profile.last_name}`.trim(),
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            onTypingChange(false);
          }
        }
      );
    }

    return channel.subscribe();
  }

  /**
   * Subscribe to all new messages (admin view)
   */
  static subscribeToAllMessages(onMessage: (message: ChatMessage) => void) {
    return supabase
      .channel('chat_messages:all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:profiles!chat_messages_user_id_fkey(
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            onMessage(message as ChatMessage);
          }
        }
      )
      .subscribe();
  }
}