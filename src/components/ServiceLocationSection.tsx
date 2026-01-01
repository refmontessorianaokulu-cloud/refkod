import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Car, Navigation, Clock, RefreshCw } from 'lucide-react';

interface ServiceLocationSectionProps {
  childId: string;
}

export default function ServiceLocationSection({ childId }: ServiceLocationSectionProps) {
  const [hasService, setHasService] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadServiceInfo();
  }, [childId]);

  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLastLocation();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, vehicleInfo]);

  const loadServiceInfo = async () => {
    setLoading(true);
    try {
      const { data: assignment } = await supabase
        .from('child_service_assignments')
        .select(`
          *,
          service_routes (
            *,
            service_vehicles (*)
          )
        `)
        .eq('child_id', childId)
        .eq('uses_service', true)
        .maybeSingle();

      if (assignment && assignment.service_routes) {
        setHasService(true);
        setRouteInfo(assignment.service_routes);
        setVehicleInfo(assignment.service_routes.service_vehicles);
        loadLastLocation(assignment.service_routes.service_vehicles.id);
      } else {
        setHasService(false);
      }
    } catch (error) {
      console.error('Error loading service info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastLocation = async (vehicleId?: string) => {
    const targetVehicleId = vehicleId || vehicleInfo?.id;
    if (!targetVehicleId) return;

    try {
      const { data } = await supabase
        .from('service_location_tracking')
        .select('*')
        .eq('vehicle_id', targetVehicleId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLastLocation(data);
      }
    } catch (error) {
      console.error('Error loading location:', error);
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
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!hasService) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-400 p-3 rounded-lg">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Servis Takibi</h2>
        </div>
        <p className="text-gray-600">Bu çocuk için servis hizmeti kullanılmıyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Servis Takibi</h2>
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
            <span>{autoRefresh ? 'Otomatik Güncelleme Açık' : 'Otomatik Güncelleme Kapalı'}</span>
          </button>
        </div>

        {vehicleInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Araç</p>
              <p className="text-lg font-semibold text-gray-900">{vehicleInfo.vehicle_name}</p>
              <p className="text-sm text-gray-500">{vehicleInfo.license_plate}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rota</p>
              <p className="text-lg font-semibold text-gray-900">{routeInfo.route_name}</p>
              {routeInfo.departure_time && (
                <p className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Kalkış: {routeInfo.departure_time}
                </p>
              )}
            </div>
          </div>
        )}

        {lastLocation ? (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Son Konum</h3>
              </div>
              <button
                onClick={() => loadLastLocation()}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Yenile</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Koordinatlar</p>
                  <p className="text-sm font-mono text-gray-900">
                    {parseFloat(lastLocation.latitude).toFixed(6)}, {parseFloat(lastLocation.longitude).toFixed(6)}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center space-x-1"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Haritada Aç</span>
                </a>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-600">Son Güncelleme:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {getTimeDifference(lastLocation.timestamp)}
                  </span>
                </div>
                {lastLocation.speed && (
                  <div>
                    <span className="text-gray-600">Hız:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {parseFloat(lastLocation.speed).toFixed(0)} km/s
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Konum: {new Date(lastLocation.timestamp).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        ) : (
          <div className="border-t pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Servis şu anda konum paylaşımı yapmıyor veya henüz konum verisi alınmadı.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
