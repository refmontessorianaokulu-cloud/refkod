import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, MealLog, SleepLog, DailyReport } from '../lib/supabase';
import { Baby, UtensilsCrossed, Moon, Calendar, BookOpen, Image as ImageIcon, Megaphone, MessageSquare, CalendarCheck, Car, X, CalendarPlus, UserCheck, MapPin, CreditCard, Home, Info, Sparkles, GraduationCap, Briefcase, Palette } from 'lucide-react';
import AnnouncementsSection from './AnnouncementsSection';
import MessagesSection from './MessagesSection';
import CalendarSection from './CalendarSection';
import FeesSection from './FeesSection';
import MealMenuSection from './MealMenuSection';
import DutyScheduleSection from './DutyScheduleSection';
import ServiceLocationSection from './ServiceLocationSection';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import RefSectionsView from './RefSectionsView';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';

type ChildWithLogs = Child & {
  meal_logs: MealLog[];
  sleep_logs: SleepLog[];
  daily_reports: DailyReport[];
};

const parentMenuCategories: MenuCategory[] = [
  {
    id: 'homepage',
    label: 'Ana Sayfa',
    items: [
      { id: 'home', label: 'Ana Sayfa', icon: Home },
      { id: 'about', label: 'Hakkımızda', icon: Info },
    ],
  },
  {
    id: 'ref_sections',
    label: 'Ref Ekosistemi',
    items: [
      { id: 'ref_akademi', label: 'Ref Akademi', icon: GraduationCap },
      { id: 'ref_danismanlik', label: 'Ref Danışmanlık', icon: Briefcase },
      { id: 'ref_atolye', label: 'Ref Atölye', icon: Palette },
    ],
  },
  {
    id: 'children_activities',
    label: 'Çocuğum',
    items: [
      { id: 'main', label: 'Günlük Aktiviteler', icon: Baby },
      { id: 'daily_reports', label: 'Montessori Günlük Raporları', icon: Sparkles },
    ],
  },
  {
    id: 'communication',
    label: 'İletişim',
    items: [
      { id: 'announcements', label: 'Duyurular', icon: Megaphone },
      { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
      { id: 'calendar', label: 'Akademik Takvim', icon: Calendar },
    ],
  },
  {
    id: 'finance_appointments',
    label: 'Mali İşler ve Randevular',
    items: [
      { id: 'fees', label: 'Okul Ödemeleri', icon: CreditCard },
      { id: 'appointments', label: 'Randevular', icon: CalendarCheck },
    ],
  },
  {
    id: 'operations',
    label: 'Operasyonel',
    items: [
      { id: 'menu', label: 'Yemek Menüsü', icon: UtensilsCrossed },
      { id: 'duty', label: 'Nöbetçi Öğretmen', icon: UserCheck },
      { id: 'service', label: 'Servis Takibi', icon: Car },
    ],
  },
];

export default function ParentDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTab>('home');
  const [children, setChildren] = useState<ChildWithLogs[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupMessage, setPickupMessage] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [targetUsers, setTargetUsers] = useState<any[]>([]);
  const [appointmentForm, setAppointmentForm] = useState({
    target_id: '',
    child_id: '',
    subject: '',
    message: '',
  });


  useEffect(() => {
    loadChildren();
    if (profile) {
      loadAppointments();
      loadTargetUsers();
    }
  }, [profile]);

  const loadChildren = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', profile.id);

      if (!parentChildren || parentChildren.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = parentChildren.map((pc) => pc.child_id);
      const { data: childrenData } = await supabase
        .from('children')
        .select(`
          *,
          teacher:teacher_children(teacher_id(full_name))
        `)
        .in('id', childIds);

      if (childrenData) {
        const childrenWithLogs = await Promise.all(
          childrenData.map(async (child: any) => {
            const { data: mealLogs } = await supabase
              .from('meal_logs')
              .select('*')
              .eq('child_id', child.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const { data: sleepLogs } = await supabase
              .from('sleep_logs')
              .select('*')
              .eq('child_id', child.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const { data: dailyReports } = await supabase
              .from('daily_reports')
              .select('*')
              .eq('child_id', child.id)
              .order('report_date', { ascending: false })
              .limit(10);

            const teacherData = child.teacher && child.teacher.length > 0
              ? { full_name: child.teacher[0].teacher_id.full_name }
              : undefined;

            return {
              ...child,
              teacher: teacherData,
              meal_logs: mealLogs || [],
              sleep_logs: sleepLogs || [],
              daily_reports: dailyReports || [],
            };
          })
        );
        setChildren(childrenWithLogs);
        if (childrenWithLogs.length > 0) {
          setSelectedChild(childrenWithLogs[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedChildData = children.find((c) => c.id === selectedChild);

  useEffect(() => {
    if (selectedChild) {
      loadAttendances();
    }
  }, [selectedChild]);

  const loadAttendances = async () => {
    if (!selectedChild) return;
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('child_id', selectedChild)
        .order('date', { ascending: false })
        .limit(30);
      setAttendances(data || []);
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };

  const loadAppointments = async () => {
    if (!profile) return;
    try {
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false });

      if (appointmentsData) {
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: targetData } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', apt.target_id)
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
              target_name: targetData?.full_name || 'Bilinmeyen',
              target_role: targetData?.role || '',
              child_name: childName,
            };
          })
        );

        setAppointments(enrichedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadTargetUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['teacher', 'admin', 'guidance_counselor'])
        .eq('approved', true);
      setTargetUsers(data || []);
    } catch (error) {
      console.error('Error loading target users:', error);
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentForm.target_id || !appointmentForm.subject || !appointmentForm.message) {
      alert('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      const { error } = await supabase.from('appointments').insert([
        {
          parent_id: profile?.id,
          target_id: appointmentForm.target_id,
          child_id: appointmentForm.child_id || null,
          subject: appointmentForm.subject,
          message: appointmentForm.message,
        },
      ]);

      if (error) throw error;

      setShowAppointmentModal(false);
      setAppointmentForm({
        target_id: '',
        child_id: '',
        subject: '',
        message: '',
      });
      loadAppointments();
      alert('Randevu talebiniz başarıyla gönderildi');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Randevu talebi oluşturulurken bir hata oluştu');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Geldi';
      case 'absent': return 'Gelmedi';
      case 'late': return 'Geç Geldi';
      case 'excused': return 'Mazeret';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMealTypeText = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'Kahvaltı';
      case 'lunch':
        return 'Öğle Yemeği';
      case 'snack':
        return 'Ara Öğün';
      default:
        return type;
    }
  };

  const getAmountEatenText = (amount: string) => {
    switch (amount) {
      case 'all':
        return 'Hepsini';
      case 'most':
        return 'Çoğunu';
      case 'some':
        return 'Biraz';
      case 'none':
        return 'Hiç';
      default:
        return amount;
    }
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} saat ${minutes} dakika`;
  };

  const handleSendPickupNotification = async () => {
    if (!selectedChild || !profile) return;

    try {
      let arrivalDateTime = null;
      if (arrivalTime) {
        const today = new Date();
        const [hours, minutes] = arrivalTime.split(':');
        today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        arrivalDateTime = today.toISOString();
      }

      const { error } = await supabase.from('pickup_notifications').insert({
        parent_id: profile.id,
        child_id: selectedChild,
        message: pickupMessage,
        arrival_time: arrivalDateTime,
      });

      if (error) throw error;

      alert('Bildirim başarıyla gönderildi!');
      setShowPickupModal(false);
      setPickupMessage('');
      setArrivalTime('');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName={profile?.full_name}
        userRole="parent"
        menuCategories={parentMenuCategories}
        panelTitle="Veli Paneli"
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:py-8">

        {activeTab === 'attendance' && selectedChild && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Devamsızlık Kayıtları</h2>
            {attendances.length === 0 ? (
              <p className="text-center py-12 text-gray-500">Henüz devamsızlık kaydı yok</p>
            ) : (
              <div className="space-y-3">
                {attendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(attendance.date).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {attendance.notes && (
                          <p className="text-sm text-gray-600 mt-1">{attendance.notes}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
                      {getStatusText(attendance.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AnnouncementsSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MessagesSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CalendarSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <FeesSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Randevular</h2>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CalendarPlus className="w-5 h-5" />
                <span>Yeni Randevu Talebi</span>
              </button>
            </div>
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Henüz randevu talebiniz bulunmuyor</p>
              ) : (
                appointments.map((apt: any) => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{apt.subject}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            apt.status === 'approved' ? 'bg-green-100 text-green-800' :
                            apt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {apt.status === 'pending' ? 'Beklemede' :
                             apt.status === 'approved' ? 'Onaylandı' :
                             apt.status === 'rejected' ? 'Reddedildi' :
                             'Tamamlandı'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Randevu Kişisi:</strong> {apt.target_name} ({
                            apt.target_role === 'teacher' ? 'Öğretmen' :
                            apt.target_role === 'admin' ? 'Yönetici' :
                            'Rehberlik Birimi'
                          })
                          {apt.child_name && (
                            <>
                              {' '}| <strong>Çocuk:</strong> {apt.child_name}
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
                              <strong>Cevap:</strong> {apt.response_message}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(apt.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MealMenuSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'duty' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <DutyScheduleSection userId={profile?.id || ''} userRole="parent" />
          </div>
        )}

        {activeTab === 'service' && selectedChild && (
          <ServiceLocationSection childId={selectedChild} />
        )}

        {activeTab === 'ref_akademi' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <RefSectionsView sectionType="ref_akademi" />
          </div>
        )}

        {activeTab === 'ref_danismanlik' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <RefSectionsView sectionType="ref_danismanlik" />
          </div>
        )}

        {activeTab === 'ref_atolye' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <RefSectionsView sectionType="ref_atolye" />
          </div>
        )}

        {activeTab === 'home' && (
          <HomePage
            onNavigateToAbout={() => setActiveTab('about')}
            userFullName={profile?.full_name}
            onSignOut={signOut}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage onNavigateHome={() => setActiveTab('home')} />
        )}

        {activeTab === 'main' && loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-500">Yükleniyor...</p>
          </div>
        ) : activeTab === 'main' && children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz çocuğunuz eklenmemiş</h2>
            <p className="text-gray-500">Lütfen yönetici ile iletişime geçin.</p>
          </div>
        ) : activeTab === 'main' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Çocuklarım</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                        selectedChild === child.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={`${child.first_name} ${child.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          selectedChild === child.id
                            ? 'bg-green-700'
                            : 'bg-gradient-to-br from-green-200 to-emerald-200'
                        }`}>
                          <Baby className={`w-6 h-6 ${selectedChild === child.id ? 'text-white' : 'text-green-700'}`} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {child.first_name} {child.last_name}
                        </div>
                        <div className={`text-sm ${selectedChild === child.id ? 'text-green-50' : 'text-gray-500'}`}>
                          <div className="flex items-center gap-2">
                            <span>{child.class_name}</span>
                            {child.schedule_type === 'yarim_gun' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Yarım Gün
                              </span>
                            )}
                          </div>
                          {child.teacher && (
                            <span className={`block text-xs ${selectedChild === child.id ? 'text-green-100' : 'text-gray-400'}`}>
                              Öğretmen: {child.teacher.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {selectedChildData && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                      {selectedChildData.photo_url ? (
                        <img
                          src={selectedChildData.photo_url}
                          alt={`${selectedChildData.first_name} ${selectedChildData.last_name}`}
                          className="w-20 h-20 rounded-full object-cover border-4 border-green-100 shadow-lg"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full border-4 border-white shadow-lg">
                          <Baby className="w-8 h-8 text-green-600" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedChildData.first_name} {selectedChildData.last_name}
                        </h2>
                        <p className="text-gray-600">{selectedChildData.class_name}</p>
                        {selectedChildData.teacher && (
                          <p className="text-sm text-green-600 font-medium">
                            Öğretmen: {selectedChildData.teacher.full_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Doğum: {new Date(selectedChildData.birth_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <UtensilsCrossed className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold text-gray-800">Yemek Kayıtları</h3>
                    </div>
                    {selectedChildData.meal_logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz yemek kaydı yok</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedChildData.meal_logs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {getMealTypeText(log.meal_type)}
                                </span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-gray-700">{getAmountEatenText(log.amount_eaten)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(log.log_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 rounded p-2">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Moon className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-xl font-bold text-gray-800">Uyku Kayıtları</h3>
                    </div>
                    {selectedChildData.sleep_logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz uyku kaydı yok</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedChildData.sleep_logs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {new Date(log.start_time).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  -{' '}
                                  {new Date(log.end_time).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Süre: {formatDuration(log.start_time, log.end_time)}
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(log.log_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 rounded p-2">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setShowPickupModal(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                      >
                        <Car className="w-5 h-5" />
                        <span>Çocuğumu Almaya Geliyorum</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'daily_reports' && children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz çocuğunuz eklenmemiş</h2>
            <p className="text-gray-500">Lütfen yönetici ile iletişime geçin.</p>
          </div>
        ) : activeTab === 'daily_reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Çocuklarım</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                        selectedChild === child.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={`${child.first_name} ${child.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          selectedChild === child.id
                            ? 'bg-green-700'
                            : 'bg-gradient-to-br from-green-200 to-emerald-200'
                        }`}>
                          <Baby className={`w-6 h-6 ${selectedChild === child.id ? 'text-white' : 'text-green-700'}`} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {child.first_name} {child.last_name}
                        </div>
                        <div className={`text-sm ${selectedChild === child.id ? 'text-green-50' : 'text-gray-500'}`}>
                          <div className="flex items-center gap-2">
                            <span>{child.class_name}</span>
                            {child.schedule_type === 'yarim_gun' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Yarım Gün
                              </span>
                            )}
                          </div>
                          {child.teacher && (
                            <span className={`block text-xs ${selectedChild === child.id ? 'text-green-100' : 'text-gray-400'}`}>
                              Öğretmen: {child.teacher.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {selectedChildData && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <BookOpen className="w-6 h-6 text-amber-600" />
                      <h3 className="text-xl font-bold text-gray-800">Montessori Günlük Raporları</h3>
                    </div>
                    {selectedChildData.daily_reports.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz günlük rapor yok</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedChildData.daily_reports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-800">
                                {new Date(report.report_date).toLocaleDateString('tr-TR')}
                              </h4>
                            </div>

                            {(report.mood || report.social_interaction) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-green-50 rounded-lg">
                                {report.mood && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Ruh Hali</h5>
                                    <p className="text-gray-700 text-sm">{report.mood}</p>
                                  </div>
                                )}
                                {report.social_interaction && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Sosyal Etkileşim</h5>
                                    <p className="text-gray-700 text-sm">{report.social_interaction}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="space-y-3">
                              {report.practical_life && (
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-green-900 mb-1">Günlük Yaşam Becerileri</h5>
                                  <p className="text-gray-700 text-sm">{report.practical_life}</p>
                                </div>
                              )}

                              {report.sensorial && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-purple-900 mb-1">Duyu Alanı</h5>
                                  <p className="text-gray-700 text-sm">{report.sensorial}</p>
                                </div>
                              )}

                              {report.mathematics && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-slate-900 mb-1">Matematik</h5>
                                  <p className="text-gray-700 text-sm">{report.mathematics}</p>
                                </div>
                              )}

                              {report.language && (
                                <div className="p-3 bg-amber-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-amber-900 mb-1">Dil</h5>
                                  <p className="text-gray-700 text-sm">{report.language}</p>
                                </div>
                              )}

                              {report.culture && (
                                <div className="p-3 bg-rose-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-rose-900 mb-1">Kozmik Alan</h5>
                                  <p className="text-gray-700 text-sm">{report.culture}</p>
                                </div>
                              )}

                              {report.general_notes && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-gray-900 mb-1">Genel Notlar</h5>
                                  <p className="text-gray-700 text-sm">{report.general_notes}</p>
                                </div>
                              )}

                              {report.media_urls && report.media_urls.length > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Fotoğraf ve Videolar</span>
                                  </h5>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {report.media_urls.map((url: string, idx: number) => {
                                      const isVideo = url.match(/\.(mp4|mov|avi|webm|mkv)$/i);
                                      return (
                                        <div key={idx} className="relative group">
                                          {isVideo ? (
                                            <video
                                              src={url}
                                              controls
                                              className="w-full h-32 object-cover rounded-lg border-2 border-white shadow-md"
                                            />
                                          ) : (
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={url}
                                                alt={`Rapor medyası ${idx + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                              />
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Yeni Randevu Talebi</h3>
                <button
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setAppointmentForm({
                      target_id: '',
                      child_id: '',
                      subject: '',
                      message: '',
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Randevu Kişisi *
                  </label>
                  <select
                    value={appointmentForm.target_id}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, target_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz...</option>
                    {targetUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({
                          user.role === 'teacher' ? 'Öğretmen' :
                          user.role === 'admin' ? 'Yönetici' :
                          'Rehberlik Birimi'
                        })
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çocuk (İsteğe Bağlı)
                  </label>
                  <select
                    value={appointmentForm.child_id}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, child_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Genel (Çocuk seçmeyin)</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konu *
                  </label>
                  <input
                    type="text"
                    value={appointmentForm.subject}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Randevu konusu..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesaj *
                  </label>
                  <textarea
                    value={appointmentForm.message}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Randevu talebinizin detaylarını yazın..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setAppointmentForm({
                        target_id: '',
                        child_id: '',
                        subject: '',
                        message: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAppointment}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Gönder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPickupModal && selectedChildData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Çocuğumu Almaya Geliyorum</h3>
                <button
                  onClick={() => {
                    setShowPickupModal(false);
                    setPickupMessage('');
                    setArrivalTime('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedChildData.first_name}</span> için öğretmene bildirim gönderilecek
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahmini Varış Saati
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesaj (İsteğe Bağlı)
                  </label>
                  <textarea
                    value={pickupMessage}
                    onChange={(e) => setPickupMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Örn: 5 dakika içinde oradayım..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPickupModal(false);
                      setPickupMessage('');
                      setArrivalTime('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPickupNotification}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Car className="w-4 h-4" />
                    <span>Bildir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
