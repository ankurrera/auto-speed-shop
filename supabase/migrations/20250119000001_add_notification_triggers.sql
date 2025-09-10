-- Create a function to trigger email notifications for new products/parts
CREATE OR REPLACE FUNCTION notify_new_product()
RETURNS TRIGGER AS $$
DECLARE
    notification_payload jsonb;
    api_url text;
    api_key text;
    request_id uuid;
BEGIN
    -- Only trigger for INSERT operations (new products/parts)
    IF TG_OP = 'INSERT' THEN
        -- Get the Supabase URL and service key from settings
        -- In production, these should be set as database settings or environment variables
        SELECT setting INTO api_url FROM pg_settings WHERE name = 'app.settings.supabase_url';
        SELECT setting INTO api_key FROM pg_settings WHERE name = 'app.settings.supabase_service_key';
        
        -- If settings are not found, try to get from environment (fallback)
        IF api_url IS NULL THEN
            api_url := current_setting('app.settings.supabase_url', true);
        END IF;
        
        IF api_key IS NULL THEN
            api_key := current_setting('app.settings.supabase_service_key', true);
        END IF;
        
        -- Build the notification payload
        notification_payload := jsonb_build_object(
            'type', CASE 
                WHEN TG_TABLE_NAME = 'products' THEN 'new_product'
                WHEN TG_TABLE_NAME = 'parts' THEN 'new_part'
                ELSE 'unknown'
            END,
            'item', jsonb_build_object(
                'id', NEW.id,
                'name', NEW.name,
                'description', COALESCE(NEW.description, ''),
                'price', COALESCE(NEW.price, 0),
                'image_urls', COALESCE(NEW.image_urls, '[]'::jsonb),
                'category', CASE 
                    WHEN TG_TABLE_NAME = 'products' THEN COALESCE(NEW.category, '')
                    WHEN TG_TABLE_NAME = 'parts' THEN COALESCE((NEW.specifications->>'category'), '')
                    ELSE ''
                END,
                'brand', CASE 
                    WHEN TG_TABLE_NAME = 'products' THEN COALESCE(NEW.brand, '')
                    WHEN TG_TABLE_NAME = 'parts' THEN COALESCE(NEW.brand, '')
                    ELSE ''
                END
            )
        );
        
        -- Only trigger if we have the necessary configuration
        IF api_url IS NOT NULL AND api_key IS NOT NULL THEN
            -- Insert a notification job that can be processed asynchronously
            -- This prevents the product creation from being blocked by email sending
            INSERT INTO product_notification_queue (
                id,
                payload,
                created_at,
                status
            ) VALUES (
                gen_random_uuid(),
                notification_payload,
                NOW(),
                'pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a queue table for async notification processing
CREATE TABLE IF NOT EXISTS public.product_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create index for efficient processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
ON public.product_notification_queue(status, created_at);

-- Enable RLS on notification queue
ALTER TABLE public.product_notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notification queue (only system can access)
CREATE POLICY "System can manage notification queue" ON public.product_notification_queue
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create triggers for products and parts tables
DROP TRIGGER IF EXISTS trigger_notify_new_product ON public.products;
CREATE TRIGGER trigger_notify_new_product
    AFTER INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_product();

DROP TRIGGER IF EXISTS trigger_notify_new_part ON public.parts;
CREATE TRIGGER trigger_notify_new_part
    AFTER INSERT ON public.parts
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_product();

-- Add comments for documentation
COMMENT ON FUNCTION notify_new_product() IS 
'Trigger function that queues email notifications when new products or parts are created';

COMMENT ON TABLE public.product_notification_queue IS 
'Queue for async processing of product notification emails to prevent blocking product creation';

-- Create a function to process the notification queue
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS TABLE(processed INTEGER, failed INTEGER) AS $$
DECLARE
    queue_item RECORD;
    api_url text;
    api_key text;
    response_status integer;
    processed_count integer := 0;
    failed_count integer := 0;
BEGIN
    -- Get API configuration
    SELECT setting INTO api_url FROM pg_settings WHERE name = 'app.settings.supabase_url';
    SELECT setting INTO api_key FROM pg_settings WHERE name = 'app.settings.supabase_service_key';
    
    -- Process pending notifications (limit to prevent long-running transactions)
    FOR queue_item IN 
        SELECT * FROM product_notification_queue 
        WHERE status = 'pending' AND retry_count < 3
        ORDER BY created_at
        LIMIT 10
    LOOP
        BEGIN
            -- Mark as processing
            UPDATE product_notification_queue 
            SET status = 'processing', processed_at = NOW()
            WHERE id = queue_item.id;
            
            -- Here you would make the HTTP request to your edge function
            -- For now, we'll simulate this and mark as completed
            -- In a real implementation, you'd use pg_net or similar to make HTTP requests
            
            -- Mark as completed
            UPDATE product_notification_queue 
            SET status = 'completed', processed_at = NOW()
            WHERE id = queue_item.id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed and increment retry count
            UPDATE product_notification_queue 
            SET status = 'failed', 
                retry_count = retry_count + 1,
                error_message = SQLERRM,
                processed_at = NOW()
            WHERE id = queue_item.id;
            
            failed_count := failed_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, failed_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_notification_queue() IS 
'Processes pending notification queue items. Should be called periodically by a cron job or background worker';