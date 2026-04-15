
/*
  # Fix field_trip_consents consent_type CHECK constraint

  ## Problem
  The consent_type column only allows 'approved' and 'stay_at_school' values.
  However, "for_parent" type field trips use 'will_attend' and 'will_not_attend'
  values, causing a CHECK constraint violation and the "Onay kaydedilemedi!" error.

  ## Changes
  - Drop the old restrictive check constraint
  - Add a new constraint that allows all four valid consent types:
    - 'approved' - child will attend the trip
    - 'stay_at_school' - child will stay at school
    - 'will_attend' - parent will personally attend the event
    - 'will_not_attend' - parent will not attend the event
*/

ALTER TABLE field_trip_consents
  DROP CONSTRAINT IF EXISTS field_trip_consents_consent_type_check;

ALTER TABLE field_trip_consents
  ADD CONSTRAINT field_trip_consents_consent_type_check
  CHECK (consent_type = ANY (ARRAY[
    'approved'::text,
    'stay_at_school'::text,
    'will_attend'::text,
    'will_not_attend'::text
  ]));
