import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Eye, CreditCard as Edit2, Calendar, User, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import EvaluationDetailModal from './EvaluationDetailModal';
import EditEvaluationModal from './EditEvaluationModal';

interface EvaluationCategory {
  id: string;
  category_name: string;
  display_name: string;
}

interface EvaluationQuestion {
  id: string;
  category_id: string;
  question_text: string;
  display_order: number;
}

interface Evaluation {
  id: string;
  evaluator_id: string;
  evaluated_category: string;
  evaluated_user_id: string | null;
  evaluation_period: string;
  scores: { [key: string]: number };
  comments: string | null;
  created_at: string;
  evaluator?: {
    full_name: string;
    role: string;
  };
  evaluated_user?: {
    full_name: string;
    role: string;
  };
}

export default function MyEvaluationsList() {
  const { language } = useLanguage();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [questions, setQuestions] = useState<{ [key: string]: EvaluationQuestion[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  const texts = {
    tr: {
      title: 'Değerlendirmelerim',
      search: 'Ara...',
      allCategories: 'Tüm Kategoriler',
      allPeriods: 'Tüm Dönemler',
      noEvaluations: 'Henüz değerlendirme yapmadınız',
      evaluatedUser: 'Değerlendirilen',
      category: 'Kategori',
      period: 'Dönem',
      date: 'Tarih',
      averageScore: 'Ortalama Puan',
      viewDetails: 'Detayları Gör',
      edit: 'Düzenle',
      loading: 'Yükleniyor...',
      selfEvaluation: 'Kendi Değerlendirmesi',
      totalEvaluations: 'Toplam Değerlendirme',
      avgScore: 'Ort. Puan',
    },
    en: {
      title: 'My Evaluations',
      search: 'Search...',
      allCategories: 'All Categories',
      allPeriods: 'All Periods',
      noEvaluations: 'You have not made any evaluations yet',
      evaluatedUser: 'Evaluated User',
      category: 'Category',
      period: 'Period',
      date: 'Date',
      averageScore: 'Average Score',
      viewDetails: 'View Details',
      edit: 'Edit',
      loading: 'Loading...',
      selfEvaluation: 'Self Evaluation',
      totalEvaluations: 'Total Evaluations',
      avgScore: 'Avg. Score',
    },
  };

  const t = texts[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [categoriesData, questionsData, evaluationsData] = await Promise.all([
        supabase.from('evaluation_categories').select('*').order('display_name'),
        supabase.from('evaluation_questions').select('*').order('display_order'),
        supabase
          .from('evaluations')
          .select(`
            *,
            evaluator:evaluator_id(full_name, role),
            evaluated_user:evaluated_user_id(full_name, role)
          `)
          .eq('evaluator_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (categoriesData.error) throw categoriesData.error;
      if (questionsData.error) throw questionsData.error;
      if (evaluationsData.error) throw evaluationsData.error;

      setCategories(categoriesData.data || []);
      setEvaluations(evaluationsData.data || []);

      const questionsByCategory: { [key: string]: EvaluationQuestion[] } = {};
      (questionsData.data || []).forEach(q => {
        const category = (categoriesData.data || []).find(c => c.id === q.category_id);
        if (category) {
          if (!questionsByCategory[category.category_name]) {
            questionsByCategory[category.category_name] = [];
          }
          questionsByCategory[category.category_name].push(q);
        }
      });
      setQuestions(questionsByCategory);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-blue-600 bg-blue-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const category = categories.find(c => c.category_name === evaluation.evaluated_category);
    const categoryMatch = selectedCategory === 'all' || evaluation.evaluated_category === selectedCategory;
    const periodMatch = selectedPeriod === 'all' || evaluation.evaluation_period === selectedPeriod;

    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm ||
      (evaluation.evaluated_user?.full_name.toLowerCase().includes(searchLower)) ||
      (category?.display_name.toLowerCase().includes(searchLower)) ||
      (evaluation.comments?.toLowerCase().includes(searchLower));

    return categoryMatch && periodMatch && searchMatch;
  });

  const uniquePeriods = [...new Set(evaluations.map(e => e.evaluation_period))].sort().reverse();

  const totalAvgScore = filteredEvaluations.length > 0
    ? filteredEvaluations.reduce((sum, evaluation) => {
        const scoreValues = Object.values(evaluation.scores);
        const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        return sum + avgScore;
      }, 0) / filteredEvaluations.length
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{t.title}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {filteredEvaluations.length} değerlendirme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">{t.totalEvaluations}</p>
              <p className="text-3xl font-bold text-blue-900">{filteredEvaluations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">{t.avgScore}</p>
              <p className="text-3xl font-bold text-green-900">{totalAvgScore.toFixed(1)} / 10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.category_name}>{cat.display_name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">{t.allPeriods}</option>
              {uniquePeriods.map(period => (
                <option key={period} value={period}>
                  {new Date(period + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvaluations.map(evaluation => {
          const category = categories.find(c => c.category_name === evaluation.evaluated_category);
          const scoreValues = Object.values(evaluation.scores);
          const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

          return (
            <div key={evaluation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t.evaluatedUser}</p>
                        <p className="font-semibold text-gray-800">
                          {evaluation.evaluated_user?.full_name || t.selfEvaluation}
                        </p>
                        {evaluation.evaluated_user && (
                          <p className="text-xs text-gray-500">{evaluation.evaluated_user.role}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t.category}</p>
                        <p className="text-sm font-medium text-gray-700">{category?.display_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t.period}</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(evaluation.evaluation_period + '-01').toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t.date}</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(evaluation.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <div className={`px-6 py-3 rounded-xl font-bold text-2xl ${getScoreColor(avgScore)}`}>
                      {avgScore.toFixed(1)} / 10
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEvaluation(evaluation)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{t.viewDetails}</span>
                      </button>
                      <button
                        onClick={() => setEditingEvaluation(evaluation)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">{t.edit}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {evaluation.comments && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{evaluation.comments}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvaluations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">{t.noEvaluations}</p>
          </div>
        )}
      </div>

      {selectedEvaluation && (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          categoryName={categories.find(c => c.category_name === selectedEvaluation.evaluated_category)?.display_name || ''}
          questions={questions[selectedEvaluation.evaluated_category] || []}
          onClose={() => setSelectedEvaluation(null)}
          onEdit={() => {
            setEditingEvaluation(selectedEvaluation);
            setSelectedEvaluation(null);
          }}
          canEdit={true}
        />
      )}

      {editingEvaluation && (
        <EditEvaluationModal
          evaluation={editingEvaluation}
          categoryName={categories.find(c => c.category_name === editingEvaluation.evaluated_category)?.display_name || ''}
          questions={questions[editingEvaluation.evaluated_category] || []}
          onClose={() => setEditingEvaluation(null)}
          onSave={() => {
            setEditingEvaluation(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
