-- SQL script to drop tables related to discount/coupon management, support tickets, and notifications
-- Run this script to remove all database tables and related objects for these features

-- Warning: This will permanently delete all data in these tables!
-- Make sure to backup your data before running this script.

-- Drop user_coupons table first (has foreign key to coupons)
DROP TABLE IF EXISTS public.user_coupons CASCADE;

-- Drop coupons table  
DROP TABLE IF EXISTS public.coupons CASCADE;

-- Drop support_tickets table
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- Drop email_subscriptions table
DROP TABLE IF EXISTS public.email_subscriptions CASCADE;

-- Drop customer support / chat tables
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.typing_indicators CASCADE;

-- Drop functions related to coupons
DROP FUNCTION IF EXISTS increment_coupon_usage(UUID);
DROP FUNCTION IF EXISTS expire_old_coupons();

-- Drop function related to email subscriptions
DROP FUNCTION IF EXISTS update_email_subscriptions_updated_at();

-- Drop triggers (these should be dropped automatically with tables, but just to be safe)
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
DROP TRIGGER IF EXISTS update_user_coupons_updated_at ON public.user_coupons;
DROP TRIGGER IF EXISTS update_email_subscriptions_updated_at_trigger ON public.email_subscriptions;

-- Note: The update_updated_at_column() function is used by other tables, so we don't drop it

-- Indexes are automatically dropped when tables are dropped, so no need to explicitly drop them

-- The following tables and related objects have been removed:
-- 1. support_tickets - Support ticket management
-- 2. coupons - Discount/coupon definitions
-- 3. user_coupons - User-assigned coupons
-- 4. email_subscriptions - Email notification preferences
-- 5. chat_messages - Customer support chat messages
-- 6. typing_indicators - Chat typing indicators
-- 7. Related functions and triggers

COMMIT;