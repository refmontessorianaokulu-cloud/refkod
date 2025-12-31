import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, MealLog, SleepLog, DailyReport } from '../lib/supabase';
import { Baby, LogOut, UtensilsCrossed, Moon, Calendar, BookOpen } from 'lucide-react';

type ChildWithLogs = Child & {
  meal_logs: MealLog[];
  sleep_logs: SleepLog[];
  daily_reports: DailyReport[];
};

export default function ParentDashboard() {
  const { signOut, profile } = useAuth();
  const [children, setChildren] = useState<ChildWithLogs[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, [profile]);

  const loadChildren = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: parentChildren } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', profile.id);

      if (!parentChildren || parentChildren.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = parentChildren.map((pc) => pc.child_id);
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .in('id', childIds);

      if (childrenData) {
        const childrenWithLogs = await Promise.all(
          childrenData.map(async (child) => {
            const { data: mealLogs } = await supabase
              .from('meal_logs')
              .select('*')
              .eq('child_id', child.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const { data: sleepLogs } = await supabase
              .from('sleep_logs')
              .select('*')
              .eq('child_id', child.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const { data: dailyReports } = await supabase
              .from('daily_reports')
              .select('*')
              .eq('child_id', child.id)
              .order('report_date', { ascending: false })
              .limit(10);

            return {
              ...child,
              meal_logs: mealLogs || [],
              sleep_logs: sleepLogs || [],
              daily_reports: dailyReports || [],
            };
          })
        );
        setChildren(childrenWithLogs);
        if (childrenWithLogs.length > 0) {
          setSelectedChild(childrenWithLogs[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedChildData = children.find((c) => c.id === selectedChild);

  const getMealTypeText = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'Kahvaltı';
      case 'lunch':
        return 'Öğle Yemeği';
      case 'snack':
        return 'Ara Öğün';
      default:
        return type;
    }
  };

  const getAmountEatenText = (amount: string) => {
    switch (amount) {
      case 'all':
        return 'Hepsini';
      case 'most':
        return 'Çoğunu';
      case 'some':
        return 'Biraz';
      case 'none':
        return 'Hiç';
      default:
        return amount;
    }
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} saat ${minutes} dakika`;
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
                <h1 className="text-xl font-bold text-gray-800">Veli Paneli</h1>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Yükleniyor...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz çocuğunuz eklenmemiş</h2>
            <p className="text-gray-500">Lütfen yönetici ile iletişime geçin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Çocuklarım</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedChild === child.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">
                        {child.first_name} {child.last_name}
                      </div>
                      <div className={`text-sm ${selectedChild === child.id ? 'text-blue-50' : 'text-gray-500'}`}>
                        {child.class_name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {selectedChildData && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 rounded-2xl">
                        <Baby className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedChildData.first_name} {selectedChildData.last_name}
                        </h2>
                        <p className="text-gray-600">{selectedChildData.class_name}</p>
                        <p className="text-sm text-gray-500">
                          Doğum: {new Date(selectedChildData.birth_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <UtensilsCrossed className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-800">Yemek Kayıtları</h3>
                    </div>
                    {selectedChildData.meal_logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz yemek kaydı yok</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedChildData.meal_logs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {getMealTypeText(log.meal_type)}
                                </span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-gray-700">{getAmountEatenText(log.amount_eaten)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(log.log_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 rounded p-2">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Moon className="w-6 h-6 text-cyan-600" />
                      <h3 className="text-xl font-bold text-gray-800">Uyku Kayıtları</h3>
                    </div>
                    {selectedChildData.sleep_logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz uyku kaydı yok</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedChildData.sleep_logs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-100"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {new Date(log.start_time).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  -{' '}
                                  {new Date(log.end_time).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Süre: {formatDuration(log.start_time, log.end_time)}
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(log.log_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-white bg-opacity-50 rounded p-2">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <BookOpen className="w-6 h-6 text-amber-600" />
                      <h3 className="text-xl font-bold text-gray-800">Montessori Günlük Raporları</h3>
                    </div>
                    {selectedChildData.daily_reports.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Henüz günlük rapor yok</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedChildData.daily_reports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-800">
                                {new Date(report.report_date).toLocaleDateString('tr-TR')}
                              </h4>
                            </div>

                            {(report.mood || report.social_interaction) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                                {report.mood && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Ruh Hali</h5>
                                    <p className="text-gray-700 text-sm">{report.mood}</p>
                                  </div>
                                )}
                                {report.social_interaction && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Sosyal Etkileşim</h5>
                                    <p className="text-gray-700 text-sm">{report.social_interaction}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="space-y-3">
                              {report.practical_life && (
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-green-900 mb-1">Pratik Yaşam</h5>
                                  <p className="text-gray-700 text-sm">{report.practical_life}</p>
                                </div>
                              )}

                              {report.sensorial && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-purple-900 mb-1">Duyusal Gelişim</h5>
                                  <p className="text-gray-700 text-sm">{report.sensorial}</p>
                                </div>
                              )}

                              {report.mathematics && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-blue-900 mb-1">Matematik</h5>
                                  <p className="text-gray-700 text-sm">{report.mathematics}</p>
                                </div>
                              )}

                              {report.language && (
                                <div className="p-3 bg-amber-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-amber-900 mb-1">Dil</h5>
                                  <p className="text-gray-700 text-sm">{report.language}</p>
                                </div>
                              )}

                              {report.culture && (
                                <div className="p-3 bg-rose-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-rose-900 mb-1">Kültür</h5>
                                  <p className="text-gray-700 text-sm">{report.culture}</p>
                                </div>
                              )}

                              {report.general_notes && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <h5 className="text-xs font-semibold text-gray-900 mb-1">Genel Notlar</h5>
                                  <p className="text-gray-700 text-sm">{report.general_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
