/*
  # Add More Status Options to Play Group Bookings

  1. Changes
    - Add new status options: 'postponed' and update constraint
    - Allow status changes even after 'paid' status
    - Status flow: pending -> confirmed -> paid -> (can change to) postponed/cancelled
    
  2. New Status Options
    - pending: Waiting for admin approval
    - confirmed: Admin approved, payment link sent
    - paid: Payment completed
    - postponed: Session postponed by admin or parent
    - cancelled: Booking cancelled
    
  3. Security
    - Admins can update any booking status at any time
    - Provides full booking lifecycle management
*/

-- Drop existing constraint
ALTER TABLE play_group_bookings 
DROP CONSTRAINT IF EXISTS play_group_bookings_status_check;

-- Add new constraint with additional status options
ALTER TABLE play_group_bookings 
ADD CONSTRAINT play_group_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'paid', 'postponed', 'cancelled'));

-- Add a notes field for admins to record status change reasons
ALTER TABLE play_group_bookings 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add a field to track original session if postponed
ALTER TABLE play_group_bookings 
ADD COLUMN IF NOT EXISTS original_session_id UUID REFERENCES play_group_sessions(id);

-- Update RLS policies to ensure admins can always update status
DROP POLICY IF EXISTS "Admins can update any booking" ON play_group_bookings;

CREATE POLICY "Admins can update any booking"
  ON play_group_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
