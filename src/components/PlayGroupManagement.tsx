import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, Plus, Edit2, Trash2, X, ExternalLink, Upload, Image as ImageIcon } from 'lucide-react';

interface PlayGroupSession {
  id: string;
  session_date: string;
  session_time: string;
  theme: string;
  capacity: number;
  booked_count: number;
  media_urls: string[];
  created_at: string;
}

interface PlayGroupBooking {
  id: string;
  session_id: string;
  parent_name: string;
  phone_number: string;
  child_name: string;
  child_birth_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'paid';
  payment_link: string | null;
  created_at: string;
}

export default function PlayGroupManagement() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<PlayGroupSession[]>([]);
  const [bookings, setBookings] = useState<PlayGroupBooking[]>([]);
  const [selectedSession, setSelectedSession] = useState<PlayGroupSession | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<PlayGroupSession | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [formData, setFormData] = useState({
    session_date: '',
    session_time: '',
    theme: '',
    capacity: 10,
    media_urls: [] as string[],
  });

  const [paymentLinkData, setPaymentLinkData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('play_group_sessions')
        .select('*')
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      alert('Oturumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('play_group_bookings')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Rezervasyonlar yüklenirken hata oluştu');
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingMedia(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('play_group_media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('play_group_media')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData({
        ...formData,
        media_urls: [...formData.media_urls, ...uploadedUrls],
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Görsel yüklenirken hata oluştu');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setFormData({
      ...formData,
      media_urls: formData.media_urls.filter(url => url !== urlToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.session_date || !formData.session_time || !formData.theme || formData.capacity <= 0) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const sessionData = {
        session_date: formData.session_date,
        session_time: formData.session_time,
        theme: formData.theme,
        capacity: formData.capacity,
        media_urls: formData.media_urls,
      };

      if (editingSession) {
        const { error } = await supabase
          .from('play_group_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);

        if (error) throw error;
        alert('Oturum başarıyla güncellendi');
      } else {
        const { error } = await supabase
          .from('play_group_sessions')
          .insert({
            ...sessionData,
            created_by: profile?.id,
          });

        if (error) throw error;
        alert('Oturum başarıyla oluşturuldu');
      }

      setFormData({ session_date: '', session_time: '', theme: '', capacity: 10, media_urls: [] });
      setEditingSession(null);
      setShowSessionForm(false);
      loadSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Oturum kaydedilirken hata oluştu');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bu oturumu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('play_group_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      alert('Oturum başarıyla silindi');
      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Oturum silinirken hata oluştu');
    }
  };

  const handleEditSession = (session: PlayGroupSession) => {
    setEditingSession(session);
    setFormData({
      session_date: session.session_date,
      session_time: session.session_time,
      theme: session.theme,
      capacity: session.capacity,
      media_urls: session.media_urls || [],
    });
    setShowSessionForm(true);
  };

  const handleViewBookings = (session: PlayGroupSession) => {
    setSelectedSession(session);
    loadBookings(session.id);
    setShowBookingsModal(true);
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('play_group_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      alert('Rezervasyon durumu güncellendi');
      if (selectedSession) {
        loadBookings(selectedSession.id);
      }
      loadSessions();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Rezervasyon durumu güncellenirken hata oluştu');
    }
  };

  const handleAddPaymentLink = async (bookingId: string) => {
    const link = paymentLinkData[bookingId];
    if (!link) {
      alert('Lütfen ödeme linkini girin');
      return;
    }

    try {
      const { error } = await supabase
        .from('play_group_bookings')
        .update({ payment_link: link, status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;
      alert('Ödeme linki eklendi ve rezervasyon onaylandı. WhatsApp bildirimi gönderiliyor...');
      setPaymentLinkData({ ...paymentLinkData, [bookingId]: '' });
      if (selectedSession) {
        loadBookings(selectedSession.id);
      }
    } catch (error) {
      console.error('Error adding payment link:', error);
      alert('Ödeme linki eklenirken hata oluştu');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'paid': return 'Ödendi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Oyun Grubu Takvimi Yönetimi</h3>
        <button
          onClick={() => {
            setEditingSession(null);
            setFormData({ session_date: '', session_time: '', theme: '', capacity: 10, media_urls: [] });
            setShowSessionForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Oturum</span>
        </button>
      </div>

      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingSession ? 'Oturum Düzenle' : 'Yeni Oturum Oluştur'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saat
                  </label>
                  <input
                    type="time"
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Yaratıcı Sanat Etkinliği"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontenjan
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görseller
                </label>
                <div className="space-y-3">
                  {formData.media_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.media_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Session media ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(url)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      disabled={uploadingMedia}
                    />
                    <div className="flex items-center space-x-2 text-gray-600">
                      {uploadingMedia ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Görsel Yükle</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={uploadingMedia}
                >
                  {editingSession ? 'Güncelle' : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionForm(false);
                    setEditingSession(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={uploadingMedia}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {session.media_urls && session.media_urls.length > 0 && (
              <div className="relative h-40 bg-gray-100">
                <img
                  src={session.media_urls[0]}
                  alt={session.theme}
                  className="w-full h-full object-cover"
                />
                {session.media_urls.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                    <ImageIcon className="w-3 h-3" />
                    <span>{session.media_urls.length}</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(session.session_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(session.session_time)}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditSession(session)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 mb-3">{session.theme}</h4>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className={`font-medium ${session.booked_count >= session.capacity ? 'text-red-600' : 'text-gray-700'}`}>
                    {session.booked_count} / {session.capacity}
                  </span>
                </div>
                {session.booked_count >= session.capacity && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    DOLU
                  </span>
                )}
              </div>

              <button
                onClick={() => handleViewBookings(session)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Rezervasyonları Gör ({session.booked_count})
              </button>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Henüz oturum oluşturulmamış
        </div>
      )}

      {showBookingsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedSession.theme}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedSession.session_date)} - {formatTime(selectedSession.session_time)}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Bu oturum için henüz rezervasyon yok
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-800">{booking.parent_name}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Telefon: {booking.phone_number}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700"><strong>Çocuk:</strong> {booking.child_name}</p>
                        <p className="text-sm text-gray-700">
                          <strong>Doğum Tarihi:</strong> {formatDate(booking.child_birth_date)}
                        </p>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="url"
                              placeholder="Ödeme linki girin"
                              value={paymentLinkData[booking.id] || ''}
                              onChange={(e) => setPaymentLinkData({ ...paymentLinkData, [booking.id]: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                              onClick={() => handleAddPaymentLink(booking.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Onayla
                            </button>
                          </div>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                          >
                            İptal Et
                          </button>
                        </div>
                      )}

                      {booking.payment_link && (
                        <div className="mt-3">
                          <a
                            href={booking.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Ödeme Linkini Aç</span>
                          </a>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'paid')}
                          className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Ödendi Olarak İşaretle
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
