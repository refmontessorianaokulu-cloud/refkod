/*
  # Update Announcement Banners for Internal Routing

  1. Changes
    - Make English fields optional (nullable)
    - Add internal page routing support
    - Change link_url to support both internal routes and external URLs
    
  2. Notes
    - Internal routes: 'playgroup', 'atolye', 'ref_akademi', 'ref_danismanlik', 'contact', etc.
    - External URLs: Start with http:// or https://
*/

-- Make English fields optional
ALTER TABLE announcement_banners 
  ALTER COLUMN message_en DROP NOT NULL;

-- Add comment for clarity on link_url usage
COMMENT ON COLUMN announcement_banners.link_url IS 
  'Can be internal route (playgroup, atolye, contact) or external URL (https://...)';

-- Update existing records with empty English text to NULL
UPDATE announcement_banners 
SET message_en = NULL 
WHERE message_en = '';