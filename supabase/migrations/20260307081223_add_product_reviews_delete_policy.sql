/*
  # Add Delete Policy for Product Reviews

  1. Changes
    - Add delete policy for product_reviews table
    - Allow users to delete their own reviews
    - Allow admins to delete any review

  2. Security
    - Users can only delete their own reviews
    - Admins can delete any review for moderation purposes
*/

-- Add delete policy for product reviews
CREATE POLICY "Users can delete own reviews and admins can delete any"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );