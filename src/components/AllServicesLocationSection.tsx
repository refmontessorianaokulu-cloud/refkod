import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Car, Navigation, Clock, RefreshCw } from 'lucide-react';

export default function AllServicesLocationSection() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadVehiclesWithLocations();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadVehiclesWithLocations();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadVehiclesWithLocations = async () => {
    setLoading(true);
    try {
      const { data: vehiclesData } = await supabase
        .from('service_vehicles')
        .select(`
          *,
          service_routes (
            id,
            route_name,
            departure_time
          )
        `)
        .eq('is_active', true);

      if (!vehiclesData) {
        setLoading(false);
        return;
      }

      const vehiclesWithLocations = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          const { data: locationData } = await supabase
            .from('service_location_tracking')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: childrenCount } = await supabase
            .from('child_service_assignments')
            .select('id', { count: 'exact', head: true })
            .in('route_id', vehicle.service_routes?.map((r: any) => r.id) || [])
            .eq('uses_service', true);

          return {
            ...vehicle,
            lastLocation: locationData,
            childrenCount: childrenCount || 0,
          };
        })
      );

      setVehicles(vehiclesWithLocations);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeDifference = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Kayıtlı servis aracı bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tüm Servis Araçları</h2>
          <p className="text-sm text-gray-600 mt-1">Aktif servis araçlarının anlık konumları</p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            autoRefresh
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          <span className="text-sm">{autoRefresh ? 'Otomatik Güncelleme Açık' : 'Otomatik Güncelleme'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{vehicle.vehicle_name}</h3>
                  <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                </div>
              </div>
              {vehicle.lastLocation && (
                <div className="flex items-center space-x-1 text-green-600">
                  <MapPin className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-semibold">Aktif</span>
                </div>
              )}
            </div>

            {vehicle.service_routes && vehicle.service_routes.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {vehicle.service_routes[0].route_name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Kalkış: {vehicle.service_routes[0].departure_time || 'Belirtilmemiş'}</span>
                  </div>
                  <span>{vehicle.childrenCount} çocuk</span>
                </div>
              </div>
            )}

            {vehicle.lastLocation ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">Son Konum</h4>
                  <span className="text-xs text-gray-600">
                    {getTimeDifference(vehicle.lastLocation.timestamp)}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono text-gray-700">
                    {parseFloat(vehicle.lastLocation.latitude).toFixed(6)},{' '}
                    {parseFloat(vehicle.lastLocation.longitude).toFixed(6)}
                  </p>
                  <div className="flex items-center justify-between">
                    {vehicle.lastLocation.speed && (
                      <div className="text-xs text-gray-600">
                        Hız: <span className="font-semibold">{parseFloat(vehicle.lastLocation.speed).toFixed(0)} km/s</span>
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${vehicle.lastLocation.latitude},${vehicle.lastLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Haritada Aç</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  Bu servis şu anda konum paylaşımı yapmıyor
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
