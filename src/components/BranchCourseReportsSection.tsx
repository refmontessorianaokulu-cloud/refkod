import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, X, Upload, Trash2, Edit2 } from 'lucide-react';

interface BranchCourseReport {
  id: string;
  teacher_id: string;
  child_id: string;
  report_date: string;
  course_type: 'english' | 'quran' | 'moral_values' | 'etiquette' | 'art_music' | 'guidance';
  content: string;
  media_urls: string[];
  created_at: string;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
}

interface BranchCourseReportsSectionProps {
  children: Child[];
  teacherId?: string;
  userRole: 'admin' | 'teacher';
}

const courseTypes = [
  { value: 'english', label: 'İngilizce' },
  { value: 'quran', label: 'Kuran-ı Kerim' },
  { value: 'moral_values', label: 'Manevi Değerler' },
  { value: 'etiquette', label: 'Adab-ı Muaşeret' },
  { value: 'art_music', label: 'Sanat ve Musiki' },
  { value: 'guidance', label: 'Rehberlik' },
];

export default function BranchCourseReportsSection({ children, teacherId, userRole }: BranchCourseReportsSectionProps) {
  const [reports, setReports] = useState<BranchCourseReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [form, setForm] = useState({
    child_id: '',
    course_type: 'english' as 'english' | 'quran' | 'moral_values' | 'etiquette' | 'art_music' | 'guidance',
    content: '',
    report_date: new Date().toISOString().split('T')[0],
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingReport, setEditingReport] = useState<BranchCourseReport | null>(null);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    loadReports();
  }, [selectedDate, selectedCourse, selectedStudent, children]);

  const loadReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('branch_course_reports')
        .select('*, children(first_name, last_name, class_name)')
        .eq('report_date', selectedDate)
        .in('child_id', children.map(c => c.id));

      if (selectedCourse !== 'all') {
        query = query.eq('course_type', selectedCourse);
      }

      if (selectedStudent !== 'all') {
        query = query.eq('child_id', selectedStudent);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('report-media').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    try {
      const mediaUrls = await uploadMediaFiles();

      const { error } = await supabase.from('branch_course_reports').insert({
        teacher_id: teacherId,
        child_id: form.child_id,
        course_type: form.course_type,
        content: form.content,
        report_date: form.report_date,
        media_urls: mediaUrls,
      });

      if (error) throw error;

      alert('Rapor başarıyla eklendi!');
      setShowModal(false);
      resetForm();
      loadReports();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleOpenEditModal = (report: any) => {
    setEditingReport(report);
    setForm({
      child_id: report.child_id,
      course_type: report.course_type,
      content: report.content,
      report_date: report.report_date,
    });
    setExistingMediaUrls(report.media_urls || []);
    setMediaFiles([]);
    setShowModal(true);
  };

  const handleEditReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !editingReport) return;

    try {
      const newMediaUrls = await uploadMediaFiles();
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

      const { error } = await supabase
        .from('branch_course_reports')
        .update({
          child_id: form.child_id,
          course_type: form.course_type,
          content: form.content,
          report_date: form.report_date,
          media_urls: allMediaUrls,
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      alert('Rapor başarıyla güncellendi!');
      setShowModal(false);
      setEditingReport(null);
      resetForm();
      loadReports();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('branch_course_reports').delete().eq('id', id);
      if (error) throw error;
      loadReports();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setForm({
      child_id: '',
      course_type: 'english',
      content: '',
      report_date: new Date().toISOString().split('T')[0],
    });
    setMediaFiles([]);
    setExistingMediaUrls([]);
    setEditingReport(null);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const getCourseLabel = (type: string) => {
    return courseTypes.find(c => c.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Branş Dersleri Günlük Raporları</h2>
        </div>
        {userRole === 'teacher' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Rapor Ekle</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tüm Dersler</option>
            {courseTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tüm Öğrenciler</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {selectedDate !== new Date().toISOString().split('T')[0]
            ? 'Seçili tarihte rapor bulunamadı'
            : 'Bugün için henüz rapor eklenmemiş'}
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: any) => (
            <div
              key={report.id}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {report.children?.first_name} {report.children?.last_name}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="inline-block px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                      {getCourseLabel(report.course_type)}
                    </span>
                    <span className="text-sm text-gray-600">{report.children?.class_name}</span>
                  </div>
                </div>
                {userRole === 'teacher' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(report)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Rapor:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
                </div>

                {report.media_urls && report.media_urls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Medya:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {report.media_urls.map((url: string, index: number) => (
                        <div key={index} className="relative">
                          {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={url}
                              controls
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {new Date(report.created_at).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingReport ? 'Branş Dersi Raporu Düzenle' : 'Branş Dersi Raporu Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingReport ? handleEditReport : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk</label>
                <select
                  required
                  value={form.child_id}
                  onChange={(e) => setForm({ ...form, child_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!!editingReport}
                >
                  <option value="">Çocuk seçin...</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name} - {child.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ders</label>
                <select
                  required
                  value={form.course_type}
                  onChange={(e) => setForm({ ...form, course_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {courseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                <input
                  type="date"
                  required
                  value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rapor</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Derste gözlemlediğiniz gelişmeler, katılım durumu, öne çıkan davranışlar..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraf/Video Ekle (İsteğe Bağlı)
                </label>
                {editingReport && existingMediaUrls.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Mevcut Medyalar</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {existingMediaUrls.map((url, index) => (
                        <div key={index} className="relative">
                          {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={url}
                              controls
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setExistingMediaUrls(existingMediaUrls.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                    id="branch-media-upload"
                  />
                  <label
                    htmlFor="branch-media-upload"
                    className="flex items-center justify-center space-x-2 cursor-pointer text-purple-600 hover:text-purple-700"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{editingReport ? 'Yeni Dosya Ekle' : 'Dosya Seç'}</span>
                  </label>
                  {mediaFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeMediaFile(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Yükleniyor...' : (editingReport ? 'Güncelle' : 'Rapor Ekle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
