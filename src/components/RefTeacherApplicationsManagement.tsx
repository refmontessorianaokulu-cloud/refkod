import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Eye, Trash2, CheckCircle, XCircle, Clock, Search, X, ChevronDown, ChevronUp, CreditCard as Edit2, Save, Upload, User, Mail, Phone, MapPin, GraduationCap, Briefcase, BookOpen, FileText } from 'lucide-react';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  graduated_school: string;
  graduated_program: string;
  has_formation: boolean;
  is_working: boolean;
  workplace: string | null;
  has_montessori_training: boolean;
  previous_trainings: string;
  reference_info: string | null;
  evaluation_essay: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Beklemede', color: 'bg-amber-100 text-amber-800', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

export default function RefTeacherApplicationsManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [saving, setSaving] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reference_teacher_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) return;
    const { error } = await supabase.from('reference_teacher_applications').delete().eq('id', id);
    if (error) { alert('Silme hatası: ' + error.message); return; }
    setApplications(prev => prev.filter(a => a.id !== id));
    if (selectedApp?.id === id) setSelectedApp(null);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('reference_teacher_applications')
      .update({ status })
      .eq('id', id);
    if (error) { alert('Güncelleme hatası: ' + error.message); return; }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status } : null);
    if (editingApp?.id === id) setEditingApp(prev => prev ? { ...prev, status } : null);
  };

  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setEditForm({ ...app });
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Fotoğraf 5MB\'dan küçük olmalı'); return; }
    setNewPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!editingApp) return;
    setSaving(true);
    try {
      let photoUrl = editForm.photo_url ?? null;

      if (newPhotoFile) {
        const ext = newPhotoFile.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reference-teacher-photos')
          .upload(path, newPhotoFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('reference-teacher-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }

      const update: Partial<Application> = {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        graduated_school: editForm.graduated_school,
        graduated_program: editForm.graduated_program,
        has_formation: editForm.has_formation,
        is_working: editForm.is_working,
        workplace: editForm.is_working ? (editForm.workplace || null) : null,
        has_montessori_training: editForm.has_montessori_training,
        previous_trainings: editForm.previous_trainings,
        reference_info: editForm.reference_info || null,
        evaluation_essay: editForm.evaluation_essay,
        status: editForm.status,
        photo_url: photoUrl,
      };

      const { error } = await supabase
        .from('reference_teacher_applications')
        .update(update)
        .eq('id', editingApp.id);
      if (error) throw error;

      const updated = { ...editingApp, ...update };
      setApplications(prev => prev.map(a => a.id === editingApp.id ? updated : a));
      if (selectedApp?.id === editingApp.id) setSelectedApp(updated);
      setEditingApp(null);
    } catch (err) {
      alert('Kaydetme hatası: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = applications.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.phone.includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Referans Öğretmen Başvuruları</h2>
            <p className="text-sm text-gray-500">{counts.all} başvuru</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              statusFilter === s
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-800">{counts[s]}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {s === 'all' ? 'Tümü' : STATUS_LABELS[s].label}
            </div>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Ad, e-posta veya telefon ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Başvuru bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const st = STATUS_LABELS[app.status];
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {app.photo_url ? (
                      <img src={app.photo_url} alt={app.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-semibold text-gray-800 truncate">{app.full_name}</span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.icon}
                        <span>{st.label}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 flex-wrap gap-y-0.5">
                      <span className="flex items-center space-x-1"><Mail className="w-3 h-3" /><span>{app.email}</span></span>
                      <span className="flex items-center space-x-1"><Phone className="w-3 h-3" /><span>{app.phone}</span></span>
                      <span>{new Date(app.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Okul:</span>{' '}
                        <span className="text-gray-800 font-medium">{app.graduated_school}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Program:</span>{' '}
                        <span className="text-gray-800 font-medium">{app.graduated_program}</span>
                      </div>
                      {app.is_working && (
                        <div>
                          <span className="text-gray-500">Çalıştığı Yer:</span>{' '}
                          <span className="text-gray-800 font-medium">{app.workplace}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      {app.has_formation && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Formasyon</span>}
                      {app.has_montessori_training && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Montessori Eğitimi</span>}
                      {app.is_working && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Çalışıyor</span>}
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-xs text-gray-500 mr-1">Durum:</span>
                      {(['pending', 'approved', 'rejected'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(app.id, s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            app.status === s
                              ? STATUS_LABELS[s].color + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {STATUS_LABELS[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-800">Başvuru Detayı</h3>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center space-x-4">
                {selectedApp.photo_url ? (
                  <img src={selectedApp.photo_url} alt={selectedApp.full_name} className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-green-600" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{selectedApp.full_name}</h4>
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${STATUS_LABELS[selectedApp.status].color}`}>
                    {STATUS_LABELS[selectedApp.status].icon}
                    <span>{STATUS_LABELS[selectedApp.status].label}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailRow icon={<Mail className="w-4 h-4" />} label="E-posta" value={selectedApp.email} />
                <DetailRow icon={<Phone className="w-4 h-4" />} label="Telefon" value={selectedApp.phone} />
                <DetailRow icon={<MapPin className="w-4 h-4" />} label="Adres" value={selectedApp.address} />
                <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Mezun Okul" value={selectedApp.graduated_school} />
                <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Mezun Program" value={selectedApp.graduated_program} />
                {selectedApp.is_working && selectedApp.workplace && (
                  <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Çalıştığı Yer" value={selectedApp.workplace} />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedApp.has_formation && <Tag color="blue">Formasyon Belgesi Var</Tag>}
                {selectedApp.has_montessori_training && <Tag color="amber">Montessori Eğitimi Aldı</Tag>}
                {selectedApp.is_working && <Tag color="emerald">Şuan Çalışıyor</Tag>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5" /><span>Aldığı Eğitimler</span>
                </label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{selectedApp.previous_trainings}</p>
              </div>

              {selectedApp.reference_info && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Referans Bilgisi</label>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{selectedApp.reference_info}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" /><span>Değerlendirme Yazısı</span>
                </label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{selectedApp.evaluation_essay}</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3">Başvuru tarihi: {new Date(selectedApp.created_at).toLocaleString('tr-TR')}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 font-medium">Durum:</span>
                  {(['pending', 'approved', 'rejected'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedApp.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedApp.status === s
                          ? STATUS_LABELS[s].color + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {STATUS_LABELS[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setSelectedApp(null); handleOpenEdit(selectedApp); }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Düzenle</span>
                </button>
                <button
                  onClick={() => { handleDelete(selectedApp.id); }}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-800">Başvuruyu Düzenle</h3>
              <button onClick={() => setEditingApp(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotoğraf</label>
                <div className="flex items-center space-x-4">
                  {(newPhotoPreview || editForm.photo_url) ? (
                    <div className="relative">
                      <img
                        src={newPhotoPreview || editForm.photo_url || ''}
                        alt="Fotoğraf"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => { setNewPhotoFile(null); setNewPhotoPreview(null); setEditForm(f => ({ ...f, photo_url: null })); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Yükle</span>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Adı Soyadı" required>
                  <input type="text" value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
                <FormField label="E-posta" required>
                  <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
                <FormField label="Telefon" required>
                  <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
                <FormField label="Adres" required>
                  <input type="text" value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
                <FormField label="Mezun Okul" required>
                  <input type="text" value={editForm.graduated_school || ''} onChange={e => setEditForm(f => ({ ...f, graduated_school: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
                <FormField label="Mezun Program" required>
                  <input type="text" value={editForm.graduated_program || ''} onChange={e => setEditForm(f => ({ ...f, graduated_program: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                </FormField>
              </div>

              <div className="space-y-2.5">
                <CheckboxField
                  id="edit_has_formation"
                  label="Pedagojik formasyon belgesi var"
                  checked={editForm.has_formation ?? false}
                  onChange={v => setEditForm(f => ({ ...f, has_formation: v }))}
                />
                <CheckboxField
                  id="edit_is_working"
                  label="Şuan çalışıyorum"
                  checked={editForm.is_working ?? false}
                  onChange={v => setEditForm(f => ({ ...f, is_working: v }))}
                />
                {editForm.is_working && (
                  <FormField label="Çalıştığı Yer" required>
                    <input type="text" value={editForm.workplace || ''} onChange={e => setEditForm(f => ({ ...f, workplace: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                  </FormField>
                )}
                <CheckboxField
                  id="edit_has_montessori"
                  label="Daha önce Montessori eğitimi aldım"
                  checked={editForm.has_montessori_training ?? false}
                  onChange={v => setEditForm(f => ({ ...f, has_montessori_training: v }))}
                />
              </div>

              <FormField label="Aldığı Eğitimler" required>
                <textarea rows={3} value={editForm.previous_trainings || ''} onChange={e => setEditForm(f => ({ ...f, previous_trainings: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none" />
              </FormField>

              <FormField label="Referans Bilgisi">
                <textarea rows={3} value={editForm.reference_info || ''} onChange={e => setEditForm(f => ({ ...f, reference_info: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none" />
              </FormField>

              <FormField label="Değerlendirme Yazısı" required>
                <textarea rows={5} value={editForm.evaluation_essay || ''} onChange={e => setEditForm(f => ({ ...f, evaluation_essay: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none" />
              </FormField>

              <FormField label="Başvuru Durumu">
                <select value={editForm.status || 'pending'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Application['status'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm">
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </FormField>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => setEditingApp(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                  İptal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start space-x-2">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-gray-800 font-medium">{value}</div>
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: 'blue' | 'amber' | 'emerald' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center space-x-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
      />
      <label htmlFor={id} className="text-sm text-gray-700">{label}</label>
    </div>
  );
}
