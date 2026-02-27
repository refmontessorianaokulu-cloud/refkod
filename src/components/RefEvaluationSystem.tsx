import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star, Send, CheckCircle } from 'lucide-react';

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

interface Profile {
  id: string;
  full_name: string;
  role: string;
  staff_role?: string;
}

export default function RefEvaluationSystem() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<EvaluationCategory[]>([]);
  const [questions, setQuestions] = useState<{ [key: string]: EvaluationQuestion[] }>({});
  const [users, setUsers] = useState<{ [key: string]: Profile[] }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<EvaluationCategory[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (profile) {
      determineAvailableCategories();
    }
  }, [profile, categories]);

  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory);
      loadUsersForCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evaluation_categories')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const determineAvailableCategories = () => {
    if (!profile) return;

    if (profile.id === 'ba979b4e-3be3-47a2-9fc1-230072a0c4e2') {
      setAvailableCategories([]);
      return;
    }

    const categoryMap: { [key: string]: string[] } = {
      'teacher': ['teacher', 'cook', 'cleaning_staff', 'guidance_counselor', 'administration', 'parent'],
      'staff': ['teacher', 'guidance_counselor', 'cook', 'administration'],
      'parent': ['teacher', 'guidance_counselor', 'administration', 'meals', 'facility_cleanliness', 'bus_service'],
      'admin': ['teacher', 'cook', 'cleaning_staff', 'guidance_counselor'],
      'guidance_counselor': ['teacher', 'cook', 'cleaning_staff', 'administration']
    };

    let allowedCategoryNames: string[] = [];

    if (profile.role === 'staff' && profile.staff_role === 'cleaning_staff') {
      allowedCategoryNames = ['teacher', 'guidance_counselor', 'cook', 'administration'];
    } else if (profile.role === 'staff' && profile.staff_role === 'cook') {
      allowedCategoryNames = ['administration', 'teacher', 'guidance_counselor', 'cleaning_staff'];
    } else if (profile.role && categoryMap[profile.role]) {
      allowedCategoryNames = categoryMap[profile.role];
    }

    const filtered = categories.filter(cat => allowedCategoryNames.includes(cat.category_name));
    setAvailableCategories(filtered);
  };

  const loadQuestions = async (categoryName: string) => {
    try {
      const category = categories.find(c => c.category_name === categoryName);
      if (!category) return;

      const { data, error } = await supabase
        .from('evaluation_questions')
        .select('*')
        .eq('category_id', category.id)
        .order('display_order');

      if (error) throw error;
      setQuestions({ ...questions, [categoryName]: data || [] });

      const initialScores: { [key: string]: number } = {};
      (data || []).forEach(q => {
        initialScores[q.id] = 5;
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Sorular yüklenirken hata oluştu');
    }
  };

  const loadUsersForCategory = async (categoryName: string) => {
    try {
      let userData: Profile[] = [];
      const excludedUserId = 'ba979b4e-3be3-47a2-9fc1-230072a0c4e2';

      if (categoryName === 'teacher') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'teacher')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
      } else if (categoryName === 'cook') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'staff')
          .eq('staff_role', 'cook')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
        console.log('Cook users loaded:', userData);
      } else if (categoryName === 'cleaning_staff') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'staff')
          .eq('staff_role', 'cleaning_staff')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
        console.log('Cleaning staff users loaded:', userData);
      } else if (categoryName === 'guidance_counselor') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'guidance_counselor')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
      } else if (categoryName === 'administration') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'admin')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
      } else if (categoryName === 'parent') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, staff_role')
          .eq('role', 'parent')
          .neq('id', excludedUserId);

        if (error) throw error;
        userData = data || [];
      }

      setUsers(prev => ({ ...prev, [categoryName]: userData }));
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Kullanıcılar yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      alert('Lütfen değerlendirme kategorisi seçin');
      return;
    }

    const categoryNeedingUser = ['teacher', 'cook', 'cleaning_staff', 'guidance_counselor', 'administration', 'parent'];
    if (categoryNeedingUser.includes(selectedCategory) && !selectedUser) {
      alert('Lütfen değerlendirmek istediğiniz kişiyi seçin');
      return;
    }

    const currentQuestions = questions[selectedCategory] || [];
    const allScored = currentQuestions.every(q => scores[q.id] !== undefined);

    if (!allScored) {
      alert('Lütfen tüm soruları puanlayın');
      return;
    }

    try {
      setSubmitting(true);

      const currentPeriod = new Date().toISOString().substring(0, 7);

      const evaluationData = {
        evaluator_id: profile?.id,
        evaluated_category: selectedCategory,
        evaluated_user_id: selectedUser || null,
        evaluation_period: currentPeriod,
        scores: scores,
        comments: comments || null,
      };

      const { error } = await supabase
        .from('evaluations')
        .upsert(evaluationData, {
          onConflict: 'evaluator_id,evaluated_category,evaluated_user_id,evaluation_period'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedCategory('');
        setSelectedUser('');
        setScores({});
        setComments('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Değerlendirme gönderilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const renderScoreSelector = (questionId: string) => {
    return (
      <div className="flex space-x-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => setScores({ ...scores, [questionId]: score })}
            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
              scores[questionId] === score
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Değerlendirme Gönderildi!</h3>
        <p className="text-gray-600">Değerlendirmeniz başarıyla kaydedildi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">REF Değerlendirme Sistemi</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Değerlendirme Kategorisi Seçin
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedUser('');
                setScores({});
                setComments('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kategori Seçin</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.category_name}>
                  {cat.display_name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && users[selectedCategory] && users[selectedCategory].length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Değerlendirmek İstediğiniz Kişiyi Seçin
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kişi Seçin</option>
                {users[selectedCategory].map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCategory && questions[selectedCategory] && (
            <div className="space-y-6 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Her bir kriteri 0-10 arası puanlayın (0: Çok Kötü, 5: Orta, 10: Mükemmel)
                </p>
              </div>

              {questions[selectedCategory].map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question_text}
                  </label>
                  {renderScoreSelector(question.id)}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ek Yorumlar (İsteğe Bağlı)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Değerlendirmeniz ile ilgili ek yorumlarınızı buraya yazabilirsiniz..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
