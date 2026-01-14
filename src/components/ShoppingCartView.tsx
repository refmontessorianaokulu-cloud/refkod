import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Trash2, Plus, Minus, Package, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  course_id?: string;
  quantity: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  product_type: 'physical' | 'digital';
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface CartItemWithDetails extends CartItem {
  product?: Product;
  course?: Course;
}

interface CheckoutData {
  shipping_address: {
    full_name: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string;
  };
  billing_address: {
    full_name: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string;
  };
  payment_method: 'credit_card' | 'bank_transfer' | 'cash';
  notes?: string;
}

export default function ShoppingCartView() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shipping_address: {
      full_name: '',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
    },
    billing_address: {
      full_name: '',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
    },
    payment_method: 'credit_card',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: cartData } = await supabase
        .from('shopping_cart')
        .select('*')
        .eq('user_id', user.id);

      if (cartData) {
        const itemsWithDetails = await Promise.all(
          cartData.map(async (item) => {
            let product = null;
            let course = null;

            if (item.product_id) {
              const { data } = await supabase
                .from('products')
                .select('id, name, description, base_price, product_type')
                .eq('id', item.product_id)
                .maybeSingle();
              product = data;
            }

            if (item.course_id) {
              const { data } = await supabase
                .from('online_courses')
                .select('id, title, description, price')
                .eq('id', item.course_id)
                .maybeSingle();
              course = data;
            }

            return { ...item, product, course };
          })
        );

        setCartItems(itemsWithDetails);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
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
      loadCart();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadCart();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.base_price || item.course?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = calculateTotal();
      const shippingCost = cartItems.some(item => item.product?.product_type === 'physical') ? 50 : 0;
      const total = subtotal + shippingCost;

      const billingAddress = sameAsBilling
        ? checkoutData.shipping_address
        : checkoutData.billing_address;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          discount_amount: 0,
          shipping_cost: shippingCost,
          total_amount: total,
          shipping_address: checkoutData.shipping_address,
          billing_address: billingAddress,
          notes: checkoutData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        course_id: item.course_id || null,
        item_name: item.product?.name || item.course?.title || '',
        quantity: item.quantity,
        unit_price: item.product?.base_price || item.course?.price || 0,
        total_price: (item.product?.base_price || item.course?.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_method: checkoutData.payment_method,
          payment_status: 'pending',
          amount: total,
        });

      if (paymentError) throw paymentError;

      const { error: clearCartError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) throw clearCartError;

      alert(`Siparişiniz alındı! Sipariş numaranız: ${orderNumber}`);
      setShowCheckout(false);
      loadCart();
    } catch (error) {
      alert('Sipariş oluşturulurken hata: ' + (error as Error).message);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Sepetinizi görmek için giriş yapmalısınız.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Sepetiniz boş</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">Alışveriş Sepetim</h3>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const name = item.product?.name || item.course?.title || '';
            const description = item.product?.description || item.course?.description || '';
            const price = item.product?.base_price || item.course?.price || 0;
            const isProduct = !!item.product;

            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">{price.toFixed(2)} ₺</span>
                      {isProduct && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded h-fit"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Sipariş Özeti</h4>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>{calculateTotal().toFixed(2)} ₺</span>
              </div>
              {cartItems.some(item => item.product?.product_type === 'physical') && (
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span>50.00 ₺</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                <span>Toplam</span>
                <span>
                  {(calculateTotal() + (cartItems.some(item => item.product?.product_type === 'physical') ? 50 : 0)).toFixed(2)} ₺
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              <CreditCard className="w-5 h-5" />
              Siparişi Tamamla
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCheckout(false)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Sipariş Bilgileri</h3>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Teslimat Adresi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                      <input
                        type="text"
                        required
                        value={checkoutData.shipping_address.full_name}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          shipping_address: { ...checkoutData.shipping_address, full_name: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
                      <textarea
                        required
                        rows={3}
                        value={checkoutData.shipping_address.address}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          shipping_address: { ...checkoutData.shipping_address, address: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
                      <input
                        type="text"
                        required
                        value={checkoutData.shipping_address.city}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          shipping_address: { ...checkoutData.shipping_address, city: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Posta Kodu *</label>
                      <input
                        type="text"
                        required
                        value={checkoutData.shipping_address.postal_code}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          shipping_address: { ...checkoutData.shipping_address, postal_code: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutData.shipping_address.phone}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          shipping_address: { ...checkoutData.shipping_address, phone: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Ödeme Yöntemi</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'credit_card', label: 'Kredi Kartı' },
                      { value: 'bank_transfer', label: 'Banka Havalesi' },
                      { value: 'cash', label: 'Kapıda Ödeme' },
                    ].map((method) => (
                      <label key={method.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          checked={checkoutData.payment_method === method.value}
                          onChange={(e) => setCheckoutData({ ...checkoutData, payment_method: e.target.value as any })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-gray-700">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sipariş Notları</label>
                  <textarea
                    rows={3}
                    value={checkoutData.notes}
                    onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                    placeholder="Siparişiniz ile ilgili özel notlar..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    Siparişi Onayla
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
