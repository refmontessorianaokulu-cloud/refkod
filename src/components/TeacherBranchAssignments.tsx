import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCheck, Plus, Trash2, AlertCircle } from 'lucide-react';

interface TeacherBranchAssignment {
  id: string;
  teacher_id: string;
  class_name: string;
  course_type: string;
  created_at: string;
  teacher?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const courseTypes = [
  { value: 'english', label: 'İngilizce' },
  { value: 'quran', label: 'Kuran-ı Kerim' },
  { value: 'moral_values', label: 'Manevi Değerler' },
  { value: 'etiquette', label: 'Adab-ı Muaşeret' },
  { value: 'art_music', label: 'Sanat ve Musiki' },
  { value: 'guidance', label: 'Rehberlik' },
];

export default function TeacherBranchAssignments() {
  const [assignments, setAssignments] = useState<TeacherBranchAssignment[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    teacher_id: '',
    class_name: '',
    course_type: 'english',
  });

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_branch_assignments')
        .select(`
          *,
          teacher:profiles!teacher_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError('Atamalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('role', ['teacher', 'guidance_counselor'])
        .order('first_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('class_name')
        .order('class_name');

      if (error) throw error;

      const uniqueClasses = Array.from(new Set(data?.map(c => c.class_name) || []));
      setClasses(uniqueClasses);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.teacher_id || !form.class_name || !form.course_type) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('teacher_branch_assignments')
        .insert([
          {
            teacher_id: form.teacher_id,
            class_name: form.class_name,
            course_type: form.course_type,
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bu öğretmen zaten bu sınıfa ve derse atanmış');
        }
        throw error;
      }

      setSuccess('Atama başarıyla eklendi');
      setForm({ teacher_id: '', class_name: '', course_type: 'english' });
      setShowModal(false);
      fetchAssignments();
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.message || 'Atama eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu atamayı silmek istediğinizden emin misiniz?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('teacher_branch_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Atama başarıyla silindi');
      fetchAssignments();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError('Atama silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCourseLabel = (courseType: string) => {
    return courseTypes.find(ct => ct.value === courseType)?.label || courseType;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Branş Dersi Öğretmen Atamaları</h2>
            <p className="text-sm text-gray-600 mt-1">Öğretmenleri sınıflara ve branş derslerine atayın</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Atama
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğretmen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sınıf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branş Dersi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atanma Tarihi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Henüz atama yapılmamış
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.teacher?.first_name} {assignment.teacher?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {assignment.teacher?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {assignment.class_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {getCourseLabel(assignment.course_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Yeni Atama Ekle</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öğretmen *
                </label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Öğretmen Seçin</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} ({teacher.role === 'guidance_counselor' ? 'Rehber Öğretmen' : 'Öğretmen'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınıf *
                </label>
                <select
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sınıf Seçin</option>
                  {classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branş Dersi *
                </label>
                <select
                  value={form.course_type}
                  onChange={(e) => setForm({ ...form, course_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {courseTypes.map((course) => (
                    <option key={course.value} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
