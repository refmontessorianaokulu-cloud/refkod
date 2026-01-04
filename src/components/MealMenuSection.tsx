import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Edit2, Trash2, Calendar, Upload, Image as ImageIcon } from 'lucide-react';

interface MealMenu {
  id: string;
  menu_date: string;
  meal_type: 'breakfast' | 'lunch' | 'afternoon_snack';
  menu_items: string;
  photo_url: string | null;
  created_at: string;
}

interface MealMenuSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent' | 'staff';
}

export default function MealMenuSection({ userId, userRole }: MealMenuSectionProps) {
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MealMenu | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({
    menu_date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'afternoon_snack',
    menu_items: '',
    photo_url: '',
  });

  useEffect(() => {
    loadMenus();
  }, [selectedMonth]);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const { data, error } = await supabase
        .from('monthly_menu')
        .select('*')
        .gte('menu_date', startDate)
        .lte('menu_date', endDate.toISOString().split('T')[0])
        .order('menu_date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedMenu) {
        const { error } = await supabase
          .from('monthly_menu')
          .update({
            menu_date: form.menu_date,
            meal_type: form.meal_type,
            menu_items: form.menu_items,
            photo_url: form.photo_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedMenu.id);
        if (error) throw error;
        alert('Menü güncellendi!');
      } else {
        const { error } = await supabase
          .from('monthly_menu')
          .insert({
            menu_date: form.menu_date,
            meal_type: form.meal_type,
            menu_items: form.menu_items,
            photo_url: form.photo_url || null,
            created_by: userId,
          });
        if (error) throw error;
        alert('Menü eklendi!');
      }
      setShowModal(false);
      setSelectedMenu(null);
      resetForm();
      loadMenus();
    } catch (error: any) {
      if (error.code === '23505') {
        alert('Bu tarih ve öğün için zaten bir menü mevcut!');
      } else {
        alert('Hata: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu menüyü silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('monthly_menu').delete().eq('id', id);
      if (error) throw error;
      alert('Menü silindi!');
      loadMenus();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin!');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `meals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-photos')
        .getPublicUrl(filePath);

      setForm({ ...form, photo_url: publicUrl });
    } catch (error) {
      alert('Fotoğraf yükleme hatası: ' + (error as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const resetForm = () => {
    setForm({
      menu_date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      menu_items: '',
      photo_url: '',
    });
  };

  const getMealTypeLabel = (type: string) => {
    const labels = {
      breakfast: 'Sabah Kahvaltısı',
      lunch: 'Öğlen Yemeği',
      afternoon_snack: 'İkindi Kahvaltısı',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMealTypeColor = (type: string) => {
    const colors = {
      breakfast: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      lunch: 'bg-red-100 text-red-800 border-red-300',
      afternoon_snack: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDaysInMonth = () => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getMenuForDate = (day: number, mealType: 'breakfast' | 'lunch' | 'afternoon_snack') => {
    const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
    return menus.find(m => m.menu_date === dateStr && m.meal_type === mealType);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Aylık Yemek Menüsü</h2>
            <p className="text-sm text-gray-600">Günlük öğün planları ve fotoğrafları</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {(userRole === 'admin' || userRole === 'staff') && (
            <button
              onClick={() => {
                setSelectedMenu(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              <span>Menü Ekle</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tarih</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sabah Kahvaltısı</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Öğlen Yemeği</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">İkindi Kahvaltısı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getDaysInMonth().map((day) => {
                  const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
                  const date = new Date(dateStr);
                  const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  const breakfast = getMenuForDate(day, 'breakfast');
                  const lunch = getMenuForDate(day, 'lunch');
                  const afternoonSnack = getMenuForDate(day, 'afternoon_snack');

                  return (
                    <tr key={day} className={isWeekend ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{day}</span>
                          <span className="text-xs text-gray-500">{dayName}</span>
                        </div>
                      </td>
                      {['breakfast', 'lunch', 'afternoon_snack'].map((mealType) => {
                        const menu = mealType === 'breakfast' ? breakfast : mealType === 'lunch' ? lunch : afternoonSnack;

                        return (
                          <td key={mealType} className="px-4 py-3">
                            {menu ? (
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-800">{menu.menu_items}</p>
                                    {menu.photo_url && (
                                      <div className="mt-2">
                                        <img
                                          src={menu.photo_url}
                                          alt={menu.menu_items}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {(userRole === 'admin' || userRole === 'staff') && (
                                    <div className="flex space-x-1 ml-2">
                                      <button
                                        onClick={() => {
                                          setSelectedMenu(menu);
                                          setForm({
                                            menu_date: menu.menu_date,
                                            meal_type: menu.meal_type,
                                            menu_items: menu.menu_items,
                                            photo_url: menu.photo_url || '',
                                          });
                                          setShowModal(true);
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(menu.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              (userRole === 'admin' || userRole === 'staff') ? (
                                <button
                                  onClick={() => {
                                    setSelectedMenu(null);
                                    setForm({
                                      menu_date: dateStr,
                                      meal_type: mealType as 'breakfast' | 'lunch' | 'afternoon_snack',
                                      menu_items: '',
                                      photo_url: '',
                                    });
                                    setShowModal(true);
                                  }}
                                  className="text-sm text-gray-400 hover:text-orange-600 transition-colors"
                                >
                                  + Ekle
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (userRole === 'admin' || userRole === 'staff') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedMenu ? 'Menü Düzenle' : 'Yeni Menü Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedMenu(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                  <input
                    type="date"
                    required
                    value={form.menu_date}
                    onChange={(e) => setForm({ ...form, menu_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Öğün</label>
                  <select
                    required
                    value={form.meal_type}
                    onChange={(e) => setForm({ ...form, meal_type: e.target.value as 'breakfast' | 'lunch' | 'afternoon_snack' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="breakfast">Sabah Kahvaltısı</option>
                    <option value="lunch">Öğlen Yemeği</option>
                    <option value="afternoon_snack">İkindi Kahvaltısı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menü İçeriği</label>
                <textarea
                  required
                  value={form.menu_items}
                  onChange={(e) => setForm({ ...form, menu_items: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Örn: Peynir, zeytin, domates, simit, süt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yemek Fotoğrafı</label>
                <div className="space-y-3">
                  {form.photo_url && (
                    <div className="relative inline-block">
                      <img
                        src={form.photo_url}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, photo_url: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                    {uploadingPhoto ? (
                      <span className="text-sm text-gray-600">Yükleniyor...</span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Fotoğraf Yükle</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMenu(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                >
                  {selectedMenu ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
