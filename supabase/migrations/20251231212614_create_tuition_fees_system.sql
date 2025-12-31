/*
  # Create Tuition Fees Management System

  1. New Tables
    - `tuition_fees`
      - `id` (uuid, primary key)
      - `child_id` (uuid, foreign key to children)
      - `amount` (decimal) - Taksit tutarı
      - `due_date` (date) - Son ödeme tarihi
      - `paid_date` (date, nullable) - Ödeme tarihi
      - `status` (text) - Ödeme durumu: 'pending', 'paid', 'overdue'
      - `academic_year` (text) - Akademik yıl (örn: 2024-2025)
      - `month` (text) - Ay bilgisi
      - `notes` (text, nullable) - Notlar
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_reminders`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, foreign key to profiles)
      - `fee_id` (uuid, foreign key to tuition_fees, nullable)
      - `message` (text) - Bildirim mesajı
      - `is_read` (boolean) - Okundu mu?
      - `sent_at` (timestamptz)
      - `created_by` (uuid, foreign key to profiles)

  2. Security
    - Enable RLS on both tables
    - Admins can manage all fees and send reminders
    - Parents can only view their children's fees
    - Parents can only view their own reminders
*/

CREATE TABLE IF NOT EXISTS tuition_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending',
  academic_year text NOT NULL,
  month text NOT NULL,
  notes text DEFAULT '',
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  fee_id uuid REFERENCES tuition_fees(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) NOT NULL
);

ALTER TABLE tuition_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tuition fees"
  ON tuition_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Parents can view their children's fees"
  ON tuition_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.child_id = tuition_fees.child_id
      AND parent_children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert tuition fees"
  ON tuition_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tuition fees"
  ON tuition_fees FOR UPDATE
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

CREATE POLICY "Admins can delete tuition fees"
  ON tuition_fees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all reminders"
  ON payment_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Parents can view their own reminders"
  ON payment_reminders FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can send reminders"
  ON payment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Parents can update their reminder read status"
  ON payment_reminders FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_tuition_fees_child_id ON tuition_fees(child_id);
CREATE INDEX IF NOT EXISTS idx_tuition_fees_status ON tuition_fees(status);
CREATE INDEX IF NOT EXISTS idx_tuition_fees_due_date ON tuition_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_parent_id ON payment_reminders(parent_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_is_read ON payment_reminders(is_read);
