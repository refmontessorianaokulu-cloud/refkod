import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Upload, Package, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  product_type: 'physical' | 'digital';
  base_price: number;
  is_active: boolean;
  sku: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  tags?: string[];
  featured: boolean;
  created_at: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  video_type: 'uploaded' | 'youtube' | 'vimeo' | 'other';
  title: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  age_group: '0-3' | '3-6' | '6+' | 'all';
  is_active: boolean;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeView, setActiveView] = useState<'products' | 'categories'>('products');

  const [productForm, setProductForm] = useState({
    category_id: '',
    name: '',
    description: '',
    product_type: 'physical' as 'physical' | 'digital',
    base_price: '',
    sku: '',
    weight: '',
    is_active: true,
    featured: false,
    tags: '',
  });

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [productVideos, setProductVideos] = useState<ProductVideo[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoType, setNewVideoType] = useState<'youtube' | 'vimeo' | 'other'>('youtube');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    age_group: 'all' as '0-3' | '3-6' | '6+' | 'all',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_categories').select('*').order('name', { ascending: true }),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductMedia = async (productId: string) => {
    try {
      const [imagesRes, videosRes] = await Promise.all([
        supabase.from('product_images').select('*').eq('product_id', productId).order('display_order'),
        supabase.from('product_videos').select('*').eq('product_id', productId).order('display_order'),
      ]);

      if (imagesRes.data) setProductImages(imagesRes.data);
      if (videosRes.data) setProductVideos(videosRes.data);
    } catch (error) {
      console.error('Error loading product media:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!editingProduct && !productForm.name) {
      alert('Önce ürünü kaydedin, sonra görsel ekleyin');
      return;
    }

    setUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (editingProduct) {
          const { error: insertError } = await supabase.from('product_images').insert({
            product_id: editingProduct.id,
            image_url: publicUrl,
            is_primary: productImages.length === 0,
            display_order: productImages.length,
          });

          if (insertError) throw insertError;
          await loadProductMedia(editingProduct.id);
        }
      }
      alert('Görseller yüklendi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return;

    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('product-images').remove([fileName]);
      }

      const { error } = await supabase.from('product_images').delete().eq('id', imageId);
      if (error) throw error;

      setProductImages(productImages.filter(img => img.id !== imageId));
      alert('Görsel silindi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!editingProduct) return;

    try {
      await supabase.from('product_images')
        .update({ is_primary: false })
        .eq('product_id', editingProduct.id);

      await supabase.from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      await loadProductMedia(editingProduct.id);
      alert('Ana görsel güncellendi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAddVideo = async () => {
    if (!editingProduct) {
      alert('Önce ürünü kaydedin, sonra video ekleyin');
      return;
    }
    if (!newVideoUrl.trim()) {
      alert('Video URL giriniz');
      return;
    }

    try {
      const { error } = await supabase.from('product_videos').insert({
        product_id: editingProduct.id,
        video_url: newVideoUrl,
        video_type: newVideoType,
        title: newVideoTitle || 'Ürün Videosu',
        is_primary: productVideos.length === 0,
        display_order: productVideos.length,
      });

      if (error) throw error;

      await loadProductMedia(editingProduct.id);
      setNewVideoUrl('');
      setNewVideoTitle('');
      alert('Video eklendi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('product_videos').delete().eq('id', videoId);
      if (error) throw error;

      setProductVideos(productVideos.filter(vid => vid.id !== videoId));
      alert('Video silindi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const productData = {
        category_id: productForm.category_id || null,
        name: productForm.name,
        description: productForm.description,
        product_type: productForm.product_type,
        base_price: parseFloat(productForm.base_price),
        sku: productForm.sku,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        is_active: productForm.is_active,
        featured: productForm.featured,
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : [],
        created_by: user.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        alert('Ürün güncellendi!');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        alert('Ürün eklendi!');
      }

      resetProductForm();
      setShowProductModal(false);
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('product_categories').insert(categoryForm);
      if (error) throw error;

      alert('Kategori eklendi!');
      setCategoryForm({ name: '', description: '', age_group: 'all', is_active: true });
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      category_id: product.category_id || '',
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      base_price: product.base_price.toString(),
      sku: product.sku,
      weight: product.weight?.toString() || '',
      is_active: product.is_active,
      featured: product.featured,
      tags: product.tags?.join(', ') || '',
    });
    await loadProductMedia(product.id);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Ürün silindi!');
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
      alert('Kategori silindi!');
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      category_id: '',
      name: '',
      description: '',
      product_type: 'physical',
      base_price: '',
      sku: '',
      weight: '',
      is_active: true,
      featured: false,
      tags: '',
    });
    setEditingProduct(null);
    setProductImages([]);
    setProductVideos([]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Kategorisiz';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView('products')}
          className={`pb-4 px-4 font-medium transition-colors ${
            activeView === 'products'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ürünler
        </button>
        <button
          onClick={() => setActiveView('categories')}
          className={`pb-4 px-4 font-medium transition-colors ${
            activeView === 'categories'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Kategoriler
        </button>
      </div>

      {/* Products View */}
      {activeView === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Ürün Yönetimi</h3>
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Ürün
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz ürün eklenmemiş</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-500">{getCategoryName(product.category_id)}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">{product.base_price.toFixed(2)} ₺</span>
                    <div className="flex gap-2">
                      {product.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Öne Çıkan</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories View */}
      {activeView === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Kategori Yönetimi</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Kategori
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{category.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {category.age_group === 'all' ? 'Tüm Yaşlar' : category.age_group + ' yaş'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {category.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button onClick={() => { setShowProductModal(false); resetProductForm(); }} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Kategorisiz</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Tipi *</label>
                  <select
                    value={productForm.product_type}
                    onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value as 'physical' | 'digital' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="physical">Fiziksel Ürün</option>
                    <option value="digital">Dijital Ürün</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {productForm.product_type === 'physical' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.weight}
                      onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler (virgülle ayırın)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="montessori, eğitici, ahşap"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Öne Çıkan</span>
                </label>
              </div>

              {editingProduct && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        <ImageIcon className="w-4 h-4 inline mr-2" />
                        Ürün Görselleri
                      </label>
                      <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {uploadingMedia ? 'Yükleniyor...' : 'Görsel Ekle'}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingMedia}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {productImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {productImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.image_url}
                              alt="Product"
                              className="w-full h-32 object-cover rounded border-2 border-gray-200"
                            />
                            {img.is_primary && (
                              <span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Ana Görsel
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              {!img.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(img.id)}
                                  className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                                  title="Ana görsel yap"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(img.id, img.image_url)}
                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded">
                        Henüz görsel eklenmemiş
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <VideoIcon className="w-4 h-4 inline mr-2" />
                      Ürün Videoları
                    </label>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Video Tipi</label>
                        <select
                          value={newVideoType}
                          onChange={(e) => setNewVideoType(e.target.value as 'youtube' | 'vimeo' | 'other')}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
                        <input
                          type="url"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Video Başlığı (Opsiyonel)</label>
                        <input
                          type="text"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          placeholder="Ürün tanıtım videosu"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Video Ekle
                      </button>
                    </div>

                    {productVideos.length > 0 ? (
                      <div className="space-y-2">
                        {productVideos.map((video) => (
                          <div key={video.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{video.title}</p>
                              <p className="text-xs text-gray-500 truncate">{video.video_url}</p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                                {video.video_type}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded">
                        Henüz video eklenmemiş
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowProductModal(false); resetProductForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Yeni Kategori Ekle</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yaş Grubu</label>
                <select
                  value={categoryForm.age_group}
                  onChange={(e) => setCategoryForm({ ...categoryForm, age_group: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Tüm Yaşlar</option>
                  <option value="0-3">0-3 Yaş</option>
                  <option value="3-6">3-6 Yaş</option>
                  <option value="6+">6+ Yaş</option>
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
