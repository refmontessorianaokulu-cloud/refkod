import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, Trash2, ShoppingCart, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface FavoriteItem {
  id: string;
  product_id: string;
  course_id: string;
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
    product_images: { image_url: string; is_primary: boolean }[];
  };
  course?: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail_url: string;
  };
}

export default function FavoritesView() {
  const auth = useAuth();
  const { t } = useLanguage();
  const profile = auth?.profile;

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          product:products(
            id,
            name,
            description,
            base_price,
            product_images(image_url, is_primary)
          ),
          course:online_courses(
            id,
            title,
            description,
            price,
            thumbnail_url
          )
        `)
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setMessage({ type: 'error', text: 'Favoriler yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setFavorites(favorites.filter(item => item.id !== itemId));
      setMessage({ type: 'success', text: 'Favorilerden çıkarıldı' });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      setMessage({ type: 'error', text: 'Favorilerden çıkarılamadı' });
    }
  };

  const addToCart = async (item: FavoriteItem) => {
    try {
      const cartData = item.product_id
        ? { user_id: profile!.id, product_id: item.product_id, quantity: 1 }
        : { user_id: profile!.id, course_id: item.course_id, quantity: 1 };

      const { error } = await supabase
        .from('shopping_cart')
        .insert(cartData);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sepete eklendi' });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Bu ürün zaten sepetinizde' });
      } else {
        setMessage({ type: 'error', text: 'Sepete eklenemedi' });
      }
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Favorileri görüntülemek için giriş yapmalısınız</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-pink-600 fill-pink-600" />
          <h2 className="text-2xl font-bold text-gray-800">Favorilerim</h2>
        </div>
        <span className="text-sm text-gray-600">{favorites.length} ürün</span>
      </div>

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

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Favori ürününüz yok</p>
          <p className="text-gray-500 text-sm mt-2">Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca ulaşabilirsiniz</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(item => {
            const isProduct = !!item.product;
            const name = isProduct ? item.product!.name : item.course!.title;
            const description = isProduct ? item.product!.description : item.course!.description;
            const price = isProduct ? item.product!.base_price : item.course!.price;
            const image = isProduct
              ? item.product!.product_images?.find(img => img.is_primary)?.image_url ||
                item.product!.product_images?.[0]?.image_url
              : item.course!.thumbnail_url;

            return (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {image && (
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 text-red-600"
                      title="Favorilerden Çıkar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-emerald-600">
                      {price.toFixed(2)} ₺
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Sepete Ekle</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
