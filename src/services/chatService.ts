import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/database.types';

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'] & {
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  admin?: {
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
      .select('*')
      .single();

    if (error) {
      console.error('[ChatService] Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    console.log('[ChatService] Message sent successfully:', {
      messageId: message.id,
      senderType: message.sender_type,
      userInfo: {
        first_name: message.first_name,
        last_name: message.last_name,
        email: message.email
      }
    });

    // Create the response with proper structure to maintain backward compatibility
    // For messages, we need to distinguish between user and admin profile data
    const chatMessage: ChatMessage = {
      ...message,
      user: {
        first_name: message.first_name || '',
        last_name: message.last_name || '',
        email: message.email || ''
      },
      admin: message.is_from_admin ? {
        first_name: message.first_name || '',
        last_name: message.last_name || '',
        email: message.email || ''
      } : undefined
    };

    return chatMessage;
  }

  /**
   * Get chat messages for a specific user conversation
   */
  static async getMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    console.log('[ChatService] Fetching messages for user:', userId, 'with limit:', limit);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ChatService] Error fetching messages for user:', userId, error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    if (!data) {
      console.warn('[ChatService] No data returned for user:', userId);
      return [];
    }

    console.log('[ChatService] Retrieved', data.length, 'messages for user:', userId);
    
    // Log message types for debugging
    const messageSummary = data.reduce((acc, msg) => {
      const type = msg.sender_type || (msg.is_from_admin ? 'admin' : 'user');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('[ChatService] Message breakdown for user', userId, ':', messageSummary);

    // Transform messages to maintain backward compatibility with existing UI components
    const chatMessages: ChatMessage[] = data.map(message => ({
      ...message,
      user: {
        first_name: message.first_name || '',
        last_name: message.last_name || '',
        email: message.email || ''
      },
      admin: message.is_from_admin ? {
        first_name: message.first_name || '',
        last_name: message.last_name || '',
        email: message.email || ''
      } : undefined
    }));

    return chatMessages;
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
    console.log('[ChatService] Getting all conversations for admin view');

    // Get all distinct user_ids who have participated in chat
    // Filter out null values and ensure we only get customer conversations
    const { data: distinctUsers, error: usersError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[ChatService] Error fetching distinct users:', usersError);
      throw new Error(`Failed to fetch conversations: ${usersError.message}`);
    }

    if (!distinctUsers || distinctUsers.length === 0) {
      console.log('[ChatService] No chat messages found in database');
      return [];
    }

    // Get unique user IDs and filter out any null/undefined values
    const uniqueUserIds = [...new Set(distinctUsers
      .map(item => item.user_id)
      .filter(userId => userId && typeof userId === 'string')
    )];
    
    console.log('[ChatService] Found conversations for users:', uniqueUserIds);

    if (uniqueUserIds.length === 0) {
      console.log('[ChatService] No valid user IDs found');
      return [];
    }

    // Get user profiles for each conversation
    const conversationsWithMessages = await Promise.all(
      uniqueUserIds.map(async (userId: string) => {
        try {
          console.log('[ChatService] Processing conversation for user:', userId);

          // Get user profile from profiles table to check admin status and get latest info
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, is_admin')
            .eq('user_id', userId)
            .single();

          if (profileError) {
            console.warn('[ChatService] Profile lookup failed for user:', userId, profileError.message);
            console.log('[ChatService] Using fallback profile for user:', userId);
          }

          // Skip admin-only profiles to avoid showing admin conversations in customer support
          if (userProfile?.is_admin === true) {
            console.log('[ChatService] Skipping admin profile:', userId);
            return null;
          }

          // Get messages for this user
          console.log('[ChatService] Fetching messages for user:', userId);
          const messages = await this.getMessages(userId);
          
          if (messages.length === 0) {
            console.warn('[ChatService] No messages found for user:', userId);
            return null;
          }

          // Always prioritize the profiles table data to ensure ticket creator's identity consistency
          // The denormalized data should be consistent after our fix, but we use profiles as primary source
          const finalProfile = {
            first_name: userProfile?.first_name || 'Unknown',
            last_name: userProfile?.last_name || 'User', 
            email: userProfile?.email || `user-${userId.slice(0, 8)}@unknown.com`
          };
          
          console.log('[ChatService] Conversation for user:', userId, {
            messageCount: messages.length,
            lastMessageType: lastMessage.sender_type,
            lastMessageTime: lastMessage.created_at,
            userProfile: finalProfile
          });

          return {
            userId,
            user: finalProfile,
            messages,
            lastMessage,
          };
        } catch (error) {
          console.error('[ChatService] Error processing conversation for user:', userId, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by last message timestamp
    const validConversations = conversationsWithMessages
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - 
        new Date(a.lastMessage.created_at).getTime()
      );

    console.log('[ChatService] Returning', validConversations.length, 'valid conversations');
    return validConversations;
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
          // Fetch the complete message using denormalized data
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            // Transform to maintain backward compatibility with existing UI components
            const chatMessage: ChatMessage = {
              ...message,
              user: {
                first_name: message.first_name || '',
                last_name: message.last_name || '',
                email: message.email || ''
              },
              admin: message.is_from_admin ? {
                first_name: message.first_name || '',
                last_name: message.last_name || '',
                email: message.email || ''
              } : undefined
            };
            onMessage(chatMessage);
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
    const channelName = `instant_chat:${userId}:${Date.now()}`;
    const channel = supabase.channel(channelName);

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

        // Fetch the complete message using denormalized data (now properly populated by our trigger)
        const { data: message, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('id', payload.new.id)
          .single();

        if (!error && message) {
          console.log('[ChatService] Instant messages calling onMessage with complete message:', {
            messageId: message.id,
            isFromAdmin: message.is_from_admin,
            senderType: message.sender_type,
            profileData: `${message.first_name} ${message.last_name}`.trim()
          });
          
          // Transform to maintain backward compatibility with existing UI components
          const chatMessage: ChatMessage = {
            ...message,
            user: {
              first_name: message.first_name || '',
              last_name: message.last_name || '',
              email: message.email || ''
            },
            admin: message.is_from_admin ? {
              first_name: message.first_name || '',
              last_name: message.last_name || '',
              email: message.email || ''
            } : undefined
          };
          onMessage(chatMessage);
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

    console.log('[ChatService] Starting subscription for channel:', channelName);
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
          // Fetch the complete message using denormalized data
          const { data: message, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            // Transform to maintain backward compatibility with existing UI components
            const chatMessage: ChatMessage = {
              ...message,
              user: {
                first_name: message.first_name || '',
                last_name: message.last_name || '',
                email: message.email || ''
              },
              admin: message.is_from_admin ? {
                first_name: message.first_name || '',
                last_name: message.last_name || '',
                email: message.email || ''
              } : undefined
            };
            onMessage(chatMessage);
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
    const channelName = `admin_dashboard:all_messages:${Date.now()}`;
    const channel = supabase.channel(channelName);

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
          senderType: payload.new.sender_type,
          userId: payload.new.user_id
        });

        // Fetch the complete message using denormalized data
        const { data: message, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('id', payload.new.id)
          .single();

        if (!error && message) {
          console.log('[ChatService] Admin dashboard processing:', message.sender_type, 'message for user:', message.user_id);
          // Transform to maintain backward compatibility with existing UI components
          const chatMessage: ChatMessage = {
            ...message,
            user: {
              first_name: message.first_name || '',
              last_name: message.last_name || '',
              email: message.email || ''
            },
            admin: message.is_from_admin ? {
              first_name: message.first_name || '',
              last_name: message.last_name || '',
              email: message.email || ''
            } : undefined
          };
          // Call the callback with the message - NO FILTERING by sender_type
          onNewMessage(chatMessage);
          if (onConversationUpdate) {
            onConversationUpdate();
          }
        } else {
          console.error('[ChatService] Error fetching complete message for admin dashboard:', error);
        }
      }
    );

    console.log('[ChatService] Starting admin dashboard subscription:', channelName);
    return channel.subscribe();
  }
}