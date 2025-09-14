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
    console.log('[ChatService] Sending message:', {
      userId: data.userId,
      senderType: data.isFromAdmin ? 'admin' : 'user',
      messagePreview: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : '')
    });

    const messageData: ChatMessageInsert = {
      user_id: data.userId,
      message: data.message,
      is_from_admin: data.isFromAdmin,
      sender_type: data.isFromAdmin ? 'admin' : 'user',
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
      console.error('[ChatService] Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    console.log('[ChatService] Message sent successfully:', {
      messageId: message.id,
      senderType: message.sender_type
    });

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
      // Only include conversations where user profile exists
      if (!acc[msg.user_id] && msg.user) {
        acc[msg.user_id] = {
          userId: msg.user_id,
          user: msg.user,
        };
      }
      return acc;
    }, {} as Record<string, { userId: string; user: { first_name: string; last_name: string; email: string } }>);

    // Get messages for each user
    const conversationsWithMessages = await Promise.all(
      Object.values(userGroups).map(async (group: { userId: string; user: { first_name: string; last_name: string; email: string } }) => {
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
   * Set typing indicator using proper UPSERT logic
   */
  static async setTypingIndicator(userId: string, isTyping: boolean, isAdmin = false): Promise<void> {
    if (isTyping) {
      // Use UPSERT to avoid duplicate key constraint errors
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          conversation_user_id: userId,
          is_typing: true,
          last_typed_at: new Date().toISOString(),
          is_admin: isAdmin,
        }, {
          onConflict: 'user_id,conversation_user_id'
        });
      
      if (error) {
        console.error('Error setting typing indicator:', error);
      }
    } else {
      // Remove typing indicator when not typing
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', userId)
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
   * This handles both user-to-admin and admin-to-user message broadcasting
   */
  static subscribeToInstantMessages(
    userId: string,
    onMessage: (message: ChatMessage) => void,
    onTypingChange?: (isTyping: boolean, userInfo?: { isAdmin: boolean; name: string }) => void
  ) {
    console.log('[ChatService] Setting up instant messages subscription for user:', userId);
    const channel = supabase.channel(`instant_chat:${userId}`);

    // Subscribe to messages for this specific user (both incoming and outgoing)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[ChatService] Instant messages received new message payload:', {
          messageId: payload.new.id,
          userId: payload.new.user_id,
          isFromAdmin: payload.new.is_from_admin,
          senderType: payload.new.sender_type,
          timestamp: payload.new.created_at
        });

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
          console.log('[ChatService] Instant messages calling onMessage with complete message:', {
            messageId: message.id,
            isFromAdmin: message.is_from_admin,
            senderType: message.sender_type,
            userProfile: message.user
          });
          onMessage(message as ChatMessage);
        } else {
          console.error('[ChatService] Error fetching complete message for instant messages:', error);
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
            if (typingData.is_typing && typingData.user_id !== userId) {
              // Only show typing indicator for other users (not self)
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, is_admin')
                .eq('user_id', typingData.user_id)
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
   * Subscribe to all new messages (admin view) - Enhanced to handle real-time updates
   */
  static subscribeToAllMessages(onMessage: (message: ChatMessage) => void) {
    return supabase
      .channel('chat_messages:all_admin')
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

  /**
   * Subscribe to all conversations for admin dashboard updates
   * This method listens for ALL message types (both user and admin messages)
   * addressing the requirement to NOT filter messages only by sender_type = 'admin'
   */
  static subscribeToAdminDashboard(onNewMessage: (message: ChatMessage) => void, onConversationUpdate?: () => void) {
    console.log('[ChatService] Setting up admin dashboard subscription for ALL message types');
    const channel = supabase.channel('admin_dashboard:all_messages');

    // Listen for all new messages to update conversations
    // IMPORTANT: No filtering by sender_type - accepts both 'user' and 'admin' messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        // NO FILTER HERE - this receives ALL messages regardless of sender_type
      },
      async (payload) => {
        console.log('[ChatService] Admin dashboard received message:', {
          messageId: payload.new.id,
          senderType: payload.new.sender_type
        });

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
          console.log('[ChatService] Admin dashboard processing:', message.sender_type, 'message');
          // Call the callback with the message - NO FILTERING by sender_type
          onNewMessage(message as ChatMessage);
          if (onConversationUpdate) {
            onConversationUpdate();
          }
        } else {
          console.error('[ChatService] Error fetching complete message for admin dashboard:', error);
        }
      }
    );

    return channel.subscribe();
  }
}