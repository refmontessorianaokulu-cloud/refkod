import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface Question {
  id: string;
  category_id: string;
  question_text: string;
  created_at: string;
}

interface Evaluation {
  id: string;
  teacher_id: string;
  child_id: string;
  category_id: string;
  question_id: string;
  rating: number;
  notes: string;
  created_at: string;
  profiles: { full_name: string };
  children: { first_name: string; last_name: string };
  ref_evaluation_categories: { name: string };
  ref_evaluation_questions: { question_text: string };
}

export default function RefEvaluationManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'categories' | 'questions' | 'evaluations'>('categories');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'categories') {
        const { data } = await supabase
          .from('ref_evaluation_categories')
          .select('*')
          .order('created_at', { ascending: false });
        setCategories(data || []);
      } else if (activeView === 'questions') {
        const { data } = await supabase
          .from('ref_evaluation_questions')
          .select('*')
          .order('created_at', { ascending: false });
        setQuestions(data || []);

        const { data: cats } = await supabase
          .from('ref_evaluation_categories')
          .select('*')
          .order('name');
        setCategories(cats || []);
      } else if (activeView === 'evaluations') {
        const { data } = await supabase
          .from('ref_evaluations')
          .select(`
            *,
            profiles!ref_evaluations_teacher_id_fkey(full_name),
            children(first_name, last_name),
            ref_evaluation_categories(name),
            ref_evaluation_questions(question_text)
          `)
          .order('created_at', { ascending: false });
        setEvaluations(data || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('ref_evaluation_categories')
        .insert({ name: newCategoryName.trim() });

      if (error) throw error;

      setNewCategoryName('');
      loadData();
      alert('Kategori başarıyla eklendi!');
    } catch (error) {
      alert('Kategori eklenirken hata: ' + (error as Error).message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz? İlişkili tüm sorular ve değerlendirmeler de silinecektir.')) return;

    try {
      const { error } = await supabase
        .from('ref_evaluation_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
      alert('Kategori başarıyla silindi!');
    } catch (error) {
      alert('Silme hatası: ' + (error as Error).message);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !selectedCategoryId) {
      alert('Lütfen kategori seçin ve soru metnini girin!');
      return;
    }

    try {
      const { error } = await supabase
        .from('ref_evaluation_questions')
        .insert({
          category_id: selectedCategoryId,
          question_text: newQuestionText.trim()
        });

      if (error) throw error;

      setNewQuestionText('');
      setSelectedCategoryId('');
      loadData();
      alert('Soru başarıyla eklendi!');
    } catch (error) {
      alert('Soru eklenirken hata: ' + (error as Error).message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz? İlişkili tüm değerlendirmeler de silinecektir.')) return;

    try {
      const { error } = await supabase
        .from('ref_evaluation_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
      alert('Soru başarıyla silindi!');
    } catch (error) {
      alert('Silme hatası: ' + (error as Error).message);
    }
  };

  const handleDeleteEvaluation = async (id: string) => {
    if (!confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('ref_evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
      alert('Değerlendirme başarıyla silindi!');
    } catch (error) {
      alert('Silme hatası: ' + (error as Error).message);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Kategori bulunamadı';
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(q.category_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvaluations = evaluations.filter(e =>
    e.children.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.children.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.ref_evaluation_categories.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Değerlendirme Yönetimi</h2>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveView('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'categories'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kategoriler
          </button>
          <button
            onClick={() => setActiveView('questions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'questions'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sorular
          </button>
          <button
            onClick={() => setActiveView('evaluations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'evaluations'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Değerlendirmeler
          </button>
        </div>
      </div>

      {activeView === 'categories' && (
        <div>
          <form onSubmit={handleAddCategory} className="mb-6 flex space-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Yeni kategori adı..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Ekle</span>
            </button>
          </form>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Henüz kategori yok</div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(category.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'questions' && (
        <div>
          <form onSubmit={handleAddQuestion} className="mb-6 space-y-3">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Kategori seçin...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Yeni soru metni..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Ekle</span>
              </button>
            </div>
          </form>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Soru ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz soru yok'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                        {getCategoryName(question.category_id)}
                      </span>
                    </div>
                    <p className="text-gray-800">{question.question_text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(question.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'evaluations' && (
        <div>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Öğrenci veya öğretmen ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz değerlendirme yok'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {evaluation.children.first_name} {evaluation.children.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Öğretmen: {evaluation.profiles.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(evaluation.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvaluation(evaluation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {evaluation.ref_evaluation_categories.name}
                      </span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= evaluation.rating ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {evaluation.ref_evaluation_questions.question_text}
                    </p>
                    {evaluation.notes && (
                      <div className="bg-gray-50 rounded-lg p-2 mt-2">
                        <p className="text-xs text-gray-600">{evaluation.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
