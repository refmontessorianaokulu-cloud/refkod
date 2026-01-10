/*
  # Davranış Raporlarına Çocuk Bağlantısı ve Veli Erişimi Ekleme

  ## Özet
  Davranış olaylarına çocuk ID'si eklenerek velilerin kendi çocuklarının 
  davranış raporlarını görüntüleyebilmesi sağlanıyor.

  ## Değişiklikler
    1. Tabloya Eklenenler
      - `behavior_incidents` tablosuna `child_id` (uuid) sütunu ekleniyor
      - Çocuk tablosu ile ilişki kuruluyor
      
    2. Güvenlik Politikaları
      - Veliler kendi çocuklarının davranış raporlarını görüntüleyebilir
*/

-- Add child_id column to behavior_incidents
ALTER TABLE behavior_incidents 
ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES children(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_behavior_incidents_child_id ON behavior_incidents(child_id);

-- Parents: Can view behavior incidents for their own children
CREATE POLICY "Parents can view their children behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.parent_id = auth.uid()
      AND parent_children.child_id = behavior_incidents.child_id
    )
  );