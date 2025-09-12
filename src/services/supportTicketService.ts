import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/database.types';

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'] & {
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

export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];

export class SupportTicketService {
  /**
   * Create a new support ticket
   */
  static async createTicket(data: {
    userId: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }): Promise<SupportTicket> {
    const ticketData: SupportTicketInsert = {
      user_id: data.userId,
      subject: data.subject,
      description: data.description,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      status: 'open',
    };

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    return ticket as SupportTicket;
  }

  /**
   * Get support tickets for a specific user
   */
  static async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user tickets: ${error.message}`);
    }

    return data as SupportTicket[];
  }

  /**
   * Get all support tickets (admin view)
   */
  static async getAllTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    return data as SupportTicket[];
  }

  /**
   * Update a support ticket (admin function)
   */
  static async updateTicket(
    ticketId: string,
    updates: {
      status?: string;
      priority?: string;
      admin_response?: string;
      admin_id?: string;
    }
  ): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return ticket as SupportTicket;
  }

  /**
   * Get ticket statistics (admin view)
   */
  static async getTicketStats(): Promise<{
    total: number;
    open: number;
    pending: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('status, priority');

    if (error) {
      throw new Error(`Failed to fetch ticket stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    };

    data.forEach((ticket) => {
      if (ticket.status === 'open') stats.open++;
      else if (ticket.status === 'pending') stats.pending++;
      else if (ticket.status === 'resolved') stats.resolved++;
      else if (ticket.status === 'closed') stats.closed++;

      if (ticket.priority in stats.byPriority) {
        stats.byPriority[ticket.priority as keyof typeof stats.byPriority]++;
      }
    });

    return stats;
  }

  /**
   * Subscribe to real-time ticket updates
   */
  static subscribeToTicketUpdates(
    userId: string,
    callback: (payload: { eventType: string; new: SupportTicket; old?: SupportTicket }) => void
  ) {
    return supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}