/*
  # Fix Appointment Day of Week Numbering System

  ## Problem
  The system was using inconsistent day_of_week numbering:
  - Some bookings used 0=Monday format
  - Slots use 0=Sunday (JavaScript Date.getDay() format)
  - This caused bookings to not show as "booked" in the UI

  ## Solution
  Remap all existing appointment_bookings to use the correct slot_id based on:
  - JavaScript Date.getDay() format: 0=Sunday, 1=Monday, 2=Tuesday, etc.
  - Match appointment_date's actual day of week with slot's day_of_week

  ## Changes
  1. Update 6 Nisan (Monday, day=1) bookings from day_of_week=0 slots to day_of_week=1 slots
  2. Update 7 Nisan (Tuesday, day=2) booking from day_of_week=0 slot to day_of_week=2 slot
*/

-- Update 6 Nisan 09:00 booking (ds)
UPDATE appointment_bookings
SET slot_id = '8d4d62b5-980e-47f4-abe5-0e9a314c2560'
WHERE appointment_date = '2026-04-06' 
  AND slot_id = 'd97fdbd7-5a42-44ea-9a5c-7b08dd4d4157';

-- Update 6 Nisan 10:00 booking (KÜBRA YILDIZ)
UPDATE appointment_bookings
SET slot_id = 'c80ab014-b636-41db-8886-03a2277f80cb'
WHERE appointment_date = '2026-04-06' 
  AND slot_id = '7600aab6-d387-4e87-8e7b-4d180d3adb4d';

-- Update 7 Nisan 11:00 booking (AYŞE DEMİR) - need to find day_of_week=2 (Tuesday) slot
UPDATE appointment_bookings
SET slot_id = (
  SELECT id FROM appointment_slots 
  WHERE day_of_week = 2 AND start_time = '11:00:00'
  LIMIT 1
)
WHERE appointment_date = '2026-04-07' 
  AND slot_id IN (
    SELECT id FROM appointment_slots WHERE day_of_week = 0 AND start_time = '11:00:00'
  );
