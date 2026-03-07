import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Palette, Users, Star, ArrowRight, Heart, Sparkles, Gift, TrendingUp } from 'lucide-react';
import TypewriterInput from './TypewriterInput';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  discounted_price?: number | null;
  featured: boolean;
  average_rating?: number;
  review_count?: number;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

interface ProductCategory {
  id: string;
  name: string;
  age_group: '0-3' | '3-6' | '6+' | 'all';
}

interface RefAtolyeHomePageProps {
  onNavigate: (tab: string, categoryId?: string) => void;
}

export default function RefAtolyeHomePage({ onNavigate }: RefAtolyeHomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      const { data: ratingsData } = await supabase
        .from('product_ratings')
        .select('*');

      const productsWithRatings = products?.map(product => {
        const rating = ratingsData?.find((r: any) => r.product_id === product.id);
        return {
          ...product,
          average_rating: rating?.average_rating || 0,
          review_count: rating?.review_count || 0,
        };
      }) || [];

      setSearchResults(productsWithRatings);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, imagesRes, ratingsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('featured', true)
          .limit(6),
        supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase.from('product_images').select('*'),
        supabase.from('product_ratings').select('*'),
      ]);

      if (productsRes.data) {
        const productsWithRatings = productsRes.data.map(product => {
          const rating = ratingsRes.data?.find((r: any) => r.product_id === product.id);
          return {
            ...product,
            average_rating: rating?.average_rating || 0,
            review_count: rating?.review_count || 0,
          };
        });
        setFeaturedProducts(productsWithRatings);
      }
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryImage = (productId: string) => {
    const image = images.find(img => img.product_id === productId && img.is_primary);
    return image?.image_url || images.find(img => img.product_id === productId)?.image_url;
  };

  const quickAccessCards = [
    {
      id: 'products',
      title: 'Ürünler',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-500',
      description: 'Eğitici oyuncaklar ve malzemeler',
    },
    {
      id: 'courses',
      title: 'Atölyeler',
      icon: Palette,
      color: 'from-blue-500 to-cyan-500',
      description: 'Yaratıcı etkinlikler ve dersler',
    },
    {
      id: 'play_groups',
      title: 'Oyun Grupları',
      icon: Users,
      color: 'from-orange-500 to-amber-500',
      description: 'Sosyal gelişim programları',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Search Overlay - closes search when clicking outside */}
      {showSearchResults && (
        <div
          className="fixed inset-0 z-[60] bg-black/20"
          onClick={() => {
            setShowSearchResults(false);
            setSearchQuery('');
          }}
        />
      )}

      {/* Search Bar - Mobile at top, Desktop integrated */}
      <div className="mb-8 relative z-[70] lg:mt-0 mt-0">
        <TypewriterInput
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          onClear={() => setSearchQuery('')}
        />

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute z-[80] left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Aranıyor...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {searchResults.length} ürün bulundu
                </div>
                {searchResults.map((product) => {
                  const imageUrl = getPrimaryImage(product.id);
                  const hasDiscount = product.discounted_price && product.discounted_price < product.base_price;
                  const displayPrice = hasDiscount ? product.discounted_price : product.base_price;

                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                        onNavigate('products');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate">{product.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">₺{product.base_price.toFixed(2)}</span>
                          )}
                          <span className="text-sm font-semibold text-emerald-600">₺{displayPrice?.toFixed(2)}</span>
                          {product.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs text-gray-600">{product.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Aradığınız ürün bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Featured Products */}
      {!showSearchResults && featuredProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Öne Çıkan Ürünler
            </h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-emerald-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.slice(0, 4).map((product) => {
              const imageUrl = getPrimaryImage(product.id);
              const hasDiscount = product.discounted_price && product.discounted_price < product.base_price;
              const displayPrice = hasDiscount ? product.discounted_price : product.base_price;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        İndirim
                      </div>
                    )}
                    <button className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    {product.review_count > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-600">
                          {product.average_rating?.toFixed(1)} ({product.review_count})
                        </span>
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        {hasDiscount && (
                          <div className="text-xs text-gray-400 line-through">
                            {product.base_price.toFixed(2)} ₺
                          </div>
                        )}
                        <div className="text-base font-bold text-emerald-600">
                          {displayPrice?.toFixed(2)} ₺
                        </div>
                      </div>
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
