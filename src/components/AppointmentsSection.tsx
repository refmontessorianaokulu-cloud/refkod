import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  child_name?: string;
}

interface AppointmentsSectionProps {
  userId: string;
}

export default function AppointmentsSection({ userId }: AppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    appointment_date: '',
    response_message: '',
  });

  useEffect(() => {
    if (userId) {
      loadAppointments();
    }
  }, [userId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('target_id', userId)
        .order('created_at', { ascending: false });

      if (appointmentsData) {
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: parentData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.parent_id)
              .single();

            let childName = '';
            if (apt.child_id) {
              const { data: childData } = await supabase
                .from('children')
                .select('first_name, last_name')
                .eq('id', apt.child_id)
                .single();
              if (childData) {
                childName = `${childData.first_name} ${childData.last_name}`;
              }
            }

            return {
              ...apt,
              parent_name: parentData?.full_name || 'Bilinmeyen Veli',
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
    } catch (error) {
      console.error('Error responding to appointment:', error);
      alert('Randevu cevaplanırken bir hata oluştu');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    const labels: { [key: string]: string } = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      completed: 'Tamamlandı',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Randevu Talepleri</h2>
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
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Veli:</strong> {apt.parent_name}
                    {apt.child_name && (
                      <>
                        {' '}
                        | <strong>Çocuk:</strong> {apt.child_name}
                      </>
                    )}
                  </p>
                  <p className="text-gray-700 mb-2">{apt.message}</p>
                  {apt.appointment_date && (
                    <p className="text-sm text-green-600 mb-2">
                      <strong>Randevu Tarihi:</strong>{' '}
                      {new Date(apt.appointment_date).toLocaleString('tr-TR')}
                    </p>
                  )}
                  {apt.response_message && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Cevabınız:</strong> {apt.response_message}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(apt.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                {apt.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowResponseModal(true);
                    }}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cevapla
                  </button>
                )}
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
    </div>
  );
}
