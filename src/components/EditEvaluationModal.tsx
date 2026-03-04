import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  display_order: number;
}

interface EditEvaluationModalProps {
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
  onSave: () => void;
}

export default function EditEvaluationModal({
  evaluation,
  categoryName,
  questions,
  onClose,
  onSave,
}: EditEvaluationModalProps) {
  const { language } = useLanguage();
  const [scores, setScores] = useState<{ [key: string]: number }>(evaluation.scores);
  const [comments, setComments] = useState(evaluation.comments || '');
  const [saving, setSaving] = useState(false);

  const texts = {
    tr: {
      title: 'Değerlendirmeyi Düzenle',
      category: 'Kategori',
      evaluatedUser: 'Değerlendirilen',
      period: 'Dönem',
      questions: 'Sorular',
      comments: 'Yorumlar',
      commentsPlaceholder: 'Yorumlarınızı buraya yazın...',
      save: 'Kaydet',
      cancel: 'İptal',
      saving: 'Kaydediliyor...',
      success: 'Değerlendirme başarıyla güncellendi',
      error: 'Değerlendirme güncellenirken hata oluştu',
    },
    en: {
      title: 'Edit Evaluation',
      category: 'Category',
      evaluatedUser: 'Evaluated User',
      period: 'Period',
      questions: 'Questions',
      comments: 'Comments',
      commentsPlaceholder: 'Write your comments here...',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving...',
      success: 'Evaluation updated successfully',
      error: 'Error updating evaluation',
    },
  };

  const t = texts[language];

  const handleScoreChange = (questionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('evaluations')
        .update({
          scores,
          comments: comments || null,
        })
        .eq('id', evaluation.id);

      if (error) throw error;

      alert(t.success);
      onSave();
    } catch (error) {
      console.error('Error updating evaluation:', error);
      alert(t.error);
    } finally {
      setSaving(false);
    }
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
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-sm text-gray-600">{t.category}: </span>
              <span className="font-semibold text-gray-800">{categoryName}</span>
            </div>
            {evaluation.evaluated_user && (
              <div>
                <span className="text-sm text-gray-600">{t.evaluatedUser}: </span>
                <span className="font-semibold text-gray-800">{evaluation.evaluated_user.full_name}</span>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">{t.period}: </span>
              <span className="font-semibold text-gray-800">
                {new Date(evaluation.evaluation_period + '-01').toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t.questions}</h4>
            <div className="space-y-4">
              {sortedQuestions.map((question) => {
                const currentScore = scores[question.id] || 0;
                return (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3">{question.question_text}</p>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(question.id, score)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                            currentScore === score
                              ? score >= 8
                                ? 'bg-green-500 text-white'
                                : score >= 6
                                ? 'bg-blue-500 text-white'
                                : score >= 4
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {t.comments}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t.commentsPlaceholder}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? t.saving : t.save}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
