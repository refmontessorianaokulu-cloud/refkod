import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Calendar, FileText, CheckCircle, Clock, Eye } from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  branch: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
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
  spiritual_values: string;
  etiquette: string;
  art_music: string;
  general_evaluation: string;
  strengths: string;
  areas_to_improve: string;
  recommendations: string;
  media_urls: string[];
  status: 'draft' | 'completed' | 'approved';
  created_at: string;
  updated_at: string;
  children?: {
    first_name: string;
    last_name: string;
  };
  academic_periods?: {
    name: string;
  };
}

export default function PeriodicDevelopmentReportsSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [reports, setReports] = useState<PeriodicReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<PeriodicReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'view'>('list');

  const [formData, setFormData] = useState({
    practical_life: '',
    sensorial: '',
    mathematics: '',
    language: '',
    culture: '',
    english: '',
    quran: '',
    spiritual_values: '',
    etiquette: '',
    art_music: '',
    general_evaluation: '',
    strengths: '',
    areas_to_improve: '',
    recommendations: '',
    status: 'draft' as 'draft' | 'completed' | 'approved',
  });

  const t = {
    title: { tr: 'Dönem Gelişim Raporları', en: 'Periodic Development Reports' },
    selectPeriod: { tr: 'Dönem Seçin', en: 'Select Period' },
    selectChild: { tr: 'Öğrenci Seçin', en: 'Select Student' },
    createReport: { tr: 'Yeni Rapor Oluştur', en: 'Create New Report' },
    montessoriAreas: { tr: 'Montessori Alanları', en: 'Montessori Areas' },
    practicalLife: { tr: 'Pratik Yaşam', en: 'Practical Life' },
    sensorial: { tr: 'Duyusal', en: 'Sensorial' },
    mathematics: { tr: 'Matematik', en: 'Mathematics' },
    language: { tr: 'Dil', en: 'Language' },
    culture: { tr: 'Kültür', en: 'Culture' },
    branchCourses: { tr: 'Branş Dersleri', en: 'Branch Courses' },
    english: { tr: 'İngilizce', en: 'English' },
    quran: { tr: 'Kuran', en: 'Quran' },
    spiritualValues: { tr: 'Manevi Değerler', en: 'Spiritual Values' },
    etiquette: { tr: 'Adab-ı Muaşeret', en: 'Etiquette' },
    artMusic: { tr: 'Sanat-Müzik', en: 'Art-Music' },
    generalEvaluation: { tr: 'Genel Değerlendirme', en: 'General Evaluation' },
    strengths: { tr: 'Güçlü Yönler', en: 'Strengths' },
    areasToImprove: { tr: 'Geliştirilmesi Gereken Alanlar', en: 'Areas to Improve' },
    recommendations: { tr: 'Öneriler ve Hedefler', en: 'Recommendations and Goals' },
    save: { tr: 'Kaydet', en: 'Save' },
    cancel: { tr: 'İptal', en: 'Cancel' },
    edit: { tr: 'Düzenle', en: 'Edit' },
    delete: { tr: 'Sil', en: 'Delete' },
    draft: { tr: 'Taslak', en: 'Draft' },
    completed: { tr: 'Tamamlandı', en: 'Completed' },
    approved: { tr: 'Onaylandı', en: 'Approved' },
    noReports: { tr: 'Henüz rapor bulunmuyor', en: 'No reports yet' },
    saveAsDraft: { tr: 'Taslak Olarak Kaydet', en: 'Save as Draft' },
    saveAsCompleted: { tr: 'Tamamlanmış Olarak Kaydet', en: 'Save as Completed' },
    student: { tr: 'Öğrenci', en: 'Student' },
    period: { tr: 'Dönem', en: 'Period' },
    status: { tr: 'Durum', en: 'Status' },
    actions: { tr: 'İşlemler', en: 'Actions' },
    view: { tr: 'Görüntüle', en: 'View' },
    backToList: { tr: 'Listeye Dön', en: 'Back to List' },
  };

  useEffect(() => {
    if (user) {
      fetchPeriods();
      fetchChildren();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReports();
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('period_number', { ascending: true });

      if (error) throw error;
      setPeriods(data || []);

      const activePeriod = data?.find(p => p.is_active);
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name,
            branch
          )
        `)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      const childrenData = data?.map((item: any) => ({
        id: item.children.id,
        first_name: item.children.first_name,
        last_name: item.children.last_name,
        branch: item.children.branch,
      })) || [];

      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('periodic_development_reports')
        .select(`
          *,
          children (
            first_name,
            last_name
          ),
          academic_periods (
            name
          )
        `)
        .eq('teacher_id', user?.id)
        .eq('period_id', selectedPeriod)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingReport(null);
    setFormData({
      practical_life: '',
      sensorial: '',
      mathematics: '',
      language: '',
      culture: '',
      english: '',
      quran: '',
      spiritual_values: '',
      etiquette: '',
      art_music: '',
      general_evaluation: '',
      strengths: '',
      areas_to_improve: '',
      recommendations: '',
      status: 'draft',
    });
    setSelectedChild('');
    setViewMode('form');
  };

  const handleEdit = (report: PeriodicReport) => {
    setEditingReport(report);
    setFormData({
      practical_life: report.practical_life,
      sensorial: report.sensorial,
      mathematics: report.mathematics,
      language: report.language,
      culture: report.culture,
      english: report.english,
      quran: report.quran,
      spiritual_values: report.spiritual_values,
      etiquette: report.etiquette,
      art_music: report.art_music,
      general_evaluation: report.general_evaluation,
      strengths: report.strengths,
      areas_to_improve: report.areas_to_improve,
      recommendations: report.recommendations,
      status: report.status,
    });
    setSelectedChild(report.child_id);
    setViewMode('form');
  };

  const handleView = (report: PeriodicReport) => {
    setEditingReport(report);
    setFormData({
      practical_life: report.practical_life,
      sensorial: report.sensorial,
      mathematics: report.mathematics,
      language: report.language,
      culture: report.culture,
      english: report.english,
      quran: report.quran,
      spiritual_values: report.spiritual_values,
      etiquette: report.etiquette,
      art_music: report.art_music,
      general_evaluation: report.general_evaluation,
      strengths: report.strengths,
      areas_to_improve: report.areas_to_improve,
      recommendations: report.recommendations,
      status: report.status,
    });
    setViewMode('view');
  };

  const handleSave = async (saveStatus: 'draft' | 'completed') => {
    if (!selectedChild || !selectedPeriod) {
      alert(language === 'tr' ? 'Lütfen öğrenci ve dönem seçin' : 'Please select student and period');
      return;
    }

    try {
      setLoading(true);
      const reportData = {
        ...formData,
        child_id: selectedChild,
        teacher_id: user?.id,
        period_id: selectedPeriod,
        status: saveStatus,
        updated_at: new Date().toISOString(),
      };

      if (editingReport) {
        const { error } = await supabase
          .from('periodic_development_reports')
          .update(reportData)
          .eq('id', editingReport.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('periodic_development_reports')
          .insert([reportData]);

        if (error) throw error;
      }

      alert(language === 'tr' ? 'Rapor başarıyla kaydedildi' : 'Report saved successfully');
      setViewMode('list');
      fetchReports();
    } catch (error: any) {
      console.error('Error saving report:', error);
      alert(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm(language === 'tr' ? 'Bu raporu silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('periodic_development_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      alert(language === 'tr' ? 'Rapor silindi' : 'Report deleted');
      fetchReports();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      alert(error.message || 'An error occurred');
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

  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            {editingReport ? (language === 'tr' ? 'Raporu Düzenle' : 'Edit Report') : t.createReport[language]}
          </h2>
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
            {t.cancel[language]}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.period[language]} *
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                disabled={!!editingReport}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{t.selectPeriod[language]}</option>
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name} {period.is_active ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.student[language]} *
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                disabled={!!editingReport}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{t.selectChild[language]}</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name} - {child.branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              {t.montessoriAreas[language]}
            </h3>
            <div className="space-y-4">
              {[
                { key: 'practical_life', label: t.practicalLife[language] },
                { key: 'sensorial', label: t.sensorial[language] },
                { key: 'mathematics', label: t.mathematics[language] },
                { key: 'language', label: t.language[language] },
                { key: 'culture', label: t.culture[language] },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <textarea
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`${field.label} ${language === 'tr' ? 'değerlendirmesi yazın...' : 'evaluation...'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t.branchCourses[language]}
            </h3>
            <div className="space-y-4">
              {[
                { key: 'english', label: t.english[language] },
                { key: 'quran', label: t.quran[language] },
                { key: 'spiritual_values', label: t.spiritualValues[language] },
                { key: 'etiquette', label: t.etiquette[language] },
                { key: 'art_music', label: t.artMusic[language] },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <textarea
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`${field.label} ${language === 'tr' ? 'değerlendirmesi yazın...' : 'evaluation...'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.generalEvaluation[language]}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.generalEvaluation[language]}
                </label>
                <textarea
                  value={formData.general_evaluation}
                  onChange={(e) => setFormData({ ...formData, general_evaluation: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Dönemin genel özeti...' : 'General summary of the period...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.strengths[language]}
                </label>
                <textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Öğrencinin güçlü yönleri...' : 'Student\'s strengths...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.areasToImprove[language]}
                </label>
                <textarea
                  value={formData.areas_to_improve}
                  onChange={(e) => setFormData({ ...formData, areas_to_improve: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Geliştirilmesi gereken alanlar...' : 'Areas to improve...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.recommendations[language]}
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Öneriler ve hedefler...' : 'Recommendations and goals...'}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {t.saveAsDraft[language]}
            </button>
            <button
              onClick={() => handleSave('completed')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {t.saveAsCompleted[language]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && editingReport) {
    const child = children.find(c => c.id === editingReport.child_id);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            {language === 'tr' ? 'Rapor Detayı' : 'Report Details'}
          </h2>
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
            {t.backToList[language]}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingReport.children?.first_name} {editingReport.children?.last_name}
              </h3>
              <p className="text-sm text-gray-600">{editingReport.academic_periods?.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(editingReport.status)}`}>
              {getStatusIcon(editingReport.status)}
              {t[editingReport.status][language]}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.montessoriAreas[language]}</h4>
              <div className="space-y-3">
                {[
                  { label: t.practicalLife[language], value: formData.practical_life },
                  { label: t.sensorial[language], value: formData.sensorial },
                  { label: t.mathematics[language], value: formData.mathematics },
                  { label: t.language[language], value: formData.language },
                  { label: t.culture[language], value: formData.culture },
                ].map((item, index) => (
                  item.value && (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900 mb-1">{item.label}</p>
                      <p className="text-gray-700">{item.value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.branchCourses[language]}</h4>
              <div className="space-y-3">
                {[
                  { label: t.english[language], value: formData.english },
                  { label: t.quran[language], value: formData.quran },
                  { label: t.spiritualValues[language], value: formData.spiritual_values },
                  { label: t.etiquette[language], value: formData.etiquette },
                  { label: t.artMusic[language], value: formData.art_music },
                ].map((item, index) => (
                  item.value && (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900 mb-1">{item.label}</p>
                      <p className="text-gray-700">{item.value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.generalEvaluation[language]}</h4>
              <div className="space-y-3">
                {formData.general_evaluation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">{t.generalEvaluation[language]}</p>
                    <p className="text-gray-700">{formData.general_evaluation}</p>
                  </div>
                )}
                {formData.strengths && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">{t.strengths[language]}</p>
                    <p className="text-gray-700">{formData.strengths}</p>
                  </div>
                )}
                {formData.areas_to_improve && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">{t.areasToImprove[language]}</p>
                    <p className="text-gray-700">{formData.areas_to_improve}</p>
                  </div>
                )}
                {formData.recommendations && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">{t.recommendations[language]}</p>
                    <p className="text-gray-700">{formData.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          {t.title[language]}
        </h2>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.createReport[language]}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.selectPeriod[language]}</option>
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {period.name} {period.is_active ? '(Aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t.noReports[language]}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.student[language]}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.period[language]}
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
                      {report.academic_periods?.name}
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
                        onClick={() => handleView(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t.view[language]}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t.edit[language]}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t.delete[language]}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}