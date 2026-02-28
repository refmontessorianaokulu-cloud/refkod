import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface PlayGroupSession {
  id: string;
  session_date: string;
  session_time: string;
  theme: string;
  capacity: number;
  booked_count: number;
  media_urls: string[];
}

interface BookingFormData {
  parent_name: string;
  phone_number: string;
  child_name: string;
  child_birth_date: string;
}

export default function PlayGroupCalendar() {
  const auth = useAuth();
  const profile = auth?.profile || null;
  const [sessions, setSessions] = useState<PlayGroupSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PlayGroupSession | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [formData, setFormData] = useState<BookingFormData>({
    parent_name: '',
    phone_number: '',
    child_name: '',
    child_birth_date: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('play_group_sessions')
        .select('*')
        .gte('session_date', today)
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

  const handleBookingClick = (session: PlayGroupSession) => {
    if (session.booked_count >= session.capacity) {
      alert('Bu oturum için kontenjan dolmuştur');
      return;
    }
    setSelectedSession(session);
    setShowBookingForm(true);
    setBookingSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) return;

    if (!formData.parent_name || !formData.phone_number || !formData.child_name || !formData.child_birth_date) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.rpc('create_play_group_booking', {
        p_session_id: selectedSession.id,
        p_parent_name: formData.parent_name.trim(),
        p_phone_number: formData.phone_number.trim(),
        p_child_name: formData.child_name.trim(),
        p_child_birth_date: formData.child_birth_date,
        p_user_id: profile?.id || null
      });

      if (error) {
        console.error('Booking RPC error:', error);
        throw new Error('Rezervasyon oluşturulamadı');
      }

      if (!data.success) {
        throw new Error(data.error || 'Rezervasyon oluşturulamadı');
      }

      console.log('Booking created successfully:', {
        bookingId: data.booking_id,
        hasProfile: !!profile
      });

      setBookingSuccess(true);
      setFormData({
        parent_name: '',
        phone_number: '',
        child_name: '',
        child_birth_date: '',
      });
      loadSessions();

    } catch (error: any) {
      console.error('Error creating booking:', error);
      const errorMessage = error?.message || 'Rezervasyon oluşturulurken hata oluştu';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getMonthYear = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    });
  };

  const groupedSessions = sessions.reduce((acc, session) => {
    const monthYear = getMonthYear(session.session_date);
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(session);
    return acc;
  }, {} as { [key: string]: PlayGroupSession[] });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-900 mb-3 text-lg">Oyun Grubu Rezervasyonu</h4>
            <div className="space-y-3 text-sm text-emerald-800">
              <p className="leading-relaxed">
                Oyun gruplarımız deneyimli öğretmenlerimiz tarafından gerçekleşmektedir.
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Günlük Kontenjan maksimum 10 kişidir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Oyun Grubu 1 saat sürmektedir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Oyun Grubu ebeveynli bir şekilde gerçekleştirilmektedir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Etkinliklerimiz çocuklarımızın yaş ve gelişim özelliklerine göre özenle hazırlanmaktadır.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Oyun grubumuz 24-48 ay öğrencilerimiz için tasarlanmıştır.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Her hafta yeni etkinlikler ve temalar belirlenmektedir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Oyun Grubu rutin olarak tanışma halkası ile başlayıp atıştırmalık vakti ile sonlanmaktadır.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Seanslık ücretimiz 500₺'dir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💫</span>
                  <span>Ücret İban üzerinden peşin olarak alınmaktadır.</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="font-semibold text-emerald-900 mb-2">Oyun Grupları Akışı:</p>
                <ul className="space-y-1.5 pl-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Çember saati</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Duyusal Çalışma</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>İnce motor becerileri ile ilgili çalışma</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Sanat çalışması</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Ritim çalışması</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Çocuklar için ikram</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Bitiş dansı</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedSessions).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Şu anda rezervasyon yapılabilecek oyun grubu oturumu bulunmamaktadır
        </div>
      ) : (
        Object.entries(groupedSessions).map(([monthYear, sessions]) => (
          <div key={monthYear} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              {monthYear}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => {
                const isAvailable = session.booked_count < session.capacity;
                const spotsLeft = session.capacity - session.booked_count;

                return (
                  <div
                    key={session.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isAvailable
                        ? 'border-gray-200 bg-white hover:shadow-md cursor-pointer'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                    onClick={() => isAvailable && handleBookingClick(session)}
                  >
                    {session.media_urls && session.media_urls.length > 0 && (
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={session.media_urls[0]}
                          alt={session.theme}
                          className="w-full h-full object-cover"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                              DOLU
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{formatDate(session.session_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(session.session_time)}</span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">{session.theme}</h4>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className={`font-medium ${!isAvailable ? 'text-red-600' : 'text-gray-700'}`}>
                            {isAvailable ? `${spotsLeft} yer kaldı` : 'Kontenjan Dolu'}
                          </span>
                        </div>
                        {!isAvailable && !session.media_urls?.length && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            DOLU
                          </span>
                        )}
                      </div>

                      {isAvailable && (
                        <button
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          Rezervasyon Yap
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showBookingForm && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Rezervasyon Oluşturuldu!</h3>
                <p className="text-center text-gray-600 mb-6">
                  Rezervasyonunuz başarıyla alındı. Yönetici en kısa sürede sizinle iletişime geçecek ve ödeme bilgilerini paylaşacaktır.
                </p>

                <button
                  onClick={() => {
                    setShowBookingForm(false);
                    setBookingSuccess(false);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Rezervasyon Formu</h3>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700"><strong>{selectedSession.theme}</strong></p>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedSession.session_date)} - {formatTime(selectedSession.session_time)}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anne Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon Numarası *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="05XX XXX XX XX"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çocuk Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      value={formData.child_name}
                      onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çocuk Doğum Tarihi *
                    </label>
                    <input
                      type="date"
                      value={formData.child_birth_date}
                      onChange={(e) => setFormData({ ...formData, child_birth_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Gönderiliyor...' : 'Rezervasyon Yap'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
