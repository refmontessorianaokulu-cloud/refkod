import { useState, useEffect } from 'react';
import { Calendar, Trash2, MessageSquare, MessageCircle, Send } from 'lucide-react';
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

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Randevu Yönetimi</h2>
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
    </div>
  );
}
