import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';

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

interface CategoryStats {
  category: string;
  categoryName: string;
  totalEvaluations: number;
  averageScore: number;
  questionAverages: { [key: string]: number };
}

interface UserStats {
  userId: string;
  userName: string;
  category: string;
  evaluationCount: number;
  averageScore: number;
}

export default function RefEvaluationAnalytics() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [questions, setQuestions] = useState<{ [key: string]: EvaluationQuestion[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (evaluations.length > 0 && categories.length > 0) {
      calculateStatistics();
    }
  }, [evaluations, categories, questions, selectedPeriod, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

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

  const calculateStatistics = () => {
    let filteredEvaluations = evaluations;

    if (selectedPeriod !== 'all') {
      filteredEvaluations = evaluations.filter(e => e.evaluation_period === selectedPeriod);
    }

    if (selectedCategory !== 'all') {
      filteredEvaluations = evaluations.filter(e => e.evaluated_category === selectedCategory);
    }

    const categoryStatsMap: { [key: string]: CategoryStats } = {};
    const userStatsMap: { [key: string]: UserStats } = {};

    filteredEvaluations.forEach(evaluation => {
      const category = categories.find(c => c.category_name === evaluation.evaluated_category);
      if (!category) return;

      if (!categoryStatsMap[evaluation.evaluated_category]) {
        categoryStatsMap[evaluation.evaluated_category] = {
          category: evaluation.evaluated_category,
          categoryName: category.display_name,
          totalEvaluations: 0,
          averageScore: 0,
          questionAverages: {},
        };
      }

      categoryStatsMap[evaluation.evaluated_category].totalEvaluations++;

      const scoreValues = Object.values(evaluation.scores);
      const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
      categoryStatsMap[evaluation.evaluated_category].averageScore += avgScore;

      Object.entries(evaluation.scores).forEach(([questionId, score]) => {
        if (!categoryStatsMap[evaluation.evaluated_category].questionAverages[questionId]) {
          categoryStatsMap[evaluation.evaluated_category].questionAverages[questionId] = 0;
        }
        categoryStatsMap[evaluation.evaluated_category].questionAverages[questionId] += score;
      });

      if (evaluation.evaluated_user_id && evaluation.evaluated_user) {
        const key = `${evaluation.evaluated_user_id}-${evaluation.evaluated_category}`;
        if (!userStatsMap[key]) {
          userStatsMap[key] = {
            userId: evaluation.evaluated_user_id,
            userName: evaluation.evaluated_user.full_name,
            category: category.display_name,
            evaluationCount: 0,
            averageScore: 0,
          };
        }

        userStatsMap[key].evaluationCount++;
        userStatsMap[key].averageScore += avgScore;
      }
    });

    Object.values(categoryStatsMap).forEach(stat => {
      stat.averageScore = stat.averageScore / stat.totalEvaluations;
      Object.keys(stat.questionAverages).forEach(questionId => {
        stat.questionAverages[questionId] = stat.questionAverages[questionId] / stat.totalEvaluations;
      });
    });

    Object.values(userStatsMap).forEach(stat => {
      stat.averageScore = stat.averageScore / stat.evaluationCount;
    });

    setCategoryStats(Object.values(categoryStatsMap).sort((a, b) => b.averageScore - a.averageScore));
    setUserStats(Object.values(userStatsMap).sort((a, b) => b.averageScore - a.averageScore));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-blue-600 bg-blue-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBarWidth = (score: number) => {
    return `${(score / 10) * 100}%`;
  };

  const uniquePeriods = [...new Set(evaluations.map(e => e.evaluation_period))].sort().reverse();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="text-xl font-semibold text-gray-800">Değerlendirme Analizleri</h3>
        <div className="flex space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.category_name}>{cat.display_name}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Dönemler</option>
            {uniquePeriods.map(period => (
              <option key={period} value={period}>
                {new Date(period + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Değerlendirme</p>
              <p className="text-2xl font-bold text-gray-800">{evaluations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ortalama Puan</p>
              <p className="text-2xl font-bold text-gray-800">
                {categoryStats.length > 0
                  ? (categoryStats.reduce((a, b) => a + b.averageScore, 0) / categoryStats.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Değerlendirilen Kişi</p>
              <p className="text-2xl font-bold text-gray-800">{userStats.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Kategori Bazlı İstatistikler</span>
        </h4>
        <div className="space-y-4">
          {categoryStats.map(stat => (
            <div key={stat.category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h5 className="font-semibold text-gray-800">{stat.categoryName}</h5>
                  <p className="text-sm text-gray-600">{stat.totalEvaluations} değerlendirme</p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold ${getScoreColor(stat.averageScore)}`}>
                  {stat.averageScore.toFixed(1)} / 10
                </div>
              </div>

              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: getScoreBarWidth(stat.averageScore) }}
                />
              </div>

              {questions[stat.category] && questions[stat.category].length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Soru Bazlı Ortalamalar:</p>
                  {questions[stat.category].map(q => (
                    <div key={q.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{q.question_text}</span>
                      <span className={`font-semibold px-2 py-1 rounded ${getScoreColor(stat.questionAverages[q.id] || 0)}`}>
                        {(stat.questionAverages[q.id] || 0).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {categoryStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Seçilen filtrelere uygun değerlendirme bulunamadı
            </div>
          )}
        </div>
      </div>

      {userStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Kişi Bazlı Performans</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kişi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değerlendirme Sayısı
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ortalama Puan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {stat.userName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {stat.evaluationCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-lg font-semibold ${getScoreColor(stat.averageScore)}`}>
                        {stat.averageScore.toFixed(1)} / 10
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Son Değerlendirmeler</h4>
        <div className="space-y-3">
          {evaluations.slice(0, 10).map(evaluation => {
            const category = categories.find(c => c.category_name === evaluation.evaluated_category);
            const scoreValues = Object.values(evaluation.scores);
            const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

            return (
              <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {evaluation.evaluator?.full_name} → {category?.display_name}
                      {evaluation.evaluated_user && ` (${evaluation.evaluated_user.full_name})`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(evaluation.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${getScoreColor(avgScore)}`}>
                    {avgScore.toFixed(1)} / 10
                  </span>
                </div>
                {evaluation.comments && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                    {evaluation.comments}
                  </p>
                )}
              </div>
            );
          })}

          {evaluations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Henüz değerlendirme yapılmamış
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
