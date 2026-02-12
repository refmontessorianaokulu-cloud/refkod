/*
  # Create Play Group Calendar System

  ## Overview
  This migration creates a calendar system for play group sessions in Ref Atölye where:
  - Admins can create play group sessions with date, time, theme, and capacity
  - Parents can book sessions by providing parent and child information
  - Bookings are tracked with status and payment link

  ## New Tables

  ### `play_group_sessions`
  - `id` (uuid, primary key) - Unique session identifier
  - `session_date` (date, not null) - Date of the play group session
  - `session_time` (time, not null) - Time of the session
  - `theme` (text, not null) - Theme/topic of the session
  - `capacity` (integer, not null) - Maximum number of participants
  - `booked_count` (integer, default 0) - Current number of bookings
  - `created_by` (uuid, foreign key to profiles) - Admin who created the session
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `play_group_bookings`
  - `id` (uuid, primary key) - Unique booking identifier
  - `session_id` (uuid, foreign key to play_group_sessions) - Related session
  - `parent_name` (text, not null) - Parent's full name
  - `phone_number` (text, not null) - Parent's phone number
  - `child_name` (text, not null) - Child's full name
  - `child_birth_date` (date, not null) - Child's birth date
  - `status` (text, not null) - Booking status: pending, confirmed, cancelled, paid
  - `payment_link` (text) - Payment link URL
  - `user_id` (uuid, foreign key to profiles, nullable) - Associated user if registered
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security (RLS)

  ### play_group_sessions
  - Public read access (anyone can view sessions)
  - Admin-only write access (create, update, delete)

  ### play_group_bookings
  - Public insert (anyone can create bookings)
  - Admins can view and manage all bookings
  - Users can view their own bookings

  ## Notes
  - Sessions track capacity and booked_count to prevent overbooking
  - Bookings start in 'pending' status and move through confirmation and payment
  - User_id is optional to allow non-registered parents to book
*/

-- Create play_group_sessions table
CREATE TABLE IF NOT EXISTS play_group_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL,
  session_time time NOT NULL,
  theme text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  booked_count integer NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create play_group_bookings table
CREATE TABLE IF NOT EXISTS play_group_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES play_group_sessions(id) ON DELETE CASCADE,
  parent_name text NOT NULL,
  phone_number text NOT NULL,
  child_name text NOT NULL,
  child_birth_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'paid')),
  payment_link text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_play_group_sessions_date ON play_group_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_play_group_bookings_session ON play_group_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_play_group_bookings_user ON play_group_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_play_group_bookings_status ON play_group_bookings(status);

-- Enable RLS
ALTER TABLE play_group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_group_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for play_group_sessions
CREATE POLICY "Anyone can view play group sessions"
  ON play_group_sessions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can create play group sessions"
  ON play_group_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update play group sessions"
  ON play_group_sessions
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

CREATE POLICY "Admins can delete play group sessions"
  ON play_group_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for play_group_bookings
CREATE POLICY "Anyone can create play group bookings"
  ON play_group_bookings
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all play group bookings"
  ON play_group_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own play group bookings"
  ON play_group_bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update play group bookings"
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

CREATE POLICY "Admins can delete play group bookings"
  ON play_group_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_play_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_play_group_sessions_updated_at
  BEFORE UPDATE ON play_group_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_play_group_updated_at();

CREATE TRIGGER update_play_group_bookings_updated_at
  BEFORE UPDATE ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_play_group_updated_at();

-- Function to increment booked_count when a booking is created
CREATE OR REPLACE FUNCTION increment_session_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count + 1
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update booked_count when booking status changes
CREATE OR REPLACE FUNCTION update_session_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from active to cancelled
  IF OLD.status NOT IN ('cancelled') AND NEW.status = 'cancelled' THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count - 1
    WHERE id = NEW.session_id;
  END IF;
  
  -- If status changed from cancelled to active
  IF OLD.status = 'cancelled' AND NEW.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count + 1
    WHERE id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement booked_count when a booking is deleted
CREATE OR REPLACE FUNCTION decrement_session_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for booked_count management
CREATE TRIGGER trigger_increment_booked_count
  AFTER INSERT ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_booked_count();

CREATE TRIGGER trigger_update_booked_count
  AFTER UPDATE ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_session_booked_count();

CREATE TRIGGER trigger_decrement_booked_count
  AFTER DELETE ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrement_session_booked_count();