import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, Calendar, Users, User, MessageSquare } from 'lucide-react';

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
  creator?: { full_name: string };
}

interface TaskResponse {
  id: string;
  task_id: string;
  user_id: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string;
  created_at: string;
}

interface TaskResponseSectionProps {
  userId: string;
  userRole: 'teacher' | 'guidance_counselor';
}

export default function TaskResponseSection({ userId, userRole }: TaskResponseSectionProps) {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [responses, setResponses] = useState<Record<string, TaskResponse>>({});
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, [userId, userRole]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('task_assignments')
        .select(`
          *,
          creator:profiles!created_by(full_name)
        `)
        .or(`assigned_to.eq.${userId},and(is_group_task.eq.true,target_roles.cs.{${userRole}})`)
        .order('week_start', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);

        const taskIds = tasksData.map(t => t.id);
        if (taskIds.length > 0) {
          const { data: responsesData } = await supabase
            .from('task_responses')
            .select('*')
            .in('task_id', taskIds)
            .eq('user_id', userId);

          const responsesByTask: Record<string, TaskResponse> = {};
          responsesData?.forEach(response => {
            responsesByTask[response.task_id] = response;
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

  const handleCompleteTask = async (taskId: string, isCompleted: boolean) => {
    try {
      const existingResponse = responses[taskId];

      if (existingResponse) {
        const { error } = await supabase
          .from('task_responses')
          .update({
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_responses')
          .insert({
            task_id: taskId,
            user_id: userId,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            notes: '',
          });

        if (error) throw error;
      }

      loadTasks();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAddNotes = async () => {
    if (!selectedTask) return;

    try {
      const existingResponse = responses[selectedTask];

      if (existingResponse) {
        const { error } = await supabase
          .from('task_responses')
          .update({ notes: responseNotes })
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_responses')
          .insert({
            task_id: selectedTask,
            user_id: userId,
            is_completed: false,
            notes: responseNotes,
          });

        if (error) throw error;
      }

      setShowResponseModal(false);
      setSelectedTask(null);
      setResponseNotes('');
      loadTasks();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const getWeekLabel = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const isOverdue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Görevlerim</h2>
        <p className="text-sm text-gray-600 mt-1">Size atanan görevleri görüntüleyin ve tamamlayın</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz size atanmış görev yok</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const response = responses[task.id];
            const overdue = isOverdue(task.week_end) && !response?.is_completed;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-6 border transition-shadow hover:shadow-lg ${
                  overdue ? 'border-red-300 bg-red-50' : response?.is_completed ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
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
                      {overdue && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                          Gecikmiş
                        </span>
                      )}
                      {response?.is_completed && (
                        <span className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Tamamlandı</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{getWeekLabel(task.week_start, task.week_end)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Atayan: </span>
                        {task.creator?.full_name || 'Yönetici'}
                      </div>
                    </div>
                  </div>
                </div>

                {response?.notes && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Notlarım:</p>
                    <p className="text-sm text-gray-600">{response.notes}</p>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  {!response?.is_completed ? (
                    <>
                      <button
                        onClick={() => handleCompleteTask(task.id, true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Tamamlandı Olarak İşaretle</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTask(task.id);
                          setResponseNotes(response?.notes || '');
                          setShowResponseModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Not Ekle</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCompleteTask(task.id, false)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Yeniden Aç</span>
                      </button>
                      {response.completed_at && (
                        <span className="text-xs text-gray-500">
                          Tamamlanma: {new Date(response.completed_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Not Ekle</h3>
            <textarea
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Göreve dair notlarınızı buraya yazın..."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedTask(null);
                  setResponseNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddNotes}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
