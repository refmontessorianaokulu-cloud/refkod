import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, ChevronUp, ChevronDown, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AboutSection {
  id: string;
  section_key: string;
  section_title: string;
  content: string;
  image_url: string | null;
  display_order: number;
}

export default function AboutContentEditor() {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [editForm, setEditForm] = useState({
    section_title: '',
    content: '',
    image_url: '',
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      alert('Hata: İçerik yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: AboutSection) => {
    setEditingId(section.id);
    setEditForm({
      section_title: section.section_title,
      content: section.content,
      image_url: section.image_url || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      section_title: '',
      content: '',
      image_url: '',
    });
  };

  const saveSection = async (sectionId: string) => {
    if (!editForm.section_title.trim() || !editForm.content.trim()) {
      alert('Başlık ve içerik alanları zorunludur');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('about_content')
        .update({
          section_title: editForm.section_title,
          content: editForm.content,
          image_url: editForm.image_url || null,
        })
        .eq('id', sectionId);

      if (error) throw error;

      alert('Değişiklikler kaydedildi');
      setEditingId(null);
      loadSections();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Hata: Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSections = [...sections];
    const [moved] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, moved);

    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('about_content')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      loadSections();
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Hata: Sıralama güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hakkımızda İçeriği</h2>
          <p className="text-gray-600 mt-1">
            Ana sayfadaki Hakkımızda bölümünün içeriğini düzenleyin
          </p>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            previewMode
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {previewMode ? (
            <>
              <EyeOff className="w-5 h-5" />
              <span>Düzenleme Modu</span>
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              <span>Önizleme</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    {section.section_key}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800">
                    {section.section_title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Yukarı Taşı"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className={`p-2 rounded-lg transition-colors ${
                      index === sections.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Aşağı Taşı"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  {editingId !== section.id && (
                    <button
                      onClick={() => startEditing(section)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {editingId === section.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={editForm.section_title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, section_title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Bölüm başlığı"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İçerik
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm({ ...editForm, content: e.target.value })
                      }
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Bölüm içeriği"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Görsel URL (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={editForm.image_url}
                      onChange={(e) =>
                        setEditForm({ ...editForm, image_url: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t">
                    <button
                      onClick={() => saveSection(section.id)}
                      disabled={saving}
                      className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {section.image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={section.image_url}
                        alt={section.section_title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
