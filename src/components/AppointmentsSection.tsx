import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Calendar, Filter, Mail } from 'lucide-react';

interface Appointment {
  id: string;
  parent_id: string;
  target_id: string;
  child_id: string | null;
  subject: string;
  message: string;
  status: string;
  appointment_date: string | null;
  response_message: string | null;
  created_at: string;
  updated_at: string;
  parent_name?: string;
  target_name?: string;
  child_name?: string;
}

interface Reminder {
  id: string;
  appointment_id: string;
  admin_id: string;
  recipient_id: string;
  recipient_type: string;
  message: string;
  sent_at: string;
  read: boolean;
}

interface AppointmentsSectionProps {
  userId: string;
  userRole?: 'admin' | 'teacher' | 'parent' | 'guidance_counselor';
}

export default function AppointmentsSection({ userId, userRole }: AppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRemindersHistory, setShowRemindersHistory] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    appointment_date: '',
    response_message: '',
  });

  const [reminderForm, setReminderForm] = useState({
    recipient_type: 'both',
    message: '',
  });

  useEffect(() => {
    if (userId) {
      loadAppointments();
      if (userRole === 'admin') {
        loadReminders();
      }
    }
  }, [userId, statusFilter, dateFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase.from('appointments').select('*');

      if (userRole === 'admin') {
      } else {
        query = query.eq('target_id', userId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      const { data: appointmentsData } = await query.order('created_at', { ascending: false });

      if (appointmentsData) {
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: parentData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.parent_id)
              .maybeSingle();

            const { data: targetData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.target_id)
              .maybeSingle();

            let childName = '';
            if (apt.child_id) {
              const { data: childData } = await supabase
                .from('children')
                .select('first_name, last_name')
                .eq('id', apt.child_id)
                .maybeSingle();
              if (childData) {
                childName = `${childData.first_name} ${childData.last_name}`;
              }
            }

            return {
              ...apt,
              parent_name: parentData?.full_name || 'Bilinmeyen Veli',
              target_name: targetData?.full_name || 'Bilinmeyen',
              child_name: childName,
            };
          })
        );

        setAppointments(enrichedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const { data } = await supabase
        .from('appointment_reminders')
        .select('*')
        .order('sent_at', { ascending: false });
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleRespondToAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const updateData: any = {
        status: responseForm.status,
        response_message: responseForm.response_message,
      };

      if (responseForm.status === 'approved' && responseForm.appointment_date) {
        updateData.appointment_date = responseForm.appointment_date;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setShowResponseModal(false);
      setSelectedAppointment(null);
      setResponseForm({
        status: 'approved',
        appointment_date: '',
        response_message: '',
      });
      loadAppointments();
      alert('Randevu cevabınız gönderildi!');
    } catch (error) {
      console.error('Error responding to appointment:', error);
      alert('Randevu cevaplanırken bir hata oluştu');
    }
  };

  const handleChangeStatus = async (appointmentId: string, newStatus: string) => {
    if (!confirm(`Randevu durumunu "${getStatusLabel(newStatus)}" olarak değiştirmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      loadAppointments();
      alert('Randevu durumu güncellendi!');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Durum güncellenirken bir hata oluştu');
    }
  };

  const handleSendReminder = async () => {
    if (!selectedAppointment || !reminderForm.message.trim()) {
      alert('Lütfen hatırlatma mesajı yazın');
      return;
    }

    try {
      const recipients: string[] = [];

      if (reminderForm.recipient_type === 'parent' || reminderForm.recipient_type === 'both') {
        recipients.push(selectedAppointment.parent_id);
      }

      if (reminderForm.recipient_type === 'target' || reminderForm.recipient_type === 'both') {
        recipients.push(selectedAppointment.target_id);
      }

      for (const recipientId of recipients) {
        await supabase.from('appointment_reminders').insert({
          appointment_id: selectedAppointment.id,
          admin_id: userId,
          recipient_id: recipientId,
          recipient_type: reminderForm.recipient_type,
          message: reminderForm.message,
        });

        await supabase.functions.invoke('send-appointment-reminder', {
          body: {
            recipientId,
            appointmentSubject: selectedAppointment.subject,
            message: reminderForm.message,
            appointmentDate: selectedAppointment.appointment_date,
          },
        });
      }

      setShowReminderModal(false);
      setReminderForm({ recipient_type: 'both', message: '' });
      setSelectedAppointment(null);
      loadReminders();
      alert('Hatırlatma gönderildi!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Hatırlatma gönderilirken bir hata oluştu');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      completed: 'Tamamlandı',
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {userRole === 'admin' ? 'Tüm Randevular' : 'Randevu Talepleri'}
        </h2>
        <div className="flex items-center space-x-3">
          {userRole === 'admin' && (
            <button
              onClick={() => setShowRemindersHistory(!showRemindersHistory)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Bell className="w-4 h-4" />
              <span>Hatırlatma Geçmişi</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtrele</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="pending">Beklemede</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {(statusFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {showRemindersHistory && userRole === 'admin' && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Gönderilen Hatırlatmalar</h3>
          {reminders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Henüz hatırlatma gönderilmedi</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{reminder.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(reminder.sent_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      reminder.read ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {reminder.read ? 'Okundu' : 'Okunmadı'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz randevu talebi bulunmuyor</p>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{apt.subject}</h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  {userRole === 'admin' ? (
                    <div className="space-y-1 mb-2">
                      <p className="text-sm text-gray-600">
                        <strong>Veli:</strong> {apt.parent_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Randevu Alan:</strong> {apt.target_name}
                      </p>
                      {apt.child_name && (
                        <p className="text-sm text-gray-600">
                          <strong>Çocuk:</strong> {apt.child_name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Veli:</strong> {apt.parent_name}
                      {apt.child_name && (
                        <>
                          {' '}
                          | <strong>Çocuk:</strong> {apt.child_name}
                        </>
                      )}
                    </p>
                  )}
                  <p className="text-gray-700 mb-2">{apt.message}</p>
                  {apt.appointment_date && (
                    <p className="text-sm text-green-600 mb-2 flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>Randevu Tarihi:</strong>{' '}
                        {new Date(apt.appointment_date).toLocaleString('tr-TR')}
                      </span>
                    </p>
                  )}
                  {apt.response_message && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Cevap:</strong> {apt.response_message}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(apt.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="ml-4 flex flex-col space-y-2">
                  {userRole === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowReminderModal(true);
                        }}
                        className="px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-2"
                        title="Hatırlatma Gönder"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Hatırlat</span>
                      </button>
                      <select
                        value={apt.status}
                        onChange={(e) => handleChangeStatus(apt.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                        <option value="completed">Tamamlandı</option>
                      </select>
                    </>
                  )}
                  {apt.status === 'pending' && userRole !== 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setShowResponseModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cevapla
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showResponseModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Randevuya Cevap Ver</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="approved">Onayla</option>
                  <option value="rejected">Reddet</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>
              {responseForm.status === 'approved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Randevu Tarihi ve Saati</label>
                  <input
                    type="datetime-local"
                    value={responseForm.appointment_date}
                    onChange={(e) => setResponseForm({ ...responseForm, appointment_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={responseForm.response_message}
                  onChange={(e) => setResponseForm({ ...responseForm, response_message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Veliye cevabınızı yazın..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRespondToAppointment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gönder
                </button>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedAppointment(null);
                    setResponseForm({
                      status: 'approved',
                      appointment_date: '',
                      response_message: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Hatırlatma Gönder</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Randevu:</strong> {selectedAppointment.subject}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Veli:</strong> {selectedAppointment.parent_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Randevu Alan:</strong> {selectedAppointment.target_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kime Gönderilsin?</label>
                <select
                  value={reminderForm.recipient_type}
                  onChange={(e) => setReminderForm({ ...reminderForm, recipient_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="both">Her İkisine</option>
                  <option value="parent">Sadece Veliye</option>
                  <option value="target">Sadece Randevu Alana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hatırlatma Mesajı</label>
                <textarea
                  value={reminderForm.message}
                  onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Hatırlatma mesajınızı yazın..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSendReminder}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gönder</span>
                </button>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setSelectedAppointment(null);
                    setReminderForm({ recipient_type: 'both', message: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
