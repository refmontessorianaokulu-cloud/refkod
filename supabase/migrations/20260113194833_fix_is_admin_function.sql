/*
  # Fix is_admin() Function
  
  1. Problem
    - is_admin() function returns false even for admin users
    - RLS policies depend on this function
    - Admin cannot see reports in UI
  
  2. Solution
    - Recreate is_admin() function with simpler logic
    - Remove approved check (admin is already approved)
*/

-- Recreate is_admin function with correct logic
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;
