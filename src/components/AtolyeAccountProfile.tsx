import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, MapPin, Save, CreditCard as Edit2 } from 'lucide-react';

export default function AtolyeAccountProfile() {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    street: '',
    building_no: '',
    apartment_no: '',
    postal_code: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        district: profile.district || '',
        neighborhood: profile.neighborhood || '',
        street: profile.street || '',
        building_no: profile.building_no || '',
        apartment_no: profile.apartment_no || '',
        postal_code: profile.postal_code || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          street: formData.street,
          building_no: formData.building_no,
          apartment_no: formData.apartment_no,
          postal_code: formData.postal_code,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setSuccess('Bilgileriniz başarıyla güncellendi!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError('Bilgiler güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hesabım</h1>
              <p className="text-gray-500">Kişisel bilgilerinizi yönetin</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Düzenle
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Ad Soyad
                </div>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-posta
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder="email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon
                </div>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="0555 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  İl
                </div>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="İstanbul"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İlçe
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Kadıköy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mahalle
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Moda Mahallesi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sokak
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Atatürk Caddesi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bina No
              </label>
              <input
                type="text"
                name="building_no"
                value={formData.building_no}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="42"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daire No
              </label>
              <input
                type="text"
                name="apartment_no"
                value={formData.apartment_no}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posta Kodu
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="34000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres (Opsiyonel - Yukarıdaki alanlar doluysa bu alan otomatik oluşturulur)
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Tam adresiniz (Opsiyonel)"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                  if (profile) {
                    setFormData({
                      full_name: profile.full_name || '',
                      email: profile.email || '',
                      phone: profile.phone || '',
                      address: profile.address || '',
                      city: profile.city || '',
                      district: profile.district || '',
                      neighborhood: profile.neighborhood || '',
                      street: profile.street || '',
                      building_no: profile.building_no || '',
                      apartment_no: profile.apartment_no || '',
                      postal_code: profile.postal_code || '',
                    });
                  }
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hesap Bilgileri</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Hesap Türü</p>
              <p className="font-medium text-gray-800">Atölye Kullanıcısı</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 mb-1">Üyelik Durumu</p>
              <p className="font-medium text-emerald-600">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
