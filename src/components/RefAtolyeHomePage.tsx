import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Palette, Users, Star, ArrowRight, Heart, Sparkles, Gift, TrendingUp } from 'lucide-react';

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
  onNavigate: (tab: string) => void;
}

export default function RefAtolyeHomePage({ onNavigate }: RefAtolyeHomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-6 h-6" />
          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
            Hoş Geldiniz
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Ref Atölye</h1>
        <p className="text-emerald-50 text-sm">
          Çocuğunuzun gelişimi için özel tasarlanmış ürünler ve aktiviteler
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Hızlı Erişim
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {quickAccessCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold">{card.title}</h3>
                      <p className="text-white/80 text-sm">{card.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
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

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => onNavigate('products')}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 border-2 border-gray-100"
              >
                <div className="text-center">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {category.age_group === 'all' ? 'Tüm Yaşlar' : `${category.age_group} yaş`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Promotional Banner */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-6 h-6" />
          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
            Özel Fırsat
          </span>
        </div>
        <h3 className="text-xl font-bold mb-2">İlk Alışverişinize Özel!</h3>
        <p className="text-white/90 text-sm mb-4">
          Seçili ürünlerde %20'ye varan indirimler
        </p>
        <button
          onClick={() => onNavigate('products')}
          className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
        >
          Ürünleri İncele
        </button>
      </div>
    </div>
  );
}
