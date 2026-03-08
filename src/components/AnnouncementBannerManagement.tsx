import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit as EditIcon, ChevronUp, ChevronDown, Save, X } from 'lucide-react';

interface AnnouncementBanner {
  id: string;
  message_tr: string;
  message_en: string;
  link_url: string | null;
  link_text_tr: string | null;
  link_text_en: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementBannerManagement() {
  const { t, language } = useLanguage();
  const [banners, setBanners] = useState<AnnouncementBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message_tr: '',
    message_en: '',
    link_url: '',
    link_text_tr: '',
    link_text_en: '',
    is_active: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('announcement_banners')
          .update({
            message_tr: formData.message_tr,
            message_en: formData.message_en,
            link_url: formData.link_url || null,
            link_text_tr: formData.link_text_tr || null,
            link_text_en: formData.link_text_en || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) : -1;

        const { error } = await supabase
          .from('announcement_banners')
          .insert([{
            message_tr: formData.message_tr,
            message_en: formData.message_en,
            link_url: formData.link_url || null,
            link_text_tr: formData.link_text_tr || null,
            link_text_en: formData.link_text_en || null,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          }]);

        if (error) throw error;
      }

      setFormData({
        message_tr: '',
        message_en: '',
        link_url: '',
        link_text_tr: '',
        link_text_en: '',
        is_active: true,
      });
      setEditingId(null);
      setShowForm(false);
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Duyuru kaydedilirken hata oluştu');
    }
  };

  const handleEdit = (banner: AnnouncementBanner) => {
    setFormData({
      message_tr: banner.message_tr,
      message_en: banner.message_en,
      link_url: banner.link_url || '',
      link_text_tr: banner.link_text_tr || '',
      link_text_en: banner.link_text_en || '',
      is_active: banner.is_active,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('announcement_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Duyuru silinirken hata oluştu');
    }
  };

  const handleMoveUp = async (banner: AnnouncementBanner) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex === 0) return;

    const previousBanner = banners[currentIndex - 1];

    try {
      await supabase
        .from('announcement_banners')
        .update({ display_order: previousBanner.display_order })
        .eq('id', banner.id);

      await supabase
        .from('announcement_banners')
        .update({ display_order: banner.display_order })
        .eq('id', previousBanner.id);

      loadBanners();
    } catch (error) {
      console.error('Error moving banner:', error);
    }
  };

  const handleMoveDown = async (banner: AnnouncementBanner) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex === banners.length - 1) return;

    const nextBanner = banners[currentIndex + 1];

    try {
      await supabase
        .from('announcement_banners')
        .update({ display_order: nextBanner.display_order })
        .eq('id', banner.id);

      await supabase
        .from('announcement_banners')
        .update({ display_order: banner.display_order })
        .eq('id', nextBanner.id);

      loadBanners();
    } catch (error) {
      console.error('Error moving banner:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      message_tr: '',
      message_en: '',
      link_url: '',
      link_text_tr: '',
      link_text_en: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'tr' ? 'Kısa Duyurular' : 'Short Announcements'}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'İptal' : 'Yeni Duyuru Ekle'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duyuru Metni (Türkçe) *
              </label>
              <input
                type="text"
                value={formData.message_tr}
                onChange={(e) => setFormData({ ...formData, message_tr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Tek satırlık duyuru metni"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duyuru Metni (İngilizce) *
              </label>
              <input
                type="text"
                value={formData.message_en}
                onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Single line announcement text"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bağlantı URL (Opsiyonel)
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="https://..."
              />
            </div>

            {formData.link_url && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buton Metni (Türkçe)
                  </label>
                  <input
                    type="text"
                    value={formData.link_text_tr}
                    onChange={(e) => setFormData({ ...formData, link_text_tr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Detaylar"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buton Metni (İngilizce)
                  </label>
                  <input
                    type="text"
                    value={formData.link_text_en}
                    onChange={(e) => setFormData({ ...formData, link_text_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Details"
                    maxLength={20}
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Aktif
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`bg-white p-4 rounded-lg shadow border ${
              banner.is_active ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(banner)}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(banner)}
                  disabled={index === banners.length - 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    banner.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {banner.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <p className="text-gray-900 font-medium mb-1">
                  🇹🇷 {banner.message_tr}
                </p>
                <p className="text-gray-700 mb-2">
                  🇬🇧 {banner.message_en}
                </p>
                {banner.link_url && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Bağlantı:</span> {banner.link_url}
                    {banner.link_text_tr && (
                      <span className="ml-2">
                        (🇹🇷 "{banner.link_text_tr}" | 🇬🇧 "{banner.link_text_en}")
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(banner)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz duyuru eklenmemiş. Yeni duyuru eklemek için yukarıdaki butona tıklayın.
          </div>
        )}
      </div>
    </div>
  );
}
