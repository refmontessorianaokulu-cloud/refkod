/*
  # Create WhatsApp Notification Trigger for Play Group Bookings

  1. Changes
    - Create a trigger function that sends WhatsApp notification when payment_link is added
    - Create a trigger on play_group_bookings table for payment_link updates
    - Trigger calls the send-play-group-whatsapp Edge Function automatically
    
  2. Security
    - Function runs with SECURITY DEFINER to access Edge Function
    - Only triggers when payment_link changes from NULL to a value
*/

CREATE OR REPLACE FUNCTION notify_play_group_payment_link()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  session_record RECORD;
  whatsapp_payload jsonb;
  supabase_url text;
BEGIN
  IF NEW.payment_link IS NOT NULL AND (OLD.payment_link IS NULL OR OLD.payment_link != NEW.payment_link) THEN
    SELECT 
      session_date,
      session_time,
      theme
    INTO session_record
    FROM play_group_sessions
    WHERE id = NEW.session_id;
    
    supabase_url := current_setting('app.settings.supabase_url', true);
    IF supabase_url IS NULL THEN
      supabase_url := 'https://your-project.supabase.co';
    END IF;
    
    whatsapp_payload := jsonb_build_object(
      'phoneNumber', NEW.phone_number,
      'parentName', NEW.parent_name,
      'childName', NEW.child_name,
      'theme', session_record.theme,
      'sessionDate', to_char(session_record.session_date, 'DD.MM.YYYY'),
      'sessionTime', to_char(session_record.session_time, 'HH24:MI'),
      'paymentLink', NEW.payment_link
    );
    
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-play-group-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := whatsapp_payload
    );
    
    RAISE NOTICE 'WhatsApp notification triggered for booking %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS play_group_payment_link_whatsapp_trigger ON play_group_bookings;

CREATE TRIGGER play_group_payment_link_whatsapp_trigger
  AFTER UPDATE OF payment_link ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_play_group_payment_link();
