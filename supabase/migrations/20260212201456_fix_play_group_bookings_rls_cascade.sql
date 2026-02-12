/*
  # Fix Play Group Bookings RLS - Cascade Drop Solution

  ## Problem
  Trigger functions need to update play_group_sessions.booked_count but RLS prevents this.
  Previous migration failed because we need CASCADE to drop functions with dependent triggers.

  ## Solution
  1. Drop triggers and functions with CASCADE
  2. Recreate everything with proper permissions
  3. Grant EXECUTE permissions to allow trigger execution

  ## Security
  - SECURITY DEFINER functions run with elevated privileges
  - RLS remains active for direct user operations
  - Only triggers can update booked_count
*/

-- Drop existing triggers with CASCADE
DROP TRIGGER IF EXISTS increment_booked_count_trigger ON play_group_bookings CASCADE;
DROP TRIGGER IF EXISTS trigger_increment_booked_count ON play_group_bookings CASCADE;
DROP TRIGGER IF EXISTS update_booked_count_trigger ON play_group_bookings CASCADE;
DROP TRIGGER IF EXISTS trigger_update_booked_count ON play_group_bookings CASCADE;
DROP TRIGGER IF EXISTS decrement_booked_count_trigger ON play_group_bookings CASCADE;
DROP TRIGGER IF EXISTS trigger_decrement_booked_count ON play_group_bookings CASCADE;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS increment_session_booked_count() CASCADE;
DROP FUNCTION IF EXISTS update_session_booked_count() CASCADE;
DROP FUNCTION IF EXISTS decrement_session_booked_count() CASCADE;

-- Create function to increment booked count
CREATE OR REPLACE FUNCTION increment_session_booked_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count + 1
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION increment_session_booked_count() TO authenticated, anon, postgres, service_role;

-- Create function to handle status changes
CREATE OR REPLACE FUNCTION update_session_booked_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled') AND NEW.status = 'cancelled' THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count - 1
    WHERE id = NEW.session_id;
  END IF;

  IF OLD.status = 'cancelled' AND NEW.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count + 1
    WHERE id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION update_session_booked_count() TO authenticated, anon, postgres, service_role;

-- Create function to decrement booked count
CREATE OR REPLACE FUNCTION decrement_session_booked_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled') THEN
    UPDATE play_group_sessions
    SET booked_count = booked_count - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN OLD;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_session_booked_count() TO authenticated, anon, postgres, service_role;

-- Recreate triggers with correct names
CREATE TRIGGER trigger_increment_booked_count
  AFTER INSERT ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_booked_count();

CREATE TRIGGER trigger_update_booked_count
  AFTER UPDATE ON play_group_bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_session_booked_count();

CREATE TRIGGER trigger_decrement_booked_count
  AFTER DELETE ON play_group_bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrement_session_booked_count();
