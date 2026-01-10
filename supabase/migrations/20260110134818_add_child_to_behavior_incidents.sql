/*
  # Davranış Raporlarına Öğrenci İlişkisi Ekleme

  ## Özet
  Davranış raporlarını belirli öğrencilere bağlamak için child_id alanı ekleniyor.
  Bu sayede veliler sadece kendi çocuklarına ait raporları görebilecek.

  ## Değişiklikler
    - `behavior_incidents` tablosuna `child_id` kolonu eklendi
      - `child_id` (uuid, nullable, references children) - Rapor hangi öğrenciyle ilgili

  ## Güvenlik Politikaları
    - Veliler sadece kendi çocuklarına ait davranış raporlarını görüntüleyebilir

  ## Notlar
    - Mevcut kayıtlar için child_id NULL olabilir (eski kayıtlar)
    - Yeni kayıtlarda child_id zorunlu olacak (uygulama seviyesinde)
*/

-- Add child_id column to behavior_incidents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'behavior_incidents' AND column_name = 'child_id'
  ) THEN
    ALTER TABLE behavior_incidents
    ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_behavior_incidents_child_id ON behavior_incidents(child_id);

-- Add parent policy: Parents can view behavior incidents for their children
CREATE POLICY "Parents can view their children's behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      JOIN profiles p ON pc.parent_id = p.id
      WHERE pc.child_id = behavior_incidents.child_id
      AND p.id = auth.uid()
      AND p.role = 'parent'
    )
  );