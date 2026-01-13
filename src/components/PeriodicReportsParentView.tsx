import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Calendar, FileText, TrendingUp } from 'lucide-react';

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
  spiritual_values: string;
  etiquette: string;
  art_music: string;
  general_evaluation: string;
  strengths: string;
  areas_to_improve: string;
  recommendations: string;
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
    title: { tr: 'Dönem Gelişim Raporları', en: 'Periodic Development Reports' },
    selectPeriod: { tr: 'Dönem Seçin', en: 'Select Period' },
    noReports: { tr: 'Bu dönem için rapor bulunmuyor', en: 'No reports for this period' },
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
    teacher: { tr: 'Öğretmen', en: 'Teacher' },
    reportDate: { tr: 'Rapor Tarihi', en: 'Report Date' },
    compare: { tr: 'Dönemleri Karşılaştır', en: 'Compare Periods' },
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
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.teacher[language]}</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedReport.profiles?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{t.reportDate[language]}</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedReport.updated_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {t.montessoriAreas[language]}
              </h3>
              <div className="space-y-4">
                {selectedReport.practical_life && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.practicalLife[language]}</p>
                    <p className="text-gray-700">{selectedReport.practical_life}</p>
                  </div>
                )}
                {selectedReport.sensorial && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.sensorial[language]}</p>
                    <p className="text-gray-700">{selectedReport.sensorial}</p>
                  </div>
                )}
                {selectedReport.mathematics && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.mathematics[language]}</p>
                    <p className="text-gray-700">{selectedReport.mathematics}</p>
                  </div>
                )}
                {selectedReport.language && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.language[language]}</p>
                    <p className="text-gray-700">{selectedReport.language}</p>
                  </div>
                )}
                {selectedReport.culture && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.culture[language]}</p>
                    <p className="text-gray-700">{selectedReport.culture}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t.branchCourses[language]}
              </h3>
              <div className="space-y-4">
                {selectedReport.english && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.english[language]}</p>
                    <p className="text-gray-700">{selectedReport.english}</p>
                  </div>
                )}
                {selectedReport.quran && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.quran[language]}</p>
                    <p className="text-gray-700">{selectedReport.quran}</p>
                  </div>
                )}
                {selectedReport.spiritual_values && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.spiritualValues[language]}</p>
                    <p className="text-gray-700">{selectedReport.spiritual_values}</p>
                  </div>
                )}
                {selectedReport.etiquette && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.etiquette[language]}</p>
                    <p className="text-gray-700">{selectedReport.etiquette}</p>
                  </div>
                )}
                {selectedReport.art_music && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.artMusic[language]}</p>
                    <p className="text-gray-700">{selectedReport.art_music}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t.generalEvaluation[language]}
              </h3>
              <div className="space-y-4">
                {selectedReport.general_evaluation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.generalEvaluation[language]}</p>
                    <p className="text-gray-700">{selectedReport.general_evaluation}</p>
                  </div>
                )}
                {selectedReport.strengths && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.strengths[language]}</p>
                    <p className="text-gray-700">{selectedReport.strengths}</p>
                  </div>
                )}
                {selectedReport.areas_to_improve && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{t.areasToImprove[language]}</p>
                    <p className="text-gray-700">{selectedReport.areas_to_improve}</p>
                  </div>
                )}
                {selectedReport.recommendations && (
                  <div className="bg-purple-50 p-4 rounded-lg">
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