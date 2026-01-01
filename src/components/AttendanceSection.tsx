import { useState, useEffect } from 'react';
import { supabase, Child } from '../lib/supabase';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, LogOut, Bell } from 'lucide-react';

interface Attendance {
  id: string;
  child_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  arrival_time: string | null;
  departure_time: string | null;
  created_at: string;
}

interface AttendanceSectionProps {
  children: Child[];
  teacherId?: string;
  userRole?: string;
  userId?: string;
}

const statusConfig = {
  present: { label: 'Geldi', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  absent: { label: 'Gelmedi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  late: { label: 'Geç Geldi', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  excused: { label: 'Mazeret', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function AttendanceSection({ children, teacherId, userRole, userId }: AttendanceSectionProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    loadAttendances();
  }, [selectedDate, children]);

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .in('child_id', children.map(c => c.id));
      setAttendances(data || []);
    } catch (error) {
      console.error('Error loading attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (childId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    try {
      const existing = attendances.find(a => a.child_id === childId);

      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance').insert({
          child_id: childId,
          date: selectedDate,
          status,
          recorded_by: teacherId,
          arrival_time: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }

      loadAttendances();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const markDeparture = async (childId: string) => {
    try {
      const existing = attendances.find(a => a.child_id === childId);
      if (!existing) {
        alert('Önce öğrencinin geldiğini işaretleyin');
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .update({ departure_time: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
      loadAttendances();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const sendPickupReminder = async (childId: string) => {
    if (!userId || !userRole) {
      alert('Kullanıcı bilgisi bulunamadı');
      return;
    }

    setSendingReminder(childId);
    try {
      const child = children.find(c => c.id === childId);
      if (!child) {
        alert('Çocuk bulunamadı');
        return;
      }

      const { data: parentData } = await supabase
        .from('parent_children')
        .select('parent_id')
        .eq('child_id', childId)
        .limit(1)
        .maybeSingle();

      if (!parentData) {
        alert('Veli bilgisi bulunamadı');
        return;
      }

      const currentTime = new Date();
      const message = `Sayın Veli, saat ${currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibariyle çocuğunuz okuldan çıkış yaptı. Bilginize.`;

      const { error } = await supabase
        .from('pickup_reminders')
        .insert({
          child_id: childId,
          parent_id: parentData.parent_id,
          sent_by: userId,
          message: message,
        });

      if (error) throw error;
      alert('Hatırlatma gönderildi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    } finally {
      setSendingReminder(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Devamsızlık Takibi</h2>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Sınıflar</option>
            {Array.from(new Set(children.map(c => c.class_name).filter(Boolean))).sort().map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : children.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz çocuk yok</div>
      ) : (
        <div className="grid gap-4">
          {children
            .filter(child => selectedClass === 'all' || child.class_name === selectedClass)
            .map((child) => {
            const attendance = attendances.find(a => a.child_id === child.id);
            const currentStatus = attendance?.status;

            return (
              <div
                key={child.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={`${child.first_name} ${child.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-700">
                          {child.first_name[0]}{child.last_name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{child.class_name}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
                    const config = statusConfig[status];
                    const isActive = currentStatus === status;
                    const Icon = config.icon;

                    return (
                      <button
                        key={status}
                        onClick={() => updateAttendance(child.id, status)}
                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          isActive
                            ? `${config.bg} ${config.color} border-current shadow-md scale-105`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>

                {attendance && (currentStatus === 'present' || currentStatus === 'late') && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        {attendance.arrival_time && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Geliş: {new Date(attendance.arrival_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {attendance.departure_time && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <LogOut className="w-4 h-4" />
                            <span>Çıkış: {new Date(attendance.departure_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                      {!attendance.departure_time && (
                        <button
                          onClick={() => markDeparture(child.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Çıktı</span>
                        </button>
                      )}
                      {attendance.departure_time && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Çıkış Yapıldı</span>
                        </div>
                      )}
                    </div>
                    {attendance.departure_time && (userRole === 'admin' || userRole === 'teacher') && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => sendPickupReminder(child.id)}
                          disabled={sendingReminder === child.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors shadow-sm"
                        >
                          <Bell className="w-4 h-4" />
                          <span className="font-medium">
                            {sendingReminder === child.id ? 'Gönderiliyor...' : 'Veliye Hatırlat'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
