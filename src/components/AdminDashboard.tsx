import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Child, Profile, ParentChild, DailyReport } from '../lib/supabase';
import { Users, Baby, LogOut, Plus, Trash2, UserPlus, BookOpen, GraduationCap } from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'children' | 'users' | 'reports'>('children');
  const [children, setChildren] = useState<Child[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showParentLinkModal, setShowParentLinkModal] = useState(false);
  const [showTeacherLinkModal, setShowTeacherLinkModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [parents, setParents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [childForm, setChildForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    class_name: '',
  });

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'parent' as 'admin' | 'teacher' | 'parent',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'children') {
        const { data } = await supabase
          .from('children')
          .select('*')
          .order('created_at', { ascending: false });
        setChildren(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
        const parentData = data?.filter(u => u.role === 'parent') || [];
        const teacherData = data?.filter(u => u.role === 'teacher') || [];
        setParents(parentData);
        setTeachers(teacherData);
      } else if (activeTab === 'reports') {
        const { data } = await supabase
          .from('daily_reports')
          .select('*')
          .order('report_date', { ascending: false });
        setDailyReports(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('children').insert(childForm);
      if (error) throw error;
      setShowChildModal(false);
      setChildForm({ first_name: '', last_name: '', birth_date: '', class_name: '' });
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
      });
      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: userForm.email,
          full_name: userForm.full_name,
          role: userForm.role,
        });
        if (profileError) throw profileError;
      }

      setShowUserModal(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'parent' });
      loadData();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleLinkParent = async (parentId: string) => {
    try {
      const { error } = await supabase.from('parent_children').insert({
        parent_id: parentId,
        child_id: selectedChild,
      });
      if (error) throw error;
      setShowParentLinkModal(false);
      setSelectedChild('');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleLinkTeacher = async (teacherId: string) => {
    try {
      const { error } = await supabase.from('teacher_children').insert({
        teacher_id: teacherId,
        child_id: selectedChild,
      });
      if (error) throw error;
      setShowTeacherLinkModal(false);
      setSelectedChild('');
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleDeleteChild = async (id: string) => {
    if (!confirm('Bu çocuğu silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('children').delete().eq('id', id);
      if (error) throw error;
      loadData();
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
                <h1 className="text-xl font-bold text-gray-800">Yönetici Paneli</h1>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('children')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'children'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Baby className="w-5 h-5" />
                <span>Çocuklar</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Kullanıcılar</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Günlük Raporlar</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'children' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Çocuklar</h2>
                  <button
                    onClick={() => setShowChildModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Çocuk Ekle</span>
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : children.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Henüz çocuk eklenmemiş
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {child.first_name} {child.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{child.class_name}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedChild(child.id);
                                setShowParentLinkModal(true);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Veli Bağla"
                            >
                              <UserPlus className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedChild(child.id);
                                setShowTeacherLinkModal(true);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                              title="Öğretmen Bağla"
                            >
                              <GraduationCap className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(child.id)}
                              className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Doğum: {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Kullanıcılar</h2>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Kullanıcı Ekle</span>
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Henüz kullanıcı yok
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ad Soyad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            E-posta
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin'
                                    ? 'bg-red-100 text-red-800'
                                    : user.role === 'teacher'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {user.role === 'admin'
                                  ? 'Yönetici'
                                  : user.role === 'teacher'
                                  ? 'Öğretmen'
                                  : 'Veli'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Günlük Raporlar</h2>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : dailyReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Henüz rapor yok
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dailyReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                            <p className="text-sm text-gray-600">
                              Tarih: {new Date(report.report_date).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{report.content}</p>
                        <div className="text-xs text-gray-500 pt-3 border-t border-amber-200">
                          Oluşturulma: {new Date(report.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Çocuk Ekle</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                <input
                  type="text"
                  required
                  value={childForm.first_name}
                  onChange={(e) => setChildForm({ ...childForm, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                <input
                  type="text"
                  required
                  value={childForm.last_name}
                  onChange={(e) => setChildForm({ ...childForm, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                <input
                  type="date"
                  required
                  value={childForm.birth_date}
                  onChange={(e) => setChildForm({ ...childForm, birth_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sınıf</label>
                <input
                  type="text"
                  required
                  value={childForm.class_name}
                  onChange={(e) => setChildForm({ ...childForm, class_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as 'admin' | 'teacher' | 'parent' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="parent">Veli</option>
                  <option value="teacher">Öğretmen</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showParentLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Veli Bağla</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parents.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => handleLinkParent(parent.id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{parent.full_name}</div>
                  <div className="text-sm text-gray-500">{parent.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowParentLinkModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {showTeacherLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Öğretmen Bağla</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleLinkTeacher(teacher.id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{teacher.full_name}</div>
                  <div className="text-sm text-gray-500">{teacher.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTeacherLinkModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
