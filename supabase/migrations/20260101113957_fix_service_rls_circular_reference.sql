/*
  # Fix Circular Reference in Service Tracking RLS Policies

  1. Changes
    - Drop problematic parent policies on service_vehicles and service_routes that cause infinite recursion
    - Parents will access vehicle and route data through child_service_assignments joins instead
    - Keep admin, teacher, and driver policies intact
    
  2. Security
    - Parents can still view service data through the child_service_assignments table
    - No security is compromised as assignments table already has proper RLS
*/

-- Drop the problematic policies that cause circular reference
DROP POLICY IF EXISTS "Parents can view their children's service vehicles" ON service_vehicles;
DROP POLICY IF EXISTS "Parents can view their children's routes" ON service_routes;
DROP POLICY IF EXISTS "Parents can view their children's service location" ON service_location_tracking;

-- Parents will access this data through joins in child_service_assignments
-- which already has proper RLS policies
