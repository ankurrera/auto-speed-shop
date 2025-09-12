import { supabase } from '../integrations/supabase/client';
import { Database } from '../database.types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];
type SupportTicketMessage = Database['public']['Tables']['support_ticket_messages']['Row'];
type SupportTicketMessageInsert = Database['public']['Tables']['support_ticket_messages']['Insert'];

export interface SupportTicketWithDetails extends SupportTicket {
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
  } | null;
  assigned_profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
  } | null;
  support_ticket_messages?: SupportTicketMessage[];
}

export interface SupportTicketMessageWithProfile extends SupportTicketMessage {
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
  } | null;
}

export class SupportTicketService {
  /**
   * Get all support tickets (admin only)
   */
  static async getAllTickets(): Promise<SupportTicketWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            id,
            email,
            full_name,
            role
          ),
          assigned_profiles:profiles!support_tickets_assigned_to_fkey (
            id,
            email,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching support tickets:', error);
        throw new Error(`Failed to fetch tickets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      throw error;
    }
  }

  /**
   * Get user support tickets
   */
  static async getUserTickets(userId: string): Promise<SupportTicketWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            id,
            email,
            full_name,
            role
          ),
          assigned_profiles:profiles!support_tickets_assigned_to_fkey (
            id,
            email,
            full_name,
            role
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tickets:', error);
        throw new Error(`Failed to fetch user tickets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTickets:', error);
      throw error;
    }
  }

  /**
   * Get support ticket by ID
   */
  static async getTicketById(ticketId: string): Promise<SupportTicketWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            id,
            email,
            full_name,
            role
          ),
          assigned_profiles:profiles!support_tickets_assigned_to_fkey (
            id,
            email,
            full_name,
            role
          ),
          support_ticket_messages (
            *,
            profiles (
              id,
              email,
              full_name,
              role
            )
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching ticket by ID:', error);
        throw new Error(`Failed to fetch ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getTicketById:', error);
      throw error;
    }
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(ticketData: Omit<SupportTicketInsert, 'ticket_number'>): Promise<SupportTicket> {
    try {
      // Generate unique ticket number
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticketData,
          ticket_number: ticketNumber,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating support ticket:', error);
        throw new Error(`Failed to create support ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createTicket:', error);
      throw error;
    }
  }

  /**
   * Update support ticket
   */
  static async updateTicket(ticketId: string, updates: SupportTicketUpdate): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error updating support ticket:', error);
        throw new Error(`Failed to update ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateTicket:', error);
      throw error;
    }
  }

  /**
   * Delete support ticket (admin only)
   */
  static async deleteTicket(ticketId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) {
        console.error('Error deleting support ticket:', error);
        throw new Error(`Failed to delete ticket: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTicket:', error);
      throw error;
    }
  }

  /**
   * Get ticket messages
   */
  static async getTicketMessages(ticketId: string): Promise<SupportTicketMessageWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name,
            role
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching ticket messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTicketMessages:', error);
      throw error;
    }
  }

  /**
   * Add message to ticket
   */
  static async addMessage(messageData: SupportTicketMessageInsert): Promise<SupportTicketMessage> {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error adding ticket message:', error);
        throw new Error(`Failed to add message: ${error.message}`);
      }

      // Update ticket's updated_at timestamp
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', messageData.ticket_id);

      return data;
    } catch (error) {
      console.error('Error in addMessage:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to admin
   */
  static async assignTicket(ticketId: string, adminId: string): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: adminId,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error assigning ticket:', error);
        throw new Error(`Failed to assign ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in assignTicket:', error);
      throw error;
    }
  }

  /**
   * Close ticket
   */
  static async closeTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error closing ticket:', error);
        throw new Error(`Failed to close ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in closeTicket:', error);
      throw error;
    }
  }

  /**
   * Reopen ticket
   */
  static async reopenTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error reopening ticket:', error);
        throw new Error(`Failed to reopen ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in reopenTicket:', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics (admin only)
   */
  static async getTicketStats(): Promise<{
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status');

      if (error) {
        console.error('Error fetching ticket statistics:', error);
        throw new Error(`Failed to fetch ticket statistics: ${error.message}`);
      }

      const stats = {
        total_tickets: data.length,
        open_tickets: data.filter(t => t.status === 'open').length,
        in_progress_tickets: data.filter(t => t.status === 'in_progress').length,
        resolved_tickets: data.filter(t => t.status === 'resolved').length,
        closed_tickets: data.filter(t => t.status === 'closed').length,
      };

      return stats;
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      throw error;
    }
  }

  /**
   * Search tickets by query
   */
  static async searchTickets(query: string, userId?: string): Promise<SupportTicketWithDetails[]> {
    try {
      let queryBuilder = supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            id,
            email,
            full_name,
            role
          ),
          assigned_profiles:profiles!support_tickets_assigned_to_fkey (
            id,
            email,
            full_name,
            role
          )
        `)
        .or(`subject.ilike.%${query}%,description.ilike.%${query}%,ticket_number.ilike.%${query}%`);

      if (userId) {
        queryBuilder = queryBuilder.eq('user_id', userId);
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching tickets:', error);
        throw new Error(`Failed to search tickets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchTickets:', error);
      throw error;
    }
  }
}