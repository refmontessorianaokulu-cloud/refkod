/*
  # Add Reference Teacher Form Settings

  ## Summary
  Adds configurable settings for the Reference Teacher Program application form.
  Admins can now edit the form's deadline date and requirements text from the admin panel.

  ## New Settings Keys
  - `ref_form_deadline`: Application deadline text (e.g. "23 OCAK")
  - `ref_form_requirements`: Application requirements text shown on the form header

  ## Security
  - Uses existing app_settings RLS policies
  - Public read access for displaying on form
  - Admin-only write access
*/

INSERT INTO app_settings (key, value, description)
VALUES
  ('ref_form_deadline', '23 OCAK', 'Referans Öğretmen Programı son başvuru tarihi'),
  ('ref_form_requirements', 'BAŞVURU ŞARTLARI: OKUL ÖNCESİ ÖĞRETMENLİĞİ VEYA ÇOCUK GELİŞİMİ EĞİTİMİ LİSANS MEZUNU VEYA SON SINIF ÖĞRENCİSİ OLMAK', 'Referans Öğretmen Programı başvuru şartları metni')
ON CONFLICT (key) DO NOTHING;
