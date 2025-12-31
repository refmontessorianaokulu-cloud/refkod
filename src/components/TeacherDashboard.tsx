import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, MealLog, SleepLog, DailyReport } from '../lib/supabase';
import { Baby, LogOut, Plus, UtensilsCrossed, Moon, BookOpen } from 'lucide-react';

export default function TeacherDashboard() {
  const { signOut, profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);

  const [mealForm, setMealForm] = useState({
    meal_type: 'lunch' as 'breakfast' | 'lunch' | 'snack',
    amount_eaten: 'all' as 'all' | 'most' | 'some' | 'none',
    notes: '',
  });

  const [sleepForm, setSleepForm] = useState({
    start_time: '',
    end_time: '',
    notes: '',
  });

  const [reportForm, setReportForm] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (profile) {
      loadChildren();
      loadReports();
    }
  }, [profile]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      if (!profile) return;

      const { data: teacherChildrenData } = await supabase
        .from('teacher_children')
        .select('child_id')
        .eq('teacher_id', profile.id);

      if (!teacherChildrenData || teacherChildrenData.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = teacherChildrenData.map((tc) => tc.child_id);
      const { data } = await supabase
        .from('children')
        .select('*')
        .in('id', childIds)
        .order('first_name', { ascending: true });
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });
      setDailyReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !profile) return;

    try {
      const { error } = await supabase.from('meal_logs').insert({
        child_id: selectedChild,
        teacher_id: profile.id,
        ...mealForm,
      });
      if (error) throw error;

      setShowMealModal(false);
      setSelectedChild('');
      setMealForm({ meal_type: 'lunch', amount_eaten: 'all', notes: '' });
      alert('Yemek kaydı eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleAddSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !profile) return;

    try {
      const { error } = await supabase.from('sleep_logs').insert({
        child_id: selectedChild,
        teacher_id: profile.id,
        ...sleepForm,
      });
      if (error) throw error;

      setShowSleepModal(false);
      setSelectedChild('');
      setSleepForm({ start_time: '', end_time: '', notes: '' });
      alert('Uyku kaydı eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedChild || !reportForm.title.trim() || !reportForm.content.trim()) return;

    try {
      const { error } = await supabase.from('daily_reports').insert({
        teacher_id: profile.id,
        child_id: selectedChild,
        title: reportForm.title,
        content: reportForm.content,
      });
      if (error) throw error;

      setShowReportModal(false);
      setSelectedChild('');
      setReportForm({ title: '', content: '' });
      loadReports();
      alert('Günlük rapor eklendi!');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Öğretmen Paneli</h1>
                <p className="text-sm text-gray-500">{profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Çocuklar</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : children.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Henüz çocuk yok</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {child.first_name} {child.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{child.class_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedChild(child.id);
                        setShowMealModal(true);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span className="text-sm font-medium">Yemek</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChild(child.id);
                        setShowSleepModal(true);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors border border-cyan-200"
                    >
                      <Moon className="w-4 h-4" />
                      <span className="text-sm font-medium">Uyku</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Günlük Rapor</h2>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {dailyReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Henüz rapor yok</p>
                </div>
              ) : (
                dailyReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{report.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(report.report_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{report.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yemek Kaydı Ekle</h3>
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öğün</label>
                <select
                  value={mealForm.meal_type}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, meal_type: e.target.value as 'breakfast' | 'lunch' | 'snack' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="breakfast">Kahvaltı</option>
                  <option value="lunch">Öğle Yemeği</option>
                  <option value="snack">Ara Öğün</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ne Kadar Yedi?</label>
                <select
                  value={mealForm.amount_eaten}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, amount_eaten: e.target.value as 'all' | 'most' | 'some' | 'none' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Hepsini</option>
                  <option value="most">Çoğunu</option>
                  <option value="some">Biraz</option>
                  <option value="none">Hiç</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={mealForm.notes}
                  onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMealModal(false);
                    setSelectedChild('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSleepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Uyku Kaydı Ekle</h3>
            <form onSubmit={handleAddSleep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Saati</label>
                <input
                  type="datetime-local"
                  required
                  value={sleepForm.start_time}
                  onChange={(e) => setSleepForm({ ...sleepForm, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Saati</label>
                <input
                  type="datetime-local"
                  required
                  value={sleepForm.end_time}
                  onChange={(e) => setSleepForm({ ...sleepForm, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="İsteğe bağlı notlar..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSleepModal(false);
                    setSelectedChild('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Günlük Rapor Ekle</h3>
            <form onSubmit={handleAddReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk</label>
                <select
                  required
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Çocuk seçin...</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Başlığı</label>
                <input
                  type="text"
                  required
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Başlık (örn: Bugünün Etkinlikleri)"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{reportForm.title.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rapor İçeriği</label>
                <textarea
                  required
                  value={reportForm.content}
                  onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Günün detaylı raporu..."
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">{reportForm.content.length}/2000</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportForm({ title: '', content: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
