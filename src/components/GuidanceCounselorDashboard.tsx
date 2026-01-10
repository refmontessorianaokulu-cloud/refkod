import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Send, Users, MessageSquare, ClipboardList, BookOpen, AlertTriangle } from 'lucide-react';
import MessagesSection from './MessagesSection';
import TaskResponseSection from './TaskResponseSection';
import BranchCourseReportsSection from './BranchCourseReportsSection';
import BehaviorIncidentSection from './BehaviorIncidentSection';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';

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

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
}

const guidanceMenuCategories: MenuCategory[] = [
  {
    id: 'appointments_management',
    label: 'Randevu Yönetimi',
    items: [
      { id: 'appointments', label: 'Randevu Talepleri', icon: Calendar },
    ],
  },
  {
    id: 'communication',
    label: 'İletişim',
    items: [
      { id: 'group_messages', label: 'Toplu Mesajlar', icon: Users },
      { id: 'messages', label: 'Bireysel Mesajlar', icon: MessageSquare },
    ],
  },
  {
    id: 'tasks_reports',
    label: 'Görevler ve Raporlar',
    items: [
      { id: 'tasks', label: 'Görevlerim', icon: ClipboardList },
      { id: 'branch_reports', label: 'Rehberlik Raporları', icon: BookOpen },
      { id: 'behavior_incidents', label: 'KOD Kayıtları', icon: AlertTriangle },
    ],
  },
];

export default function GuidanceCounselorDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTab>(() => {
    const saved = localStorage.getItem('guidance-active-tab');
    return (saved as MenuTab) || 'appointments';
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
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
    localStorage.setItem('guidance-active-tab', activeTab);
    if (profile) {
      loadAppointments();
      loadGroupMessages();
      loadChildren();
    }
  }, [profile, activeTab]);

  const loadChildren = async () => {
    try {
      const { data } = await supabase
        .from('children')
        .select('*')
        .order('first_name', { ascending: true });
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName={profile?.full_name}
        userRole="guidance_counselor"
        menuCategories={guidanceMenuCategories}
        panelTitle="Rehberlik Birimi Paneli"
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Randevu Talepleri</h2>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz randevu talebi bulunmuyor</p>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-emerald-300">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
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
                          <p className="text-gray-700 mb-3">{apt.message}</p>
                          {apt.appointment_date && (
                            <p className="text-sm text-emerald-600 mb-2">
                              <strong>Randevu Tarihi:</strong>{' '}
                              {new Date(apt.appointment_date).toLocaleString('tr-TR')}
                            </p>
                          )}
                          {apt.response_message && (
                            <div className="mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                              <p className="text-sm text-gray-700">
                                <strong>Cevabınız:</strong> {apt.response_message}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-3">
                            {new Date(apt.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowResponseModal(true);
                            }}
                            className="ml-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
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

          {activeTab === 'group_messages' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Toplu Mesajlar</h2>
                <button
                  onClick={() => setShowGroupMessageModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
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
                    <div key={msg.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-emerald-300">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{msg.subject}</h3>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium border border-emerald-200">
                          {getRecipientGroupLabel(msg.recipient_group)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{msg.message}</p>
                      <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <MessagesSection userId={profile?.id || ''} userRole="guidance_counselor" />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <TaskResponseSection userId={profile?.id || ''} userRole="guidance_counselor" />
            </div>
          )}

          {activeTab === 'branch_reports' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <BranchCourseReportsSection
                children={children}
                teacherId={profile?.id}
                userRole="guidance_counselor"
              />
            </div>
          )}

          {activeTab === 'behavior_incidents' && profile && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <BehaviorIncidentSection
                userId={profile.id}
                userRole="guidance_counselor"
              />
            </div>
          )}
        </div>
      </div>

      {showResponseModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Randevuya Cevap Ver</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={responseForm.response_message}
                  onChange={(e) => setResponseForm({ ...responseForm, response_message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Veliye cevabınızı yazın..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleRespondToAppointment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
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
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Toplu Mesaj Gönder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alıcı Grup</label>
                <select
                  value={groupMessageForm.recipient_group}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, recipient_group: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Mesaj konusu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  value={groupMessageForm.message}
                  onChange={(e) => setGroupMessageForm({ ...groupMessageForm, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Mesajınızı yazın..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSendGroupMessage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
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
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
