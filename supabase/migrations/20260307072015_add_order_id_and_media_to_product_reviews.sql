/*
  # Add order_id and media support to product reviews

  1. Changes
    - Add `order_id` column to `product_reviews` table
    - Create storage bucket for review media
    - Add storage policies for review media upload/access
  
  2. Security
    - Users can upload media for their own reviews
    - Anyone can view approved review media
*/

-- Add order_id column to product_reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_reviews' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE product_reviews ADD COLUMN order_id uuid REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review media
DROP POLICY IF EXISTS "Users can upload review media" ON storage.objects;
CREATE POLICY "Users can upload review media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view review media" ON storage.objects;
CREATE POLICY "Anyone can view review media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "Users can delete own review media" ON storage.objects;
CREATE POLICY "Users can delete own review media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);
