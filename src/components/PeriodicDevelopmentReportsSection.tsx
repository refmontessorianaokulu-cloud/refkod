import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Calendar, FileText, CheckCircle, Clock, Eye, AlertCircle, User } from 'lucide-react';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
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

interface TeacherAssignment {
  course_type: string;
  class_name: string;
}

export default function PeriodicDevelopmentReportsSection() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [reports, setReports] = useState<PeriodicReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'view'>('list');
  const [editingReport, setEditingReport] = useState<PeriodicReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [isBranchTeacher, setIsBranchTeacher] = useState(false);
  const [isGuidanceCounselor, setIsGuidanceCounselor] = useState(false);
  const [branchAssignments, setBranchAssignments] = useState<TeacherAssignment[]>([]);

  const [formData, setFormData] = useState({
    practical_life: '',
    sensorial: '',
    mathematics: '',
    language: '',
    culture: '',
    english: '',
    quran: '',
    moral_values: '',
    etiquette: '',
    art_music: '',
    focus_duration: null as 'high' | 'medium' | 'low' | null,
    communication_skills: null as 'high' | 'medium' | 'low' | null,
    collaboration: null as 'high' | 'medium' | 'low' | null,
    motivation: null as 'high' | 'medium' | 'low' | null,
    cleanliness_order: null as 'high' | 'medium' | 'low' | null,
    material_usage_skills: null as 'high' | 'medium' | 'low' | null,
    productivity: null as 'high' | 'medium' | 'low' | null,
    general_evaluation: '',
    montessori_interests: '',
    learning_process_evaluation: '',
    recommendations: '',
    guidance_evaluation: '',
    status: 'draft' as 'draft' | 'completed' | 'approved',
  });

  const t = {
    title: { tr: 'Dönem Gelişim Raporları', en: 'Periodic Development Reports' },
    selectPeriod: { tr: 'Dönem Seçin', en: 'Select Period' },
    selectChild: { tr: 'Öğrenci Seçin', en: 'Select Student' },
    createReport: { tr: 'Yeni Rapor Oluştur', en: 'Create New Report' },
    montessoriAreas: { tr: 'Montessori Alanları', en: 'Montessori Areas' },
    practicalLife: { tr: 'Pratik Yaşam Becerileri', en: 'Practical Life Skills' },
    sensorial: { tr: 'Duyusal Gelişim', en: 'Sensorial Development' },
    mathematics: { tr: 'Matematik', en: 'Mathematics' },
    language: { tr: 'Dil Gelişimi', en: 'Language Development' },
    culture: { tr: 'Kültür ve Bilim', en: 'Culture and Science' },
    branchCourses: { tr: 'Branş Dersleri', en: 'Branch Courses' },
    english: { tr: 'İngilizce', en: 'English' },
    quran: { tr: 'Kur\'an-ı Kerim', en: 'Holy Quran' },
    moralValues: { tr: 'Manevi Değerler', en: 'Moral Values' },
    etiquette: { tr: 'Adab-ı Muaşeret', en: 'Etiquette' },
    artMusic: { tr: 'Sanat ve Müzik', en: 'Art and Music' },
    likertScales: { tr: 'Gelişim Değerlendirmeleri', en: 'Development Evaluations' },
    focusDuration: { tr: 'Odak Süresi', en: 'Focus Duration' },
    communicationSkills: { tr: 'İletişim Becerileri', en: 'Communication Skills' },
    collaboration: { tr: 'İşbirliği', en: 'Collaboration' },
    motivation: { tr: 'Motivasyon', en: 'Motivation' },
    cleanlinessOrder: { tr: 'Temizlik ve Düzen', en: 'Cleanliness and Order' },
    materialUsageSkills: { tr: 'Materyal Kullanma Becerileri', en: 'Material Usage Skills' },
    productivity: { tr: 'Üretkenlik', en: 'Productivity' },
    highLevel: { tr: 'Yüksek Düzey', en: 'High Level' },
    mediumLevel: { tr: 'Orta Düzey', en: 'Medium Level' },
    lowLevel: { tr: 'Düşük Düzey', en: 'Low Level' },
    generalEvaluation: { tr: 'Genel Değerlendirme', en: 'General Evaluation' },
    montessoriInterests: { tr: 'Montessori\'de İlgi Duyduğu Alanlar', en: 'Areas of Interest in Montessori' },
    learningProcessEvaluation: { tr: 'Öğrenme Sürecindeki Odaklanma, Sınıf Uyumu ve İşbirliği Seviyesi', en: 'Focus, Classroom Adaptation and Collaboration in Learning Process' },
    recommendations: { tr: 'Öneriler ve Hedefler', en: 'Recommendations and Goals' },
    guidanceEvaluation: { tr: 'Rehberlik Birimi Değerlendirmesi', en: 'Guidance Unit Evaluation' },
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
    preparedBy: { tr: 'Hazırlayan', en: 'Prepared By' },
    evaluatedBy: { tr: 'Değerlendiren', en: 'Evaluated By' },
    completedBy: { tr: 'Dolduran', en: 'Completed By' },
    branchCompletion: { tr: 'Branş Tamamlanma', en: 'Branch Completion' },
    classTeacher: { tr: 'Sınıf Öğretmeni', en: 'Class Teacher' },
    branchTeacher: { tr: 'Branş Öğretmeni', en: 'Branch Teacher' },
    guidanceCounselor: { tr: 'Rehberlik Öğretmeni', en: 'Guidance Counselor' },
    allBranchesCompleted: { tr: 'Tüm branş dersleri dolduruldu', en: 'All branch courses completed' },
    waitingForBranches: { tr: 'Branş öğretmenleri bekleniyor', en: 'Waiting for branch teachers' },
    cannotCompleteWithoutBranches: { tr: 'Tüm branş dersleri ve rehberlik değerlendirmesi doldurulmadan rapor tamamlanamaz', en: 'Report cannot be completed without all branch courses and guidance evaluation' },
    missingEvaluations: { tr: 'Eksik Değerlendirmeler', en: 'Missing Evaluations' },
  };

  useEffect(() => {
    if (user && profile) {
      setIsGuidanceCounselor(profile.role === 'guidance_counselor');
      fetchPeriods();
      fetchChildren();
      fetchBranchAssignments();
    }
  }, [user, profile]);

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

  const fetchBranchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_branch_assignments')
        .select('course_type, class_name')
        .eq('teacher_id', user?.id);

      if (error) throw error;
      setBranchAssignments(data || []);
      setIsBranchTeacher((data || []).length > 0);
    } catch (error) {
      console.error('Error fetching branch assignments:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const classChildren = await supabase
        .from('teacher_children')
        .select(`
          child_id,
          children (
            id,
            first_name,
            last_name,
            class_name
          )
        `)
        .eq('teacher_id', user?.id);

      const classChildrenData = classChildren.data?.map((item: any) => ({
        id: item.children.id,
        first_name: item.children.first_name,
        last_name: item.children.last_name,
        class_name: item.children.class_name,
      })) || [];

      setIsClassTeacher(classChildrenData.length > 0);

      const branchChildren = await supabase
        .from('teacher_branch_assignments')
        .select(`
          class_name,
          course_type
        `)
        .eq('teacher_id', user?.id);

      if (branchChildren.data && branchChildren.data.length > 0) {
        const classNames = branchChildren.data.map((a: any) => a.class_name);

        const branchChildrenQuery = await supabase
          .from('children')
          .select('id, first_name, last_name, class_name')
          .in('class_name', classNames);

        const branchChildrenData = branchChildrenQuery.data || [];

        const allChildren = [...classChildrenData];
        branchChildrenData.forEach(bc => {
          if (!allChildren.find(c => c.id === bc.id)) {
            allChildren.push(bc);
          }
        });

        setChildren(allChildren);
      } else {
        setChildren(classChildrenData);
      }
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
      moral_values: '',
      etiquette: '',
      art_music: '',
      focus_duration: null,
      communication_skills: null,
      collaboration: null,
      motivation: null,
      cleanliness_order: null,
      material_usage_skills: null,
      productivity: null,
      general_evaluation: '',
      montessori_interests: '',
      learning_process_evaluation: '',
      recommendations: '',
      guidance_evaluation: '',
      status: 'draft',
    });
    setSelectedChild('');
    setViewMode('form');
  };

  const handleEdit = (report: PeriodicReport) => {
    setEditingReport(report);
    setFormData({
      practical_life: report.practical_life || '',
      sensorial: report.sensorial || '',
      mathematics: report.mathematics || '',
      language: report.language || '',
      culture: report.culture || '',
      english: report.english || '',
      quran: report.quran || '',
      moral_values: report.moral_values || '',
      etiquette: report.etiquette || '',
      art_music: report.art_music || '',
      focus_duration: report.focus_duration,
      communication_skills: report.communication_skills,
      collaboration: report.collaboration,
      motivation: report.motivation,
      cleanliness_order: report.cleanliness_order,
      material_usage_skills: report.material_usage_skills,
      productivity: report.productivity,
      general_evaluation: report.general_evaluation || '',
      montessori_interests: report.montessori_interests || '',
      learning_process_evaluation: report.learning_process_evaluation || '',
      recommendations: report.recommendations || '',
      guidance_evaluation: report.guidance_evaluation || '',
      status: report.status,
    });
    setSelectedChild(report.child_id);
    setViewMode('form');
  };

  const handleView = (report: PeriodicReport) => {
    setEditingReport(report);
    setFormData({
      practical_life: report.practical_life || '',
      sensorial: report.sensorial || '',
      mathematics: report.mathematics || '',
      language: report.language || '',
      culture: report.culture || '',
      english: report.english || '',
      quran: report.quran || '',
      moral_values: report.moral_values || '',
      etiquette: report.etiquette || '',
      art_music: report.art_music || '',
      focus_duration: report.focus_duration,
      communication_skills: report.communication_skills,
      collaboration: report.collaboration,
      motivation: report.motivation,
      cleanliness_order: report.cleanliness_order,
      material_usage_skills: report.material_usage_skills,
      productivity: report.productivity,
      general_evaluation: report.general_evaluation || '',
      montessori_interests: report.montessori_interests || '',
      learning_process_evaluation: report.learning_process_evaluation || '',
      recommendations: report.recommendations || '',
      guidance_evaluation: report.guidance_evaluation || '',
      status: report.status,
    });
    setViewMode('view');
  };

  const canEditBranch = (courseType: string) => {
    return branchAssignments.some(a => a.course_type === courseType);
  };

  const checkAllBranchesCompleted = (report: PeriodicReport | null): { allCompleted: boolean; missing: string[] } => {
    if (!report) return { allCompleted: false, missing: [] };

    const missing: string[] = [];

    if (!report.english_completed) missing.push(t.english[language]);
    if (!report.quran_completed) missing.push(t.quran[language]);
    if (!report.moral_values_completed) missing.push(t.moralValues[language]);
    if (!report.etiquette_completed) missing.push(t.etiquette[language]);
    if (!report.art_music_completed) missing.push(t.artMusic[language]);
    if (!report.guidance_completed) missing.push(t.guidanceEvaluation[language]);

    return { allCompleted: missing.length === 0, missing };
  };

  const handleSave = async (saveStatus: 'draft' | 'completed') => {
    if (!selectedChild || !selectedPeriod) {
      alert(language === 'tr' ? 'Lütfen öğrenci ve dönem seçin' : 'Please select student and period');
      return;
    }

    if (saveStatus === 'completed' && isClassTeacher) {
      const completionCheck = checkAllBranchesCompleted(editingReport);
      if (!completionCheck.allCompleted) {
        alert(`${t.cannotCompleteWithoutBranches[language]}\n\n${t.missingEvaluations[language]}: ${completionCheck.missing.join(', ')}`);
        return;
      }
    }

    try {
      setLoading(true);
      let reportData: any = {
        child_id: selectedChild,
        period_id: selectedPeriod,
        updated_at: new Date().toISOString(),
      };

      if (isClassTeacher) {
        reportData = {
          ...reportData,
          practical_life: formData.practical_life,
          sensorial: formData.sensorial,
          mathematics: formData.mathematics,
          language: formData.language,
          culture: formData.culture,
          focus_duration: formData.focus_duration,
          communication_skills: formData.communication_skills,
          collaboration: formData.collaboration,
          motivation: formData.motivation,
          cleanliness_order: formData.cleanliness_order,
          material_usage_skills: formData.material_usage_skills,
          productivity: formData.productivity,
          general_evaluation: formData.general_evaluation,
          montessori_interests: formData.montessori_interests,
          learning_process_evaluation: formData.learning_process_evaluation,
          recommendations: formData.recommendations,
          montessori_teacher_id: user?.id,
          montessori_completed: true,
          status: saveStatus,
        };
      }

      if (isBranchTeacher) {
        if (canEditBranch('english')) {
          reportData.english = formData.english;
          reportData.english_teacher_id = user?.id;
          reportData.english_completed = true;
        }
        if (canEditBranch('quran')) {
          reportData.quran = formData.quran;
          reportData.quran_teacher_id = user?.id;
          reportData.quran_completed = true;
        }
        if (canEditBranch('moral_values')) {
          reportData.moral_values = formData.moral_values;
          reportData.moral_values_teacher_id = user?.id;
          reportData.moral_values_completed = true;
        }
        if (canEditBranch('etiquette')) {
          reportData.etiquette = formData.etiquette;
          reportData.etiquette_teacher_id = user?.id;
          reportData.etiquette_completed = true;
        }
        if (canEditBranch('art_music')) {
          reportData.art_music = formData.art_music;
          reportData.art_music_teacher_id = user?.id;
          reportData.art_music_completed = true;
        }
      }

      if (isGuidanceCounselor) {
        reportData.guidance_evaluation = formData.guidance_evaluation;
        reportData.guidance_teacher_id = user?.id;
        reportData.guidance_completed = true;
      }

      if (editingReport) {
        const { error } = await supabase
          .from('periodic_development_reports')
          .update(reportData)
          .eq('id', editingReport.id);

        if (error) throw error;
      } else {
        if (!isClassTeacher) {
          alert(language === 'tr' ? 'Sadece sınıf öğretmeni yeni rapor oluşturabilir' : 'Only class teacher can create new report');
          return;
        }
        reportData.teacher_id = user?.id;
        reportData.status = 'draft';

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

  const getLikertBadgeColor = (level: string | null) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getLikertLabel = (level: string | null) => {
    switch (level) {
      case 'high': return t.highLevel[language];
      case 'medium': return t.mediumLevel[language];
      case 'low': return t.lowLevel[language];
      default: return language === 'tr' ? 'Seçilmedi' : 'Not Selected';
    }
  };

  const renderLikertField = (fieldName: keyof typeof formData, label: string) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-2">
          {[
            { value: 'high', label: t.highLevel[language], color: 'bg-green-100 hover:bg-green-200 border-green-300' },
            { value: 'medium', label: t.mediumLevel[language], color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
            { value: 'low', label: t.lowLevel[language], color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              disabled={!isClassTeacher}
              onClick={() => setFormData({ ...formData, [fieldName]: option.value })}
              className={`flex-1 px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                formData[fieldName] === option.value
                  ? option.color + ' border-opacity-100'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              } ${!isClassTeacher ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (viewMode === 'form') {
    const childData = children.find(c => c.id === selectedChild);

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
                    {child.first_name} {child.last_name} - {child.class_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isClassTeacher && (
            <>
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t.montessoriAreas[language]}</h3>
                  <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{t.classTeacher[language]}</span>
                </div>
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
                        value={formData[field.key as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`${field.label} ${language === 'tr' ? 'değerlendirmesi...' : 'evaluation...'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t.likertScales[language]}</h3>
                  <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{t.classTeacher[language]}</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {renderLikertField('focus_duration', t.focusDuration[language])}
                  {renderLikertField('communication_skills', t.communicationSkills[language])}
                  {renderLikertField('collaboration', t.collaboration[language])}
                  {renderLikertField('motivation', t.motivation[language])}
                  {renderLikertField('cleanliness_order', t.cleanlinessOrder[language])}
                  {renderLikertField('material_usage_skills', t.materialUsageSkills[language])}
                  {renderLikertField('productivity', t.productivity[language])}
                </div>
              </div>
            </>
          )}

          {isBranchTeacher && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t.branchCourses[language]}</h3>
                <span className="ml-auto px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">{t.branchTeacher[language]}</span>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'english', label: t.english[language], courseType: 'english' },
                  { key: 'quran', label: t.quran[language], courseType: 'quran' },
                  { key: 'moral_values', label: t.moralValues[language], courseType: 'moral_values' },
                  { key: 'etiquette', label: t.etiquette[language], courseType: 'etiquette' },
                  { key: 'art_music', label: t.artMusic[language], courseType: 'art_music' },
                ].map(field => {
                  const canEdit = canEditBranch(field.courseType);
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {canEdit && <span className="ml-2 text-xs text-green-600">({language === 'tr' ? 'Düzenleyebilirsiniz' : 'You can edit'})</span>}
                        {!canEdit && <span className="ml-2 text-xs text-gray-500">({language === 'tr' ? 'Sadece okuma' : 'Read only'})</span>}
                      </label>
                      <textarea
                        value={formData[field.key as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        rows={3}
                        disabled={!canEdit}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={canEdit ? `${field.label} ${language === 'tr' ? 'değerlendirmesi...' : 'evaluation...'}` : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isGuidanceCounselor && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t.guidanceEvaluation[language]}</h3>
                <span className="ml-auto px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">{t.guidanceCounselor[language]}</span>
              </div>
              <div>
                <textarea
                  value={formData.guidance_evaluation}
                  onChange={(e) => setFormData({ ...formData, guidance_evaluation: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Rehberlik birimi değerlendirmesi...' : 'Guidance evaluation...'}
                />
              </div>
            </div>
          )}

          {isClassTeacher && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t.generalEvaluation[language]}</h3>
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{t.classTeacher[language]}</span>
              </div>
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
                    {t.montessoriInterests[language]}
                  </label>
                  <textarea
                    value={formData.montessori_interests}
                    onChange={(e) => setFormData({ ...formData, montessori_interests: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={language === 'tr' ? 'Öğrencinin Montessori\'de ilgi duyduğu alanlar...' : 'Areas of interest in Montessori...'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.learningProcessEvaluation[language]}
                  </label>
                  <textarea
                    value={formData.learning_process_evaluation}
                    onChange={(e) => setFormData({ ...formData, learning_process_evaluation: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={language === 'tr' ? 'Odaklanma, sınıf uyumu ve işbirliği seviyesi...' : 'Focus, classroom adaptation and collaboration...'}
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
          )}

          {editingReport && !isClassTeacher && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {t.branchCompletion[language]}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {checkAllBranchesCompleted(editingReport).allCompleted
                      ? t.allBranchesCompleted[language]
                      : t.waitingForBranches[language]}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {t.saveAsDraft[language]}
            </button>
            {isClassTeacher && (
              <button
                onClick={() => handleSave('completed')}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t.saveAsCompleted[language]}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && editingReport) {
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

          {(formData.practical_life || formData.sensorial || formData.mathematics || formData.language || formData.culture) && (
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
          )}

          {(formData.focus_duration || formData.communication_skills || formData.collaboration || formData.motivation || formData.cleanliness_order || formData.material_usage_skills || formData.productivity) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.likertScales[language]}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t.focusDuration[language], value: formData.focus_duration },
                  { label: t.communicationSkills[language], value: formData.communication_skills },
                  { label: t.collaboration[language], value: formData.collaboration },
                  { label: t.motivation[language], value: formData.motivation },
                  { label: t.cleanlinessOrder[language], value: formData.cleanliness_order },
                  { label: t.materialUsageSkills[language], value: formData.material_usage_skills },
                  { label: t.productivity[language], value: formData.productivity },
                ].map((item, index) => (
                  item.value && (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLikertBadgeColor(item.value)}`}>
                        {getLikertLabel(item.value)}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {(formData.english || formData.quran || formData.moral_values || formData.etiquette || formData.art_music) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.branchCourses[language]}</h4>
              <div className="space-y-3">
                {[
                  { label: t.english[language], value: formData.english },
                  { label: t.quran[language], value: formData.quran },
                  { label: t.moralValues[language], value: formData.moral_values },
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
          )}

          {formData.guidance_evaluation && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.guidanceEvaluation[language]}</h4>
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-gray-700">{formData.guidance_evaluation}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{t.generalEvaluation[language]}</h4>
            <div className="space-y-3">
              {formData.general_evaluation && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{t.generalEvaluation[language]}</p>
                  <p className="text-gray-700">{formData.general_evaluation}</p>
                </div>
              )}
              {formData.montessori_interests && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{t.montessoriInterests[language]}</p>
                  <p className="text-gray-700">{formData.montessori_interests}</p>
                </div>
              )}
              {formData.learning_process_evaluation && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{t.learningProcessEvaluation[language]}</p>
                  <p className="text-gray-700">{formData.learning_process_evaluation}</p>
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          {t.title[language]}
        </h2>
        {isClassTeacher && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.createReport[language]}
          </button>
        )}
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
                      {isClassTeacher && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title={t.delete[language]}
                        >
                          <Trash2 className="w-5 h-5" />
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
  );
}
