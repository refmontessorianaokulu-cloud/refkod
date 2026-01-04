import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { Plus, CheckCircle, Clock, Users, User, Calendar, Trash2, Edit2 } from 'lucide-react';

interface TaskAssignment {
  id: string;
  created_by: string;
  title: string;
  description: string;
  is_group_task: boolean;
  assigned_to: string | null;
  target_roles: string[];
  week_start: string;
  week_end: string;
  created_at: string;
  assignee?: Profile;
  creator?: Profile;
}

interface TaskResponse {
  id: string;
  task_id: string;
  user_id: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string;
  user?: Profile;
}

interface TasksSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent' | 'guidance_counselor';
}

export default function TasksSection({ userId, userRole }: TasksSectionProps) {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [responses, setResponses] = useState<Record<string, TaskResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskAssignment | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    is_group_task: false,
    assigned_to: '',
    target_roles: [] as string[],
    week_start: '',
    week_end: '',
  });

  useEffect(() => {
    loadTasks();
    if (userRole === 'admin') {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['teacher', 'guidance_counselor'])
        .eq('approved', true)
        .order('full_name');
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('task_assignments')
        .select(`
          *,
          assignee:profiles!assigned_to(id, full_name, role),
          creator:profiles!created_by(id, full_name)
        `)
        .order('week_start', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);

        const taskIds = tasksData.map(t => t.id);
        if (taskIds.length > 0) {
          const { data: responsesData } = await supabase
            .from('task_responses')
            .select(`
              *,
              user:profiles(id, full_name, role)
            `)
            .in('task_id', taskIds);

          const responsesByTask: Record<string, TaskResponse[]> = {};
          responsesData?.forEach(response => {
            if (!responsesByTask[response.task_id]) {
              responsesByTask[response.task_id] = [];
            }
            responsesByTask[response.task_id].push(response);
          });
          setResponses(responsesByTask);
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('task_assignments')
          .update({
            title: taskForm.title,
            description: taskForm.description,
            is_group_task: taskForm.is_group_task,
            assigned_to: taskForm.is_group_task ? null : taskForm.assigned_to,
            target_roles: taskForm.is_group_task ? taskForm.target_roles : [],
            week_start: taskForm.week_start,
            week_end: taskForm.week_end,
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        alert('Görev başarıyla güncellendi!');
      } else {
        const { error } = await supabase.from('task_assignments').insert({
          created_by: userId,
          title: taskForm.title,
          description: taskForm.description,
          is_group_task: taskForm.is_group_task,
          assigned_to: taskForm.is_group_task ? null : taskForm.assigned_to,
          target_roles: taskForm.is_group_task ? taskForm.target_roles : [],
          week_start: taskForm.week_start,
          week_end: taskForm.week_end,
        });

        if (error) throw error;
        alert('Görev başarıyla oluşturuldu!');
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        is_group_task: false,
        assigned_to: '',
        target_roles: [],
        week_start: '',
        week_end: '',
      });
      loadTasks();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEditTask = (task: TaskAssignment) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      is_group_task: task.is_group_task,
      assigned_to: task.assigned_to || '',
      target_roles: task.target_roles,
      week_start: task.week_start,
      week_end: task.week_end,
    });
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleToggleRole = (role: string) => {
    setTaskForm(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  const getWeekLabel = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getTaskCompletionRate = (taskId: string) => {
    const taskResponses = responses[taskId] || [];
    if (taskResponses.length === 0) return 0;
    const completed = taskResponses.filter(r => r.is_completed).length;
    return Math.round((completed / taskResponses.length) * 100);
  };

  if (userRole !== 'admin') {
    return <div className="text-center py-12 text-gray-500">Bu bölüme erişim yetkiniz yok</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Haftalık Görevlendirmeler</h2>
          <p className="text-sm text-gray-600 mt-1">Öğretmenler ve rehberlik birimine görev atayın</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setTaskForm({
              title: '',
              description: '',
              is_group_task: false,
              assigned_to: '',
              target_roles: [],
              week_start: '',
              week_end: '',
            });
            setShowTaskModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Görev</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz görev eklenmemiş</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const completionRate = getTaskCompletionRate(task.id);
            const taskResponses = responses[task.id] || [];

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      {task.is_group_task ? (
                        <span className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          <Users className="w-3 h-3" />
                          <span>Toplu Görev</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <User className="w-3 h-3" />
                          <span>Bireysel</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{getWeekLabel(task.week_start, task.week_end)}</span>
                      </div>
                      {task.is_group_task ? (
                        <div>
                          <span className="font-medium">Hedef: </span>
                          {task.target_roles.map(role => (
                            role === 'teacher' ? 'Öğretmenler' : 'Rehberlik Birimi'
                          )).join(', ')}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">Atanan: </span>
                          {task.assignee?.full_name || 'Bilinmiyor'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Görevi Düzenle"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Görevi Sil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {task.is_group_task && taskResponses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Tamamlanma Durumu</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {taskResponses.map((response) => (
                        <div
                          key={response.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            response.is_completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {response.is_completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-800">{response.user?.full_name}</p>
                              {response.notes && (
                                <p className="text-xs text-gray-600 mt-1">{response.notes}</p>
                              )}
                            </div>
                          </div>
                          {response.is_completed && response.completed_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(response.completed_at).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!task.is_group_task && taskResponses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {taskResponses.map((response) => (
                      <div
                        key={response.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          response.is_completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {response.is_completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {response.is_completed ? 'Tamamlandı' : 'Devam Ediyor'}
                            </p>
                            {response.notes && (
                              <p className="text-xs text-gray-600 mt-1">{response.notes}</p>
                            )}
                          </div>
                        </div>
                        {response.is_completed && response.completed_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(response.completed_at).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Oluştur'}
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görev Başlığı</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Haftalık Plan Hazırlama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görev Açıklaması</label>
                <textarea
                  required
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Görevin detaylarını açıklayın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hafta Başlangıcı</label>
                  <input
                    type="date"
                    required
                    value={taskForm.week_start}
                    onChange={(e) => setTaskForm({ ...taskForm, week_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hafta Bitişi</label>
                  <input
                    type="date"
                    required
                    value={taskForm.week_end}
                    onChange={(e) => setTaskForm({ ...taskForm, week_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={taskForm.is_group_task}
                    onChange={(e) => setTaskForm({
                      ...taskForm,
                      is_group_task: e.target.checked,
                      assigned_to: e.target.checked ? '' : taskForm.assigned_to,
                      target_roles: e.target.checked ? taskForm.target_roles : [],
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Toplu Görevlendirme</span>
                </label>
              </div>

              {taskForm.is_group_task ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Roller</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={taskForm.target_roles.includes('teacher')}
                        onChange={() => handleToggleRole('teacher')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Öğretmenler</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={taskForm.target_roles.includes('guidance_counselor')}
                        onChange={() => handleToggleRole('guidance_counselor')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Rehberlik Birimi</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kişi Seçin</label>
                  <select
                    required
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.role === 'teacher' ? 'Öğretmen' : 'Rehberlik Birimi'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                    setTaskForm({
                      title: '',
                      description: '',
                      is_group_task: false,
                      assigned_to: '',
                      target_roles: [],
                      week_start: '',
                      week_end: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  {editingTask ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
