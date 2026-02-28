import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Truck, CheckCircle, X, Eye, Search, Filter, MessageCircle, Loader, Trash2 } from 'lucide-react';

interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: any;
  billing_address: any;
  notes?: string;
  is_guest_order?: boolean;
  guest_email?: string;
  guest_phone?: string;
  guest_name?: string;
  shipping_carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  estimated_delivery_date?: string;
  created_at: string;
}

interface OrderWithUser extends Order {
  user_name?: string;
  user_email?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Payment {
  id: string;
  order_id: string;
  payment_method: string;
  payment_status: string;
  amount: number;
  payment_date?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede', color: 'yellow' },
  { value: 'confirmed', label: 'Onaylandı', color: 'blue' },
  { value: 'processing', label: 'Hazırlanıyor', color: 'purple' },
  { value: 'shipped', label: 'Kargoya Verildi', color: 'indigo' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'green' },
  { value: 'cancelled', label: 'İptal Edildi', color: 'red' },
];

export default function OrderManagement() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersData) {
        const ordersWithUser = await Promise.all(
          ordersData.map(async (order) => {
            if (order.is_guest_order) {
              return {
                ...order,
                user_name: order.shipping_address?.full_name || 'Misafir',
                user_email: order.guest_email || '',
              };
            } else {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', order.user_id)
                .maybeSingle();

              return {
                ...order,
                user_name: profile?.full_name || 'Bilinmiyor',
                user_email: profile?.email || '',
              };
            }
          })
        );

        setOrders(ordersWithUser);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order: OrderWithUser) => {
    try {
      const [itemsRes, paymentRes] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', order.id),
        supabase.from('payments').select('*').eq('order_id', order.id).maybeSingle(),
      ]);

      if (itemsRes.data) setOrderItems(itemsRes.data);
      if (paymentRes.data) setPayment(paymentRes.data);
      setSelectedOrder(order);

      // Load shipping info
      setShippingCarrier(order.shipping_carrier || '');
      setTrackingNumber(order.tracking_number || '');
      setTrackingUrl(order.tracking_url || '');
      setEstimatedDeliveryDate(order.estimated_delivery_date || '');
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      alert('Sipariş durumu güncellendi!');
      loadOrders();
      if (selectedOrder) {
        const updatedOrder = { ...selectedOrder, status: newStatus as any };
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const updateShippingInfo = async () => {
    if (!selectedOrder) return;

    try {
      const updateData: any = {
        shipping_carrier: shippingCarrier || null,
        tracking_number: trackingNumber || null,
        tracking_url: trackingUrl || null,
        estimated_delivery_date: estimatedDeliveryDate || null,
      };

      // If status is being changed to shipped, set shipped_at timestamp
      if (selectedOrder.status === 'shipped' && !selectedOrder.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      alert('Kargo bilgileri güncellendi!');
      loadOrders();

      // Update selected order
      const updatedOrder = { ...selectedOrder, ...updateData };
      setSelectedOrder(updatedOrder);
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      // Delete order items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Delete payments
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('order_id', orderId);

      if (paymentsError) throw paymentsError;

      // Delete order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      alert('Sipariş başarıyla silindi!');
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      alert('Sipariş silinirken hata oluştu: ' + (error as Error).message);
    }
  };

  const sendWhatsAppShippingInfo = async (order: OrderWithUser) => {
    try {
      setSendingWhatsApp(true);

      if (!trackingNumber || !shippingCarrier) {
        alert('Lütfen önce kargo firması ve takip numarasını girin');
        return;
      }

      let phone = '';
      let customerName = '';

      if (order.is_guest_order) {
        phone = order.guest_phone || '';
        customerName = order.shipping_address?.full_name || 'Müşteri';
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, full_name')
          .eq('id', order.user_id)
          .maybeSingle();

        phone = profile?.phone_number || '';
        customerName = profile?.full_name || 'Müşteri';
      }

      if (!phone) {
        alert('Müşteri telefon numarası bulunamadı');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;

      let message = `Merhaba ${customerName},\n\nRef Atölye siparişiniz (#${order.order_number}) kargoya verilmiştir! 🎉\n\n`;
      message += `📦 Kargo Firması: ${shippingCarrier}\n`;
      message += `🔢 Takip Numarası: ${trackingNumber}\n`;

      if (trackingUrl) {
        message += `🔗 Takip Linki: ${trackingUrl}\n`;
      }

      if (estimatedDeliveryDate) {
        const deliveryDate = new Date(estimatedDeliveryDate).toLocaleDateString('tr-TR');
        message += `📅 Tahmini Teslim Tarihi: ${deliveryDate}\n`;
      }

      message += `\nSipariş Detayları:\n${orderItems.map(item => `- ${item.item_name} x${item.quantity}`).join('\n')}`;
      message += `\n\nİyi günler dileriz! 🌟`;

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      alert('WhatsApp kargo takip bilgileri açıldı. Lütfen müşteriye mesajı gönderin.');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('WhatsApp gönderilirken hata oluştu');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const sendWhatsAppPaymentLink = async (order: OrderWithUser) => {
    try {
      setSendingWhatsApp(true);

      let phone = '';
      let customerName = '';

      if (order.is_guest_order) {
        phone = order.guest_phone || '';
        customerName = order.shipping_address?.full_name || 'Müşteri';
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, full_name')
          .eq('id', order.user_id)
          .maybeSingle();

        phone = profile?.phone_number || '';
        customerName = profile?.full_name || 'Müşteri';
      }

      if (!phone) {
        alert('Müşteri telefon numarası bulunamadı');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;

      const message = `Merhaba ${customerName},\n\nRef Atölye siparişiniz (#${order.order_number}) alınmıştır.\n\nSipariş Detayları:\n${orderItems.map(item => `- ${item.item_name} x${item.quantity}: ${item.total_price.toFixed(2)} ₺`).join('\n')}\n\nToplam Tutar: ${order.total_amount.toFixed(2)} ₺\n\nÖdeme işlemini tamamlamak için lütfen bizimle iletişime geçin.\n\nTeşekkür ederiz!`;

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      alert('WhatsApp ödeme linki açıldı. Lütfen müşteriye mesajı gönderin.');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('WhatsApp gönderilirken hata oluştu');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Sipariş Yönetimi</h3>
          <p className="text-gray-600 mt-1">Tüm siparişleri görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-5 h-5" />
          <span className="font-semibold">{filteredOrders.length} sipariş</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Sipariş numarası veya müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Tüm Durumlar</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sipariş bulunamadı</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-800 text-lg">{order.order_number}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Müşteri:</span> {order.user_name}</p>
                    <p><span className="font-medium">E-posta:</span> {order.user_email}</p>
                    <p><span className="font-medium">Tarih:</span> {new Date(order.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{order.total_amount.toFixed(2)} ₺</div>
                    <div className="text-sm text-gray-500">
                      Ara Toplam: {order.subtotal.toFixed(2)} ₺
                    </div>
                    {order.shipping_cost > 0 && (
                      <div className="text-sm text-gray-500">
                        Kargo: {order.shipping_cost.toFixed(2)} ₺
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadOrderDetails(order)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Detaylar
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      title="Siparişi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedOrder.order_number}</h3>
                  <p className="text-gray-600 mt-1">{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Update and WhatsApp */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sipariş Durumu</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => sendWhatsAppPaymentLink(selectedOrder)}
                  disabled={sendingWhatsApp}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingWhatsApp ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>WhatsApp ile Ödeme Linki Gönder</span>
                    </>
                  )}
                </button>
              </div>

              {/* Shipping Tracking Information */}
              {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' || selectedOrder.tracking_number ? (
                <div className="mb-6 border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Kargo Takip Bilgileri</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Firması</label>
                      <select
                        value={shippingCarrier}
                        onChange={(e) => setShippingCarrier(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seçiniz</option>
                        <option value="Aras Kargo">Aras Kargo</option>
                        <option value="MNG Kargo">MNG Kargo</option>
                        <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                        <option value="PTT Kargo">PTT Kargo</option>
                        <option value="Sürat Kargo">Sürat Kargo</option>
                        <option value="UPS">UPS</option>
                        <option value="DHL">DHL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Takip Numarası</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Kargo takip numarasını girin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Takip Linki (Opsiyonel)</label>
                      <input
                        type="url"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Teslim Tarihi (Opsiyonel)</label>
                      <input
                        type="date"
                        value={estimatedDeliveryDate}
                        onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={updateShippingInfo}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Kargo Bilgilerini Kaydet
                      </button>

                      <button
                        onClick={() => sendWhatsAppShippingInfo(selectedOrder)}
                        disabled={sendingWhatsApp || !trackingNumber || !shippingCarrier}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {sendingWhatsApp ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Gönderiliyor...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp Gönder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedOrder.shipped_at && (
                    <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Kargoya verilme: {new Date(selectedOrder.shipped_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Müşteri Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedOrder.is_guest_order && (
                    <p className="text-sm text-amber-600 font-medium mb-2">Misafir Sipariş</p>
                  )}
                  <p><span className="font-medium">Ad:</span> {selectedOrder.user_name}</p>
                  <p><span className="font-medium">E-posta:</span> {selectedOrder.user_email}</p>
                  {selectedOrder.is_guest_order && selectedOrder.guest_phone && (
                    <p><span className="font-medium">Telefon:</span> {selectedOrder.guest_phone}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Sipariş Kalemleri</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{item.item_name}</p>
                        <p className="text-sm text-gray-600">Miktar: {item.quantity} × {item.unit_price.toFixed(2)} ₺</p>
                      </div>
                      <span className="font-semibold text-gray-800">{item.total_price.toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Teslimat Adresi</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.shipping_address.full_name}</p>
                    <p>{selectedOrder.shipping_address.address}</p>
                    <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.postal_code}</p>
                    <p>{selectedOrder.shipping_address.phone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Fatura Adresi</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.billing_address.full_name}</p>
                    <p>{selectedOrder.billing_address.address}</p>
                    <p>{selectedOrder.billing_address.city} - {selectedOrder.billing_address.postal_code}</p>
                    <p>{selectedOrder.billing_address.phone}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {payment && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Ödeme Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Ödeme Yöntemi:</span> {payment.payment_method === 'credit_card' ? 'Kredi Kartı' : payment.payment_method === 'bank_transfer' ? 'Banka Havalesi' : 'Kapıda Ödeme'}</p>
                    <p><span className="font-medium">Durum:</span> {payment.payment_status === 'completed' ? 'Tamamlandı' : payment.payment_status === 'pending' ? 'Beklemede' : payment.payment_status}</p>
                    <p><span className="font-medium">Tutar:</span> {payment.amount.toFixed(2)} ₺</p>
                    {payment.payment_date && (
                      <p><span className="font-medium">Ödeme Tarihi:</span> {new Date(payment.payment_date).toLocaleString('tr-TR')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Sipariş Notları</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} ₺</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim</span>
                      <span>-{selectedOrder.discount_amount.toFixed(2)} ₺</span>
                    </div>
                  )}
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Kargo</span>
                      <span>{selectedOrder.shipping_cost.toFixed(2)} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-800 text-lg pt-2 border-t">
                    <span>Toplam</span>
                    <span>{selectedOrder.total_amount.toFixed(2)} ₺</span>
                  </div>
                </div>
              </div>

              {/* Delete Order Button */}
              <div className="border-t mt-6 pt-4">
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Siparişi Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
