import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/database.types";

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface Conversation {
  id: string;
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export class ChatService {
  static async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!chat_messages_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  static async getAllConversations(): Promise<Conversation[]> {
    try {
      // Get all conversations by finding unique conversation_ids and their latest messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          conversation_id,
          message,
          created_at,
          user_id,
          profiles!chat_messages_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Group messages by conversation_id and get the latest message for each
      const conversationMap = new Map<string, Conversation>();
      
      data.forEach((message: any) => {
        if (!conversationMap.has(message.conversation_id)) {
          const profile = message.profiles;
          conversationMap.set(message.conversation_id, {
            id: message.conversation_id,
            user_id: message.user_id,
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown User',
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: 0, // This would need to be calculated based on read status if implemented
          });
        }
      });

      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      throw error;
    }
  }

  static async sendMessage(conversationId: string, message: string, userId: string, isAdmin: boolean = false): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          message,
          user_id: userId,
          is_admin: isAdmin,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  static async createConversation(userId: string, initialMessage: string): Promise<string> {
    try {
      // Generate a unique conversation ID
      const conversationId = `conv_${userId}_${Date.now()}`;

      // Send the initial message
      await this.sendMessage(conversationId, initialMessage, userId, false);

      return conversationId;
    } catch (error) {
      console.error('Error in createConversation:', error);
      throw error;
    }
  }
}