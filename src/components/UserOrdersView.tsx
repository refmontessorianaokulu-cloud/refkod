import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Truck,
  CheckCircle,
  X,
  Eye,
  Search,
  XCircle,
  ExternalLink,
  Star,
  MessageSquare,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: any;
  billing_address: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  course_id?: string;
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

interface ShippingInfo {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number?: string;
  shipping_date?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
}

interface Review {
  product_id?: string;
  course_id?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Onaylandı', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
];

const CARRIER_TRACKING_URLS: { [key: string]: string } = {
  'Aras Kargo': 'https://www.araskargo.com.tr/takip/',
  'Yurtiçi Kargo': 'https://www.yurticikargo.com/tr/tracking/',
  'MNG Kargo': 'https://www.mngkargo.com.tr/tracking/',
  'PTT Kargo': 'https://gonderitakip.ptt.gov.tr/',
  'Sürat Kargo': 'https://www.suratkargo.com.tr/kargo-takip/',
};

export default function UserOrdersView() {
  const auth = useAuth();
  const user = auth?.user;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<OrderItem | null>(null);
  const [reviewData, setReviewData] = useState<Review>({
    rating: 5,
    title: '',
    comment: '',
    images: [],
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Siparişler yüklenirken hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order: Order) => {
    try {
      const [itemsRes, paymentRes, shippingRes] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', order.id),
        supabase.from('payments').select('*').eq('order_id', order.id).maybeSingle(),
        supabase.from('shipping_info').select('*').eq('order_id', order.id).maybeSingle(),
      ]);

      if (itemsRes.data) setOrderItems(itemsRes.data);
      if (paymentRes.data) setPayment(paymentRes.data);
      if (shippingRes.data) setShippingInfo(shippingRes.data);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Sipariş detayları yüklenirken hata oluştu: ' + (error as Error).message);
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setCancelling(true);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          notes: selectedOrder.notes
            ? `${selectedOrder.notes}\n\n[İptal Nedeni: ${cancelReason || 'Belirtilmedi'}]`
            : `[İptal Nedeni: ${cancelReason || 'Belirtilmedi'}]`
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      for (const item of orderItems) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .maybeSingle();

          if (variant) {
            await supabase
              .from('product_variants')
              .update({
                stock_quantity: variant.stock_quantity + item.quantity
              })
              .eq('id', item.variant_id);

            await supabase
              .from('stock_movements')
              .insert({
                variant_id: item.variant_id,
                movement_type: 'in',
                quantity: item.quantity,
                notes: `Sipariş iptali - ${selectedOrder.order_number}`,
                created_by: user!.id,
              });
          }
        }

        if (item.course_id) {
          await supabase
            .from('user_course_enrollments')
            .delete()
            .eq('user_id', user!.id)
            .eq('course_id', item.course_id)
            .eq('order_id', selectedOrder.id);
        }
      }

      alert('Siparişiniz başarıyla iptal edildi.');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Sipariş iptal edilirken hata oluştu: ' + (error as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const openReviewModal = (item: OrderItem) => {
    setSelectedItemForReview(item);
    setReviewData({
      product_id: item.product_id,
      course_id: item.course_id,
      rating: 5,
      title: '',
      comment: '',
      images: [],
    });
    setShowReviewModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if ((reviewData.images?.length || 0) + files.length > 5) {
      alert('En fazla 5 görsel yükleyebilirsiniz.');
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert('Sadece görsel dosyaları yükleyebilirsiniz.');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert('Görsel boyutu en fazla 5MB olabilir.');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('review-media')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('review-media')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      setReviewData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Görseller yüklenirken hata oluştu: ' + (error as Error).message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setReviewData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReview || !user || !selectedOrder) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: selectedItemForReview.product_id || null,
          user_id: user.id,
          order_id: selectedOrder.id,
          rating: reviewData.rating,
          title: reviewData.title || null,
          comment: reviewData.comment,
          images: reviewData.images || [],
          is_verified_purchase: true,
          is_approved: true,
        });

      if (error) throw error;

      alert('Değerlendirmeniz başarıyla gönderildi!');
      setShowReviewModal(false);
      setSelectedItemForReview(null);
      setReviewData({ rating: 5, title: '', comment: '', images: [] });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Değerlendirme gönderilirken hata oluştu: ' + (error as Error).message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const baseUrl = CARRIER_TRACKING_URLS[carrier];
    if (baseUrl) {
      return baseUrl + trackingNumber;
    }
    return null;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Siparişleri görüntülemek için giriş yapmalısınız</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Siparişlerim</h3>
          <p className="text-gray-600 mt-1">Sipariş geçmişinizi görüntüleyin</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-5 h-5" />
          <span className="font-semibold">{filteredOrders.length} sipariş</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Sipariş numarası ara..."
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

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz siparişiniz bulunmuyor</p>
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Sipariş Tarihi:</span> {new Date(order.created_at).toLocaleString('tr-TR')}</p>
                    <p><span className="font-medium">Toplam:</span> <span className="text-emerald-600 font-semibold">{order.total_amount.toFixed(2)} ₺</span></p>
                  </div>
                </div>
                <button
                  onClick={() => loadOrderDetails(order)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Detaylar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedOrder.order_number}</h3>
                  <p className="text-gray-600 mt-1">{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {canCancelOrder(selectedOrder.status) && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Siparişi İptal Et
                  </button>
                </div>
              )}

              {shippingInfo && shippingInfo.tracking_number && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Kargo Bilgileri
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Kargo Firması:</span> {shippingInfo.carrier}</p>
                    <p><span className="font-medium">Takip Numarası:</span> {shippingInfo.tracking_number}</p>
                    {shippingInfo.shipping_date && (
                      <p><span className="font-medium">Kargo Tarihi:</span> {new Date(shippingInfo.shipping_date).toLocaleDateString('tr-TR')}</p>
                    )}
                    {shippingInfo.estimated_delivery && (
                      <p><span className="font-medium">Tahmini Teslimat:</span> {new Date(shippingInfo.estimated_delivery).toLocaleDateString('tr-TR')}</p>
                    )}
                    {shippingInfo.actual_delivery && (
                      <p><span className="font-medium">Teslimat Tarihi:</span> {new Date(shippingInfo.actual_delivery).toLocaleDateString('tr-TR')}</p>
                    )}
                    {getTrackingUrl(shippingInfo.carrier, shippingInfo.tracking_number) && (
                      <a
                        href={getTrackingUrl(shippingInfo.carrier, shippingInfo.tracking_number)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Kargo Takip Sayfasını Aç
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Sipariş Kalemleri</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.item_name}</p>
                          <p className="text-sm text-gray-600">Miktar: {item.quantity} × {item.unit_price.toFixed(2)} ₺</p>
                        </div>
                        <span className="font-semibold text-gray-800">{item.total_price.toFixed(2)} ₺</span>
                      </div>
                      {selectedOrder.status === 'delivered' && (
                        <button
                          onClick={() => openReviewModal(item)}
                          className="mt-2 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Değerlendir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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

              {payment && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Ödeme Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Ödeme Yöntemi:</span> {
                      payment.payment_method === 'credit_card' ? 'Kredi Kartı' :
                      payment.payment_method === 'bank_transfer' ? 'Banka Havalesi' :
                      'Kapıda Ödeme'
                    }</p>
                    <p><span className="font-medium">Durum:</span> {
                      payment.payment_status === 'completed' ? 'Tamamlandı' :
                      payment.payment_status === 'pending' ? 'Beklemede' :
                      payment.payment_status === 'failed' ? 'Başarısız' :
                      payment.payment_status === 'refunded' ? 'İade Edildi' :
                      payment.payment_status
                    }</p>
                    <p><span className="font-medium">Tutar:</span> {payment.amount.toFixed(2)} ₺</p>
                    {payment.payment_date && (
                      <p><span className="font-medium">Ödeme Tarihi:</span> {new Date(payment.payment_date).toLocaleString('tr-TR')}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Sipariş Notları</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

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
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Siparişi İptal Et</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedOrder.order_number}</strong> numaralı siparişi iptal etmek istediğinizden emin misiniz?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İptal Nedeni (İsteğe Bağlı)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Neden iptal etmek istiyorsunuz?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'İptal Ediliyor...' : 'İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedItemForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ürünü Değerlendir</h3>
            <p className="text-gray-600 mb-4 font-medium">{selectedItemForReview.item_name}</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puanınız *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= reviewData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                  placeholder="Örn: Harika bir ürün!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yorumunuz *
                </label>
                <textarea
                  required
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görseller (İsteğe Bağlı - En fazla 5)
                </label>

                {reviewData.images && reviewData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {reviewData.images.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Review ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(!reviewData.images || reviewData.images.length < 5) && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      {uploadingImages ? (
                        <div className="text-sm text-gray-500">Yükleniyor...</div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-500">Görsel Ekle</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
