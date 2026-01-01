/*
  # Staff Roles and Service Tracking System

  1. New Columns
    - Add `staff_role` to profiles table for staff classification

  2. New Tables
    - `service_vehicles`
      - `id` (uuid, primary key)
      - `vehicle_name` (text) - Name/identifier of the vehicle
      - `license_plate` (text) - License plate number
      - `driver_id` (uuid, foreign key to profiles) - Current driver
      - `capacity` (integer) - Number of children the vehicle can carry
      - `is_active` (boolean) - Whether the vehicle is currently in use
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `service_routes`
      - `id` (uuid, primary key)
      - `route_name` (text) - Name of the route (e.g., "Morning Route 1")
      - `vehicle_id` (uuid, foreign key to service_vehicles)
      - `is_active` (boolean) - Whether the route is currently active
      - `departure_time` (time) - Scheduled departure time
      - `estimated_arrival_time` (time) - Expected arrival time at school
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `child_service_assignments`
      - `id` (uuid, primary key)
      - `child_id` (uuid, foreign key to children)
      - `route_id` (uuid, foreign key to service_routes)
      - `uses_service` (boolean) - Whether child currently uses service
      - `pickup_address` (text) - Address where child is picked up
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `service_location_tracking`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key to service_vehicles)
      - `driver_id` (uuid, foreign key to profiles)
      - `route_id` (uuid, foreign key to service_routes, nullable)
      - `latitude` (decimal) - Current latitude
      - `longitude` (decimal) - Current longitude
      - `speed` (decimal, nullable) - Current speed in km/h
      - `heading` (decimal, nullable) - Direction in degrees
      - `timestamp` (timestamptz) - Time of location update
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Add policies for admins to manage all data
    - Add policies for drivers to update their own location
    - Add policies for parents to view location of their children's service
    - Add policies for teachers to view service locations
*/

-- Add staff_role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'staff_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN staff_role text CHECK (staff_role IN ('cook', 'cleaning_staff', 'bus_driver', 'other'));
  END IF;
END $$;

-- Create service_vehicles table
CREATE TABLE IF NOT EXISTS service_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name text NOT NULL,
  license_plate text NOT NULL UNIQUE,
  driver_id uuid REFERENCES profiles(id),
  capacity integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_vehicles ENABLE ROW LEVEL SECURITY;

-- Create service_routes table
CREATE TABLE IF NOT EXISTS service_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  vehicle_id uuid REFERENCES service_vehicles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  departure_time time,
  estimated_arrival_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_routes ENABLE ROW LEVEL SECURITY;

-- Create child_service_assignments table
CREATE TABLE IF NOT EXISTS child_service_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES service_routes(id) ON DELETE CASCADE NOT NULL,
  uses_service boolean DEFAULT true,
  pickup_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(child_id, route_id)
);

ALTER TABLE child_service_assignments ENABLE ROW LEVEL SECURITY;

-- Create service_location_tracking table
CREATE TABLE IF NOT EXISTS service_location_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES service_vehicles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES service_routes(id) ON DELETE SET NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  speed decimal(5, 2),
  heading decimal(5, 2),
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_location_tracking ENABLE ROW LEVEL SECURITY;

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp ON service_location_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_tracking_vehicle ON service_location_tracking(vehicle_id, timestamp DESC);

-- RLS Policies for service_vehicles

-- Admins can do everything with vehicles
CREATE POLICY "Admins can manage service vehicles"
  ON service_vehicles FOR ALL
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

-- Drivers can view their assigned vehicles
CREATE POLICY "Drivers can view their vehicles"
  ON service_vehicles FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Teachers can view all vehicles
CREATE POLICY "Teachers can view service vehicles"
  ON service_vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Parents can view vehicles their children use
CREATE POLICY "Parents can view their children's service vehicles"
  ON service_vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN parent_children pc ON pc.child_id = c.id
      JOIN child_service_assignments csa ON csa.child_id = c.id
      JOIN service_routes sr ON sr.id = csa.route_id
      WHERE pc.parent_id = auth.uid()
      AND sr.vehicle_id = service_vehicles.id
      AND csa.uses_service = true
    )
  );

-- RLS Policies for service_routes

-- Admins can manage routes
CREATE POLICY "Admins can manage service routes"
  ON service_routes FOR ALL
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

-- Drivers can view routes for their vehicles
CREATE POLICY "Drivers can view their routes"
  ON service_routes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_vehicles sv
      WHERE sv.id = service_routes.vehicle_id
      AND sv.driver_id = auth.uid()
    )
  );

-- Teachers can view all routes
CREATE POLICY "Teachers can view service routes"
  ON service_routes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Parents can view routes their children use
CREATE POLICY "Parents can view their children's routes"
  ON service_routes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN parent_children pc ON pc.child_id = c.id
      JOIN child_service_assignments csa ON csa.child_id = c.id
      WHERE pc.parent_id = auth.uid()
      AND csa.route_id = service_routes.id
      AND csa.uses_service = true
    )
  );

-- RLS Policies for child_service_assignments

-- Admins can manage assignments
CREATE POLICY "Admins can manage child service assignments"
  ON child_service_assignments FOR ALL
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

-- Teachers can view all assignments
CREATE POLICY "Teachers can view child service assignments"
  ON child_service_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Parents can view their children's assignments
CREATE POLICY "Parents can view their children's service assignments"
  ON child_service_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = child_service_assignments.child_id
    )
  );

-- Drivers can view assignments for their routes
CREATE POLICY "Drivers can view their route assignments"
  ON child_service_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_routes sr
      JOIN service_vehicles sv ON sv.id = sr.vehicle_id
      WHERE sr.id = child_service_assignments.route_id
      AND sv.driver_id = auth.uid()
    )
  );

-- RLS Policies for service_location_tracking

-- Admins can manage all location data
CREATE POLICY "Admins can manage location tracking"
  ON service_location_tracking FOR ALL
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

-- Drivers can insert and view their own location
CREATE POLICY "Drivers can insert their location"
  ON service_location_tracking FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers can view their location history"
  ON service_location_tracking FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Teachers can view all location data
CREATE POLICY "Teachers can view all service locations"
  ON service_location_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Parents can view location of their children's service
CREATE POLICY "Parents can view their children's service location"
  ON service_location_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN parent_children pc ON pc.child_id = c.id
      JOIN child_service_assignments csa ON csa.child_id = c.id
      JOIN service_routes sr ON sr.id = csa.route_id
      WHERE pc.parent_id = auth.uid()
      AND sr.vehicle_id = service_location_tracking.vehicle_id
      AND csa.uses_service = true
    )
  );
