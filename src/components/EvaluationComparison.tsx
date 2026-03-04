import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, Minus, User, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
  evaluated_user?: {
    full_name: string;
    role: string;
  };
}

interface UserPeriodData {
  userId: string;
  userName: string;
  periods: {
    [period: string]: {
      avgScore: number;
      evaluationCount: number;
    };
  };
}

export default function EvaluationComparison() {
  const { language } = useLanguage();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [questions, setQuestions] = useState<{ [key: string]: EvaluationQuestion[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [userPeriodData, setUserPeriodData] = useState<UserPeriodData[]>([]);

  const texts = {
    tr: {
      title: 'Karşılaştırmalı Analiz ve Trendler',
      selectCategory: 'Kategori Seçin',
      selectUser: 'Kullanıcı Seçin',
      allCategories: 'Tüm Kategoriler',
      allUsers: 'Tüm Kullanıcılar',
      period: 'Dönem',
      avgScore: 'Ort. Puan',
      evaluationCount: 'Değerlendirme',
      trend: 'Trend',
      improving: 'Yükseliş',
      declining: 'Düşüş',
      stable: 'Stabil',
      noData: 'Karşılaştırma için yeterli veri yok',
      loading: 'Yükleniyor...',
      periodComparison: 'Dönemsel Karşılaştırma',
      questionTrends: 'Soru Bazlı Trendler',
      overallTrend: 'Genel Trend',
    },
    en: {
      title: 'Comparative Analysis and Trends',
      selectCategory: 'Select Category',
      selectUser: 'Select User',
      allCategories: 'All Categories',
      allUsers: 'All Users',
      period: 'Period',
      avgScore: 'Avg. Score',
      evaluationCount: 'Evaluations',
      trend: 'Trend',
      improving: 'Improving',
      declining: 'Declining',
      stable: 'Stable',
      noData: 'Not enough data for comparison',
      loading: 'Loading...',
      periodComparison: 'Period Comparison',
      questionTrends: 'Question Trends',
      overallTrend: 'Overall Trend',
    },
  };

  const t = texts[language];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (evaluations.length > 0) {
      calculateTrends();
    }
  }, [evaluations, selectedCategory, selectedUser]);

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
            evaluated_user:evaluated_user_id(full_name, role)
          `)
          .eq('evaluator_id', user.id)
          .not('evaluated_user_id', 'is', null)
          .order('evaluation_period', { ascending: true })
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
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = () => {
    let filteredEvaluations = evaluations;

    if (selectedCategory !== 'all') {
      filteredEvaluations = filteredEvaluations.filter(e => e.evaluated_category === selectedCategory);
    }

    if (selectedUser !== 'all') {
      filteredEvaluations = filteredEvaluations.filter(e => e.evaluated_user_id === selectedUser);
    }

    const userDataMap: { [key: string]: UserPeriodData } = {};

    filteredEvaluations.forEach(evaluation => {
      if (!evaluation.evaluated_user_id || !evaluation.evaluated_user) return;

      if (!userDataMap[evaluation.evaluated_user_id]) {
        userDataMap[evaluation.evaluated_user_id] = {
          userId: evaluation.evaluated_user_id,
          userName: evaluation.evaluated_user.full_name,
          periods: {},
        };
      }

      const scoreValues = Object.values(evaluation.scores);
      const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

      if (!userDataMap[evaluation.evaluated_user_id].periods[evaluation.evaluation_period]) {
        userDataMap[evaluation.evaluated_user_id].periods[evaluation.evaluation_period] = {
          avgScore: 0,
          evaluationCount: 0,
        };
      }

      const periodData = userDataMap[evaluation.evaluated_user_id].periods[evaluation.evaluation_period];
      periodData.avgScore = (periodData.avgScore * periodData.evaluationCount + avgScore) / (periodData.evaluationCount + 1);
      periodData.evaluationCount++;
    });

    setUserPeriodData(Object.values(userDataMap));
  };

  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.3) {
      return <Minus className="w-5 h-5 text-gray-500" />;
    }
    return diff > 0
      ? <TrendingUp className="w-5 h-5 text-green-500" />
      : <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getTrendText = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.3) return t.stable;
    return diff > 0 ? t.improving : t.declining;
  };

  const getTrendColor = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.3) return 'text-gray-600 bg-gray-50';
    return diff > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-blue-600 bg-blue-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const uniqueUsers = [...new Set(evaluations.map(e => e.evaluated_user_id))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800">{t.title}</h3>
        <p className="text-gray-600 text-sm mt-1">
          Değerlendirmelerin zaman içindeki gelişimini takip edin
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectCategory}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.category_name}>{cat.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectUser}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.allUsers}</option>
              {uniqueUsers.map(userId => {
                const evaluation = evaluations.find(e => e.evaluated_user_id === userId);
                return (
                  <option key={userId} value={userId}>
                    {evaluation?.evaluated_user?.full_name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {userPeriodData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500 text-lg">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {userPeriodData.map(userData => {
            const periods = Object.keys(userData.periods).sort();
            if (periods.length < 2) return null;

            return (
              <div key={userData.userId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{userData.userName}</h4>
                      <p className="text-sm text-gray-600">{t.periodComparison}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.period}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.evaluationCount}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.avgScore}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t.trend}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {periods.map((period, index) => {
                          const periodData = userData.periods[period];
                          const previousPeriod = index > 0 ? userData.periods[periods[index - 1]] : null;

                          return (
                            <tr key={period} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {new Date(period + '-01').toLocaleDateString('tr-TR', {
                                      year: 'numeric',
                                      month: 'long',
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                {periodData.evaluationCount}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-lg font-semibold ${getScoreColor(periodData.avgScore)}`}>
                                  {periodData.avgScore.toFixed(1)} / 10
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {previousPeriod ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    {getTrendIcon(periodData.avgScore, previousPeriod.avgScore)}
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${getTrendColor(periodData.avgScore, previousPeriod.avgScore)}`}>
                                      {getTrendText(periodData.avgScore, previousPeriod.avgScore)}
                                      {' '}
                                      ({(periodData.avgScore - previousPeriod.avgScore > 0 ? '+' : '')}
                                      {(periodData.avgScore - previousPeriod.avgScore).toFixed(1)})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t.overallTrend}</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {userData.periods[periods[0]].avgScore.toFixed(1)} → {userData.periods[periods[periods.length - 1]].avgScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(
                          userData.periods[periods[periods.length - 1]].avgScore,
                          userData.periods[periods[0]].avgScore
                        )}
                        <span className={`text-lg font-bold px-4 py-2 rounded-lg ${getTrendColor(
                          userData.periods[periods[periods.length - 1]].avgScore,
                          userData.periods[periods[0]].avgScore
                        )}`}>
                          {(userData.periods[periods[periods.length - 1]].avgScore - userData.periods[periods[0]].avgScore > 0 ? '+' : '')}
                          {(userData.periods[periods[periods.length - 1]].avgScore - userData.periods[periods[0]].avgScore).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
