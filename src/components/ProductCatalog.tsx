import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Star, Filter, Search, X, Package, Heart, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Truck, Zap, CreditCard, Camera } from 'lucide-react';
import ProductReviewsModal from './ProductReviewsModal';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  product_type: 'physical' | 'digital';
  base_price: number;
  discounted_price?: number | null;
  is_active: boolean;
  sku: string;
  tags?: string[];
  featured: boolean;
  created_at: string;
  average_rating?: number;
  review_count?: number;
  has_photo_reviews?: boolean;
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

interface ProductCatalogProps {
  initialCategoryId?: string | null;
}

function ProductCatalog({ initialCategoryId }: ProductCatalogProps) {
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
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    loadData();
    loadCartCount();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, imagesRes, ratingsRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('featured', { ascending: false }),
        supabase.from('product_categories').select('*').eq('is_active', true).order('name', { ascending: true }),
        supabase.from('product_images').select('*').order('display_order', { ascending: true }),
        supabase.from('product_ratings').select('*'),
        supabase.from('product_reviews').select('product_id, images').eq('is_approved', true),
      ]);

      if (productsRes.data) {
        const productsWithRatings = productsRes.data.map(product => {
          const rating = ratingsRes.data?.find((r: any) => r.product_id === product.id);
          const hasPhotoReviews = reviewsRes.data?.some(
            (r: any) => r.product_id === product.id && r.images && r.images.length > 0
          );
          return {
            ...product,
            average_rating: rating?.average_rating || 0,
            review_count: rating?.review_count || 0,
            has_photo_reviews: hasPhotoReviews || false,
          };
        });
        setProducts(productsWithRatings);
      }
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [cameraColor, setCameraColor] = useState('#3B82F6');
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F97316'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCameraColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        const primaryImage = getPrimaryImage(product.id);
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
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

        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        setMessage({ type: 'success', text: 'Ürün sepete eklendi!' });
        window.dispatchEvent(new Event('cart-updated'));
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
        <>
          {/* Mobile: Grouped by Category with Horizontal Scroll (No Category Names) */}
          <div className="md:hidden space-y-6">
            {categories
              .filter(category => {
                const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
                return categoryProducts.length > 0;
              })
              .map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
                return (
                  <CategoryScrollSection key={category.id} products={categoryProducts} />
                );
              })}
          </div>

          {/* Desktop: 3 Columns Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
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

      {/* Product Reviews Modal */}
      {showReviewsModal && selectedProductForReviews && (
        <ProductReviewsModal
          product={selectedProductForReviews}
          onClose={() => {
            setShowReviewsModal(false);
            setSelectedProductForReviews(null);
          }}
        />
      )}
    </div>
  );

  function CategoryScrollSection({ products }: { products: Product[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScrollPosition = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    useEffect(() => {
      checkScrollPosition();
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', checkScrollPosition);
        return () => scrollElement.removeEventListener('scroll', checkScrollPosition);
      }
    }, [products]);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const scrollAmount = 300;
        const newScrollLeft = direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

        scrollRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        });
      }
    };

    return (
      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all"
            aria-label="Önceki ürünler"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all"
            aria-label="Sonraki ürünler"
          >
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="grid grid-cols-2 gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ gridAutoFlow: 'column', gridAutoColumns: 'calc(50% - 6px)' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ProductCard({ product }: { product: typeof filteredProducts[0] }) {
    const [featureIndex, setFeatureIndex] = useState(0);
    const price = product.discounted_price || product.base_price;

    const featuresAbove1000 = [
      { icon: Truck, text: 'Ücretsiz Kargo', color: 'text-emerald-600' },
      { icon: CreditCard, text: 'Kapıda Ödeme', color: 'text-blue-600' },
      { icon: Zap, text: 'Fırsat Ürünü', color: 'text-orange-600' },
    ];

    const featuresBelow1000 = [
      { icon: CreditCard, text: 'Kapıda Ödeme', color: 'text-blue-600' },
      { icon: Zap, text: 'Fırsat Ürünü', color: 'text-orange-600' },
    ];

    const features = price >= 1000 ? featuresAbove1000 : featuresBelow1000;

    useEffect(() => {
      const interval = setInterval(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }, [features.length]);

    const currentFeature = features[featureIndex];
    const FeatureIcon = currentFeature.icon;

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
        <div className="p-2.5">
          <h4 className="font-semibold text-gray-800 text-sm mb-1.5 line-clamp-2 sm:line-clamp-1 sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">{product.name}</h4>

          <div
            className="flex items-center gap-1 mb-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowReviewsModal(true);
              setSelectedProductForReviews(product);
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= (product.average_rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({product.review_count || 0})
            </span>
            {product.has_photo_reviews && (
              <Camera className="w-4 h-4 ml-1 transition-colors duration-500" style={{
                color: cameraColor
              }} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {product.discounted_price ? (
                <>
                  <span className="text-[10px] sm:text-xs text-gray-400 line-through whitespace-nowrap">{product.base_price.toFixed(2)} ₺</span>
                  <span className="text-sm sm:text-base font-bold text-green-600 whitespace-nowrap">{product.discounted_price.toFixed(2)} ₺</span>
                </>
              ) : (
                <span className="text-sm sm:text-base font-bold text-green-600 whitespace-nowrap">{product.base_price.toFixed(2)} ₺</span>
              )}
            </div>

            <div className="h-5 flex items-center">
              <div className={`flex items-center gap-1 text-xs transition-opacity duration-500 ${currentFeature.color}`}>
                <FeatureIcon className="w-3.5 h-3.5" />
                <span className="font-medium">{currentFeature.text}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToFavorites(product);
                }}
                className="flex-1 p-2 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center"
                title="Favorilere Ekle"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="flex-1 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                title="Sepete Ekle"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ProductDetailModal({
    product,
    onClose,
    onAddToCart,
    getCategoryName,
    getPrimaryImage
  }: {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
    getCategoryName: (categoryId: string) => string;
    getPrimaryImage: (productId: string) => string;
  }) {
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    useEffect(() => {
      loadSimilarProducts();
      loadReviews();
    }, [product.id]);

    const loadSimilarProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', product.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (data) {
          const { data: ratingsData } = await supabase.from('product_ratings').select('*');
          const productsWithRatings = data.map(p => {
            const rating = ratingsData?.find((r: any) => r.product_id === p.id);
            return {
              ...p,
              average_rating: rating?.average_rating || 0,
              review_count: rating?.review_count || 0,
            };
          });
          setSimilarProducts(productsWithRatings);
        }
      } catch (error) {
        console.error('Error loading similar products:', error);
      }
    };

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            *,
            profiles:user_id (
              full_name
            )
          `)
          .eq('product_id', product.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    const maskName = (fullName: string): string => {
      const parts = fullName.trim().split(' ');
      return parts.map(part => {
        if (part.length === 0) return '';
        return part[0] + '*'.repeat(part.length - 1);
      }).join(' ');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <img
              src={getPrimaryImage(product.id)}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
            />

            <div className="space-y-2">
              <p className="text-sm text-gray-500">{getCategoryName(product.category_id)}</p>
              <p className="text-gray-700">{product.description}</p>

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  {product.discounted_price ? (
                    <>
                      <span className="text-xl md:text-2xl font-bold text-emerald-600">{product.discounted_price.toFixed(2)} ₺</span>
                      <span className="text-sm md:text-lg text-gray-400 line-through">{product.base_price.toFixed(2)} ₺</span>
                    </>
                  ) : (
                    <span className="text-xl md:text-2xl font-bold text-emerald-600">{product.base_price.toFixed(2)} ₺</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToFavorites(product)}
                    className="p-2.5 md:p-3 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors md:flex md:items-center md:gap-2"
                    title="Favorilere Ekle"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="hidden md:inline font-medium">Favorilere Ekle</span>
                  </button>
                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="p-2.5 md:p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors md:flex md:items-center md:gap-2"
                    title="Sepete Ekle"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden md:inline font-medium">Sepete Ekle</span>
                  </button>
                </div>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Değerlendirmeler</h4>
                  <button
                    onClick={() => {
                      setShowReviewsModal(true);
                      setSelectedProductForReviews(product);
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Tümünü Gör
                  </button>
                </div>
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
                  ) : (
                    reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-800">{maskName(review.profiles.full_name)}</span>
                              {review.is_verified_purchase && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  Onaylı Alıcı
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.images && review.images.length > 0 && (
                                <Camera className="w-5 h-5 transition-colors duration-500" style={{
                                  color: cameraColor
                                }} />
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.slice(0, 3).map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Review ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {similarProducts.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Benzer Ürünler</h4>
                <div className="grid grid-cols-3 gap-3">
                  {similarProducts.map((similar) => (
                    <div
                      key={similar.id}
                      className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        onClose();
                        setSelectedProduct(similar);
                      }}
                    >
                      <img
                        src={getPrimaryImage(similar.id)}
                        alt={similar.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2">
                        <h5 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{similar.name}</h5>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 ${
                                star <= (similar.average_rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {similar.discounted_price ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 line-through">{similar.base_price.toFixed(2)} ₺</span>
                            <span className="text-xs font-bold text-emerald-600">{similar.discounted_price.toFixed(2)} ₺</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">{similar.base_price.toFixed(2)} ₺</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ProductCatalog;

