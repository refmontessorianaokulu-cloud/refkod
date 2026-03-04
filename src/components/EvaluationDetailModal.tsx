import { X, TrendingUp, Calendar, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  display_order: number;
}

interface EvaluationDetailModalProps {
  evaluation: {
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
  };
  categoryName: string;
  questions: EvaluationQuestion[];
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function EvaluationDetailModal({
  evaluation,
  categoryName,
  questions,
  onClose,
  onEdit,
  canEdit = false,
}: EvaluationDetailModalProps) {
  const { language } = useLanguage();

  const texts = {
    tr: {
      title: 'Değerlendirme Detayları',
      evaluator: 'Değerlendiren',
      evaluated: 'Değerlendirilen',
      category: 'Kategori',
      period: 'Dönem',
      date: 'Tarih',
      averageScore: 'Ortalama Puan',
      questions: 'Sorular ve Puanlar',
      comments: 'Yorumlar',
      noComments: 'Yorum eklenmemiş',
      edit: 'Düzenle',
      close: 'Kapat',
    },
    en: {
      title: 'Evaluation Details',
      evaluator: 'Evaluator',
      evaluated: 'Evaluated',
      category: 'Category',
      period: 'Period',
      date: 'Date',
      averageScore: 'Average Score',
      questions: 'Questions and Scores',
      comments: 'Comments',
      noComments: 'No comments added',
      edit: 'Edit',
      close: 'Close',
    },
  };

  const t = texts[language];

  const scoreValues = Object.values(evaluation.scores);
  const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 text-green-700';
    if (score >= 6) return 'bg-blue-50 text-blue-700';
    if (score >= 4) return 'bg-yellow-50 text-yellow-700';
    return 'bg-red-50 text-red-700';
  };

  const sortedQuestions = [...questions].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t.evaluator}</p>
                  <p className="font-semibold text-gray-800">
                    {evaluation.evaluator?.full_name || '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {evaluation.evaluator?.role || '-'}
                  </p>
                </div>
              </div>

              {evaluation.evaluated_user && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t.evaluated}</p>
                    <p className="font-semibold text-gray-800">
                      {evaluation.evaluated_user.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {evaluation.evaluated_user.role}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t.period}</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(evaluation.evaluation_period + '-01').toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.date}: {new Date(evaluation.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t.averageScore}</p>
                  <p className={`text-3xl font-bold ${getScoreBgColor(avgScore)} px-3 py-1 rounded-lg inline-block`}>
                    {avgScore.toFixed(1)} / 10
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">{t.category}</p>
              <p className="font-semibold text-gray-800">{categoryName}</p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t.questions}</h4>
            <div className="space-y-3">
              {sortedQuestions.map((question) => {
                const score = evaluation.scores[question.id] || 0;
                return (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-700 flex-1">{question.question_text}</p>
                      <span className={`ml-3 px-3 py-1 rounded-lg font-bold text-sm ${getScoreBgColor(score)}`}>
                        {score} / 10
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreColor(score)} transition-all duration-300`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {evaluation.comments && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">{t.comments}</h4>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{evaluation.comments}</p>
              </div>
            </div>
          )}

          {!evaluation.comments && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">{t.noComments}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.edit}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
