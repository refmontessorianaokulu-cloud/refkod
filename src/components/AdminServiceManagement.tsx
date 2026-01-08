import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Plus, Trash2, MapPin, Users, Clock } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_name: string;
  license_plate: string;
  capacity: number;
  is_active: boolean;
  driver_id?: string | null;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface Route {
  id: string;
  route_name: string;
  vehicle_id: string;
  is_active: boolean;
  departure_time: string;
  estimated_arrival_time: string;
  service_vehicles?: Vehicle;
}

interface ServiceAssignment {
  id: string;
  child_id: string;
  route_id: string;
  uses_service: boolean;
  pickup_address: string;
  children?: {
    id: string;
    first_name: string;
    last_name: string;
    class_name: string;
    photo_url: string | null;
  };
  service_routes?: Route;
}

export default function AdminServiceManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'assignments' | 'routes' | 'vehicles'>('assignments');

  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState({
    child_id: '',
    route_id: '',
    pickup_address: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_name: '',
    license_plate: '',
    capacity: 0,
    driver_id: '',
  });

  const [routeForm, setRouteForm] = useState({
    route_name: '',
    vehicle_id: '',
    departure_time: '',
    estimated_arrival_time: '',
  });

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, routesRes, assignmentsRes, childrenRes, driversRes] = await Promise.all([
        supabase.from('service_vehicles').select('*, profiles(id, full_name, email)').order('created_at', { ascending: false }),
        supabase.from('service_routes').select('*, service_vehicles(*)').order('created_at', { ascending: false }),
        supabase.from('child_service_assignments').select(`
          *,
          children(id, first_name, last_name, class_name, photo_url),
          service_routes(*, service_vehicles(*))
        `).eq('uses_service', true).order('created_at', { ascending: false }),
        supabase.from('children').select('*').order('first_name', { ascending: true }),
        supabase.from('profiles').select('*').eq('staff_role', 'bus_driver').order('full_name', { ascending: true }),
      ]);

      setVehicles(vehiclesRes.data || []);
      setRoutes(routesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setChildren(childrenRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('service_vehicles').insert({
        vehicle_name: vehicleForm.vehicle_name,
        license_plate: vehicleForm.license_plate,
        capacity: vehicleForm.capacity,
        driver_id: vehicleForm.driver_id || null,
        is_active: true,
      });

      if (error) throw error;

      setShowAddVehicleModal(false);
      setVehicleForm({ vehicle_name: '', license_plate: '', capacity: 0, driver_id: '' });
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('service_routes').insert({
        route_name: routeForm.route_name,
        vehicle_id: routeForm.vehicle_id,
        departure_time: routeForm.departure_time,
        estimated_arrival_time: routeForm.estimated_arrival_time,
        is_active: true,
      });

      if (error) throw error;

      setShowAddRouteModal(false);
      setRouteForm({ route_name: '', vehicle_id: '', departure_time: '', estimated_arrival_time: '' });
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('child_service_assignments').insert({
        child_id: assignmentForm.child_id,
        route_id: assignmentForm.route_id,
        pickup_address: assignmentForm.pickup_address,
        uses_service: true,
      });

      if (error) throw error;

      setShowAddAssignmentModal(false);
      setAssignmentForm({ child_id: '', route_id: '', pickup_address: '' });
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bu servis atamasını silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('child_service_assignments').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Bu aracı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('service_vehicles').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Bu rotayı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('service_routes').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Servis Yönetimi</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'assignments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Atamalar
          </button>
          <button
            onClick={() => setActiveView('routes')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'routes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <MapPin className="w-5 h-5 inline mr-2" />
            Rotalar
          </button>
          <button
            onClick={() => setActiveView('vehicles')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'vehicles'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Car className="w-5 h-5 inline mr-2" />
            Araçlar
          </button>
        </div>
      </div>

      {activeView === 'assignments' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Servis Kullanan Çocuklar</h3>
            <button
              onClick={() => setShowAddAssignmentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Çocuk Ekle</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              Henüz servis ataması yapılmamış
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {assignment.children?.photo_url ? (
                        <img
                          src={assignment.children.photo_url}
                          alt={`${assignment.children.first_name} ${assignment.children.last_name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {assignment.children?.first_name} {assignment.children?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{assignment.children?.class_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Car className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">{assignment.service_routes?.route_name}</span>
                    </div>
                    {assignment.service_routes?.service_vehicles && (
                      <div className="text-gray-600 ml-6">
                        {assignment.service_routes.service_vehicles.vehicle_name} -{' '}
                        {assignment.service_routes.service_vehicles.license_plate}
                      </div>
                    )}
                    {assignment.pickup_address && (
                      <div className="flex items-start text-gray-700 mt-2">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-xs">{assignment.pickup_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'routes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Servis Rotaları</h3>
            <button
              onClick={() => setShowAddRouteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Rota Ekle</span>
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              Henüz rota eklenmemiş
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{route.route_name}</h4>
                        <div className={`text-sm ${route.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {route.is_active ? 'Aktif' : 'Pasif'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="p-2 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>

                  {route.service_vehicles && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-700">
                        <Car className="w-4 h-4 mr-2" />
                        <span className="font-medium">{route.service_vehicles.vehicle_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-6">
                        {route.service_vehicles.license_plate}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {route.departure_time && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-blue-600" />
                        <span>Kalkış: {route.departure_time}</span>
                      </div>
                    )}
                    {route.estimated_arrival_time && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-green-600" />
                        <span>Varış: {route.estimated_arrival_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'vehicles' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Servis Araçları</h3>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Araç Ekle</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              Henüz araç eklenmemiş
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Car className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{vehicle.vehicle_name}</h4>
                        <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="p-2 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">Kapasite:</span>
                        <span className="ml-2 font-semibold text-gray-900">{vehicle.capacity} kişi</span>
                      </div>
                      <div className={`text-sm font-medium ${vehicle.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {vehicle.is_active ? 'Aktif' : 'Pasif'}
                      </div>
                    </div>
                    {vehicle.profiles && (
                      <div className="text-sm pt-2 border-t">
                        <span className="text-gray-600">Şöför:</span>
                        <span className="ml-2 font-semibold text-blue-900">{vehicle.profiles.full_name}</span>
                      </div>
                    )}
                    {!vehicle.profiles && (
                      <div className="text-sm pt-2 border-t text-orange-600">
                        Şöför atanmamış
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Servise Çocuk Ekle</h3>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk</label>
                <select
                  required
                  value={assignmentForm.child_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, child_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Rota</label>
                <select
                  required
                  value={assignmentForm.route_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, route_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Rota seçin...</option>
                  {routes.filter(r => r.is_active).map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alınacağı Adres</label>
                <textarea
                  required
                  value={assignmentForm.pickup_address}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, pickup_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Çocuğun servis tarafından alınacağı adres..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAssignmentModal(false);
                    setAssignmentForm({ child_id: '', route_id: '', pickup_address: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Araç Ekle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Araç Adı</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.vehicle_name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Servis 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plaka</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.license_plate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 34 ABC 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kapasite</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={vehicleForm.capacity || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şöför</label>
                <select
                  value={vehicleForm.driver_id}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driver_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Şöför seçin (isteğe bağlı)...</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} - {driver.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicleModal(false);
                    setVehicleForm({ vehicle_name: '', license_plate: '', capacity: 0, driver_id: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Rota Ekle</h3>
            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rota Adı</label>
                <input
                  type="text"
                  required
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Sabah Rotası 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Araç</label>
                <select
                  required
                  value={routeForm.vehicle_id}
                  onChange={(e) => setRouteForm({ ...routeForm, vehicle_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Araç seçin...</option>
                  {vehicles.filter(v => v.is_active).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_name} - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kalkış Saati</label>
                <input
                  type="time"
                  value={routeForm.departure_time}
                  onChange={(e) => setRouteForm({ ...routeForm, departure_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahmini Varış Saati</label>
                <input
                  type="time"
                  value={routeForm.estimated_arrival_time}
                  onChange={(e) => setRouteForm({ ...routeForm, estimated_arrival_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRouteModal(false);
                    setRouteForm({ route_name: '', vehicle_id: '', departure_time: '', estimated_arrival_time: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
