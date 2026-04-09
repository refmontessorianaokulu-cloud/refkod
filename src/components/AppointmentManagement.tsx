import { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, MessageSquare, MessageCircle, Send, Clock, Plus, Search, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Appointment {
  id: string;
  slot_id: string;
  appointment_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  child_name: string;
  child_birth_date: string;
  appointment_subject: string;
  notes: string;
  status: 'pending' | 'approved' | 'postponed' | 'cancelled';
  admin_notes: string;
  created_at: string;
}

interface TimeSlot {
  start_time: string;
}

interface UserSuggestion {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  children?: { name: string; birth_date?: string }[];
}

const EMPTY_MANUAL_FORM = {
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  child_name: '',
  child_birth_date: '',
  appointment_subject: 'early_registration',
  notes: '',
  status: 'approved' as const,
  admin_notes: '',
  appointment_date: '',
  slot_id: '',
};

const SUBJECT_LABELS: Record<string, string> = {
  early_registration: 'Erken Kayıt Görüşmesi',
  kindergarten_info: 'Anaokulu Hakkında Bilgi',
  kindergarten_tour: 'Anaokulu Gezisi',
  playgroup_info: 'Oyun Grubu Hakkında Bilgi',
  playgroup_trial: 'Oyun Grubu Deneme Dersi',
  other: 'Diğer'
};

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slotTimes, setSlotTimes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'postponed' | 'cancelled'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ ...EMPTY_MANUAL_FORM });
  const [manualSlots, setManualSlots] = useState<TimeSlot[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      let query = supabase.from('appointment_bookings').select('*');

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('appointment_date', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
      loadSlotTimes(data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlotTimes = async (appts: Appointment[]) => {
    const slotIds = new Set(appts.map(a => a.slot_id).filter(Boolean));
    if (slotIds.size === 0) return;

    const { data } = await supabase
      .from('appointment_slots')
      .select('id, start_time')
      .in('id', Array.from(slotIds));

    const times: Record<string, string> = {};
    data?.forEach(slot => {
      times[slot.id] = slot.start_time;
    });
    setSlotTimes(times);
  };

  const handleStatusChange = async (id: string, newStatus: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('appointment_bookings')
        .update({
          status: newStatus,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      loadAppointments();
      setEditingId(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Güncelleme başarısız: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase.from('appointment_bookings').delete().eq('id', id);
      if (error) throw error;
      loadAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Silme başarısız: ' + (err as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'postponed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'approved':
        return 'Onaylı';
      case 'postponed':
        return 'Ertelendi';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  const handleSendWhatsAppReminder = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
    const appointmentTime = slotTimes[appointment.slot_id]?.substring(0, 5) || '';

    const defaultMessage = `Merhaba ${appointment.guest_name},

Ref Montessori School olarak randevunuzu hatırlatmak isteriz.

📅 Randevu Tarihi: ${appointmentDate}
🕐 Randevu Saati: ${appointmentTime}
👤 Çocuğunuz: ${appointment.child_name}
📋 Randevu Konusu: ${SUBJECT_LABELS[appointment.appointment_subject]}

Görüşmek üzere!

Ref Montessori School
📍 Adres: [Adresiniz]
📞 Tel: [Telefon Numaranız]`;

    setReminderMessage(defaultMessage);
    setShowReminderModal(true);
  };

  const sendWhatsAppReminder = () => {
    if (!selectedAppointment || !reminderMessage.trim()) {
      alert('Lütfen mesaj yazın');
      return;
    }

    const phoneNumber = selectedAppointment.guest_phone.replace(/\D/g, '').startsWith('0')
      ? '90' + selectedAppointment.guest_phone.replace(/\D/g, '').substring(1)
      : '90' + selectedAppointment.guest_phone.replace(/\D/g, '');

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(reminderMessage)}`;
    window.open(whatsappLink, '_blank');
    setShowReminderModal(false);
    setReminderMessage('');
    setSelectedAppointment(null);
  };

  const handleReschedule = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.appointment_date);
    await loadAvailableSlotsForDate(appointment.appointment_date);
    setShowRescheduleModal(true);
  };

  const loadAvailableSlotsForDate = async (date: string) => {
    try {
      const dayOfWeek = new Date(date).getDay();
      const { data: slots } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time');

      const { data: bookings } = await supabase
        .from('appointment_bookings')
        .select('slot_id')
        .eq('appointment_date', date)
        .in('status', ['pending', 'approved']);

      const bookedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);
      const availableSlotsList = (slots || []).filter(slot => !bookedSlotIds.has(slot.id));

      setAvailableSlots(availableSlotsList);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleSlotId) {
      alert('Lütfen yeni tarih ve saat seçin');
      return;
    }

    try {
      const { error } = await supabase
        .from('appointment_bookings')
        .update({
          appointment_date: rescheduleDate,
          slot_id: rescheduleSlotId,
          status: 'approved',
          admin_notes: `Randevu ${new Date().toLocaleDateString('tr-TR')} tarihinde ertelendi`,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      alert('Randevu başarıyla ertelendi');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleSlotId('');
      setSelectedAppointment(null);
      loadAppointments();
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert('Erteleme başarısız: ' + (err as Error).message);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .in('role', ['parent', 'atolye_user'])
        .ilike('full_name', `%${query}%`)
        .limit(8);

      const suggestions: UserSuggestion[] = [];

      for (const profile of profiles || []) {
        const suggestion: UserSuggestion = {
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          role: profile.role,
          children: [],
        };

        if (profile.role === 'parent') {
          const { data: children } = await supabase
            .from('children')
            .select('name, birth_date')
            .in('id', (
              await supabase
                .from('parent_children')
                .select('child_id')
                .eq('parent_id', profile.id)
                .then(r => (r.data || []).map((x: any) => x.child_id))
            ));
          suggestion.children = (children || []).map(c => ({ name: c.name, birth_date: c.birth_date }));
        }

        suggestions.push(suggestion);
      }

      setUserSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setManualSearchQuery(value);
    setManualForm(prev => ({ ...prev, guest_name: value }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchUsers(value), 300);
  };

  const selectUserSuggestion = (user: UserSuggestion) => {
    const firstChild = user.children?.[0];
    setManualForm(prev => ({
      ...prev,
      guest_name: user.full_name,
      guest_email: user.email,
      guest_phone: user.phone || '',
      child_name: firstChild?.name || '',
      child_birth_date: firstChild?.birth_date || '',
    }));
    setManualSearchQuery(user.full_name);
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  const loadManualSlotsForDate = async (date: string) => {
    if (!date) return;
    const dayOfWeek = new Date(date).getDay();
    const { data: slots } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time');

    const { data: bookings } = await supabase
      .from('appointment_bookings')
      .select('slot_id')
      .eq('appointment_date', date)
      .in('status', ['pending', 'approved']);

    const bookedSlotIds = new Set((bookings || []).map((b: any) => b.slot_id));
    setManualSlots((slots || []).filter((s: any) => !bookedSlotIds.has(s.id)));
  };

  const handleManualFormDateChange = (date: string) => {
    setManualForm(prev => ({ ...prev, appointment_date: date, slot_id: '' }));
    loadManualSlotsForDate(date);
  };

  const handleCreateManualAppointment = async () => {
    const { guest_name, guest_phone, appointment_date, slot_id, appointment_subject } = manualForm;
    if (!guest_name.trim() || !guest_phone.trim() || !appointment_date || !slot_id || !appointment_subject) {
      alert('Lütfen zorunlu alanları doldurun: Ad, Telefon, Tarih, Saat, Konu');
      return;
    }

    setManualSaving(true);
    try {
      const { error } = await supabase.from('appointment_bookings').insert({
        slot_id: manualForm.slot_id,
        appointment_date: manualForm.appointment_date,
        guest_name: manualForm.guest_name.trim(),
        guest_email: manualForm.guest_email.trim() || null,
        guest_phone: manualForm.guest_phone.trim(),
        child_name: manualForm.child_name.trim() || null,
        child_birth_date: manualForm.child_birth_date || null,
        appointment_subject: manualForm.appointment_subject,
        notes: manualForm.notes.trim() || null,
        status: manualForm.status,
        admin_notes: manualForm.admin_notes.trim() || null,
        is_guest: true,
      });

      if (error) throw error;

      setShowManualModal(false);
      setManualForm({ ...EMPTY_MANUAL_FORM });
      setManualSearchQuery('');
      setManualSlots([]);
      loadAppointments();
    } catch (err) {
      console.error('Error creating manual appointment:', err);
      alert('Randevu oluşturulamadı: ' + (err as Error).message);
    } finally {
      setManualSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'parent') return 'Veli';
    if (role === 'atolye_user') return 'Ref Atölye';
    return role;
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Randevu Yönetimi</h2>
        </div>
        <button
          onClick={() => {
            setManualForm({ ...EMPTY_MANUAL_FORM });
            setManualSearchQuery('');
            setManualSlots([]);
            setUserSuggestions([]);
            setShowSuggestions(false);
            setShowManualModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Manuel Randevu Ekle
        </button>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'postponed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status === 'all'
              ? 'Tümü'
              : status === 'pending'
              ? 'Beklemede'
              : status === 'approved'
              ? 'Onaylı'
              : status === 'postponed'
              ? 'Ertelendi'
              : 'İptal'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Randevu bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tarih & Saat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kişi Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Çocuk Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Konu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>{new Date(appointment.appointment_date).toLocaleDateString('tr-TR')}</div>
                      <div className="text-xs text-gray-500">{slotTimes[appointment.slot_id]?.substring(0, 5)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.guest_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.child_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {SUBJECT_LABELS[appointment.appointment_subject]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <a href={`tel:${appointment.guest_phone}`} className="text-green-600 hover:text-green-700">
                        {appointment.guest_phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingId === appointment.id ? (
                        <div className="flex gap-2">
                          <select
                            value={appointment.status}
                            onChange={(e) => {
                              const appt = appointments.find(a => a.id === appointment.id)!;
                              appt.status = e.target.value as any;
                              setAppointments([...appointments]);
                            }}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            <option value="pending">Beklemede</option>
                            <option value="approved">Onay</option>
                            <option value="postponed">Ertel</option>
                            <option value="cancelled">İptal</option>
                          </select>
                          <button
                            onClick={() => handleStatusChange(appointment.id, appointment.status, adminNotes)}
                            className="text-green-600 hover:text-green-700 font-semibold"
                          >
                            Kaydet
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(appointment.id);
                              setAdminNotes(appointment.admin_notes || '');
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Düzenle"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReschedule(appointment)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Başka Saate Ertele"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWhatsAppReminder(appointment)}
                            className="text-green-600 hover:text-green-700"
                            title="WhatsApp Hatırlatma Gönder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(appointment.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Yönetici Notları</h3>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="İç not ekleyiniz..."
            rows={3}
          />
          <button
            onClick={() => setEditingId(null)}
            className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Kapat
          </button>
        </div>
      )}

      {showReminderModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">WhatsApp Randevu Hatırlatması</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAppointment.guest_name} - {selectedAppointment.guest_phone}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setSelectedAppointment(null);
                  setReminderMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesajınızı düzenleyin:
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={12}
                  placeholder="Randevu hatırlatma mesajınızı yazın..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setSelectedAppointment(null);
                    setReminderMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={sendWhatsAppReminder}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp ile Gönder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Manuel Randevu Oluştur</h3>
                <p className="text-sm text-gray-500 mt-0.5">Takvime yeni randevu ekle</p>
              </div>
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setManualForm({ ...EMPTY_MANUAL_FORM });
                  setManualSearchQuery('');
                  setManualSlots([]);
                  setUserSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                Kayıtlı veli veya Ref Atölye kullanıcısı aramak için ad yazın, bilgileri otomatik dolacaktır.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={suggestionsRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={manualSearchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => userSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Ad soyad girin veya kayıtlı kullanıcı arayın..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {showSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                      {userSuggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={() => selectUserSuggestion(user)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-sm">{user.full_name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                user.role === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {getRoleLabel(user.role)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                            {user.children && user.children.length > 0 && (
                              <p className="text-xs text-green-600 mt-0.5">
                                Çocuk: {user.children.map(c => c.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={manualForm.guest_phone}
                    onChange={(e) => setManualForm(prev => ({ ...prev, guest_phone: e.target.value }))}
                    placeholder="05xx xxx xx xx"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
                  <input
                    type="email"
                    value={manualForm.guest_email}
                    onChange={(e) => setManualForm(prev => ({ ...prev, guest_email: e.target.value }))}
                    placeholder="ornek@mail.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Çocuk Adı</label>
                  <input
                    type="text"
                    value={manualForm.child_name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, child_name: e.target.value }))}
                    placeholder="Çocuğun adı"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Çocuk Doğum Tarihi</label>
                  <input
                    type="date"
                    value={manualForm.child_birth_date}
                    onChange={(e) => setManualForm(prev => ({ ...prev, child_birth_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Randevu Konusu <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.appointment_subject}
                  onChange={(e) => setManualForm(prev => ({ ...prev, appointment_subject: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Randevu Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={manualForm.appointment_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleManualFormDateChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Saat <span className="text-red-500">*</span>
                  </label>
                  {!manualForm.appointment_date ? (
                    <p className="text-sm text-gray-400 pt-2.5">Önce tarih seçin</p>
                  ) : manualSlots.length === 0 ? (
                    <p className="text-sm text-red-500 pt-2.5">Bu tarihte uygun slot yok</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {manualSlots.map((slot: any) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setManualForm(prev => ({ ...prev, slot_id: slot.id }))}
                          className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                            manualForm.slot_id === slot.id
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {slot.start_time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durum</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value="approved">Onaylı</option>
                    <option value="pending">Beklemede</option>
                    <option value="postponed">Ertelendi</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Not (Veli için)</label>
                <textarea
                  value={manualForm.notes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Veli notları..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yönetici Notu</label>
                <textarea
                  value={manualForm.admin_notes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                  rows={2}
                  placeholder="Dahili notlar..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowManualModal(false);
                    setManualForm({ ...EMPTY_MANUAL_FORM });
                    setManualSearchQuery('');
                    setManualSlots([]);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateManualAppointment}
                  disabled={manualSaving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {manualSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Randevu Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Randevuyu Başka Saate Ertele</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAppointment.guest_name} - {selectedAppointment.child_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                  setRescheduleDate('');
                  setRescheduleSlotId('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Tarih Seçin
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleSlotId('');
                    loadAvailableSlotsForDate(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Saat Seçin
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-red-600">Bu tarihte uygun slot bulunmamaktadır</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot: any) => (
                        <button
                          key={slot.id}
                          onClick={() => setRescheduleSlotId(slot.id)}
                          className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                            rescheduleSlotId === slot.id
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {slot.start_time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setRescheduleDate('');
                    setRescheduleSlotId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={confirmReschedule}
                  disabled={!rescheduleDate || !rescheduleSlotId}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  Randevuyu Ertele
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
