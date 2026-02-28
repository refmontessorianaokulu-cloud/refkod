import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingCart, Trash2, Heart, Package, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  course_id: string;
  quantity: number;
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

export default function CartView() {
  const auth = useAuth();
  const { t } = useLanguage();
  const profile = auth?.profile;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      loadCart();
    }
  }, [profile]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_cart')
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
      setCartItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setMessage({ type: 'error', text: 'Sepet yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.filter(item => item.id !== itemId));
      setMessage({ type: 'success', text: 'Ürün sepetten çıkarıldı' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      setMessage({ type: 'error', text: 'Ürün sepetten çıkarılamadı' });
    }
  };

  const moveToFavorites = async (item: CartItem) => {
    try {
      const favoriteData = item.product_id
        ? { user_id: profile!.id, product_id: item.product_id }
        : { user_id: profile!.id, course_id: item.course_id };

      const { error: favError } = await supabase
        .from('user_favorites')
        .insert(favoriteData);

      if (favError) throw favError;

      const { error: cartError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', item.id);

      if (cartError) throw cartError;

      setCartItems(cartItems.filter(i => i.id !== item.id));
      setMessage({ type: 'success', text: 'Ürün favorilere taşındı' });
    } catch (error: any) {
      console.error('Error moving to favorites:', error);
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Bu ürün zaten favorilerinizde' });
      } else {
        setMessage({ type: 'error', text: 'Favorilere eklenemedi' });
      }
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      setMessage({ type: 'error', text: 'Miktar güncellenemedi' });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product ? item.product.base_price : item.course!.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const confirmOrder = async () => {
    if (cartItems.length === 0) {
      setMessage({ type: 'error', text: 'Sepetiniz boş' });
      return;
    }

    try {
      setSubmitting(true);

      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = calculateTotal();
      const total = subtotal;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: profile!.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          discount_amount: 0,
          shipping_cost: 0,
          total_amount: total,
          shipping_address: { address: 'Belirtilmedi' },
          billing_address: { address: 'Belirtilmedi' },
          notes: 'Ref Atölye web sitesi üzerinden sipariş'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        course_id: item.course_id,
        item_name: item.product ? item.product.name : item.course!.title,
        quantity: item.quantity,
        unit_price: item.product ? item.product.base_price : item.course!.price,
        total_price: (item.product ? item.product.base_price : item.course!.price) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: cartClearError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', profile!.id);

      if (cartClearError) throw cartClearError;

      setCartItems([]);
      setMessage({
        type: 'success',
        text: 'Siparişiniz alındı! Yönetici en kısa sürede sizinle iletişime geçecektir.'
      });
    } catch (error) {
      console.error('Error confirming order:', error);
      setMessage({ type: 'error', text: 'Sipariş oluşturulurken hata oluştu' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-8 h-8 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">Sepetim</h2>
        </div>
        <span className="text-sm text-gray-600">{cartItems.length} ürün</span>
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

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Sepetiniz boş</p>
          <p className="text-gray-500 text-sm mt-2">Ürünleri sepete ekleyerek alışverişe başlayabilirsiniz</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map(item => {
              const isProduct = !!item.product;
              const name = isProduct ? item.product!.name : item.course!.title;
              const description = isProduct ? item.product!.description : item.course!.description;
              const price = isProduct ? item.product!.base_price : item.course!.price;
              const image = isProduct
                ? item.product!.product_images?.find(img => img.is_primary)?.image_url ||
                  item.product!.product_images?.[0]?.image_url
                : item.course!.thumbnail_url;

              return (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-4">
                    {image && (
                      <img
                        src={image}
                        alt={name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
                          <p className="text-lg font-bold text-emerald-600 mt-2">
                            {price.toFixed(2)} ₺
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Sepetten Çıkar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => moveToFavorites(item)}
                            className="text-pink-600 hover:text-pink-700 p-1"
                            title="Favorilere Taşı"
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {isProduct && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm text-gray-600">Miktar:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 ml-4">
                            Toplam: {(price * item.quantity).toFixed(2)} ₺
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center justify-between text-2xl font-bold text-emerald-900 mb-4">
              <span>Toplam Tutar:</span>
              <span>{calculateTotal().toFixed(2)} ₺</span>
            </div>
            <button
              onClick={confirmOrder}
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sipariş Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>Sepeti Onayla</span>
                </>
              )}
            </button>
            <p className="text-xs text-emerald-700 mt-3 text-center">
              Siparişiniz onaylandıktan sonra yönetici sizinle WhatsApp üzerinden iletişime geçerek ödeme işlemlerini tamamlayacaktır.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
