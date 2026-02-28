/*
  # Remove WhatsApp API Trigger - Switch to Manual WhatsApp Business

  1. Changes
    - Drop the automatic WhatsApp notification trigger
    - Drop the trigger function
    - System now uses manual WhatsApp Business links (wa.me) instead of API
    
  2. Reason
    - WhatsApp Business API requires complex setup and phone number verification
    - Manual WhatsApp Business is simpler and works immediately
    - Admin can click "WhatsApp ile Bildir" button to open pre-filled message
*/

DROP TRIGGER IF EXISTS play_group_payment_link_whatsapp_trigger ON play_group_bookings;

DROP FUNCTION IF EXISTS notify_play_group_payment_link();
