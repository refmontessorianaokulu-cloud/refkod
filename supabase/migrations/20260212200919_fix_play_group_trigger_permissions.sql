/*
  # Fix Play Group Trigger Permissions
  
  ## Problem
  When non-admin users create play group bookings, the trigger tries to update
  play_group_sessions.booked_count, but fails due to RLS policies that only
  allow admins to update sessions.
  
  ## Solution
  Mark all trigger functions as SECURITY DEFINER so they run with the permissions
  of the function owner (postgres superuser), bypassing RLS restrictions.
  
  ## Changes
  - Recreate increment_session_booked_count() as SECURITY DEFINER
  - Recreate update_session_booked_count() as SECURITY DEFINER  
  - Recreate decrement_session_booked_count() as SECURITY DEFINER
*/

-- Drop existing functions (CASCADE will drop triggers)
DROP FUNCTION IF EXISTS increment_session_booked_count() CASCADE;
DROP FUNCTION IF EXISTS update_session_booked_count() CASCADE;
DROP FUNCTION IF EXISTS decrement_session_booked_count() CASCADE;

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION increment_session_booked_count()
RETURNS TRIGGER 
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_session_booked_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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

CREATE OR REPLACE FUNCTION decrement_session_booked_count()
RETURNS TRIGGER 
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
$$ LANGUAGE plpgsql;

-- Recreate triggers
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
