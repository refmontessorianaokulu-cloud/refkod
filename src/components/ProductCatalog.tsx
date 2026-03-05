import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Star, Filter, Search, X, Package, Heart, CheckCircle, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  product_type: 'physical' | 'digital';
  base_price: number;
  is_active: boolean;
  sku: string;
  tags?: string[];
  featured: boolean;
  created_at: string;
}

interface ProductCategory {
  id: string;
  name: string;
  age_group: '0-3' | '3-6' | '6+' | 'all';
  is_active: boolean;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

function ProductCatalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
    loadCartCount();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, imagesRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('featured', { ascending: false }),
        supabase.from('product_categories').select('*').eq('is_active', true).order('name', { ascending: true }),
        supabase.from('product_images').select('*').order('display_order', { ascending: true }),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      if (user) {
        const { data } = await supabase
          .from('shopping_cart')
          .select('quantity')
          .eq('user_id', user.id);

        if (data) {
          const total = data.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(total);
        }
      } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const total = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(total);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      if (user) {
        const { error } = await supabase.from('shopping_cart').insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        });

        if (error) {
          if (error.code === '23505') {
            setMessage({ type: 'error', text: 'Bu ürün zaten sepetinizde' });
          } else {
            throw error;
          }
        } else {
          setMessage({ type: 'success', text: 'Ürün sepete eklendi!' });
        }
      } else {
        const primaryImage = getPrimaryImage(product.id);
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingItem = guestCart.find((item: any) => item.product_id === product.id);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          guestCart.push({
            id: `guest_cart_${Date.now()}`,
            product_id: product.id,
            quantity: 1,
            name: product.name,
            description: product.description,
            price: product.base_price,
            image: primaryImage,
            added_at: new Date().toISOString(),
          });
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setMessage({ type: 'success', text: 'Ürün sepete eklendi!' });
      }
      loadCartCount();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + (error as Error).message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addToFavorites = async (product: Product) => {
    try {
      if (user) {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: user.id,
          product_id: product.id,
        });

        if (error) {
          if (error.code === '23505') {
            setMessage({ type: 'error', text: 'Bu ürün zaten favorilerinizde' });
          } else {
            throw error;
          }
        } else {
          setMessage({ type: 'success', text: 'Ürün favorilere eklendi!' });
        }
      } else {
        const primaryImage = getPrimaryImage(product.id);
        const guestFavorites = JSON.parse(localStorage.getItem('guestFavorites') || '[]');
        const existingItem = guestFavorites.find((item: any) => item.product_id === product.id);

        if (existingItem) {
          setMessage({ type: 'error', text: 'Bu ürün zaten favorilerinizde' });
        } else {
          guestFavorites.push({
            id: `guest_fav_${Date.now()}`,
            product_id: product.id,
            quantity: 1,
            name: product.name,
            description: product.description,
            price: product.base_price,
            image: primaryImage,
            added_at: new Date().toISOString(),
          });
          localStorage.setItem('guestFavorites', JSON.stringify(guestFavorites));
          setMessage({ type: 'success', text: 'Ürün favorilere eklendi!' });
        }
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + (error as Error).message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getPrimaryImage = (productId: string) => {
    const image = images.find(img => img.product_id === productId && img.is_primary);
    return image?.image_url || 'https://images.pexels.com/photos/296301/pexels-photo-296301.jpeg';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const category = categories.find(c => c.id === product.category_id);
    const matchesAgeGroup = selectedAgeGroup === 'all' || category?.age_group === selectedAgeGroup || category?.age_group === 'all';
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesAgeGroup && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Ürün Kataloğu</h3>
          <p className="text-gray-600 mt-1">Montessori materyalleri ve eğitim araçları</p>
        </div>
        {cartCount > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">{cartCount} ürün sepetinizde</span>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-5 h-5" />
          Filtrele
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yaş Grubu</label>
            <div className="flex flex-wrap gap-2">
              {['all', '0-3', '3-6', '6+'].map((age) => (
                <button
                  key={age}
                  onClick={() => setSelectedAgeGroup(age)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedAgeGroup === age
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {age === 'all' ? 'Tümü' : age + ' yaş'}
                </button>
              ))}
            </div>
          </div>

          {(selectedCategory !== 'all' || selectedAgeGroup !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAgeGroup('all');
                setSearchTerm('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ürün bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories
            .filter(category => {
              const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
              return categoryProducts.length > 0;
            })
            .map(category => {
              const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-800">{category.name}</h4>
                    <span className="text-sm text-gray-500">{categoryProducts.length} ürün</span>
                  </div>

                  {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                  <div className="md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                    <div className="flex md:hidden overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex-shrink-0 w-[280px] snap-start"
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:contents">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          getCategoryName={getCategoryName}
          getPrimaryImage={getPrimaryImage}
        />
      )}
    </div>
  );

  function ProductCard({ product }: { product: typeof filteredProducts[0] }) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
        onClick={() => setSelectedProduct(product)}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={getPrimaryImage(product.id)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {product.featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Öne Çıkan
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{getCategoryName(product.category_id)}</p>
          <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{product.name}</h4>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-base sm:text-lg font-bold text-emerald-600 whitespace-nowrap">{product.base_price.toFixed(2)} ₺</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToFavorites(product);
                }}
                className="p-1.5 sm:p-2 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                title="Favorilere Ekle"
              >
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="flex items-center gap-1 sm:gap-2 bg-emerald-600 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sepete Ekle</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ProductCatalog;

