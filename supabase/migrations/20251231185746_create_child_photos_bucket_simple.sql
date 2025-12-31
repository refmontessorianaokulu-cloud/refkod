/*
  # Create Storage Bucket for Child Photos

  1. New Storage Bucket
    - Create `child-photos` bucket for storing child profile photos
    - Make bucket public so photos can be accessed directly
    - Set 5MB file size limit
    - Allow only image file types
  
  2. Notes
    - Photos will be stored with unique filenames
    - Public access allows photos to be displayed without authentication
    - Storage policies are managed by Supabase automatically for public buckets
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-photos',
  'child-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];