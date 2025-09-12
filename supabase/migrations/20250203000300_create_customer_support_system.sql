-- Create customer support system
-- This adds support tickets and message logs functionality

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'order', 'payment', 'product', 'shipping', 'technical')),
  assigned_to uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Support messages table for ticket conversations
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean DEFAULT false, -- For admin-only messages
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chat logs table for general customer chat
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  support_agent_id uuid REFERENCES public.profiles(user_id),
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS policies for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS policies for support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = support_messages.ticket_id 
      AND st.user_id = auth.uid()
    ) AND NOT is_internal
  );

CREATE POLICY "Users can add messages to their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = support_messages.ticket_id 
      AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all messages" ON public.support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS policies for chat_logs
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat logs" ON public.chat_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create chat messages" ON public.chat_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all chat logs" ON public.chat_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create chat messages" ON public.chat_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'TICKET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::text, 4, '0');
END;
$$;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Function to create support ticket
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  requesting_user_id uuid,
  ticket_subject text,
  ticket_description text,
  ticket_priority text DEFAULT 'medium',
  ticket_category text DEFAULT 'general'
)
RETURNS TABLE(
  ticket_id uuid,
  ticket_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ticket_id uuid;
  new_ticket_number text;
BEGIN
  -- Generate ticket number
  new_ticket_number := generate_ticket_number();
  
  -- Create ticket
  INSERT INTO public.support_tickets (
    ticket_number, user_id, subject, description, priority, category
  ) VALUES (
    new_ticket_number, requesting_user_id, ticket_subject, ticket_description, ticket_priority, ticket_category
  ) RETURNING id INTO new_ticket_id;

  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    requesting_user_id,
    'support',
    'Support Ticket Created',
    format('Your support ticket %s has been created and will be reviewed shortly.', new_ticket_number),
    jsonb_build_object(
      'ticket_id', new_ticket_id,
      'ticket_number', new_ticket_number
    )
  );

  RETURN QUERY SELECT new_ticket_id, new_ticket_number;
END;
$$;

-- Function to get support tickets for admin
CREATE OR REPLACE FUNCTION public.admin_get_support_tickets(
  requesting_user_id uuid,
  ticket_status text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  ticket_number text,
  user_email text,
  user_name text,
  subject text,
  description text,
  status text,
  priority text,
  category text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    st.id,
    st.ticket_number,
    p.email as user_email,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as user_name,
    st.subject,
    st.description,
    st.status,
    st.priority,
    st.category,
    st.created_at,
    st.updated_at
  FROM public.support_tickets st
  JOIN public.profiles p ON st.user_id = p.user_id
  WHERE (ticket_status IS NULL OR st.status = ticket_status)
  ORDER BY 
    CASE st.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END,
    st.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to update ticket status
CREATE OR REPLACE FUNCTION public.admin_update_ticket_status(
  requesting_user_id uuid,
  ticket_id uuid,
  new_status text
)
RETURNS TABLE(
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_user_id uuid;
  ticket_number text;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RETURN QUERY SELECT false, 'Access denied: Admin privileges required';
    RETURN;
  END IF;

  -- Get ticket info
  SELECT st.user_id, st.ticket_number INTO ticket_user_id, ticket_number
  FROM public.support_tickets st
  WHERE st.id = ticket_id;

  IF ticket_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Ticket not found';
    RETURN;
  END IF;

  -- Update ticket
  UPDATE public.support_tickets 
  SET 
    status = new_status,
    updated_at = now(),
    resolved_at = CASE WHEN new_status IN ('resolved', 'closed') THEN now() ELSE resolved_at END
  WHERE id = ticket_id;

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    ticket_user_id,
    'support',
    'Ticket Status Updated',
    format('Your support ticket %s status has been updated to: %s', ticket_number, new_status),
    jsonb_build_object(
      'ticket_id', ticket_id,
      'ticket_number', ticket_number,
      'new_status', new_status
    )
  );

  RETURN QUERY SELECT true, 'Ticket status updated successfully';
END;
$$;

-- Function to add message to ticket
CREATE OR REPLACE FUNCTION public.add_ticket_message(
  requesting_user_id uuid,
  ticket_id uuid,
  message_text text,
  is_internal_message boolean DEFAULT false
)
RETURNS TABLE(
  success boolean,
  message_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_message_id uuid;
  ticket_exists boolean := false;
  is_admin boolean := false;
BEGIN
  -- Check if user is admin
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = requesting_user_id;

  -- Check if ticket exists and user has access
  IF is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE id = ticket_id) INTO ticket_exists;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = requesting_user_id
    ) INTO ticket_exists;
  END IF;

  IF NOT ticket_exists THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  -- Insert message
  INSERT INTO public.support_messages (ticket_id, user_id, message, is_internal)
  VALUES (ticket_id, requesting_user_id, message_text, is_internal_message)
  RETURNING id INTO new_message_id;

  -- Update ticket timestamp
  UPDATE public.support_tickets 
  SET updated_at = now()
  WHERE id = ticket_id;

  RETURN QUERY SELECT true, new_message_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_support_ticket(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_support_tickets(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_ticket_status(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_ticket_message(uuid, uuid, text, boolean) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON public.chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON public.chat_logs(session_id);