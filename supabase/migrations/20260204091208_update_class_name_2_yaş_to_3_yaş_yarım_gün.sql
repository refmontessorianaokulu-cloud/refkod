/*
  # Update class name from "2 Yaş Sınıfı" to "3 Yaş Yarım Gün Sınıfı"
  
  1. Changes
    - Update all children with class_name "2 Yaş Sınıfı" to "3 Yaş Yarım Gün Sınıfı"
    - Update all teacher_branch_assignments with class_name "2 Yaş Sınıfı" to "3 Yaş Yarım Gün Sınıfı"
  
  2. Impact
    - Affects all existing students in the 2 Yaş class
    - Updates related teacher assignments
*/

UPDATE children
SET class_name = '3 Yaş Yarım Gün Sınıfı'
WHERE class_name = '2 Yaş Sınıfı';

UPDATE teacher_branch_assignments
SET class_name = '3 Yaş Yarım Gün Sınıfı'
WHERE class_name = '2 Yaş Sınıfı';
