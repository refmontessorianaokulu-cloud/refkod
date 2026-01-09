import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, Profile, DailyReport } from '../lib/supabase';
import { Users, Baby, LogOut, Plus, Trash2, UserPlus, BookOpen, GraduationCap, CheckCircle, XCircle, Calendar, Megaphone, MessageSquare, Car, Bell, CalendarCheck, ClipboardList, UtensilsCrossed, UserCheck, CreditCard as Edit, Sparkles, Package, FileText } from 'lucide-react';
import AttendanceSection from './AttendanceSection';
import AnnouncementsSection from './AnnouncementsSection';
import MessagesSection from './MessagesSection';
import CalendarSection from './CalendarSection';
import FeesSection from './FeesSection';
import AppointmentsSection from './AppointmentsSection';
import TasksSection from './TasksSection';
import MealMenuSection from './MealMenuSection';
import DutyScheduleSection from './DutyScheduleSection';
import AdminServiceManagement from './AdminServiceManagement';
import CleaningRequestsSection from './CleaningRequestsSection';
import AllServicesLocationSection from './AllServicesLocationSection';
import BranchCourseReportsSection from './BranchCourseReportsSection';
import InquiryFormsSection from './InquiryFormsSection';
import MaterialRequestsSection from './MaterialRequestsSection';

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'children' | 'users' | 'montessori_reports' | 'branch_reports' | 'attendance' | 'announcements' | 'messages' | 'calendar' | 'fees' | 'appointments' | 'tasks' | 'menu' | 'duty' | 'services' | 'cleaning' | 'inquiries' | 'material_requests' | 'reference_applications'>('children');
  const [children, setChildren] = useState<Child[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showParentLinkModal, setShowParentLinkModal] = useState(false);
  const [showTeacherLinkModal, setShowTeacherLinkModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [parents, setParents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupNotifications, setPickupNotifications] = useState<any[]>([]);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [reportDateFilter, setReportDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [reportChildFilter, setReportChildFilter] = useState<string>('all');
  const [reportClassFilter, setReportClassFilter] = useState<string>('all');
  const [referenceApplications, setReferenceApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const [childForm, setChildForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    class_name: '',
    photo_url: '',
    parent_id: '',
    teacher_id: '',
  });

  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'parent' as 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff',
    staff_role: undefined as 'cook' | 'cleaning_staff' | 'bus_driver' | 'security_staff' | 'toilet_attendant' | 'other' | undefined,
  });

  useEffect(() => {
    loadData();
    loadParentsAndTeachers();
    loadPickupNotifications();
    if (activeTab === 'reference_applications') {
      loadReferenceApplications();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'montessori_reports' && reportDateFilter) {
      loadDailyReports();
    }
  }, [reportDateFilter, reportChildFilter, reportClassFilter, activeTab]);

  const loadParentsAndTeachers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['parent', 'teacher'])
        .eq('approved', true);
      const parentData = data?.filter(u => u.role === 'parent') || [];
      const teacherData = data?.filter(u => u.role === 'teacher') || [];
      setParents(parentData);
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error loading parents and teachers:', error);
    }
  };

  const loadPickupNotifications = async () => {
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

  const loadDailyReports = async () => {
    try {
      let query = supabase
        .from('daily_reports')
        .select('*, children(first_name, last_name, class_name)')
        .eq('report_date', reportDateFilter);

      if (reportChildFilter !== 'all') {
        query = query.eq('child_id', reportChildFilter);
      }

      const { data } = await query.order('created_at', { ascending: false });

      let filteredData = data || [];
      if (reportClassFilter !== 'all') {
        filteredData = filteredData.filter((report: any) =>
          report.children?.class_name === reportClassFilter
        );
      }

      setDailyReports(filteredData);
    } catch (error) {
      console.error('Error loading daily reports:', error);
    }
  };

  const loadReferenceApplications = async () => {
    try {
      const { data } = await supabase
        .from('reference_teacher_applications')
        .select('*')
        .order('created_at', { ascending: false });
      setReferenceApplications(data || []);
    } catch (error) {
      console.error('Error loading reference applications:', error);
    }
  };

  const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('reference_teacher_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setReferenceApplications(prev =>
        prev.map(app => app.id === id ? { ...app, status } : app)
      );
      setSelectedApplication(null);
      alert(`Başvuru ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Durum güncellenirken hata oluştu.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: false });
      setChildren(childrenData || []);

      if (activeTab === 'children') {
        // Already loaded above
      } else if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
        const parentData = data?.filter(u => u.role === 'parent') || [];
        const teacherData = data?.filter(u => u.role === 'teacher') || [];
        setParents(parentData);
        setTeachers(teacherData);
      } else if (activeTab === 'montessori_reports') {
        await loadDailyReports();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingPhoto(true);
    try {
      let photoUrl = childForm.photo_url;

      if (selectedPhotoFile) {
        const fileExt = selectedPhotoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('child-photos')
          .upload(filePath, selectedPhotoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error('Fotoğraf yükleme hatası: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('child-photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      const { data: newChild, error } = await supabase
        .from('children')
        .insert({
          first_name: childForm.first_name,
          last_name: childForm.last_name,
          birth_date: childForm.birth_date,
          class_name: childForm.class_name,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (error) throw error;

      if (newChild && childForm.parent_id) {
        const { error: parentError } = await supabase
          .from('parent_children')
          .insert({
            parent_id: childForm.parent_id,
            child_id: newChild.id,
          });
        if (parentError) console.error('Parent link error:', parentError);
      }

      if (newChild && childForm.teacher_id) {
        const { error: teacherError } = await supabase
          .from('teacher_children')
          .insert({
            teacher_id: childForm.teacher_id,
            child_id: newChild.id,
          });
        if (teacherError) console.error('Teacher link error:', teacherError);
      }

      setShowChildModal(false);
      setChildForm({
        first_name: '',
        last_name: '',
        birth_date: '',
        class_name: '',
        photo_url: '',
        parent_id: '',
        teacher_id: ''
      });
      setSelectedPhotoFile(null);
      loadData();
      alert('Çocuk başarıyla eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
      });
      if (error) throw error;

      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          email: userForm.email,
          full_name: userForm.full_name,
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: profile?.id
        };

        if (userForm.role === 'staff' && userForm.staff_role) {
          profileData.role = null;
          profileData.staff_role = userForm.staff_role;
        } else {
          profileData.role = userForm.role;
          profileData.staff_role = null;
        }

        const { error: profileError } = await supabase.from('profiles').insert(profileData);
        if (profileError) throw profileError;
      }

      setShowUserModal(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'parent', staff_role: undefined });
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleLinkParent = async (parentId: string) => {
    try {
      const { error } = await supabase.from('parent_children').insert({
        parent_id: parentId,
        child_id: selectedChild,
      });
      if (error) throw error;
      setShowParentLinkModal(false);
      setSelectedChild('');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleLinkTeacher = async (teacherId: string) => {
    try {
      const { error } = await supabase.from('teacher_children').insert({
        teacher_id: teacherId,
        child_id: selectedChild,
      });
      if (error) throw error;
      setShowTeacherLinkModal(false);
      setSelectedChild('');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleDeleteChild = async (id: string) => {
    if (!confirm('Bu çocuğu silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('children').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChildId(child.id);
    setChildForm({
      first_name: child.first_name,
      last_name: child.last_name,
      birth_date: child.birth_date,
      class_name: child.class_name,
      photo_url: child.photo_url || '',
      parent_id: '',
      teacher_id: '',
    });
    setShowChildModal(true);
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChildId) return;

    setUploadingPhoto(true);
    try {
      let photoUrl = childForm.photo_url;

      if (selectedPhotoFile) {
        const fileExt = selectedPhotoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('child-photos')
          .upload(filePath, selectedPhotoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error('Fotoğraf yükleme hatası: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('child-photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('children')
        .update({
          first_name: childForm.first_name,
          last_name: childForm.last_name,
          birth_date: childForm.birth_date,
          class_name: childForm.class_name,
          photo_url: photoUrl,
        })
        .eq('id', editingChildId);

      if (error) throw error;

      setShowChildModal(false);
      setEditingChildId(null);
      setChildForm({
        first_name: '',
        last_name: '',
        birth_date: '',
        class_name: '',
        photo_url: '',
        parent_id: '',
        teacher_id: '',
      });
      setSelectedPhotoFile(null);
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: profile?.id
        })
        .eq('id', userId);

      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı reddetmek istediğinize emin misiniz? Kullanıcı silinecektir.')) return;
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
                alt="REF Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Yönetici Paneli</h1>
                <p className="text-sm text-gray-500">{profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('children')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'children'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Baby className="w-5 h-5" />
                <span>Çocuklar</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Kullanıcılar</span>
              </button>
              <button
                onClick={() => setActiveTab('montessori_reports')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'montessori_reports'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>Montessori Raporları</span>
              </button>
              <button
                onClick={() => setActiveTab('branch_reports')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'branch_reports'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Branş Dersleri</span>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Devamsızlık</span>
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'announcements'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Megaphone className="w-5 h-5" />
                <span>Duyurular</span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Mesajlar</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Akademik Takvim</span>
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'fees'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg font-bold">₺</span>
                <span>Okul Ödemeleri</span>
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Randevular</span>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span>Görevlendirmeler</span>
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'menu'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span>Yemek Menüsü</span>
              </button>
              <button
                onClick={() => setActiveTab('duty')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'duty'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span>Nöbetçi Öğretmen</span>
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'services'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Car className="w-5 h-5" />
                <span>Servis Takibi</span>
              </button>
              <button
                onClick={() => setActiveTab('cleaning')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'cleaning'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>Temizlik</span>
              </button>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'inquiries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Bilgi Talepleri</span>
              </button>
              <button
                onClick={() => setActiveTab('material_requests')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'material_requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Malzeme Talepleri</span>
              </button>
              <button
                onClick={() => setActiveTab('reference_applications')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'reference_applications'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Referans Öğretmen Başvuruları</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'children' && (
              <div>
                {pickupNotifications.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Alış Bildirimleri</h3>
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

                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">Çocuklar</h2>
                  <div className="flex items-center space-x-3">
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
                    <button
                      onClick={() => setShowChildModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Çocuk Ekle</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : children.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Henüz çocuk eklenmemiş
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children
                      .filter(child => selectedClass === 'all' || child.class_name === selectedClass)
                      .map((child) => (
                      <div
                        key={child.id}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4 mb-4">
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
                            <h3 className="text-lg font-semibold text-gray-800">
                              {child.first_name} {child.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{child.class_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditChild(child)}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedChild(child.id);
                                setShowParentLinkModal(true);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Veli Bağla"
                            >
                              <UserPlus className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedChild(child.id);
                                setShowTeacherLinkModal(true);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Öğretmen Bağla"
                            >
                              <GraduationCap className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(child.id)}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Kullanıcılar</h2>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Kullanıcı Ekle</span>
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Henüz kullanıcı yok
                  </div>
                ) : (
                  <div className="space-y-6">
                    {users.filter(u => !u.approved && u.role !== 'admin').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2">
                            {users.filter(u => !u.approved && u.role !== 'admin').length}
                          </span>
                          Onay Bekleyen Kullanıcılar
                        </h3>
                        <div className="overflow-x-auto bg-yellow-50 rounded-lg border border-yellow-200">
                          <table className="w-full">
                            <thead className="bg-yellow-100 border-b border-yellow-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Ad Soyad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  E-posta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  İşlemler
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-yellow-200">
                              {users.filter(u => !u.approved && u.role !== 'admin').map((user) => {
                                const getRoleLabel = () => {
                                  if (user.role === 'teacher') return 'Öğretmen';
                                  if (user.role === 'parent') return 'Veli';
                                  if (user.role === 'guidance_counselor') return 'Rehberlik';
                                  if (user.staff_role === 'cook') return 'Aşçı';
                                  if (user.staff_role === 'cleaning_staff') return 'Temizlik Personeli';
                                  if (user.staff_role === 'bus_driver') return 'Servis Şoförü';
                                  if (user.staff_role === 'security_staff') return 'Güvenlik';
                                  if (user.staff_role === 'toilet_attendant') return 'Tuvalet Ablası';
                                  if (user.staff_role === 'other') return 'Diğer Personel';
                                  return 'Personel';
                                };

                                return (
                                  <tr key={user.id} className="hover:bg-yellow-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {user.full_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          user.role === 'teacher'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : user.role === 'parent'
                                            ? 'bg-green-100 text-green-800'
                                            : user.role === 'guidance_counselor'
                                            ? 'bg-teal-100 text-teal-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {getRoleLabel()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleApproveUser(user.id)}
                                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Onayla</span>
                                        </button>
                                        <button
                                          onClick={() => handleRejectUser(user.id)}
                                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          <span>Reddet</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tüm Kullanıcılar</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ad Soyad
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                E-posta
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Durum
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => {
                              const getRoleLabel = () => {
                                if (user.role === 'admin') return 'Yönetici';
                                if (user.role === 'teacher') return 'Öğretmen';
                                if (user.role === 'parent') return 'Veli';
                                if (user.role === 'guidance_counselor') return 'Rehberlik';
                                if (user.staff_role === 'cook') return 'Aşçı';
                                if (user.staff_role === 'cleaning_staff') return 'Temizlik Personeli';
                                if (user.staff_role === 'bus_driver') return 'Servis Şoförü';
                                if (user.staff_role === 'security_staff') return 'Güvenlik';
                                if (user.staff_role === 'toilet_attendant') return 'Tuvalet Ablası';
                                if (user.staff_role === 'other') return 'Diğer Personel';
                                return 'Bilinmiyor';
                              };

                              const getRoleColor = () => {
                                if (user.role === 'admin') return 'bg-red-100 text-red-800';
                                if (user.role === 'teacher') return 'bg-emerald-100 text-emerald-800';
                                if (user.role === 'parent') return 'bg-green-100 text-green-800';
                                if (user.role === 'guidance_counselor') return 'bg-teal-100 text-teal-800';
                                if (user.staff_role) return 'bg-amber-100 text-amber-800';
                                return 'bg-gray-100 text-gray-800';
                              };

                              return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.full_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor()}`}>
                                      {getRoleLabel()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.approved || user.role === 'admin'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {user.approved || user.role === 'admin' ? 'Onaylı' : 'Bekliyor'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'montessori_reports' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Montessori Günlük Raporları</h2>
                </div>

                <div className="flex items-center space-x-3 mb-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                    <select
                      value={reportClassFilter}
                      onChange={(e) => {
                        setReportClassFilter(e.target.value);
                        setReportChildFilter('all');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="all">Tüm Sınıflar</option>
                      {Array.from(new Set(children.map(c => c.class_name).filter(Boolean))).sort().map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
                    <select
                      value={reportChildFilter}
                      onChange={(e) => setReportChildFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="all">Tüm Öğrenciler</option>
                      {children
                        .filter(child => reportClassFilter === 'all' || child.class_name === reportClassFilter)
                        .map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.first_name} {child.last_name} {child.class_name ? `(${child.class_name})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : dailyReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Bu tarih için rapor yok
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dailyReports.map((report: any) => (
                      <div
                        key={report.id}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                          <div>
                            {report.children && (
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {report.children.first_name} {report.children.last_name}
                                {report.children.class_name && (
                                  <span className="ml-2 text-sm text-gray-500 font-normal">
                                    ({report.children.class_name})
                                  </span>
                                )}
                              </h3>
                            )}
                            <span className="text-sm text-gray-600">
                              {new Date(report.report_date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>

                        {(report.mood || report.social_interaction) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-green-50 rounded-lg">
                            {report.mood && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Ruh Hali</h4>
                                <p className="text-gray-700 text-sm">{report.mood}</p>
                              </div>
                            )}
                            {report.social_interaction && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sosyal Etkileşim</h4>
                                <p className="text-gray-700 text-sm">{report.social_interaction}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          {report.practical_life && (
                            <div className="p-4 bg-green-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-green-900 mb-2">Günlük Yaşam Becerileri</h4>
                              <p className="text-gray-700 text-sm">{report.practical_life}</p>
                            </div>
                          )}

                          {report.sensorial && (
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-purple-900 mb-2">Duyu Alanı</h4>
                              <p className="text-gray-700 text-sm">{report.sensorial}</p>
                            </div>
                          )}

                          {report.mathematics && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-slate-900 mb-2">Matematik</h4>
                              <p className="text-gray-700 text-sm">{report.mathematics}</p>
                            </div>
                          )}

                          {report.language && (
                            <div className="p-4 bg-amber-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-amber-900 mb-2">Dil</h4>
                              <p className="text-gray-700 text-sm">{report.language}</p>
                            </div>
                          )}

                          {report.culture && (
                            <div className="p-4 bg-rose-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-rose-900 mb-2">Kozmik Alan</h4>
                              <p className="text-gray-700 text-sm">{report.culture}</p>
                            </div>
                          )}

                          {report.general_notes && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Genel Notlar</h4>
                              <p className="text-gray-700 text-sm">{report.general_notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 pt-4 mt-4 border-t border-gray-200">
                          Oluşturulma: {new Date(report.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                <AttendanceSection
                  children={children}
                  teacherId={profile?.id}
                  userRole={profile?.role || undefined}
                  userId={profile?.id}
                />
              </div>
            )}

            {activeTab === 'announcements' && (
              <div>
                <AnnouncementsSection userId={profile?.id || ''} userRole="admin" children={children} />
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <MessagesSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div>
                <CalendarSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'fees' && (
              <div>
                <FeesSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <AppointmentsSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <TasksSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'menu' && (
              <div>
                <MealMenuSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'duty' && (
              <div>
                <DutyScheduleSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <AllServicesLocationSection />
                </div>
                <div>
                  <AdminServiceManagement />
                </div>
              </div>
            )}

            {activeTab === 'branch_reports' && (
              <div>
                <BranchCourseReportsSection
                  children={children}
                  teacherId={profile?.id}
                  userRole="admin"
                />
              </div>
            )}

            {activeTab === 'cleaning' && (
              <div>
                <CleaningRequestsSection userId={profile?.id || ''} userRole="admin" />
              </div>
            )}

            {activeTab === 'inquiries' && (
              <div>
                <InquiryFormsSection />
              </div>
            )}

            {activeTab === 'material_requests' && (
              <div>
                <MaterialRequestsSection
                  userId={profile?.id || ''}
                  userRole="admin"
                />
              </div>
            )}

            {activeTab === 'reference_applications' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Referans Öğretmen Başvuruları</h2>
                  <p className="text-gray-600 mt-1">Son başvuru tarihi: 23 Ocak</p>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : referenceApplications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Henüz başvuru yok</div>
                ) : (
                  <div className="grid gap-4">
                    {referenceApplications.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-4">
                            {app.photo_url && (
                              <img
                                src={app.photo_url}
                                alt={app.full_name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{app.full_name}</h3>
                              <p className="text-sm text-gray-600">{app.email}</p>
                              <p className="text-sm text-gray-600">{app.phone}</p>
                              <span
                                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                                  app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status === 'approved'
                                  ? 'Onaylandı'
                                  : app.status === 'rejected'
                                  ? 'Reddedildi'
                                  : 'Beklemede'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Detayları Gör
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingChildId ? 'Çocuk Bilgilerini Güncelle' : 'Yeni Çocuk Ekle'}
            </h3>
            <form onSubmit={editingChildId ? handleUpdateChild : handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                <input
                  type="text"
                  required
                  value={childForm.first_name}
                  onChange={(e) => setChildForm({ ...childForm, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                <input
                  type="text"
                  required
                  value={childForm.last_name}
                  onChange={(e) => setChildForm({ ...childForm, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                <input
                  type="date"
                  required
                  value={childForm.birth_date}
                  onChange={(e) => setChildForm({ ...childForm, birth_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sınıf</label>
                <select
                  required
                  value={childForm.class_name}
                  onChange={(e) => setChildForm({ ...childForm, class_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sınıf seçin...</option>
                  <option value="5 Yaş Sınıfı">5 Yaş Sınıfı</option>
                  <option value="4 Yaş Sınıfı">4 Yaş Sınıfı</option>
                  <option value="3 Yaş Sınıfı">3 Yaş Sınıfı</option>
                  <option value="2 Yaş Sınıfı">2 Yaş Sınıfı</option>
                </select>
              </div>
              {!editingChildId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Veli</label>
                    <select
                      value={childForm.parent_id}
                      onChange={(e) => setChildForm({ ...childForm, parent_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Veli seçin (isteğe bağlı)...</option>
                      {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.full_name} ({parent.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Öğretmen</label>
                    <select
                      value={childForm.teacher_id}
                      onChange={(e) => setChildForm({ ...childForm, teacher_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Öğretmen seçin (isteğe bağlı)...</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name} ({teacher.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotoğraf</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
                          e.target.value = '';
                          return;
                        }
                        setSelectedPhotoFile(file);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {selectedPhotoFile && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">Seçili:</span>
                      <span>{selectedPhotoFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoFile(null)}
                        className="ml-auto text-red-600 hover:text-red-700"
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChildModal(false);
                    setSelectedPhotoFile(null);
                    setEditingChildId(null);
                    setChildForm({
                      first_name: '',
                      last_name: '',
                      birth_date: '',
                      class_name: '',
                      photo_url: '',
                      parent_id: '',
                      teacher_id: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? 'Yükleniyor...' : (editingChildId ? 'Güncelle' : 'Ekle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="parent">Veli</option>
                  <option value="teacher">Öğretmen</option>
                  <option value="admin">Yönetici</option>
                  <option value="guidance_counselor">Rehberlik Birimi</option>
                  <option value="staff">Personel</option>
                </select>
              </div>
              {userForm.role === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personel Türü</label>
                  <select
                    value={userForm.staff_role || ''}
                    onChange={(e) =>
                      setUserForm({ ...userForm, staff_role: e.target.value as 'cook' | 'cleaning_staff' | 'bus_driver' | 'security_staff' | 'toilet_attendant' | 'other' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Personel türü seçin...</option>
                    <option value="cook">Aşçı</option>
                    <option value="cleaning_staff">Temizlik Personeli</option>
                    <option value="bus_driver">Servis Şoförü</option>
                    <option value="security_staff">Güvenlik</option>
                    <option value="toilet_attendant">Tuvalet Ablası</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showParentLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Veli Bağla</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parents.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => handleLinkParent(parent.id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{parent.full_name}</div>
                  <div className="text-sm text-gray-500">{parent.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowParentLinkModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {showTeacherLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Öğretmen Bağla</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleLinkTeacher(teacher.id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{teacher.full_name}</div>
                  <div className="text-sm text-gray-500">{teacher.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTeacherLinkModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Başvuru Detayları</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {selectedApplication.photo_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedApplication.photo_url}
                    alt={selectedApplication.full_name}
                    className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <p className="text-gray-900">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <p className="text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <p className="text-gray-900">{selectedApplication.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <p className="text-gray-900">{selectedApplication.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mezun Olduğu Okul</label>
                  <p className="text-gray-900">{selectedApplication.graduated_school}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mezun Olduğu Program</label>
                  <p className="text-gray-900">{selectedApplication.graduated_program}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formasyon</label>
                  <p className="text-gray-900">{selectedApplication.has_formation ? 'Var' : 'Yok'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Durumu</label>
                  <p className="text-gray-900">
                    {selectedApplication.is_working ? `Çalışıyor - ${selectedApplication.workplace}` : 'Çalışmıyor'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montessori Eğitimi</label>
                  <p className="text-gray-900">{selectedApplication.has_montessori_training ? 'Aldı' : 'Almadı'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başvuru Tarihi</label>
                  <p className="text-gray-900">
                    {new Date(selectedApplication.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aldığı Eğitimler</label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedApplication.previous_trainings}
                </p>
              </div>

              {selectedApplication.reference_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referans Bilgisi</label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedApplication.reference_info}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Değerlendirme Yazısı</label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedApplication.evaluation_essay}
                </p>
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
