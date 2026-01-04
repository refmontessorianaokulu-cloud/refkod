/*
  # Add Chef Role and Meal Menu Management

  This migration adds chef role and enables chefs to manage meal menus with photos.

  1. **Profile Role Update**
    - Add 'chef' to allowed roles in profiles table
  
  2. **Meal Menu Policies for Chef**
    - Chef can INSERT meal menu items
    - Chef can UPDATE meal menu items
    - Chef can DELETE meal menu items
  
  3. **Storage Policies for Chef**
    - Chef can upload menu photos
    - Chef can update menu photos
    - Chef can delete menu photos
  
  Security:
  - Only approved chefs can manage menus
  - Chefs have full control over meal menu system
  - Storage bucket already exists (menu-photos)
*/

-- Update profiles role check constraint to include chef
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'teacher', 'parent', 'guidance_counselor', 'staff', 'chef'));

-- Chef can insert menu items
CREATE POLICY "Chef can insert menu"
  ON monthly_menu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );

-- Chef can update menu items
CREATE POLICY "Chef can update menu"
  ON monthly_menu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );

-- Chef can delete menu items
CREATE POLICY "Chef can delete menu"
  ON monthly_menu FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );

-- Chef can upload menu photos
CREATE POLICY "Chef can upload menu photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-photos'
    AND (storage.foldername(name))[1] = 'meals'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );

-- Chef can update menu photos
CREATE POLICY "Chef can update menu photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );

-- Chef can delete menu photos
CREATE POLICY "Chef can delete menu photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef'
      AND profiles.approved = true
    )
  );