import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Eye, EyeOff, Upload, ExternalLink, Save, X, Calendar, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface InstagramPost {
  id: string;
  image_url: string;
  caption: string;
  post_url: string;
  posted_date: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManualInstagramPosts() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    caption: '',
    post_url: '',
    posted_date: new Date().toISOString().split('T')[0],
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (editingPost) {
      setPreviewUrl(editingPost.image_url);
    } else {
      setPreviewUrl('');
    }
  }, [selectedFile, editingPost]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      alert('Gönderiler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) {
      if (editingPost) return editingPost.image_url;
      throw new Error('Lütfen bir görsel seçin');
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('instagram-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('instagram-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const imageUrl = await uploadImage();

      const postData = {
        image_url: imageUrl,
        caption: formData.caption,
        post_url: formData.post_url,
        posted_date: formData.posted_date,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('instagram_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        alert('Gönderi güncellendi');
      } else {
        const { error } = await supabase
          .from('instagram_posts')
          .insert([postData]);

        if (error) throw error;
        alert('Gönderi eklendi');
      }

      handleCloseModal();
      loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Gönderi kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('instagram_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Gönderi silindi');
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Gönderi silinirken hata oluştu');
    }
  };

  const toggleActive = async (post: InstagramPost) => {
    try {
      const { error } = await supabase
        .from('instagram_posts')
        .update({ is_active: !post.is_active })
        .eq('id', post.id);

      if (error) throw error;
      loadPosts();
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('Durum değiştirilirken hata oluştu');
    }
  };

  const handleEdit = (post: InstagramPost) => {
    setEditingPost(post);
    setFormData({
      caption: post.caption,
      post_url: post.post_url,
      posted_date: post.posted_date,
      display_order: post.display_order,
      is_active: post.is_active,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({
      caption: '',
      post_url: '',
      posted_date: new Date().toISOString().split('T')[0],
      display_order: posts.length,
      is_active: true,
    });
  };

  const movePost = async (post: InstagramPost, direction: 'up' | 'down') => {
    const currentIndex = posts.findIndex(p => p.id === post.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === posts.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherPost = posts[newIndex];

    try {
      await supabase
        .from('instagram_posts')
        .update({ display_order: otherPost.display_order })
        .eq('id', post.id);

      await supabase
        .from('instagram_posts')
        .update({ display_order: post.display_order })
        .eq('id', otherPost.id);

      loadPosts();
    } catch (error) {
      console.error('Error moving post:', error);
      alert('Sıralama değiştirilirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manuel Instagram Gönderileri</h2>
          <p className="text-gray-600 mt-1">
            Instagram gönderilerinizi manuel olarak yönetin
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Gönderi</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Henüz gönderi bulunmuyor</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>İlk Gönderiyi Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !post.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="relative aspect-square">
                <img
                  src={post.image_url}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
                {!post.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Pasif</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {post.caption && (
                  <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(post.posted_date).toLocaleDateString('tr-TR')}</span>
                  <span>Sıra: {post.display_order}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => movePost(post, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Yukarı taşı"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => movePost(post, 'down')}
                    disabled={index === posts.length - 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Aşağı taşı"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(post)}
                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded transition-colors ${
                      post.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {post.is_active ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Pasif</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {post.post_url && (
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Instagram'da Gör</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPost ? 'Gönderiyi Düzenle' : 'Yeni Gönderi Ekle'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel {!editingPost && <span className="text-red-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (!editingPost) setPreviewUrl('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Görseli Değiştir
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-1">Görsel yüklemek için tıklayın</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Gönderi açıklaması..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Linki
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.post_url}
                    onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderi Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.posted_date}
                      onChange={(e) => setFormData({ ...formData, posted_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görüntüleme Sırası
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Gönderiyi aktif olarak yayınla
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading || (!selectedFile && !editingPost)}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{saving || uploading ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
