import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadTimeSlots = async () => {
    try {
      const date = new Date(selectedDate!);
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;

      const { data, error: err } = await supabase
        .from('appointment_slots')
        .select('id, start_time')
        .eq('day_of_week', dayOfWeek)
        .order('start_time', { ascending: true });

      if (err) throw err;

      const { data: bookings } = await supabase
        .from('appointment_bookings')
        .select('slot_id')
        .eq('appointment_date', selectedDate);

      const bookedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);
      const available = (data || []).filter(slot => !bookedSlotIds.has(slot.id));

      setTimeSlots(available);
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

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {step === 1 ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">1. Tarih Seçiniz</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {nextDays.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayName = DAYS_OF_WEEK[date.getDay()];
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setStep(2);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600">{dayName}</div>
                  <div className="text-lg font-bold text-gray-900">{date.getDate()}</div>
                  <div className="text-xs text-gray-500">
                    {date.toLocaleString('tr-TR', { month: 'short' })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-6 pb-4 border-b">
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

          <h2 className="text-xl font-semibold text-gray-900 mb-6">2. Saat Seçiniz</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedTime(slot.id)}
                className={`p-2 rounded border-2 text-sm font-semibold transition-all ${
                  selectedTime === slot.id
                    ? 'border-green-600 bg-green-100 text-green-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                {slot.start_time.substring(0, 5)}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">3. Bilgileri Doldurunuz</h2>
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
                  Doğum Tarihi *
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-semibold transition-all"
              >
                {loading ? 'Gönderiliyor...' : 'Randevu Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
