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

interface GuestCartItem {
  id: string;
  product_id?: string;
  course_id?: string;
  quantity: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export default function CartView() {
  const auth = useAuth();
  const { t } = useLanguage();
  const profile = auth?.profile;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addressTitle: '',
    country: '',
    city: '',
    district: '',
    neighborhood: '',
    street: '',
    buildingNo: '',
    apartmentNo: ''
  });

  const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
    'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
    'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Sivas', 'Şırnak', 'Tekirdağ',
    'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  useEffect(() => {
    if (profile) {
      loadCart();
      setGuestInfo(prev => ({
        ...prev,
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
        email: profile.email || ''
      }));
    } else {
      loadGuestCart();
    }
  }, [profile]);

  const loadGuestCart = () => {
    try {
      const stored = localStorage.getItem('guestCart');
      if (stored) {
        setGuestCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGuestCart = (items: GuestCartItem[]) => {
    localStorage.setItem('guestCart', JSON.stringify(items));
    setGuestCartItems(items);
  };

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
    if (!profile) {
      const updated = guestCartItems.filter(item => item.id !== itemId);
      saveGuestCart(updated);
      setMessage({ type: 'success', text: 'Ürün sepetten çıkarıldı' });
      return;
    }

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

  const moveToFavorites = async (item: CartItem | GuestCartItem) => {
    if (!profile) {
      const guestItem = item as GuestCartItem;
      const stored = localStorage.getItem('guestFavorites');
      const favorites: GuestCartItem[] = stored ? JSON.parse(stored) : [];

      const exists = favorites.some(fav =>
        (fav.product_id && fav.product_id === guestItem.product_id) ||
        (fav.course_id && fav.course_id === guestItem.course_id)
      );

      if (exists) {
        setMessage({ type: 'error', text: 'Bu ürün zaten favorilerinizde' });
        return;
      }

      favorites.push(guestItem);
      localStorage.setItem('guestFavorites', JSON.stringify(favorites));

      const updated = guestCartItems.filter(i => i.id !== guestItem.id);
      saveGuestCart(updated);
      setMessage({ type: 'success', text: 'Ürün favorilere taşındı' });
      return;
    }

    try {
      const cartItem = item as CartItem;
      const favoriteData = cartItem.product_id
        ? { user_id: profile!.id, product_id: cartItem.product_id }
        : { user_id: profile!.id, course_id: cartItem.course_id };

      const { error: favError } = await supabase
        .from('user_favorites')
        .insert(favoriteData);

      if (favError) throw favError;

      const { error: cartError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', cartItem.id);

      if (cartError) throw cartError;

      setCartItems(cartItems.filter(i => i.id !== cartItem.id));
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

    if (!profile) {
      const updated = guestCartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      saveGuestCart(updated);
      return;
    }

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

  const calculateSubtotal = () => {
    if (!profile) {
      return guestCartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }

    return cartItems.reduce((total, item) => {
      const price = item.product ? item.product.base_price : item.course!.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateShippingCost = () => {
    const subtotal = calculateSubtotal();
    return subtotal < 1000 ? 79.90 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShippingCost();
  };

  const handleGuestOrder = () => {
    setShowGuestForm(true);
  };

  const confirmOrder = async () => {
    const itemsCount = profile ? cartItems.length : guestCartItems.length;
    if (itemsCount === 0) {
      setMessage({ type: 'error', text: 'Sepetiniz boş' });
      return;
    }

    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.phone ||
        !guestInfo.country || !guestInfo.city || !guestInfo.district ||
        !guestInfo.neighborhood || !guestInfo.street || !guestInfo.buildingNo) {
      setMessage({ type: 'error', text: 'Lütfen tüm zorunlu alanları doldurun' });
      return;
    }

    try {
      setSubmitting(true);

      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const shippingCost = calculateShippingCost();
      const total = calculateTotal();

      const fullAddress = `${guestInfo.addressTitle ? guestInfo.addressTitle + ' - ' : ''}${guestInfo.neighborhood}, ${guestInfo.street} Sokak, No: ${guestInfo.buildingNo}${guestInfo.apartmentNo ? ', Daire: ' + guestInfo.apartmentNo : ''}, ${guestInfo.district}/${guestInfo.city}, ${guestInfo.country}`;

      const customerName = profile?.full_name || `${guestInfo.firstName} ${guestInfo.lastName}`;
      const customerPhone = profile ? (profile as any).phone || guestInfo.phone : guestInfo.phone;
      const customerEmail = profile?.email || guestInfo.email || null;

      const orderData: any = {
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount_amount: 0,
        shipping_cost: shippingCost,
        total_amount: total,
        shipping_address: {
          title: guestInfo.addressTitle || null,
          country: guestInfo.country,
          city: guestInfo.city,
          district: guestInfo.district,
          neighborhood: guestInfo.neighborhood,
          street: guestInfo.street,
          buildingNo: guestInfo.buildingNo,
          apartmentNo: guestInfo.apartmentNo || null,
          fullAddress: fullAddress,
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        },
        billing_address: {
          title: guestInfo.addressTitle || null,
          country: guestInfo.country,
          city: guestInfo.city,
          district: guestInfo.district,
          neighborhood: guestInfo.neighborhood,
          street: guestInfo.street,
          buildingNo: guestInfo.buildingNo,
          apartmentNo: guestInfo.apartmentNo || null,
          fullAddress: fullAddress,
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        },
        notes: `Sipariş - ${customerName} - Tel: ${customerPhone}${customerEmail ? ` - Email: ${customerEmail}` : ''} - ${fullAddress}`
      };

      if (profile) {
        orderData.user_id = profile.id;
        orderData.is_guest_order = false;
      } else {
        orderData.user_id = null;
        orderData.guest_name = `${guestInfo.firstName} ${guestInfo.lastName}`;
        orderData.guest_phone = guestInfo.phone;
        orderData.guest_email = guestInfo.email || null;
        orderData.is_guest_order = true;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Sipariş oluşturulamadı: ${orderError.message}`);
      }

      const orderItems = profile
        ? cartItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            course_id: item.course_id,
            item_name: item.product ? item.product.name : item.course!.title,
            quantity: item.quantity,
            unit_price: item.product ? item.product.base_price : item.course!.price,
            total_price: (item.product ? item.product.base_price : item.course!.price) * item.quantity
          }))
        : guestCartItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id || null,
            course_id: item.course_id || null,
            item_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw new Error(`Sipariş kalemleri eklenemedi: ${itemsError.message}`);
      }

      if (profile) {
        const { error: cartClearError } = await supabase
          .from('shopping_cart')
          .delete()
          .eq('user_id', profile.id);

        if (cartClearError) throw cartClearError;
        setCartItems([]);
      } else {
        localStorage.removeItem('guestCart');
        setGuestCartItems([]);
        setShowGuestForm(false);
        setGuestInfo({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          addressTitle: '',
          country: '',
          city: '',
          district: '',
          neighborhood: '',
          street: '',
          buildingNo: '',
          apartmentNo: ''
        });
      }

      setMessage({
        type: 'success',
        text: 'Siparişiniz alındı! Yönetici en kısa sürede sizinle iletişime geçecektir.'
      });
    } catch (error: any) {
      console.error('Error confirming order:', error);
      const errorMessage = error?.message || 'Sipariş oluşturulurken hata oluştu. Lütfen tüm bilgileri kontrol edip tekrar deneyin.';
      setMessage({ type: 'error', text: errorMessage });
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

  const displayItems = profile ? cartItems : guestCartItems;
  const itemsCount = displayItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-8 h-8 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">Sepetim</h2>
        </div>
        <span className="text-sm text-gray-600">{itemsCount} ürün</span>
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

      {itemsCount === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Sepetiniz boş</p>
          <p className="text-gray-500 text-sm mt-2">Ürünleri sepete ekleyerek alışverişe başlayabilirsiniz</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {profile ? cartItems.map(item => {
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
            }) : guestCartItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold text-emerald-600 mt-2">
                          {item.price.toFixed(2)} ₺
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
                    {item.product_id && (
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
                          Toplam: {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-lg text-gray-700">
                <span>Ara Toplam:</span>
                <span className="font-semibold">{calculateSubtotal().toFixed(2)} ₺</span>
              </div>
              <div className="flex items-center justify-between text-lg text-gray-700">
                <span>Kargo Ücreti:</span>
                <span className="font-semibold">
                  {calculateShippingCost() === 0 ? (
                    <span className="text-green-600">Ücretsiz</span>
                  ) : (
                    `${calculateShippingCost().toFixed(2)} ₺`
                  )}
                </span>
              </div>
              {calculateSubtotal() < 1000 && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  1000 ₺ ve üzeri siparişlerde kargo ücretsiz!
                </p>
              )}
              <div className="flex items-center justify-between text-2xl font-bold text-emerald-900 pt-3 border-t border-emerald-300">
                <span>Toplam Tutar:</span>
                <span>{calculateTotal().toFixed(2)} ₺</span>
              </div>
            </div>

            {showGuestForm && (
              <div className="bg-white rounded-lg p-4 mb-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2 z-10 border-b">
                  İletişim ve Teslimat Bilgileri
                </h3>

                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Kişisel Bilgiler</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                        disabled={!!profile}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                        placeholder="Adınız"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.lastName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                        disabled={!!profile}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                        placeholder="Soyadınız"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0555 123 45 67"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        disabled={!!profile}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Teslimat Adresi</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres Başlığı
                      </label>
                      <input
                        type="text"
                        value={guestInfo.addressTitle}
                        onChange={(e) => setGuestInfo({ ...guestInfo, addressTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ev, İş, Diğer..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ülke <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={guestInfo.country}
                          onChange={(e) => setGuestInfo({ ...guestInfo, country: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">Seçiniz</option>
                          <option value="Türkiye">Türkiye</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İl <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={guestInfo.city}
                          onChange={(e) => setGuestInfo({ ...guestInfo, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">Seçiniz</option>
                          {turkishCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İlçe <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.district}
                        onChange={(e) => setGuestInfo({ ...guestInfo, district: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="İlçe adını girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mahalle <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.neighborhood}
                        onChange={(e) => setGuestInfo({ ...guestInfo, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Mahalle adını girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sokak <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.street}
                        onChange={(e) => setGuestInfo({ ...guestInfo, street: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Sokak adını girin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bina No <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestInfo.buildingNo}
                          onChange={(e) => setGuestInfo({ ...guestInfo, buildingNo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Bina No"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Daire No
                        </label>
                        <input
                          type="text"
                          value={guestInfo.apartmentNo}
                          onChange={(e) => setGuestInfo({ ...guestInfo, apartmentNo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Daire No"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showGuestForm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGuestForm(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>Siparişi Tamamla</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGuestOrder}
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
            )}

            <p className="text-xs text-emerald-700 mt-3 text-center">
              Siparişiniz onaylandıktan sonra yönetici sizinle WhatsApp üzerinden iletişime geçerek ödeme işlemlerini tamamlayacaktır.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
