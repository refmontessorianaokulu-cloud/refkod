import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Calendar, FileText, TrendingUp, User, Target } from 'lucide-react';

interface AcademicPeriod {
  id: string;
  name: string;
  period_number: number;
}

interface PeriodicReport {
  id: string;
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
  status: string;
  created_at: string;
  updated_at: string;
  academic_periods?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface Props {
  childId: string;
}

export default function PeriodicReportsParentView({ childId }: Props) {
  const { language } = useLanguage();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [reports, setReports] = useState<PeriodicReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PeriodicReport | null>(null);

  const t = {
    title: { tr: 'Ref Karne', en: 'Ref Report Card' },
    selectPeriod: { tr: 'Dönem Seçin', en: 'Select Period' },
    noReports: { tr: 'Bu dönem için karne bulunmuyor', en: 'No report cards for this period' },
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
    teacher: { tr: 'Öğretmen', en: 'Teacher' },
    reportDate: { tr: 'Karne Tarihi', en: 'Report Card Date' },
    preparedBy: { tr: 'Hazırlayan', en: 'Prepared By' },
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod && childId) {
      fetchReports();
    }
  }, [selectedPeriod, childId]);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('periodic_development_reports')
        .select(`
          *,
          academic_periods (
            name
          ),
          profiles (
            full_name
          )
        `)
        .eq('child_id', childId)
        .eq('period_id', selectedPeriod)
        .in('status', ['completed', 'approved']);

      if (error) throw error;
      setReports(data || []);
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
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
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-blue-600" />
          {t.title[language]}
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.selectPeriod[language]}</option>
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : !selectedReport ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noReports[language]}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t.preparedBy[language]}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedReport.profiles?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{t.reportDate[language]}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(selectedReport.updated_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>

            {(selectedReport.practical_life || selectedReport.sensorial || selectedReport.mathematics || selectedReport.language || selectedReport.culture) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {t.montessoriAreas[language]}
                </h3>
                <div className="space-y-3">
                  {selectedReport.practical_life && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.practicalLife[language]}</p>
                      <p className="text-gray-700">{selectedReport.practical_life}</p>
                    </div>
                  )}
                  {selectedReport.sensorial && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.sensorial[language]}</p>
                      <p className="text-gray-700">{selectedReport.sensorial}</p>
                    </div>
                  )}
                  {selectedReport.mathematics && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.mathematics[language]}</p>
                      <p className="text-gray-700">{selectedReport.mathematics}</p>
                    </div>
                  )}
                  {selectedReport.language && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.language[language]}</p>
                      <p className="text-gray-700">{selectedReport.language}</p>
                    </div>
                  )}
                  {selectedReport.culture && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.culture[language]}</p>
                      <p className="text-gray-700">{selectedReport.culture}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedReport.focus_duration || selectedReport.communication_skills || selectedReport.collaboration || selectedReport.motivation || selectedReport.cleanliness_order || selectedReport.material_usage_skills || selectedReport.productivity) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  {t.likertScales[language]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: t.focusDuration[language], value: selectedReport.focus_duration },
                    { label: t.communicationSkills[language], value: selectedReport.communication_skills },
                    { label: t.collaboration[language], value: selectedReport.collaboration },
                    { label: t.motivation[language], value: selectedReport.motivation },
                    { label: t.cleanlinessOrder[language], value: selectedReport.cleanliness_order },
                    { label: t.materialUsageSkills[language], value: selectedReport.material_usage_skills },
                    { label: t.productivity[language], value: selectedReport.productivity },
                  ].map((item, index) => (
                    item.value && (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLikertBadgeColor(item.value)}`}>
                          {getLikertLabel(item.value)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {(selectedReport.english || selectedReport.quran || selectedReport.moral_values || selectedReport.etiquette || selectedReport.art_music) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {t.branchCourses[language]}
                </h3>
                <div className="space-y-3">
                  {selectedReport.english && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.english[language]}</p>
                      <p className="text-gray-700">{selectedReport.english}</p>
                    </div>
                  )}
                  {selectedReport.quran && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.quran[language]}</p>
                      <p className="text-gray-700">{selectedReport.quran}</p>
                    </div>
                  )}
                  {selectedReport.moral_values && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.moralValues[language]}</p>
                      <p className="text-gray-700">{selectedReport.moral_values}</p>
                    </div>
                  )}
                  {selectedReport.etiquette && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.etiquette[language]}</p>
                      <p className="text-gray-700">{selectedReport.etiquette}</p>
                    </div>
                  )}
                  {selectedReport.art_music && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{t.artMusic[language]}</p>
                      <p className="text-gray-700">{selectedReport.art_music}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedReport.guidance_evaluation && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  {t.guidanceEvaluation[language]}
                </h3>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-gray-700">{selectedReport.guidance_evaluation}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t.generalEvaluation[language]}
              </h3>
              <div className="space-y-3">
                {selectedReport.general_evaluation && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-900 mb-2">{t.generalEvaluation[language]}</p>
                    <p className="text-gray-700">{selectedReport.general_evaluation}</p>
                  </div>
                )}
                {selectedReport.montessori_interests && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="font-medium text-gray-900 mb-2">{t.montessoriInterests[language]}</p>
                    <p className="text-gray-700">{selectedReport.montessori_interests}</p>
                  </div>
                )}
                {selectedReport.learning_process_evaluation && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="font-medium text-gray-900 mb-2">{t.learningProcessEvaluation[language]}</p>
                    <p className="text-gray-700">{selectedReport.learning_process_evaluation}</p>
                  </div>
                )}
                {selectedReport.recommendations && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="font-medium text-gray-900 mb-2">{t.recommendations[language]}</p>
                    <p className="text-gray-700">{selectedReport.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
