import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Trash2, Plus, X, Bell, AlertCircle, UserCheck } from 'lucide-react';

interface DutySchedule {
  id: string;
  duty_date: string;
  teacher_id: string;
  teacher_name?: string;
  notes: string | null;
  created_at: string;
}

interface DutyDescription {
  id: string;
  month: string;
  description: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface ChildAtSchool {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  parent_name: string;
  arrival_time: string;
}

interface DutyScheduleSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent';
}

export default function DutyScheduleSection({ userId, userRole }: DutyScheduleSectionProps) {
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dutyDescription, setDutyDescription] = useState<DutyDescription | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DutySchedule | null>(null);
  const [childrenAtSchool, setChildrenAtSchool] = useState<ChildAtSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [descriptionForm, setDescriptionForm] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    duty_date: new Date().toISOString().split('T')[0],
    teacher_id: '',
    notes: '',
  });

  const currentTime = new Date();

  const todaySchedule = schedules.find(
    s => s.duty_date === new Date().toISOString().split('T')[0]
  );
  const isOnDutyToday = todaySchedule?.teacher_id === userId;

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSchedules(),
        loadDutyDescription(),
        loadTeachers(),
        loadChildrenAtSchool(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const { data, error } = await supabase
        .from('duty_schedule')
        .select(`
          *,
          teacher:profiles!teacher_id(full_name)
        `)
        .gte('duty_date', startDate)
        .lte('duty_date', endDate.toISOString().split('T')[0])
        .order('duty_date', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        ...item,
        teacher_name: item.teacher?.full_name,
      })) || [];

      setSchedules(formattedData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadDutyDescription = async () => {
    try {
      const { data, error } = await supabase
        .from('duty_descriptions')
        .select('*')
        .eq('month', selectedMonth)
        .maybeSingle();

      if (error) throw error;
      setDutyDescription(data);
      setDescriptionForm(data?.description || '');
    } catch (error) {
      console.error('Error loading duty description:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .eq('approved', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadChildrenAtSchool = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          child_id,
          arrival_time,
          children(
            id,
            first_name,
            last_name,
            parent_children(
              parent_id,
              parent:profiles!parent_id(id, full_name)
            )
          )
        `)
        .eq('date', today)
        .is('departure_time', null);

      if (error) throw error;

      const formattedData: ChildAtSchool[] = [];
      attendanceData?.forEach((attendance: any) => {
        const child = attendance.children;
        if (child && child.parent_children && child.parent_children.length > 0) {
          child.parent_children.forEach((pc: any) => {
            if (pc.parent) {
              formattedData.push({
                id: child.id,
                first_name: child.first_name,
                last_name: child.last_name,
                parent_id: pc.parent.id,
                parent_name: pc.parent.full_name,
                arrival_time: attendance.arrival_time,
              });
            }
          });
        }
      });

      setChildrenAtSchool(formattedData);
    } catch (error) {
      console.error('Error loading children at school:', error);
    }
  };

  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dutyDescription) {
        const { error } = await supabase
          .from('duty_descriptions')
          .update({
            description: descriptionForm,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dutyDescription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('duty_descriptions')
          .insert({
            month: selectedMonth,
            description: descriptionForm,
            created_by: userId,
          });
        if (error) throw error;
      }
      alert('Görev tanımı kaydedildi!');
      setShowDescriptionModal(false);
      loadDutyDescription();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSchedule) {
        const { error } = await supabase
          .from('duty_schedule')
          .update({
            teacher_id: scheduleForm.teacher_id,
            notes: scheduleForm.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedSchedule.id);
        if (error) throw error;
        alert('Nöbet görevi güncellendi!');
      } else {
        const { error } = await supabase
          .from('duty_schedule')
          .insert({
            duty_date: scheduleForm.duty_date,
            teacher_id: scheduleForm.teacher_id,
            notes: scheduleForm.notes || null,
            created_by: userId,
          });
        if (error) throw error;
        alert('Nöbet görevi eklendi!');
      }
      setShowScheduleModal(false);
      setSelectedSchedule(null);
      resetScheduleForm();
      loadSchedules();
    } catch (error: any) {
      if (error.code === '23505') {
        alert('Bu tarih için zaten bir nöbet görevi mevcut!');
      } else {
        alert('Hata: ' + error.message);
      }
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Bu nöbet görevini silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('duty_schedule').delete().eq('id', id);
      if (error) throw error;
      alert('Nöbet görevi silindi!');
      loadSchedules();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSendReminder = async (childId: string, parentId: string) => {
    try {
      const message = `Sayın Veli, saat ${currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibariyle çocuğunuz hala okulda. Lütfen en kısa sürede almaya geliniz.`;

      const { error } = await supabase
        .from('pickup_reminders')
        .insert({
          child_id: childId,
          parent_id: parentId,
          sent_by: userId,
          message: message,
        });

      if (error) throw error;
      alert('Hatırlatma gönderildi!');
      loadChildrenAtSchool();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      duty_date: new Date().toISOString().split('T')[0],
      teacher_id: '',
      notes: '',
    });
  };

  const getDaysInMonth = () => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getScheduleForDate = (day: number) => {
    const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
    return schedules.find(s => s.duty_date === dateStr);
  };

  const canManageSchedule = userRole === 'admin';
  const canSendReminders = userRole === 'admin' || isOnDutyToday;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Aylık Nöbetçi Öğretmen Listesi</h2>
            <p className="text-sm text-gray-600">Günlük nöbet programı ve görev tanımı</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {canManageSchedule && (
            <>
              <button
                onClick={() => setShowDescriptionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
                <span>Görev Tanımı</span>
              </button>
              <button
                onClick={() => {
                  setSelectedSchedule(null);
                  resetScheduleForm();
                  setShowScheduleModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <Plus className="w-5 h-5" />
                <span>Nöbet Ekle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {dutyDescription && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Nöbetçi Öğretmen Görev Tanımı</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{dutyDescription.description}</p>
        </div>
      )}

      {canSendReminders && childrenAtSchool.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Okulda Kalan Öğrenciler</h3>
              <p className="text-sm text-gray-600">Saat {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibariyle {childrenAtSchool.length} öğrenci</p>
            </div>
          </div>
          <div className="space-y-3">
            {childrenAtSchool.map((child) => (
              <div key={child.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {child.first_name} {child.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Veli: {child.parent_name}</p>
                  <p className="text-xs text-gray-500">
                    Geliş: {new Date(child.arrival_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleSendReminder(child.id, child.parent_id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>Hatırlat</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tarih</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nöbetçi Öğretmen</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Notlar</th>
                  {canManageSchedule && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlemler</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getDaysInMonth().map((day) => {
                  const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
                  const date = new Date(dateStr);
                  const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const schedule = getScheduleForDate(day);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <tr key={day} className={`${isWeekend ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{day}</span>
                          <span className="text-xs text-gray-500 capitalize">{dayName}</span>
                          {isToday && (
                            <span className="text-xs text-blue-600 font-semibold">Bugün</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {schedule ? (
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              schedule.teacher_id === userId
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {schedule.teacher_name}
                            </span>
                            {schedule.teacher_id === userId && (
                              <span className="text-xs text-green-600 font-semibold">(Siz)</span>
                            )}
                          </div>
                        ) : (
                          canManageSchedule ? (
                            <button
                              onClick={() => {
                                setSelectedSchedule(null);
                                setScheduleForm({
                                  duty_date: dateStr,
                                  teacher_id: '',
                                  notes: '',
                                });
                                setShowScheduleModal(true);
                              }}
                              className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              + Atama Yap
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {schedule?.notes && (
                          <p className="text-sm text-gray-600">{schedule.notes}</p>
                        )}
                      </td>
                      {canManageSchedule && (
                        <td className="px-6 py-4">
                          {schedule && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedSchedule(schedule);
                                  setScheduleForm({
                                    duty_date: schedule.duty_date,
                                    teacher_id: schedule.teacher_id,
                                    notes: schedule.notes || '',
                                  });
                                  setShowScheduleModal(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDescriptionModal && canManageSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Görev Tanımı Düzenle</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDescription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMonth} Ayı Nöbetçi Öğretmen Görev Tanımı
                </label>
                <textarea
                  required
                  value={descriptionForm}
                  onChange={(e) => setDescriptionForm(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Nöbetçi öğretmen görevlerini buraya yazın..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDescriptionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && canManageSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedSchedule ? 'Nöbet Görevi Düzenle' : 'Yeni Nöbet Görevi'}
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedSchedule(null);
                  resetScheduleForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.duty_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duty_date: e.target.value })}
                  disabled={!!selectedSchedule}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nöbetçi Öğretmen</label>
                <select
                  required
                  value={scheduleForm.teacher_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Öğretmen seçin...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (İsteğe Bağlı)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedSchedule(null);
                    resetScheduleForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  {selectedSchedule ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
