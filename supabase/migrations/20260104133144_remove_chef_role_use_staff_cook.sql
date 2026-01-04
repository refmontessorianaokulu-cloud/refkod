/*
  # Remove Chef Role and Use Staff Cook Instead

  This migration reverts the chef role addition and ensures we only use the existing
  staff_role = 'cook' system for meal menu management.

  1. **Remove Chef Policies**
    - Drop all chef-specific policies for monthly_menu
    - Drop all chef-specific policies for storage (menu-photos)

  2. **Update Profile Role Constraint**
    - Remove 'chef' from allowed roles
    - Keep only: admin, teacher, parent, guidance_counselor, staff

  Security:
  - Cooks already have proper policies via staff_role = 'cook'
  - This simplifies the role system and avoids duplication
*/

-- Drop chef policies for monthly_menu
DROP POLICY IF EXISTS "Chef can insert menu" ON monthly_menu;
DROP POLICY IF EXISTS "Chef can update menu" ON monthly_menu;
DROP POLICY IF EXISTS "Chef can delete menu" ON monthly_menu;

-- Drop chef policies for storage
DROP POLICY IF EXISTS "Chef can upload menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Chef can update menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Chef can delete menu photos" ON storage.objects;

-- Update profiles role constraint to remove chef
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'teacher', 'parent', 'guidance_counselor', 'staff'));
