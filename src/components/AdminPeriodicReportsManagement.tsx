import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Plus, Edit2, Trash2, Save, X, CheckCircle, Clock, Eye, FileText, TrendingUp, Download } from 'lucide-react';
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
    branch: string;
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
  const [selectedReport, setSelectedReport] = useState<PeriodicReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  const [periodForm, setPeriodForm] = useState({
    name: '',
    period_number: 1,
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const t = {
    title: { tr: 'Dönem Gelişim Raporları Yönetimi', en: 'Periodic Development Reports Management' },
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
    reports: { tr: 'Raporlar', en: 'Reports' },
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
    view: { tr: 'Görüntüle', en: 'View' },
    statistics: { tr: 'İstatistikler', en: 'Statistics' },
    totalReports: { tr: 'Toplam Rapor', en: 'Total Reports' },
    completedReports: { tr: 'Tamamlanan', en: 'Completed' },
    approvedReports: { tr: 'Onaylanan', en: 'Approved' },
    pendingReports: { tr: 'Bekleyen', en: 'Pending' },
    noPeriods: { tr: 'Henüz dönem bulunmuyor', en: 'No periods yet' },
    noReports: { tr: 'Rapor bulunmuyor', en: 'No reports found' },
    branch: { tr: 'Sınıf', en: 'Branch' },
  };

  useEffect(() => {
    if (user) {
      fetchPeriods();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReports();
    }
  }, [selectedPeriod, statusFilter]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('period_number', { ascending: true });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('periodic_development_reports')
        .select(`
          *,
          children (
            first_name,
            last_name,
            branch
          ),
          profiles (
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

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
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

      alert(language === 'tr' ? 'Rapor onaylandı' : 'Report approved');
      fetchReports();
    } catch (error: any) {
      console.error('Error approving report:', error);
      alert(error.message || 'An error occurred');
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
    doc.text(language === 'tr' ? 'Dönem Gelişim Raporu' : 'Periodic Development Report', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${language === 'tr' ? 'Öğrenci' : 'Student'}: ${report.children?.first_name} ${report.children?.last_name}`, margin, yPos);
    yPos += 6;
    doc.text(`${language === 'tr' ? 'Sınıf' : 'Branch'}: ${report.children?.branch || ''}`, margin, yPos);
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
      addSection(language === 'tr' ? 'Manevi Değerler' : 'Spiritual Values', report.spiritual_values);
      addSection(language === 'tr' ? 'Adab-ı Muaşeret' : 'Etiquette', report.etiquette);
      addSection(language === 'tr' ? 'Sanat-Müzik' : 'Art-Music', report.art_music);
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
    addSection(language === 'tr' ? 'Güçlü Yönler' : 'Strengths', report.strengths);
    addSection(language === 'tr' ? 'Geliştirilmesi Gereken Alanlar' : 'Areas to Improve', report.areas_to_improve);
    addSection(language === 'tr' ? 'Öneriler ve Hedefler' : 'Recommendations', report.recommendations);

    const fileName = `rapor_${report.children?.first_name}_${report.children?.last_name}_${report.academic_periods?.name}.pdf`.replace(/\s+/g, '_');
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
      case 'completed': return <CheckCircle className="w-4 h-4" />;
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

        <div className="flex gap-4 mb-6">
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
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.completedReports[language]}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.student[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.branch[language]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.teacher[language]}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.children?.first_name} {report.children?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {report.children?.branch}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {report.profiles?.full_name}
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
                          className="text-purple-600 hover:text-purple-900"
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {language === 'tr' ? 'Rapor Detayı' : 'Report Details'}
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
                  <p className="text-sm text-gray-600">{selectedReport.children?.branch}</p>
                  <p className="text-sm text-gray-600">{selectedReport.academic_periods?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedReport.status)}`}>
                  {getStatusIcon(selectedReport.status)}
                  {t[selectedReport.status][language]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">{language === 'tr' ? 'Montessori Alanları' : 'Montessori Areas'}</h5>
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
                  <h5 className="font-semibold text-gray-900">{language === 'tr' ? 'Branş Dersleri' : 'Branch Courses'}</h5>
                  {selectedReport.english && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'İngilizce' : 'English'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.english}</p>
                    </div>
                  )}
                  {selectedReport.quran && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Kuran' : 'Quran'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.quran}</p>
                    </div>
                  )}
                  {selectedReport.spiritual_values && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Manevi Değerler' : 'Spiritual Values'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.spiritual_values}</p>
                    </div>
                  )}
                  {selectedReport.etiquette && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Adab-ı Muaşeret' : 'Etiquette'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.etiquette}</p>
                    </div>
                  )}
                  {selectedReport.art_music && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Sanat-Müzik' : 'Art-Music'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.art_music}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">{language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation'}</h5>
                <div className="space-y-3">
                  {selectedReport.general_evaluation && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Genel Değerlendirme' : 'General Evaluation'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.general_evaluation}</p>
                    </div>
                  )}
                  {selectedReport.strengths && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Güçlü Yönler' : 'Strengths'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.strengths}</p>
                    </div>
                  )}
                  {selectedReport.areas_to_improve && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Geliştirilmesi Gereken Alanlar' : 'Areas to Improve'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.areas_to_improve}</p>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700">{language === 'tr' ? 'Öneriler ve Hedefler' : 'Recommendations and Goals'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}