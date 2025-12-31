import { useState, useEffect } from 'react';
import { supabase, Child } from '../lib/supabase';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Attendance {
  id: string;
  child_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  created_at: string;
}

interface AttendanceSectionProps {
  children: Child[];
  teacherId?: string;
}

const statusConfig = {
  present: { label: 'Geldi', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  absent: { label: 'Gelmedi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  late: { label: 'Geç Geldi', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  excused: { label: 'Mazeret', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function AttendanceSection({ children, teacherId }: AttendanceSectionProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

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
        });
        if (error) throw error;
      }

      loadAttendances();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Devamsızlık Takibi</h2>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : children.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz çocuk yok</div>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => {
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
