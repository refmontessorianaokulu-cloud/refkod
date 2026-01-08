import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReferenceTeacherForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    graduated_school: '',
    graduated_program: '',
    has_formation: false,
    is_working: false,
    workplace: '',
    has_montessori_training: false,
    previous_trainings: '',
    reference_info: '',
    evaluation_essay: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('reference-teacher-photos')
      .upload(filePath, photoFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('reference-teacher-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const { error: insertError } = await supabase
        .from('reference_teacher_applications')
        .insert([
          {
            ...formData,
            photo_url: photoUrl,
            workplace: formData.is_working ? formData.workplace : null,
          },
        ]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Başvurunuz Alındı</h2>
          <p className="text-gray-600 mb-6">
            Referans Öğretmen Programı başvurunuz başarıyla alınmıştır.
            En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">Referans Öğretmen Programı</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
              <p className="font-semibold text-lg mb-2">SON BAŞVURU TARİHİ: 23 OCAK</p>
              <p className="text-sm font-medium">
                BAŞVURU ŞARTLARI: OKUL ÖNCESİ ÖĞRETMENLİĞİ VEYA ÇOCUK GELİŞİMİ EĞİTİMİ
                LİSANS MEZUNU VEYA SON SINIF ÖĞRENCİSİ OLMAK
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotoğraf
              </label>
              <div className="flex items-center space-x-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-2">Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Maksimum 5MB</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0555 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mezun Olduğu Okul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.graduated_school}
                  onChange={(e) => setFormData({ ...formData, graduated_school: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mezun Olduğu Program <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.graduated_program}
                  onChange={(e) => setFormData({ ...formData, graduated_program: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Örn: Okul Öncesi Öğretmenliği"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has_formation"
                  checked={formData.has_formation}
                  onChange={(e) => setFormData({ ...formData, has_formation: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="has_formation" className="text-sm font-medium text-gray-700">
                  Pedagojik formasyon belgesi var
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_working"
                  checked={formData.is_working}
                  onChange={(e) => setFormData({ ...formData, is_working: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_working" className="text-sm font-medium text-gray-700">
                  Şuan çalışıyorum
                </label>
              </div>

              {formData.is_working && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çalıştığınız Yer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={formData.is_working}
                    value={formData.workplace}
                    onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has_montessori_training"
                  checked={formData.has_montessori_training}
                  onChange={(e) => setFormData({ ...formData, has_montessori_training: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="has_montessori_training" className="text-sm font-medium text-gray-700">
                  Daha önce Montessori eğitimi aldım
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aldığınız Eğitimler <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.previous_trainings}
                onChange={(e) => setFormData({ ...formData, previous_trainings: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Daha önce aldığınız eğitimleri, sertifikaları ve seminerleri belirtiniz..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referans Bilgisi (İsteğe Bağlı)
              </label>
              <textarea
                value={formData.reference_info}
                onChange={(e) => setFormData({ ...formData, reference_info: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Referans gösterebileceğiniz kişilerin adı, soyadı ve iletişim bilgileri..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Okul Öncesi Eğitim Alanına Dair Değerlendirme Yazınız <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.evaluation_essay}
                onChange={(e) => setFormData({ ...formData, evaluation_essay: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Okul öncesi eğitim alanı hakkındaki görüşlerinizi, deneyimlerinizi ve yaklaşımınızı paylaşınız..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
