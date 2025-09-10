import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending notifications from queue
    const { data: queueItems, error: queueError } = await supabase
      .from('product_notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at')
      .limit(10);

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue items' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    let failedCount = 0;

    // Process each queue item
    for (const item of queueItems) {
      try {
        // Mark as processing
        await supabase
          .from('product_notification_queue')
          .update({ 
            status: 'processing', 
            processed_at: new Date().toISOString() 
          })
          .eq('id', item.id);

        // Call the send-notification function
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(item.payload),
        });

        if (notificationResponse.ok) {
          // Mark as completed
          await supabase
            .from('product_notification_queue')
            .update({ 
              status: 'completed', 
              processed_at: new Date().toISOString() 
            })
            .eq('id', item.id);
          
          processedCount++;
        } else {
          throw new Error(`Notification service returned ${notificationResponse.status}`);
        }

      } catch (error) {
        // Mark as failed and increment retry count
        await supabase
          .from('product_notification_queue')
          .update({ 
            status: 'failed',
            retry_count: (item.retry_count || 0) + 1,
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        failedCount++;
        console.error(`Failed to process notification ${item.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Queue processing completed',
        processed: processedCount,
        failed: failedCount,
        total: queueItems.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in process-queue function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});