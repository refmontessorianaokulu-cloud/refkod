import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle, Globe, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const APPOINTMENT_SUBJECTS = [
  { value: 'early_registration', label: 'Erken Kayıt Görüşmesi' },
  { value: 'kindergarten_info', label: 'Anaokulu Hakkında Bilgi' },
  { value: 'kindergarten_tour', label: 'Anaokulu Gezisi' },
  { value: 'playgroup_info', label: 'Oyun Grubu Hakkında Bilgi' },
  { value: 'playgroup_trial', label: 'Oyun Grubu Deneme Dersi' },
  { value: 'other', label: 'Diğer' }
];

const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

interface TimeSlot {
  id: string;
  start_time: string;
  isBooked?: boolean;
}

export default function AppointmentBooking() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [approvedBookings, setApprovedBookings] = useState<Array<{ date: string; time: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    guest_name: profile?.full_name || '',
    guest_email: user?.email || '',
    guest_phone: '',
    child_name: '',
    child_birth_date: '',
    appointment_subject: 'early_registration',
    notes: ''
  });

  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, 1 - (firstDayOfWeek - i));
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, isCurrentMonth: false });
      }
    }

    return days;
  };

  const monthDays = getMonthDays(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  useEffect(() => {
    loadBookedDates();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadBookedDates = async () => {
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const formatDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const firstDayStr = formatDateStr(firstDay);
      const lastDayStr = formatDateStr(lastDay);

      const { data: bookings } = await supabase
        .from('appointment_bookings')
        .select('appointment_date, slot_id, guest_name')
        .gte('appointment_date', firstDayStr)
        .lte('appointment_date', lastDayStr)
        .in('status', ['pending', 'approved']);

      const { data: slots } = await supabase
        .from('appointment_slots')
        .select('id, day_of_week, start_time');

      const slotsByDay: Record<number, string[]> = {};
      const slotTimeById: Record<string, string> = {};
      slots?.forEach(slot => {
        if (!slotsByDay[slot.day_of_week]) {
          slotsByDay[slot.day_of_week] = [];
        }
        slotsByDay[slot.day_of_week].push(slot.id);
        slotTimeById[slot.id] = slot.start_time;
      });

      const bookingsByDate: Record<string, Set<string>> = {};
      const approvedBookingsList: Array<{ date: string; time: string; name: string }> = [];

      bookings?.forEach(booking => {
        if (!bookingsByDate[booking.appointment_date]) {
          bookingsByDate[booking.appointment_date] = new Set();
        }
        bookingsByDate[booking.appointment_date].add(booking.slot_id);

        if (booking.guest_name) {
          approvedBookingsList.push({
            date: booking.appointment_date,
            time: slotTimeById[booking.slot_id]?.substring(0, 5) || '',
            name: booking.guest_name
          });
        }
      });

      setApprovedBookings(approvedBookingsList);

      const fullyBookedDates = new Set<string>();
      Object.entries(bookingsByDate).forEach(([date, bookedSlots]) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
        const totalSlots = slotsByDay[dayOfWeek]?.length || 0;

        if (totalSlots > 0 && bookedSlots.size >= totalSlots) {
          fullyBookedDates.add(date);
        }
      });

      setBookedDates(fullyBookedDates);
    } catch (err) {
      console.error('Error loading booked dates:', err);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const date = new Date(selectedDate!);
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;

      console.log('=== RANDEVU SAAT YÜKLEME DEBUG ===');
      console.log('Seçilen Tarih:', selectedDate);
      console.log('Gün (0=Pzt, 6=Paz):', dayOfWeek);

      const { data, error: err } = await supabase
        .from('appointment_slots')
        .select('id, start_time')
        .eq('day_of_week', dayOfWeek)
        .order('start_time', { ascending: true });

      if (err) throw err;

      console.log('Tüm Slotlar:', data);

      const { data: bookings } = await supabase
        .from('appointment_bookings')
        .select('slot_id')
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'approved']);

      console.log('Dolu Randevular:', bookings);

      const bookedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);
      console.log('Dolu Slot ID\'leri:', Array.from(bookedSlotIds));

      const allSlots = (data || []).map(slot => ({
        ...slot,
        isBooked: bookedSlotIds.has(slot.id)
      }));

      console.log('İşlenmiş Slotlar:', allSlots);

      setTimeSlots(allSlots);
      setSelectedTime(null);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Lütfen tarih ve saat seçiniz');
      return;
    }

    if (!formData.guest_name || !formData.guest_phone || !formData.child_name || !formData.child_birth_date) {
      setError('Lütfen tüm zorunlu alanları doldurunuz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase.from('appointment_bookings').insert({
        slot_id: selectedTime,
        appointment_date: selectedDate,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        child_name: formData.child_name,
        child_birth_date: formData.child_birth_date,
        appointment_subject: formData.appointment_subject,
        notes: formData.notes,
        created_by: user?.id || null,
        is_guest: !user,
        status: 'pending'
      });

      if (err) throw err;

      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const nextDays = getNextDays(60);

  if (submitted) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Başarılı!</h2>
        <p className="text-gray-600">Randevu talebiniz alınmıştır. Yönetici tarafından onaylandıktan sonra bilgilendirileceksiniz.</p>
      </div>
    );
  }

  const today = new Date();
  const displayMonth = currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Karşılama Başlığı */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌍</span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Ref Montessori School
            </h2>
            <span className="text-2xl">🇹🇷</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Lütfen Randevu İçin Tarih Seçiniz
            </h2>

            {/* Ay Başlığı ve Navigasyon */}
            <div className="flex items-center justify-between mb-6 px-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gradient-to-br hover:from-green-100 hover:to-lime-100 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent capitalize">
                {displayMonth}
              </h3>

              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gradient-to-br hover:from-green-100 hover:to-lime-100 rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Hafta Günleri */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Takvim Günleri */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map(({ date, isCurrentMonth }, index) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = selectedDate === dateStr;
                const isPast = date < today && date.toDateString() !== today.toDateString();
                const isToday = date.toDateString() === today.toDateString();
                const isFullyBooked = bookedDates.has(dateStr);
                const hasAppointments = approvedBookings.filter(b => b.date === dateStr).length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isPast && isCurrentMonth && !isFullyBooked) {
                        setSelectedDate(dateStr);
                        setStep(2);
                      }
                    }}
                    disabled={isPast || !isCurrentMonth || isFullyBooked}
                    className={`aspect-square p-2 rounded-xl transition-all text-center font-semibold relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-green-500 to-lime-500 text-white shadow-md scale-105'
                        : isPast || !isCurrentMonth || isFullyBooked
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isToday
                        ? 'bg-gradient-to-br from-green-100 to-lime-100 text-green-900 border-2 border-green-400 hover:from-green-200 hover:to-lime-200'
                        : 'bg-gradient-to-br from-green-50 to-lime-50 text-gray-800 hover:from-green-100 hover:to-lime-100 hover:shadow-md'
                    }`}
                  >
                    <div className={`text-sm ${isCurrentMonth && !isPast && !isFullyBooked ? '' : 'opacity-40'}`}>
                      {date.getDate()}
                    </div>
                    {hasAppointments && isCurrentMonth && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {approvedBookings.filter(b => b.date === dateStr).slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-green-500 rounded-full"></div>
                        ))}
                      </div>
                    )}
                    {isFullyBooked && isCurrentMonth && !isPast && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Randevu Listesi */}
            {approvedBookings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Bu Ay İçindeki Randevular
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {approvedBookings
                    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                    .map((booking, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-green-600 font-semibold">
                            {new Date(booking.date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="text-gray-600">{booking.time}</div>
                        </div>
                        <div className="text-gray-700 font-medium truncate max-w-[150px]">
                          {booking.name}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
            <button
              onClick={() => setStep(1)}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Tarih Değiştir
            </button>
            <div className="text-sm text-gray-600">
              {selectedDate && new Date(selectedDate).toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Lütfen Randevu Saati Seçiniz
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => !slot.isBooked && setSelectedTime(slot.id)}
                disabled={slot.isBooked}
                className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                  slot.isBooked
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : selectedTime === slot.id
                    ? 'bg-gradient-to-br from-green-500 to-lime-500 text-white shadow-md'
                    : 'bg-gradient-to-br from-green-50 to-lime-50 text-gray-700 hover:from-green-100 hover:to-lime-100 hover:shadow'
                }`}
              >
                {slot.start_time.substring(0, 5)}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            İletişim Bilgileriniz
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adınız Soyadınız *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresiniz
              </label>
              <input
                type="email"
                value={formData.guest_email}
                onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çocuğunuzun Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.child_name}
                  onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Çocuğunuzun Adı Soyadı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çocuğunuzun Doğum Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.child_birth_date}
                  onChange={(e) => setFormData({ ...formData, child_birth_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Randevu Konusu *
              </label>
              <select
                required
                value={formData.appointment_subject}
                onChange={(e) => setFormData({ ...formData, appointment_subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {APPOINTMENT_SUBJECTS.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlarınız
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Eklemek istediğiniz notlar..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-lime-500 text-white rounded-lg hover:from-green-600 hover:to-lime-600 disabled:opacity-50 font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Gönderiliyor...' : 'Randevu Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}
