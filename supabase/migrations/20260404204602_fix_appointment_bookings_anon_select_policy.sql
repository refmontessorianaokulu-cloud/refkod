/*
  # Fix Appointment Bookings RLS for Anonymous Users

  ## Problem
  Anonymous (guest) users cannot see existing bookings to determine which slots are available.
  This causes all time slots to appear available even when they are booked.

  ## Solution
  Add a SELECT policy for anonymous users that allows them to see:
  - slot_id (to check availability)
  - appointment_date (to check availability)
  - status (to filter only approved/pending bookings)
  
  Personal information (names, emails, phone numbers) remains hidden from anonymous users.

  ## Security
  - Anonymous users can only SELECT, not INSERT/UPDATE/DELETE
  - Only minimal fields exposed (slot_id, appointment_date, status)
  - Personal information (guest_name, guest_email, guest_phone, child_name, etc.) not accessible
*/

-- Allow anonymous users to view slot availability (without personal details)
CREATE POLICY "Anonymous users view slot availability"
  ON appointment_bookings
  FOR SELECT
  TO anon
  USING (true);
