import { useState, useEffect } from 'react';
import { supabase, Child } from '../lib/supabase';
import { Megaphone, Plus, X, Image } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  target_audience: 'all' | 'parents' | 'teachers' | 'specific_children';
  target_children: string[];
  media_urls?: string[];
  created_at: string;
}

interface AnnouncementsSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent';
  children?: Child[];
}

export default function AnnouncementsSection({ userId, userRole, children = [] }: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    target_audience: 'specific_children' as 'all' | 'parents' | 'teachers' | 'specific_children',
    target_children: [] as string[],
  });

  useEffect(() => {
    loadAnnouncements();
  }, [userId]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingFiles(true);
    try {
      const mediaUrls: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('announcement-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('announcement-media')
            .getPublicUrl(filePath);

          mediaUrls.push(publicUrlData.publicUrl);
        }
      }

      const { error } = await supabase.from('announcements').insert({
        created_by: userId,
        ...form,
        media_urls: mediaUrls,
      });
      if (error) throw error;

      setShowModal(false);
      setForm({
        title: '',
        content: '',
        target_audience: 'specific_children',
        target_children: [],
      });
      setSelectedFiles([]);
      loadAnnouncements();
      alert('Duyuru oluşturuldu!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const canCreateAnnouncement = userRole === 'admin' || userRole === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Duyurular</h2>
        </div>
        {canCreateAnnouncement && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Duyuru</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz duyuru yok</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">{announcement.title}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{announcement.content}</p>
              {announcement.media_urls && announcement.media_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {announcement.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Duyuru fotoğrafı ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-purple-200"
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-xs px-3 py-1 bg-white rounded-full text-purple-700 font-medium border border-purple-200">
                  {announcement.target_audience === 'all' && 'Tüm Kullanıcılar'}
                  {announcement.target_audience === 'parents' && 'Veliler'}
                  {announcement.target_audience === 'teachers' && 'Öğretmenler'}
                  {announcement.target_audience === 'specific_children' && 'Belirli Öğrenciler'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Yeni Duyuru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Duyuru başlığı..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Duyuru içeriği..."
                />
              </div>

              {userRole === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kitle</label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setForm({ ...form, target_audience: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="parents">Sadece Veliler</option>
                    <option value="teachers">Sadece Öğretmenler</option>
                    <option value="specific_children">Belirli Öğrencilerin Velileri</option>
                  </select>
                </div>
              )}

              {(userRole === 'teacher' || form.target_audience === 'specific_children') && children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Öğrenciler {userRole === 'teacher' && '(Zorunlu)'}
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                    {children.map((child) => (
                      <label key={child.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.target_children.includes(child.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, target_children: [...form.target_children, child.id] });
                            } else {
                              setForm({ ...form, target_children: form.target_children.filter(id => id !== child.id) });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          {child.first_name} {child.last_name} - {child.class_name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraflar
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative inline-block">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFiles([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadingFiles}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingFiles ? 'Yükleniyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
