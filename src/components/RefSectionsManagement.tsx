import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface RefSection {
  id: string;
  section_type: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  title: string;
  content: string;
  media_urls: string[];
  created_at: string;
}

const SECTION_TYPES = [
  { value: 'ref_akademi', label: 'Ref Akademi' },
  { value: 'ref_danismanlik', label: 'Ref Danışmanlık' },
  { value: 'ref_atolye', label: 'Ref Atölye' },
];

export default function RefSectionsManagement() {
  const [sections, setSections] = useState<RefSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    section_type: 'ref_akademi' as 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye',
    title: '',
    content: '',
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_sections')
        .select('*')
        .order('section_type', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading ref sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: profile } = await supabase.auth.getUser();

      if (editingId) {
        const { error } = await supabase
          .from('ref_sections')
          .update({
            title: formData.title,
            content: formData.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Bölüm başarıyla güncellendi!');
      } else {
        const { error } = await supabase
          .from('ref_sections')
          .insert({
            section_type: formData.section_type,
            title: formData.title,
            content: formData.content,
            created_by: profile.user?.id,
          });

        if (error) throw error;
        alert('Bölüm başarıyla oluşturuldu!');
      }

      setFormData({ section_type: 'ref_akademi', title: '', content: '' });
      setEditingId(null);
      setShowAddModal(false);
      loadSections();
    } catch (error) {
      console.error('Error saving ref section:', error);
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEdit = (section: RefSection) => {
    setFormData({
      section_type: section.section_type,
      title: section.title,
      content: section.content,
    });
    setEditingId(section.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bölümü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('ref_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Bölüm başarıyla silindi!');
      loadSections();
    } catch (error) {
      console.error('Error deleting ref section:', error);
      alert('Hata: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({ section_type: 'ref_akademi', title: '', content: '' });
    setEditingId(null);
    setShowAddModal(false);
  };

  const getSectionLabel = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Ref Bölümleri Yönetimi</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Bölüm Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {SECTION_TYPES.map(type => {
          const section = sections.find(s => s.section_type === type.value);

          return (
            <div key={type.value} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{type.label}</h3>
                  {section ? (
                    <>
                      <h4 className="text-lg font-medium text-gray-700 mb-2">{section.title}</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{section.content}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Henüz içerik eklenmemiş</p>
                  )}
                </div>
                {section && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(section)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'Bölümü Düzenle' : 'Yeni Bölüm Ekle'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bölüm Tipi
                </label>
                <select
                  value={formData.section_type}
                  onChange={(e) => setFormData({ ...formData, section_type: e.target.value as any })}
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                >
                  {SECTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bölüm içeriğini buraya yazın..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
