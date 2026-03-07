/*
  # Create Product Ratings View
  
  1. New View
    - `product_ratings`
      - `product_id` (uuid) - Product identifier
      - `average_rating` (numeric) - Average rating score (1-5)
      - `review_count` (bigint) - Total number of approved reviews
  
  2. Purpose
    - Provides real-time statistics for product reviews
    - Only counts approved reviews (is_approved = true)
    - Used by frontend to display ratings on product cards
  
  3. Security
    - View is publicly readable (no RLS needed for aggregated data)
*/

-- Create materialized view for better performance
CREATE OR REPLACE VIEW product_ratings AS
SELECT 
  product_id,
  COALESCE(AVG(rating), 0)::numeric(3,2) as average_rating,
  COUNT(*)::bigint as review_count
FROM product_reviews
WHERE is_approved = true
GROUP BY product_id;

-- Grant public access to the view
GRANT SELECT ON product_ratings TO authenticated;
GRANT SELECT ON product_ratings TO anon;
