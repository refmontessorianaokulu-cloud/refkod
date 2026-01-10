import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, DailyReport } from '../lib/supabase';
import { Baby, Plus, UtensilsCrossed, Moon, BookOpen, Image, Video, X, Calendar, Megaphone, MessageSquare, Car, Bell, CalendarCheck, ClipboardList, UserCheck, Sparkles, Package, Edit2, Upload, AlertTriangle, Home, Info } from 'lucide-react';
import AttendanceSection from './AttendanceSection';
import AnnouncementsSection from './AnnouncementsSection';
import MessagesSection from './MessagesSection';
import CalendarSection from './CalendarSection';
import AppointmentsSection from './AppointmentsSection';
import TaskResponseSection from './TaskResponseSection';
import MealMenuSection from './MealMenuSection';
import DutyScheduleSection from './DutyScheduleSection';
import CleaningRequestsSection from './CleaningRequestsSection';
import AllServicesLocationSection from './AllServicesLocationSection';
import BranchCourseReportsSection from './BranchCourseReportsSection';
import MaterialRequestsSection from './MaterialRequestsSection';
import BehaviorIncidentSection from './BehaviorIncidentSection';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';

const teacherMenuCategories: MenuCategory[] = [
  {
    id: 'homepage',
    label: 'Ana Sayfa',
    items: [
      { id: 'home', label: 'Ana Sayfa', icon: Home },
      { id: 'about', label: 'Hakkımızda', icon: Info },
    ],
  },
  {
    id: 'daily_activities',
    label: 'Günlük Aktiviteler',
    items: [
      { id: 'main', label: 'Çocuk Takibi', icon: Baby },
      { id: 'attendance', label: 'Devamsızlık', icon: Calendar },
    ],
  },
  {
    id: 'reports',
    label: 'Raporlar',
    items: [
      { id: 'branch_reports', label: 'Branş Dersleri', icon: BookOpen },
      { id: 'behavior_incidents', label: 'KOD Kayıtları', icon: AlertTriangle },
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
    id: 'operations',
    label: 'Operasyonel',
    items: [
      { id: 'appointments', label: 'Randevular', icon: CalendarCheck },
      { id: 'tasks', label: 'Görevlerim', icon: ClipboardList },
      { id: 'menu', label: 'Yemek Menüsü', icon: UtensilsCrossed },
      { id: 'duty', label: 'Nöbetçi Öğretmen', icon: UserCheck },
    ],
  },
  {
    id: 'services',
    label: 'Hizmetler',
    items: [
      { id: 'cleaning', label: 'Temizlik İstekleri', icon: Sparkles },
      { id: 'service', label: 'Servis Takibi', icon: Car },
      { id: 'material_requests', label: 'Malzeme Talepleri', icon: Package },
    ],
  },
];

export default function TeacherDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTab>(() => {
    const saved = localStorage.getItem('teacher-active-tab');
    return (saved as MenuTab) || 'home';
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showToiletModal, setShowToiletModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState('');
  const [toiletNotes, setToiletNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const [mealForm, setMealForm] = useState({
    meal_type: 'lunch' as 'breakfast' | 'lunch' | 'snack',
    amount_eaten: 'all' as 'all' | 'most' | 'some' | 'none',
    notes: '',
  });

  const [sleepForm, setSleepForm] = useState({
    start_time: '',
    end_time: '',
    notes: '',
  });

  const [mealMediaFiles, setMealMediaFiles] = useState<File[]>([]);
  const [sleepMediaFiles, setSleepMediaFiles] = useState<File[]>([]);
  const [uploadingMeal, setUploadingMeal] = useState(false);
  const [uploadingSleep, setUploadingSleep] = useState(false);

  const [reportForm, setReportForm] = useState({
    practical_life: '',
    sensorial: '',
    mathematics: '',
    language: '',
    culture: '',
    general_notes: '',
    mood: '',
    social_interaction: '',
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pickupNotifications, setPickupNotifications] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [reportDateFilter, setReportDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [reportChildFilter, setReportChildFilter] = useState<string>('all');
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('teacher-active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (profile) {
      loadChildren();
      loadPickupNotifications();
    }
  }, [profile]);

  useEffect(() => {
    if (profile && reportDateFilter) {
      loadReports();
    }
  }, [profile, reportDateFilter, reportChildFilter]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      if (!profile) return;

      const { data: teacherChildrenData } = await supabase
        .from('teacher_children')
        .select('child_id')
        .eq('teacher_id', profile.id);

      if (!teacherChildrenData || teacherChildrenData.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = teacherChildrenData.map((tc) => tc.child_id);
      const { data } = await supabase
        .from('children')
        .select('*')
        .in('id', childIds)
        .order('first_name', { ascending: true });
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      let query = supabase
        .from('daily_reports')
        .select('*, children(first_name, last_name, class_name)')
        .eq('report_date', reportDateFilter);

      if (reportChildFilter !== 'all') {
        query = query.eq('child_id', reportChildFilter);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setDailyReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadPickupNotifications = async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from('pickup_notifications')
        .select(`
          *,
          child:children(first_name, last_name),
          parent:profiles!parent_id(full_name)
        `)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false });
      setPickupNotifications(data || []);
    } catch (error) {
      console.error('Error loading pickup notifications:', error);
    }
  };

  const handleAcknowledgePickup = async (notificationId: string) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('pickup_notifications')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: profile.id,
        })
        .eq('id', notificationId);

      if (error) throw error;
      loadPickupNotifications();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const uploadMealMedia = async (): Promise<string[]> => {
    if (mealMediaFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    setUploadingMeal(true);

    try {
      for (const file of mealMediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('report-media').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    } finally {
      setUploadingMeal(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !profile) return;

    try {
      const mediaUrls = await uploadMealMedia();

      const { error } = await supabase.from('meal_logs').insert({
        child_id: selectedChild,
        teacher_id: profile.id,
        ...mealForm,
        media_urls: mediaUrls,
      });
      if (error) throw error;

      setShowMealModal(false);
      setSelectedChild('');
      setMealForm({ meal_type: 'lunch', amount_eaten: 'all', notes: '' });
      setMealMediaFiles([]);
      alert('Yemek kaydı eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const uploadSleepMedia = async (): Promise<string[]> => {
    if (sleepMediaFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    setUploadingSleep(true);

    try {
      for (const file of sleepMediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('report-media').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    } finally {
      setUploadingSleep(false);
    }
  };

  const handleAddSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !profile) return;

    try {
      const mediaUrls = await uploadSleepMedia();

      const { error } = await supabase.from('sleep_logs').insert({
        child_id: selectedChild,
        teacher_id: profile.id,
        ...sleepForm,
        media_urls: mediaUrls,
      });
      if (error) throw error;

      setShowSleepModal(false);
      setSelectedChild('');
      setSleepForm({ start_time: '', end_time: '', notes: '' });
      setSleepMediaFiles([]);
      alert('Uyku kaydı eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedChild) return;

    if (selectedChild === 'all') {
      const confirmMessage = `${children.length} çocuk için rapor eklenecek. Devam etmek istiyor musunuz?`;
      if (!confirm(confirmMessage)) return;
    }

    setUploading(true);
    try {
      const mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `reports/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('report-media')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('report-media')
            .getPublicUrl(fileName);

          mediaUrls.push(publicUrl);
        }
      }

      if (selectedChild === 'all') {
        const reportsToInsert = children.map(child => ({
          teacher_id: profile.id,
          child_id: child.id,
          practical_life: reportForm.practical_life,
          sensorial: reportForm.sensorial,
          mathematics: reportForm.mathematics,
          language: reportForm.language,
          culture: reportForm.culture,
          general_notes: reportForm.general_notes,
          mood: reportForm.mood,
          social_interaction: reportForm.social_interaction,
          media_urls: mediaUrls,
        }));

        const { error } = await supabase.from('daily_reports').insert(reportsToInsert);
        if (error) throw error;

        alert(`${children.length} çocuk için rapor başarıyla eklendi!`);
      } else {
        const { error } = await supabase.from('daily_reports').insert({
          teacher_id: profile.id,
          child_id: selectedChild,
          practical_life: reportForm.practical_life,
          sensorial: reportForm.sensorial,
          mathematics: reportForm.mathematics,
          language: reportForm.language,
          culture: reportForm.culture,
          general_notes: reportForm.general_notes,
          mood: reportForm.mood,
          social_interaction: reportForm.social_interaction,
          media_urls: mediaUrls,
        });
        if (error) throw error;

        alert('Günlük rapor eklendi!');
      }

      setShowReportModal(false);
      setSelectedChild('');
      setMediaFiles([]);
      setReportForm({
        practical_life: '',
        sensorial: '',
        mathematics: '',
        language: '',
        culture: '',
        general_notes: '',
        mood: '',
        social_interaction: '',
      });
      loadReports();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditModal = (report: any) => {
    setEditingReport(report);
    setSelectedChild(report.child_id);
    setReportForm({
      practical_life: report.practical_life || '',
      sensorial: report.sensorial || '',
      mathematics: report.mathematics || '',
      language: report.language || '',
      culture: report.culture || '',
      general_notes: report.general_notes || '',
      mood: report.mood || '',
      social_interaction: report.social_interaction || '',
    });
    setExistingMediaUrls(report.media_urls || []);
    setMediaFiles([]);
    setShowReportModal(true);
  };

  const handleEditReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editingReport) return;

    setUploading(true);
    try {
      const newMediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${editingReport.child_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('report-media')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('report-media')
            .getPublicUrl(fileName);

          newMediaUrls.push(publicUrl);
        }
      }

      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

      const { error } = await supabase
        .from('daily_reports')
        .update({
          practical_life: reportForm.practical_life,
          sensorial: reportForm.sensorial,
          mathematics: reportForm.mathematics,
          language: reportForm.language,
          culture: reportForm.culture,
          general_notes: reportForm.general_notes,
          mood: reportForm.mood,
          social_interaction: reportForm.social_interaction,
          media_urls: allMediaUrls,
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      setShowReportModal(false);
      setEditingReport(null);
      setSelectedChild('');
      setMediaFiles([]);
      setExistingMediaUrls([]);
      setReportForm({
        practical_life: '',
        sensorial: '',
        mathematics: '',
        language: '',
        culture: '',
        general_notes: '',
        mood: '',
        social_interaction: '',
      });
      loadReports();
      alert('Rapor başarıyla güncellendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSendToiletNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !profile) return;

    try {
      const { error } = await supabase.from('toilet_notifications').insert({
        child_id: selectedChild,
        sent_by: profile.id,
        notes: toiletNotes,
        status: 'pending',
      });
      if (error) throw error;

      setShowToiletModal(false);
      setSelectedChild('');
      setToiletNotes('');
      alert('Tuvalet bildirimi gönderildi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName={profile?.full_name}
        userRole="teacher"
        menuCategories={teacherMenuCategories}
        panelTitle="Öğretmen Paneli"
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

        {activeTab === 'main' && (
        <>
          {pickupNotifications.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Çocuğumu Almaya Geliyorum Bildirimi</h3>
                  <p className="text-sm text-gray-600">{pickupNotifications.length} yeni bildirim</p>
                </div>
              </div>
              <div className="space-y-3">
                {pickupNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Car className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {notification.child?.first_name} {notification.child?.last_name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Veli: {notification.parent?.full_name}
                          </p>
                          {notification.arrival_time && !isNaN(new Date(notification.arrival_time).getTime()) && (
                            <p className="text-sm text-blue-600 font-medium mt-1">
                              Tahmini Varış: {new Date(notification.arrival_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {notification.message && (
                            <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcknowledgePickup(notification.id)}
                        className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Gördüm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Çocuklar</h2>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Sınıflar</option>
                    {Array.from(new Set(children.map(c => c.class_name).filter(Boolean))).sort().map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : children.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Henüz çocuk yok</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children
                .filter(child => selectedClass === 'all' || child.class_name === selectedClass)
                .map((child) => (
                <div
                  key={child.id}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={`${child.first_name} ${child.last_name}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <Baby className="w-8 h-8 text-green-700" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">{child.class_name}</p>
                        {child.schedule_type === 'yarim_gun' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Yarım Gün
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChild(child.id);
                          setShowMealModal(true);
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors border border-green-200"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span className="text-sm font-medium">Yemek</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChild(child.id);
                          setShowSleepModal(true);
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors border border-emerald-200"
                      >
                        <Moon className="w-4 h-4" />
                        <span className="text-sm font-medium">Uyku</span>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedChild(child.id);
                        setShowToiletModal(true);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-sm"
                    >
                      <Baby className="w-4 h-4" />
                      <span className="text-sm font-medium">Tuvalet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Günlük Rapor</h2>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={reportDateFilter}
                  onChange={(e) => setReportDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
                <select
                  value={reportChildFilter}
                  onChange={(e) => setReportChildFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Tüm Öğrenciler</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {dailyReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Bu tarih için rapor yok</p>
                </div>
              ) : (
                dailyReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {report.children && (
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {report.children.first_name} {report.children.last_name}
                            {report.children.class_name && (
                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                ({report.children.class_name})
                              </span>
                            )}
                          </h4>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(report.report_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(report)}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>
                    {report.practical_life && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Pratik Yaşam:</span>
                        <p className="text-sm text-gray-700">{report.practical_life}</p>
                      </div>
                    )}
                    {report.sensorial && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Duyusal:</span>
                        <p className="text-sm text-gray-700">{report.sensorial}</p>
                      </div>
                    )}
                    {report.mathematics && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Matematik:</span>
                        <p className="text-sm text-gray-700">{report.mathematics}</p>
                      </div>
                    )}
                    {report.language && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Dil:</span>
                        <p className="text-sm text-gray-700">{report.language}</p>
                      </div>
                    )}
                    {report.culture && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Kültür:</span>
                        <p className="text-sm text-gray-700">{report.culture}</p>
                      </div>
                    )}
                    {report.general_notes && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Genel Notlar:</span>
                        <p className="text-sm text-gray-700">{report.general_notes}</p>
                      </div>
                    )}
                    {report.mood && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Ruh Hali:</span>
                        <p className="text-sm text-gray-700">{report.mood}</p>
                      </div>
                    )}
                    {report.social_interaction && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Sosyal Etkileşim:</span>
                        <p className="text-sm text-gray-700">{report.social_interaction}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AttendanceSection
              children={children}
              teacherId={profile?.id}
              userRole={profile?.role || undefined}
              userId={profile?.id}
            />
          </div>
        )}

        {activeTab === 'branch_reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <BranchCourseReportsSection
              children={children}
              teacherId={profile?.id}
              userRole="teacher"
            />
          </div>
        )}

        {activeTab === 'material_requests' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MaterialRequestsSection
              userId={profile?.id || ''}
              userRole="teacher"
            />
          </div>
        )}

        {activeTab === 'behavior_incidents' && profile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <BehaviorIncidentSection
              userId={profile.id}
              userRole="teacher"
            />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AnnouncementsSection userId={profile?.id || ''} userRole="teacher" children={children} />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MessagesSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CalendarSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AppointmentsSection userId={profile?.id || ''} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TaskResponseSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MealMenuSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'duty' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <DutyScheduleSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'cleaning' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CleaningRequestsSection userId={profile?.id || ''} userRole="teacher" />
          </div>
        )}

        {activeTab === 'service' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AllServicesLocationSection />
          </div>
        )}
      </div>

      {showMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yemek Kaydı Ekle</h3>
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öğün</label>
                <select
                  value={mealForm.meal_type}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, meal_type: e.target.value as 'breakfast' | 'lunch' | 'snack' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="breakfast">Kahvaltı</option>
                  <option value="lunch">Öğle Yemeği</option>
                  <option value="snack">Ara Öğün</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ne Kadar Yedi?</label>
                <select
                  value={mealForm.amount_eaten}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, amount_eaten: e.target.value as 'all' | 'most' | 'some' | 'none' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Hepsini</option>
                  <option value="most">Çoğunu</option>
                  <option value="some">Biraz</option>
                  <option value="none">Hiç</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={mealForm.notes}
                  onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraf/Video (İsteğe Bağlı)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setMealMediaFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="meal-media-upload"
                  />
                  <label
                    htmlFor="meal-media-upload"
                    className="flex items-center justify-center space-x-2 cursor-pointer text-green-600 hover:text-green-700"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Dosya Seç</span>
                  </label>
                  {mealMediaFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mealMediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setMealMediaFiles(mealMediaFiles.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMealModal(false);
                    setSelectedChild('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadingMeal}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingMeal ? 'Yükleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSleepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Uyku Kaydı Ekle</h3>
            <form onSubmit={handleAddSleep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Saati</label>
                <input
                  type="datetime-local"
                  required
                  value={sleepForm.start_time}
                  onChange={(e) => setSleepForm({ ...sleepForm, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Saati</label>
                <input
                  type="datetime-local"
                  required
                  value={sleepForm.end_time}
                  onChange={(e) => setSleepForm({ ...sleepForm, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraf/Video (İsteğe Bağlı)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setSleepMediaFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="sleep-media-upload"
                  />
                  <label
                    htmlFor="sleep-media-upload"
                    className="flex items-center justify-center space-x-2 cursor-pointer text-green-600 hover:text-green-700"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Dosya Seç</span>
                  </label>
                  {sleepMediaFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {sleepMediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSleepMediaFiles(sleepMediaFiles.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSleepModal(false);
                    setSelectedChild('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadingSleep}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingSleep ? 'Yükleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingReport ? 'Montessori Raporu Düzenle' : 'Montessori Günlük Rapor'}
            </h3>
            <form onSubmit={editingReport ? handleEditReport : handleAddReport} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk</label>
                <select
                  required
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={!!editingReport}
                >
                  <option value="">Çocuk seçin...</option>
                  {!editingReport && (
                    <option value="all" className="font-bold">
                      ✓ Tüm Çocuklar ({children.length})
                    </option>
                  )}
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
                {selectedChild === 'all' && !editingReport && (
                  <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                    ℹ Bu rapor tüm çocuklarınıza ({children.length} çocuk) aynı içerikle kaydedilecektir.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ruh Hali</label>
                  <textarea
                    value={reportForm.mood}
                    onChange={(e) => setReportForm({ ...reportForm, mood: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Çocuğun günlük ruh hali ve genel durumu..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sosyal Etkileşim</label>
                  <textarea
                    value={reportForm.social_interaction}
                    onChange={(e) => setReportForm({ ...reportForm, social_interaction: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Arkadaşlarıyla etkileşimi, sosyal davranışları..."
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Montessori Alanları</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Günlük Yaşam Becerileri
                      <span className="text-xs text-gray-500 ml-2">(Öz bakım, çevre bakımı, nezaket kuralları)</span>
                    </label>
                    <textarea
                      value={reportForm.practical_life}
                      onChange={(e) => setReportForm({ ...reportForm, practical_life: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Örn: El yıkama, giysilerini asma, masayı hazırlama..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duyu Alanı
                      <span className="text-xs text-gray-500 ml-2">(Beş duyu geliştirme çalışmaları)</span>
                    </label>
                    <textarea
                      value={reportForm.sensorial}
                      onChange={(e) => setReportForm({ ...reportForm, sensorial: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Örn: Renk eşleştirme, dokunma tabletleri, ses kutuları..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matematik
                      <span className="text-xs text-gray-500 ml-2">(Sayılar, geometri, matematiksel kavramlar)</span>
                    </label>
                    <textarea
                      value={reportForm.mathematics}
                      onChange={(e) => setReportForm({ ...reportForm, mathematics: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Örn: Sayı çubukları, geometrik şekiller, sayma alıştırmaları..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dil
                      <span className="text-xs text-gray-500 ml-2">(Konuşma, okuma hazırlığı, yazma)</span>
                    </label>
                    <textarea
                      value={reportForm.language}
                      onChange={(e) => setReportForm({ ...reportForm, language: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Örn: Harf tanıma, hikaye dinleme, kelime oyunları..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kozmik Alan
                      <span className="text-xs text-gray-500 ml-2">(Coğrafya, Bilim, Sanat, Müzik)</span>
                    </label>
                    <textarea
                      value={reportForm.culture}
                      onChange={(e) => setReportForm({ ...reportForm, culture: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Örn: Dünya haritası çalışması, doğa gözlemi, resim yapma, müzik dinleme..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fotoğraf ve Video Ekle
                  <span className="text-xs text-gray-500 ml-2">(İsteğe bağlı)</span>
                </label>
                <div className="space-y-3">
                  {editingReport && existingMediaUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Mevcut Medyalar</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {existingMediaUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={url} alt={`Media ${index + 1}`} className="w-full h-24 object-cover" />
                              ) : (
                                <video src={url} className="w-full h-24 object-cover" />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setExistingMediaUrls(existingMediaUrls.filter((_, i) => i !== index));
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 transition-colors">
                        <Image className="w-5 h-5 text-blue-600" />
                        <Video className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">{editingReport ? 'Yeni Dosya Ekle' : 'Dosya Seç'}</span>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            setMediaFiles([...mediaFiles, ...Array.from(e.target.files)]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center space-x-2">
                              {file.type.startsWith('image/') ? (
                                <Image className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              ) : (
                                <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700 truncate flex-1">
                                {file.name}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaFiles(mediaFiles.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genel Notlar</label>
                <textarea
                  value={reportForm.general_notes}
                  onChange={(e) => setReportForm({ ...reportForm, general_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Günle ilgili özel notlar, gözlemler veya veliye iletilmesi gereken bilgiler..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setEditingReport(null);
                    setSelectedChild('');
                    setMediaFiles([]);
                    setExistingMediaUrls([]);
                    setReportForm({
                      practical_life: '',
                      sensorial: '',
                      mathematics: '',
                      language: '',
                      culture: '',
                      general_notes: '',
                      mood: '',
                      social_interaction: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Yükleniyor...' : (editingReport ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToiletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Tuvalet Bildirimi Gönder</h3>
            <form onSubmit={handleSendToiletNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çocuk Seçin
                </label>
                <select
                  required
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Çocuk seçin...</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar (İsteğe Bağlı)
                </label>
                <textarea
                  value={toiletNotes}
                  onChange={(e) => setToiletNotes(e.target.value)}
                  placeholder="Örn: Acil, özel dikkat gerekiyor..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowToiletModal(false);
                    setSelectedChild('');
                    setToiletNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
