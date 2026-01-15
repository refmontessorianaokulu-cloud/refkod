import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Plus, Edit2, Trash2, Save, X, CheckCircle, Clock, Eye, FileText, TrendingUp, Download, Filter, Users, GraduationCap, AlertCircle, CheckSquare, Square } from 'lucide-react';
import jsPDF from 'jspdf';

interface AcademicPeriod {
  id: string;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface PeriodicReport {
  id: string;
  child_id: string;
  teacher_id: string;
  period_id: string;
  practical_life: string;
  sensorial: string;
  mathematics: string;
  language: string;
  culture: string;
  english: string;
  quran: string;
  moral_values: string;
  etiquette: string;
  art_music: string;
  focus_duration: 'high' | 'medium' | 'low' | null;
  communication_skills: 'high' | 'medium' | 'low' | null;
  collaboration: 'high' | 'medium' | 'low' | null;
  motivation: 'high' | 'medium' | 'low' | null;
  cleanliness_order: 'high' | 'medium' | 'low' | null;
  material_usage_skills: 'high' | 'medium' | 'low' | null;
  productivity: 'high' | 'medium' | 'low' | null;
  general_evaluation: string;
  montessori_interests: string;
  learning_process_evaluation: string;
  recommendations: string;
  guidance_evaluation: string;
  english_teacher_id: string | null;
  english_completed: boolean;
  quran_teacher_id: string | null;
  quran_completed: boolean;
  moral_values_teacher_id: string | null;
  moral_values_completed: boolean;
  etiquette_teacher_id: string | null;
  etiquette_completed: boolean;
  art_music_teacher_id: string | null;
  art_music_completed: boolean;
  montessori_teacher_id: string | null;
  montessori_completed: boolean;
  guidance_teacher_id: string | null;
  guidance_completed: boolean;
  status: 'draft' | 'completed' | 'approved';
  created_at: string;
  updated_at: string;
  children?: {
    first_name: string;
    last_name: string;
    class_name: string;
  };
  profiles?: {
    full_name: string;
  };
  academic_periods?: {
    name: string;
  };
}

export default function AdminPeriodicReportsManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [reports, setReports] = useState<PeriodicReport[]>([]);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [pendingOnlyFilter, setPendingOnlyFilter] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PeriodicReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [classes, setClasses] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [periodForm, setPeriodForm] = useState({
    name: '',
    period_number: 1,
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const t = {
    title: { tr: 'Ref Karne Yönetimi', en: 'Ref Report Card Management' },
    academicPeriods: { tr: 'Akademik Dönemler', en: 'Academic Periods' },
    createPeriod: { tr: 'Yeni Dönem Oluştur', en: 'Create New Period' },
    editPeriod: { tr: 'Dönemi Düzenle', en: 'Edit Period' },
    periodName: { tr: 'Dönem Adı', en: 'Period Name' },
    periodNumber: { tr: 'Dönem Numarası', en: 'Period Number' },
    startDate: { tr: 'Başlangıç Tarihi', en: 'Start Date' },
    endDate: { tr: 'Bitiş Tarihi', en: 'End Date' },
    active: { tr: 'Aktif', en: 'Active' },
    save: { tr: 'Kaydet', en: 'Save' },
    cancel: { tr: 'İptal', en: 'Cancel' },
    edit: { tr: 'Düzenle', en: 'Edit' },
    delete: { tr: 'Sil', en: 'Delete' },
    reports: { tr: 'Karneler', en: 'Report Cards' },
    selectPeriod: { tr: 'Dönem Seçin', en: 'Select Period' },
    allStatuses: { tr: 'Tüm Durumlar', en: 'All Statuses' },
    draft: { tr: 'Taslak', en: 'Draft' },
    completed: { tr: 'Tamamlandı', en: 'Completed' },
    approved: { tr: 'Onaylandı', en: 'Approved' },
    student: { tr: 'Öğrenci', en: 'Student' },
    teacher: { tr: 'Öğretmen', en: 'Teacher' },
    period: { tr: 'Dönem', en: 'Period' },
    status: { tr: 'Durum', en: 'Status' },
    actions: { tr: 'İşlemler', en: 'Actions' },
    approve: { tr: 'Onayla', en: 'Approve' },
    revokeApproval: { tr: 'Onayı Kaldır', en: 'Revoke Approval' },
    view: { tr: 'Görüntüle', en: 'View' },
    statistics: { tr: 'İstatistikler', en: 'Statistics' },
    totalReports: { tr: 'Toplam Karne', en: 'Total Report Cards' },
    completedReports: { tr: 'Tamamlanan', en: 'Completed' },
    approvedReports: { tr: 'Onaylanan', en: 'Approved' },
    pendingReports: { tr: 'Bekleyen', en: 'Pending' },
    noPeriods: { tr: 'Henüz dönem bulunmuyor', en: 'No periods yet' },
    noReports: { tr: 'Karne bulunmuyor', en: 'No report cards found' },
    branch: { tr: 'Sınıf', en: 'Branch' },
    class: { tr: 'Sınıf', en: 'Class' },
    allClasses: { tr: 'Tüm Sınıflar', en: 'All Classes' },
    allTeachers: { tr: 'Tüm Öğretmenler', en: 'All Teachers' },
    filters: { tr: 'Filtreler', en: 'Filters' },
    pendingApprovalOnly: { tr: 'Sadece Onay Bekleyenler', en: 'Pending Approval Only' },
    completion: { tr: 'Tamamlanma', en: 'Completion' },
    bulkApprove: { tr: 'Toplu Onayla', en: 'Bulk Approve' },
    selectAll: { tr: 'Tümünü Seç', en: 'Select All' },
    deselectAll: { tr: 'Tümünü Kaldır', en: 'Deselect All' },
    selected: { tr: 'Seçili', en: 'Selected' },
    montessoriSections: { tr: 'Montessori Alanları', en: 'Montessori Areas' },
    branchCourses: { tr: 'Branş Dersleri', en: 'Branch Courses' },
    guidanceUnit: { tr: 'Rehberlik', en: 'Guidance' },
    completionRate: { tr: 'Tamamlanma Oranı', en: 'Completion Rate' },
    developmentEvaluations: { tr: 'Gelişim Değerlendirmeleri', en: 'Development Evaluations' },
    focusDuration: { tr: 'Odaklanma Süresi', en: 'Focus Duration' },
    communicationSkills: { tr: 'İletişim Becerileri', en: 'Communication Skills' },
    collaboration: { tr: 'İşbirliği', en: 'Collaboration' },
    motivation: { tr: 'Motivasyon', en: 'Motivation' },
    cleanlinessOrder: { tr: 'Düzen ve Temizlik', en: 'Cleanliness & Order' },
    materialUsageSkills: { tr: 'Materyal Kullanım Becerileri', en: 'Material Usage Skills' },
    productivity: { tr: 'Üretkenlik', en: 'Productivity' },
    high: { tr: 'Yüksek', en: 'High' },
    medium: { tr: 'Orta', en: 'Medium' },
    low: { tr: 'Düşük', en: 'Low' },
    founderDirector: { tr: 'Kurucu Müdür', en: 'Founder Director' },
    institutionDirector: { tr: 'Kurum Müdürü', en: 'Institution Director' },
    signature: { tr: 'İmza', en: 'Signature' },
  };

  useEffect(() => {
    if (user) {
      fetchPeriods();
      fetchClassesAndTeachers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReports();
    }
  }, [selectedPeriod, statusFilter, classFilter, teacherFilter, pendingOnlyFilter]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('period_number', { ascending: true });

      if (error) throw error;
      setPeriods(data || []);

      if (data && data.length > 0 && !selectedPeriod) {
        const activePeriod = data.find(p => p.is_active);
        const periodToSelect = activePeriod || data[0];
        setSelectedPeriod(periodToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchClassesAndTeachers = async () => {
    try {
      const { data: childrenData } = await supabase
        .from('children')
        .select('class_name')
        .order('class_name');

      const uniqueClasses = Array.from(new Set(childrenData?.map(c => c.class_name).filter(Boolean)));
      setClasses(uniqueClasses);

      const { data: teachersData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['teacher', 'guidance_counselor'])
        .eq('approved', true)
        .order('full_name');

      setTeachers(teachersData || []);
    } catch (error) {
      console.error('Error fetching classes and teachers:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('=== FETCH REPORTS START ===');
      console.log('Selected period:', selectedPeriod);
      console.log('Status filter:', statusFilter);
      console.log('Pending only:', pendingOnlyFilter);
      console.log('User ID:', user?.id);

      let query = supabase
        .from('periodic_development_reports')
        .select(`
          *,
          children (
            first_name,
            last_name,
            class_name
          ),
          profiles!teacher_id (
            full_name
          ),
          academic_periods (
            name
          )
        `)
        .eq('period_id', selectedPeriod);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (pendingOnlyFilter) {
        query = query.eq('status', 'completed');
      }

      console.log('Executing query...');
      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('=== QUERY RESULT ===');
      console.log('Error:', error);
      console.log('Data:', data);
      console.log('Data length:', data?.length);

      if (error) {
        console.error('Supabase query error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      let filteredData = data || [];
      console.log('Data before client-side filtering:', filteredData.length);

      if (classFilter !== 'all') {
        console.log('Applying class filter:', classFilter);
        filteredData = filteredData.filter(r => r.children?.class_name === classFilter);
        console.log('After class filter:', filteredData.length);
      }

      if (teacherFilter !== 'all') {
        console.log('Applying teacher filter:', teacherFilter);
        filteredData = filteredData.filter(r =>
          r.teacher_id === teacherFilter ||
          r.montessori_teacher_id === teacherFilter ||
          r.english_teacher_id === teacherFilter ||
          r.quran_teacher_id === teacherFilter ||
          r.moral_values_teacher_id === teacherFilter ||
          r.etiquette_teacher_id === teacherFilter ||
          r.art_music_teacher_id === teacherFilter ||
          r.guidance_teacher_id === teacherFilter
        );
        console.log('After teacher filter:', filteredData.length);
      }

      console.log('=== FINAL RESULT ===');
      console.log('Final filtered reports:', filteredData.length);
      console.log('Reports:', filteredData);
      setReports(filteredData);
    } catch (error: any) {
      console.error('=== ERROR CAUGHT ===');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      alert(`Karneler yüklenirken hata oluştu: ${error?.message || 'Bilinmeyen hata'}\n\nKonsolu (F12) açıp detayları kontrol edin.`);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (report: PeriodicReport): number => {
    const sections = [
      report.montessori_completed,
      report.english_completed,
      report.quran_completed,
      report.moral_values_completed,
      report.etiquette_completed,
      report.art_music_completed,
      report.guidance_completed,
    ];

    const completedCount = sections.filter(Boolean).length;
    return Math.round((completedCount / sections.length) * 100);
  };

  const getLikertLabel = (value: 'high' | 'medium' | 'low' | null): string => {
    if (!value) return '-';
    return t[value][language];
  };

  const getLikertBadgeColor = (value: 'high' | 'medium' | 'low' | null): string => {
    switch (value) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingPeriod) {
        const { error } = await supabase
          .from('academic_periods')
          .update(periodForm)
          .eq('id', editingPeriod.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('academic_periods')
          .insert([periodForm]);

        if (error) throw error;
      }

      alert(language === 'tr' ? 'Dönem başarıyla kaydedildi' : 'Period saved successfully');
      setShowPeriodForm(false);
      setEditingPeriod(null);
      setPeriodForm({
        name: '',
        period_number: 1,
        start_date: '',
        end_date: '',
        is_active: false,
      });
      fetchPeriods();
    } catch (error: any) {
      console.error('Error saving period:', error);
      alert(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm(language === 'tr' ? 'Bu dönemi silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this period?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('academic_periods')
        .delete()
        .eq('id', periodId);

      if (error) throw error;

      alert(language === 'tr' ? 'Dönem silindi' : 'Period deleted');
      fetchPeriods();
    } catch (error: any) {
      console.error('Error deleting period:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const handleEditPeriod = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    setPeriodForm({
      name: period.name,
      period_number: period.period_number,
      start_date: period.start_date,
      end_date: period.end_date,
      is_active: period.is_active,
    });
    setShowPeriodForm(true);
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('periodic_development_reports')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      alert(language === 'tr' ? 'Karne onaylandı' : 'Report card approved');
      fetchReports();
      setSelectedReports(new Set());
    } catch (error: any) {
      console.error('Error approving report:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const handleRevokeApproval = async (reportId: string) => {
    if (!confirm(language === 'tr' ? 'Karne onayını kaldırmak istediğinizden emin misiniz?' : 'Are you sure you want to revoke the approval?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('periodic_development_reports')
        .update({
          status: 'completed',
          approved_by: null,
          approved_at: null,
        })
        .eq('id', reportId);

      if (error) throw error;

      alert(language === 'tr' ? 'Karne onayı kaldırıldı' : 'Report card approval revoked');
      fetchReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: 'completed' });
      }
    } catch (error: any) {
      console.error('Error revoking approval:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReports.size === 0) {
      alert(language === 'tr' ? 'Lütfen onaylamak için karne seçin' : 'Please select report cards to approve');
      return;
    }

    if (!confirm(language === 'tr' ? `${selectedReports.size} karneyi onaylamak istediğinizden emin misiniz?` : `Are you sure you want to approve ${selectedReports.size} report cards?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedReports).map(reportId =>
        supabase
          .from('periodic_development_reports')
          .update({
            status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', reportId)
      );

      await Promise.all(promises);

      alert(language === 'tr' ? 'Karneler onaylandı' : 'Report cards approved');
      fetchReports();
      setSelectedReports(new Set());
    } catch (error: any) {
      console.error('Error bulk approving:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const toggleReportSelection = (reportId: string) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.filter(r => r.status === 'completed').length) {
      setSelectedReports(new Set());
    } else {
      const completedReportIds = reports.filter(r => r.status === 'completed').map(r => r.id);
      setSelectedReports(new Set(completedReportIds));
    }
  };

  const handleDownloadPDF = async (report: PeriodicReport) => {
    try {
      const { data, error } = await supabase
        .from('periodic_development_reports')
        .select('*')
        .eq('id', report.id)
        .single();

      if (error) throw error;

      const fullReport = { ...data, children: report.children, profiles: report.profiles, academic_periods: report.academic_periods };
      generatePDF(fullReport);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(language === 'tr' ? 'PDF oluşturulurken hata oluştu' : 'Error generating PDF');
    }
  };

  const generatePDF = (report: PeriodicReport) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(language === 'tr' ? 'Ref Karne' : 'Ref Report Card', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${language === 'tr' ? 'Öğrenci' : 'Student'}: ${report.children?.first_name} ${report.children?.last_name}`, margin, yPos);
    yPos += 6;
    doc.text(`${language === 'tr' ? 'Sınıf' : 'Class'}: ${report.children?.class_name || ''}`, margin, yPos);
    yPos += 6;
    doc.text(`${language === 'tr' ? 'Dönem' : 'Period'}: ${report.academic_periods?.name || ''}`, margin, yPos);
    yPos += 6;
    doc.text(`${language === 'tr' ? 'Öğretmen' : 'Teacher'}: ${report.profiles?.full_name || ''}`, margin, yPos);
    yPos += 10;

    const addSection = (title: string, content: string) => {
      if (!content) return;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(content, maxWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 5;
    };

    if (report.practical_life || report.sensorial || report.mathematics || report.language || report.culture) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'tr' ? 'Montessori Alanları' : 'Montessori Areas', margin, yPos);
      yPos += 8;

      addSection(language === 'tr' ? 'Pratik Yaşam' : 'Practical Life', report.practical_life);
      addSection(language === 'tr' ? 'Duyusal' : 'Sensorial', report.sensorial);
      addSection(language === 'tr' ? 'Matematik' : 'Mathematics', report.mathematics);
      addSection(language === 'tr' ? 'Dil' : 'Language', report.language);
      addSection(language === 'tr' ? 'Kültür' : 'Culture', report.culture);
    }

    if (report.english || report.quran || report.moral_values || report.etiquette || report.art_music) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'tr' ? 'Branş Dersleri' : 'Branch Courses', margin, yPos);
      yPos += 8;

      addSection(language === 'tr' ? 'İngilizce' : 'English', report.english);
      addSection(language === 'tr' ? 'Kuran' : 'Quran', report.quran);
      addSection(language === 'tr' ? 'Manevi Değerler' : 'Moral Values', report.moral_values);
      addSection(language === 'tr' ? 'Adab-ı Muaşeret' : 'Etiquette', report.etiquette);
      addSection(language === 'tr' ? 'Sanat-Müzik' : 'Art-Music', report.art_music);
    }

    if (report.focus_duration || report.communication_skills || report.collaboration || report.motivation ||
        report.cleanliness_order || report.material_usage_skills || report.productivity) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'tr' ? 'Gelişim Değerlendirmeleri' : 'Development Evaluations', margin, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (report.focus_duration) {
        doc.text(`${language === 'tr' ? 'Odaklanma Süresi' : 'Focus Duration'}: ${getLikertLabel(report.focus_duration)}`, margin, yPos);
        yPos += 5;
      }
      if (report.communication_skills) {
        doc.text(`${language === 'tr' ? 'İletişim Becerileri' : 'Communication Skills'}: ${getLikertLabel(report.communication_skills)}`, margin, yPos);
        yPos += 5;
      }
      if (report.collaboration) {
        doc.text(`${language === 'tr' ? 'İşbirliği' : 'Collaboration'}: ${getLikertLabel(report.collaboration)}`, margin, yPos);
        yPos += 5;
      }
      if (report.motivation) {
        doc.text(`${language === 'tr' ? 'Motivasyon' : 'Motivation'}: ${getLikertLabel(report.motivation)}`, margin, yPos);
        yPos += 5;
      }
      if (report.cleanliness_order) {
        doc.text(`${language === 'tr' ? 'Düzen ve Temizlik' : 'Cleanliness & Order'}: ${getLikertLabel(report.cleanliness_order)}`, margin, yPos);
        yPos += 5;
      }
      if (report.material_usage_skills) {
        doc.text(`${language === 'tr' ? 'Materyal Kullanım Becerileri' : 'Material Usage Skills'}: ${getLikertLabel(report.material_usage_skills)}`, margin, yPos);
        yPos += 5;
      }
      if (report.productivity) {
        doc.text(`${language === 'tr' ? 'Üretkenlik' : 'Productivity'}: ${getLikertLabel(report.productivity)}`, margin, yPos);
        yPos += 5;
      }
      yPos += 5;
    }

    if (report.guidance_evaluation) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'tr' ? 'Rehberlik Birimi Değerlendirmesi' : 'Guidance Unit Evaluation', margin, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(report.guidance_evaluation, maxWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 5;
    }

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation', margin, yPos);
    yPos += 8;

    addSection(language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation', report.general_evaluation);
    addSection(language === 'tr' ? 'Montessori\'de İlgi Duyduğu Alanlar' : 'Areas of Interest in Montessori', report.montessori_interests);
    addSection(language === 'tr' ? 'Öğrenme Süreci Değerlendirmesi' : 'Learning Process Evaluation', report.learning_process_evaluation);
    addSection(language === 'tr' ? 'Öneriler ve Hedefler' : 'Recommendations', report.recommendations);

    if (report.status === 'approved') {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);

      const leftSignatureX = margin;
      doc.line(leftSignatureX, yPos, leftSignatureX + 50, yPos);
      doc.text(language === 'tr' ? 'Kurum Müdürü' : 'Institution Director', leftSignatureX, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Ramazan YILDIZ', leftSignatureX, yPos + 10);

      doc.setFont('helvetica', 'bold');
      const rightSignatureX = pageWidth - margin - 50;
      doc.line(rightSignatureX, yPos, rightSignatureX + 50, yPos);
      doc.text(language === 'tr' ? 'Kurucu Müdür' : 'Founder Director', rightSignatureX, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Kubra YILDIZ', rightSignatureX, yPos + 10);
    }

    const fileName = `karne_${report.children?.first_name}_${report.children?.last_name}_${report.academic_periods?.name}.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
  };

  const handleViewReport = async (report: PeriodicReport) => {
    try {
      const { data, error } = await supabase
        .from('periodic_development_reports')
        .select('*')
        .eq('id', report.id)
        .single();

      if (error) throw error;
      setSelectedReport({ ...data, children: report.children, profiles: report.profiles, academic_periods: report.academic_periods });
      setShowReportDetail(true);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'completed': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    total: reports.length,
    completed: reports.filter(r => r.status === 'completed').length,
    approved: reports.filter(r => r.status === 'approved').length,
    pending: reports.filter(r => r.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          {t.title[language]}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {t.academicPeriods[language]}
          </h3>
          <button
            onClick={() => {
              setShowPeriodForm(true);
              setEditingPeriod(null);
              setPeriodForm({
                name: '',
                period_number: 1,
                start_date: '',
                end_date: '',
                is_active: false,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.createPeriod[language]}
          </button>
        </div>

        {periods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t.noPeriods[language]}
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium text-gray-900">{period.name}</h4>
                    {period.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {t.active[language]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(period.start_date).toLocaleDateString('tr-TR')} - {new Date(period.end_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditPeriod(period)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title={t.edit[language]}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePeriod(period.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title={t.delete[language]}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPeriodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingPeriod ? t.editPeriod[language] : t.createPeriod[language]}
            </h3>
            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.periodName[language]}
                </label>
                <input
                  type="text"
                  required
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1. Dönem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.periodNumber[language]}
                </label>
                <select
                  value={periodForm.period_number}
                  onChange={(e) => setPeriodForm({ ...periodForm, period_number: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1. Dönem</option>
                  <option value={2}>2. Dönem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.startDate[language]}
                </label>
                <input
                  type="date"
                  required
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.endDate[language]}
                </label>
                <input
                  type="date"
                  required
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={periodForm.is_active}
                  onChange={(e) => setPeriodForm({ ...periodForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  {t.active[language]}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPeriodForm(false);
                    setEditingPeriod(null);
                  }}
                  className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t.cancel[language]}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {t.save[language]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {t.reports[language]}
        </h3>

        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.period[language]}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.selectPeriod[language]}</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.status[language]}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.allStatuses[language]}</option>
                <option value="draft">{t.draft[language]}</option>
                <option value="completed">{t.completed[language]}</option>
                <option value="approved">{t.approved[language]}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.class[language]}
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.allClasses[language]}</option>
                {classes.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t.teacher[language]}
              </label>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.allTeachers[language]}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center px-4 py-2 border rounded-lg bg-yellow-50">
              <input
                type="checkbox"
                id="pending_only"
                checked={pendingOnlyFilter}
                onChange={(e) => setPendingOnlyFilter(e.target.checked)}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor="pending_only" className="ml-2 text-sm text-gray-700 whitespace-nowrap">
                {t.pendingApprovalOnly[language]}
              </label>
            </div>
          </div>
        </div>

        {selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.totalReports[language]}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.pendingReports[language]}</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.completedReports[language]}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.completed}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.approvedReports[language]}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {stats.completed > 0 && (
          <div className="mb-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedReports.size === reports.filter(r => r.status === 'completed').length ? (
                  <>
                    <CheckSquare className="w-5 h-5" />
                    {t.deselectAll[language]}
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5" />
                    {t.selectAll[language]}
                  </>
                )}
              </button>
              {selectedReports.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedReports.size} {t.selected[language]}
                </span>
              )}
            </div>
            {selectedReports.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                {t.bulkApprove[language]}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : !selectedPeriod ? (
          <div className="text-center py-12 text-gray-500">
            {t.selectPeriod[language]}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t.noReports[language]}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {stats.completed > 0 && (
                    <th className="px-3 py-3 text-left">
                      <span className="sr-only">Select</span>
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.student[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.class[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.teacher[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.completionRate[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status[language]}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions[language]}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    {stats.completed > 0 && (
                      <td className="px-3 py-4 whitespace-nowrap">
                        {report.status === 'completed' && (
                          <input
                            type="checkbox"
                            checked={selectedReports.has(report.id)}
                            onChange={() => toggleReportSelection(report.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.children?.first_name} {report.children?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {report.children?.class_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {report.profiles?.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              calculateCompletionRate(report) === 100
                                ? 'bg-green-600'
                                : calculateCompletionRate(report) >= 70
                                ? 'bg-blue-600'
                                : calculateCompletionRate(report) >= 40
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${calculateCompletionRate(report)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {calculateCompletionRate(report)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {t[report.status][language]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t.view[language]}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(report)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title={language === 'tr' ? 'PDF İndir' : 'Download PDF'}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {report.status === 'completed' && (
                          <button
                            onClick={() => handleApproveReport(report.id)}
                            className="text-green-600 hover:text-green-900"
                            title={t.approve[language]}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {report.status === 'approved' && (
                          <button
                            onClick={() => handleRevokeApproval(report.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t.revokeApproval[language]}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {language === 'tr' ? 'Karne Detayı' : 'Report Card Details'}
              </h3>
              <button
                onClick={() => setShowReportDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedReport.children?.first_name} {selectedReport.children?.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{selectedReport.children?.class_name}</p>
                  <p className="text-sm text-gray-600">{selectedReport.academic_periods?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    {t[selectedReport.status][language]}
                  </span>
                  <div className="mt-2 text-sm text-gray-600">
                    {t.completionRate[language]}: {calculateCompletionRate(selectedReport)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-gray-900">{t.montessoriSections[language]}</h5>
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.montessori_completed ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedReport.montessori_completed ? <CheckCircle className="w-8 h-8 mx-auto" /> : <Clock className="w-8 h-8 mx-auto" />}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <h5 className="font-semibold text-gray-900">{t.branchCourses[language]}</h5>
                  </div>
                  <div className="text-sm text-gray-600">
                    {[selectedReport.english_completed, selectedReport.quran_completed, selectedReport.moral_values_completed, selectedReport.etiquette_completed, selectedReport.art_music_completed].filter(Boolean).length}/5
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h5 className="font-semibold text-gray-900">{t.guidanceUnit[language]}</h5>
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.guidance_completed ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedReport.guidance_completed ? <CheckCircle className="w-8 h-8 mx-auto" /> : <Clock className="w-8 h-8 mx-auto" />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    {language === 'tr' ? 'Montessori Alanları' : 'Montessori Areas'}
                  </h5>
                  {selectedReport.practical_life && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Pratik Yaşam' : 'Practical Life'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.practical_life}</p>
                    </div>
                  )}
                  {selectedReport.sensorial && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Duyusal' : 'Sensorial'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.sensorial}</p>
                    </div>
                  )}
                  {selectedReport.mathematics && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Matematik' : 'Mathematics'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.mathematics}</p>
                    </div>
                  )}
                  {selectedReport.language && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Dil' : 'Language'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.language}</p>
                    </div>
                  )}
                  {selectedReport.culture && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Kültür' : 'Culture'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.culture}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    {language === 'tr' ? 'Branş Dersleri' : 'Branch Courses'}
                  </h5>
                  {selectedReport.english && (
                    <div className={`p-3 rounded-lg ${selectedReport.english_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'İngilizce' : 'English'}</p>
                        {selectedReport.english_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{selectedReport.english}</p>
                    </div>
                  )}
                  {selectedReport.quran && (
                    <div className={`p-3 rounded-lg ${selectedReport.quran_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Kuran' : 'Quran'}</p>
                        {selectedReport.quran_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{selectedReport.quran}</p>
                    </div>
                  )}
                  {selectedReport.moral_values && (
                    <div className={`p-3 rounded-lg ${selectedReport.moral_values_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Manevi Değerler' : 'Moral Values'}</p>
                        {selectedReport.moral_values_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{selectedReport.moral_values}</p>
                    </div>
                  )}
                  {selectedReport.etiquette && (
                    <div className={`p-3 rounded-lg ${selectedReport.etiquette_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Adab-ı Muaşeret' : 'Etiquette'}</p>
                        {selectedReport.etiquette_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{selectedReport.etiquette}</p>
                    </div>
                  )}
                  {selectedReport.art_music && (
                    <div className={`p-3 rounded-lg ${selectedReport.art_music_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Sanat-Müzik' : 'Art-Music'}</p>
                        {selectedReport.art_music_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{selectedReport.art_music}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  {t.developmentEvaluations[language]}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReport.focus_duration && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.focusDuration[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.focus_duration)}`}>
                        {getLikertLabel(selectedReport.focus_duration)}
                      </span>
                    </div>
                  )}
                  {selectedReport.communication_skills && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.communicationSkills[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.communication_skills)}`}>
                        {getLikertLabel(selectedReport.communication_skills)}
                      </span>
                    </div>
                  )}
                  {selectedReport.collaboration && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.collaboration[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.collaboration)}`}>
                        {getLikertLabel(selectedReport.collaboration)}
                      </span>
                    </div>
                  )}
                  {selectedReport.motivation && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.motivation[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.motivation)}`}>
                        {getLikertLabel(selectedReport.motivation)}
                      </span>
                    </div>
                  )}
                  {selectedReport.cleanliness_order && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.cleanlinessOrder[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.cleanliness_order)}`}>
                        {getLikertLabel(selectedReport.cleanliness_order)}
                      </span>
                    </div>
                  )}
                  {selectedReport.material_usage_skills && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.materialUsageSkills[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.material_usage_skills)}`}>
                        {getLikertLabel(selectedReport.material_usage_skills)}
                      </span>
                    </div>
                  )}
                  {selectedReport.productivity && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.productivity[language]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLikertBadgeColor(selectedReport.productivity)}`}>
                        {getLikertLabel(selectedReport.productivity)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.guidance_evaluation && (
                <div className="border-t pt-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    {language === 'tr' ? 'Rehberlik Birimi Değerlendirmesi' : 'Guidance Unit Evaluation'}
                  </h5>
                  <div className={`p-3 rounded-lg ${selectedReport.guidance_completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-600">{selectedReport.guidance_evaluation}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">{language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation'}</h5>
                <div className="space-y-3">
                  {selectedReport.general_evaluation && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.general_evaluation}</p>
                    </div>
                  )}
                  {selectedReport.montessori_interests && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Montessori\'de İlgi Duyduğu Alanlar' : 'Areas of Interest in Montessori'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.montessori_interests}</p>
                    </div>
                  )}
                  {selectedReport.learning_process_evaluation && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Öğrenme Süreci Değerlendirmesi' : 'Learning Process Evaluation'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.learning_process_evaluation}</p>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Öneriler ve Hedefler' : 'Recommendations and Goals'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.status === 'approved' && (
                <div className="border-t pt-6 mt-6">
                  <div className="flex justify-between px-8">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 w-48">
                        <p className="text-sm font-semibold text-gray-900">{t.institutionDirector[language]}</p>
                        <p className="text-sm text-gray-700 mt-1">Ramazan YILDIZ</p>
                        <p className="text-xs text-gray-500 mt-2">{t.signature[language]}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 w-48">
                        <p className="text-sm font-semibold text-gray-900">{t.founderDirector[language]}</p>
                        <p className="text-sm text-gray-700 mt-1">Kübra YILDIZ</p>
                        <p className="text-xs text-gray-500 mt-2">{t.signature[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 flex justify-end gap-3">
                {selectedReport.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleRevokeApproval(selectedReport.id);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    {t.revokeApproval[language]}
                  </button>
                )}
                {selectedReport.status === 'completed' && (
                  <button
                    onClick={() => {
                      handleApproveReport(selectedReport.id);
                      setShowReportDetail(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {t.approve[language]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
