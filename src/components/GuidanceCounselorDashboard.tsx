import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Calendar, Send, Users, MessageSquare, User, ClipboardList } from 'lucide-react';
import MessagesSection from './MessagesSection';
import TaskResponseSection from './TaskResponseSection';

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

interface GroupMessage {
  id: string;
  sender_id: string;
  recipient_group: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function GuidanceCounselorDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'group-messages' | 'individual-messages' | 'tasks'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showGroupMessageModal, setShowGroupMessageModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    appointment_date: '',
    response_message: '',
  });
  const [groupMessageForm, setGroupMessageForm] = useState({
    recipient_group: 'all_parents',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (profile) {
      loadAppointments();
      loadGroupMessages();
    }
  }, [profile]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('target_id', profile?.id)
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

  const loadGroupMessages = async () => {
    try {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('sender_id', profile?.id)
        .order('created_at', { ascending: false });
      setGroupMessages(data || []);
    } catch (error) {
      console.error('Error loading group messages:', error);
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

  const handleSendGroupMessage = async () => {
    if (!groupMessageForm.subject || !groupMessageForm.message) {
      alert('Lütfen konu ve mesaj alanlarını doldurun');
      return;
    }

    try {
      const { error } = await supabase.from('group_messages').insert([
        {
          sender_id: profile?.id,
          recipient_group: groupMessageForm.recipient_group,
          subject: groupMessageForm.subject,
          message: groupMessageForm.message,
        },
      ]);

      if (error) throw error;

      setShowGroupMessageModal(false);
      setGroupMessageForm({
        recipient_group: 'all_parents',
        subject: '',
        message: '',
      });
      loadGroupMessages();
    } catch (error) {
      console.error('Error sending group message:', error);
      alert('Mesaj gönderilirken bir hata oluştu');
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

  const getRecipientGroupLabel = (group: string) => {
    const labels: { [key: string]: string } = {
      all_parents: 'Tüm Veliler',
      all_teachers: 'Tüm Öğretmenler',
      all_admins: 'Tüm Yöneticiler',
    };
    return labels[group] || 'Bireysel';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <User className="w-8 h-8 text-teal-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">Rehberlik Birimi Paneli</h1>
                <p className="text-sm text-gray-600">{profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`pb-4 px-6 font-semibold transition-colors ${
                activeTab === 'appointments'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Randevular
            </button>
            <button
              onClick={() => setActiveTab('group-messages')}
              className={`pb-4 px-6 font-semibold transition-colors ${
                activeTab === 'group-messages'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Toplu Mesajlar
            </button>
            <button
              onClick={() => setActiveTab('individual-messages')}
              className={`pb-4 px-6 font-semibold transition-colors ${
                activeTab === 'individual-messages'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Bireysel Mesajlar
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-4 px-6 font-semibold transition-colors ${
                activeTab === 'tasks'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-5 h-5 inline mr-2" />
              Görevlerim
            </button>
          </div>

          {activeTab === 'appointments' && (
            <div className="mt-6">
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
                            <p className="text-sm text-teal-600 mb-2">
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
                            className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            Cevapla
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'group-messages' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Toplu Mesajlar</h2>
                <button
                  onClick={() => setShowGroupMessageModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>Yeni Mesaj Gönder</span>
                </button>
              </div>
              <div className="space-y-4">
                {groupMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz gönderilmiş mesaj bulunmuyor</p>
                ) : (
                  groupMessages.map((msg) => (
                    <div key={msg.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{msg.subject}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {getRecipientGroupLabel(msg.recipient_group)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{msg.message}</p>
                      <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'individual-messages' && (
            <div className="mt-6">
              <MessagesSection userId={profile?.id || ''} userRole="guidance_counselor" />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="mt-6">
              <TaskResponseSection userId={profile?.id || ''} userRole="guidance_counselor" />
            </div>
          )}
        </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={responseForm.response_message}
                  onChange={(e) => setResponseForm({ ...responseForm, response_message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Veliye cevabınızı yazın..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRespondToAppointment}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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

      {showGroupMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Toplu Mesaj Gönder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alıcı Grup</label>
                <select
                  value={groupMessageForm.recipient_group}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, recipient_group: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all_parents">Tüm Veliler</option>
                  <option value="all_teachers">Tüm Öğretmenler</option>
                  <option value="all_admins">Tüm Yöneticiler</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                <input
                  type="text"
                  value={groupMessageForm.subject}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Mesaj konusu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={groupMessageForm.message}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Mesajınızı yazın..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSendGroupMessage}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Gönder
                </button>
                <button
                  onClick={() => {
                    setShowGroupMessageModal(false);
                    setGroupMessageForm({
                      recipient_group: 'all_parents',
                      subject: '',
                      message: '',
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
