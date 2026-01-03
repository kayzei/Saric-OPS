import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, ArrowRight, Truck, History, CheckCircle, AlertTriangle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import { INITIAL_SHIPMENTS } from '../constants';
import { Asset, Shipment } from '../types';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const truckIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const originIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    shadowSize: [32, 32]
});

const destIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    shadowSize: [32, 32]
});

const CITY_COORDINATES: Record<string, [number, number]> = {
    'Lusaka, ZM': [-15.3875, 28.3228],
    'Ndola, ZM': [-12.9587, 28.6366],
    'Solwezi, ZM': [-12.1689, 26.3927],
    'Chingola, ZM': [-12.5373, 27.8458],
    'Chirundu, ZM': [-15.9534, 28.8657],
    'Mpika, ZM': [-11.8427, 31.4528],
    'Nakonde, ZM': [-9.3244, 32.7442],
    'Mongu, ZM': [-15.2724, 23.1487],
    'KKIA Airport': [-15.3275, 28.4426],
    'Radisson Blu': [-15.3972, 28.2991],
    'Kapiri Mposhi, ZM': [-13.9715, 28.6698],
    'Mkushi, ZM': [-13.6212, 29.4147],
    'Livingstone, ZM': [-17.8419, 25.8528],
    'Kalomo, ZM': [-17.0270, 26.4950],
    'Kabwe, ZM': [-14.4265, 28.4396],
    'Kitwe, ZM': [-12.8024, 28.2132],
    'Chinsali, ZM': [-10.5087, 31.8129],
    'Kaoma, ZM': [-14.7833, 24.8000]
};

interface ShipmentsProps {
    assets?: Asset[];
}

const Shipments: React.FC<ShipmentsProps> = ({ assets = [] }) => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await dbService.getShipments();
      if (data && data.length > 0) {
        setShipments(data);
      }
    } catch (e) {
      console.warn("Shipment sync deferred: Using cache.");
    } finally {
      setLoading(false);
    }
  };

  const activeShipments = useMemo(() => shipments.filter(s => ['In Transit', 'Pending'].includes(s.status)), [shipments]);
  const historyShipments = useMemo(() => shipments.filter(s => ['Delivered', 'Delayed'].includes(s.status)), [shipments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAssetClick = (assetId?: string) => {
    if (assetId) {
      navigate('/assets', { state: { targetAssetId: assetId } });
    }
  };

  const getCityCoords = (city: string): [number, number] => {
      if (city && CITY_COORDINATES[city]) return CITY_COORDINATES[city];
      const key = city ? Object.keys(CITY_COORDINATES).find(k => city.includes(k.split(',')[0])) : null;
      return key ? CITY_COORDINATES[key] : [-15.3875, 28.3228];
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Shipment Management</h1>
            <p className="text-slate-500 text-sm">Active bills of lading and cargo tracking.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={fetchShipments} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="px-4 py-2 bg-saric-600 text-white rounded-lg hover:bg-saric-500 transition-colors text-sm font-medium shadow-sm">
                New Shipment
            </button>
        </div>
      </div>
      
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Active Operations</h3>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeShipments.map((shipment) => {
                const activeAsset = assets.find(a => a.id === shipment.assetId);
                const originCoords = getCityCoords(shipment.origin);
                const destCoords = getCityCoords(shipment.destination);
                
                // Ensure valid numeric current position
                const currentPos = (activeAsset && Number.isFinite(activeAsset.location.lat) && Number.isFinite(activeAsset.location.lng)) 
                    ? [activeAsset.location.lat, activeAsset.location.lng] as [number, number] 
                    : originCoords;
                
                // Use array of coordinates for bounds to avoid 'isValid' issues on empty objects
                const boundsPoints: [number, number][] = [originCoords, destCoords];
                if (activeAsset && Number.isFinite(activeAsset.location.lat)) {
                    boundsPoints.push([activeAsset.location.lat, activeAsset.location.lng]);
                }

                return (
                    <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row h-auto md:h-64 group hover:shadow-md transition-shadow">
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Package size={18} className="text-indigo-600" />
                                        <span className="font-mono font-bold text-slate-800">{shipment.id}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(shipment.status)}`}>
                                        {shipment.status}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-700 text-sm mb-4">{shipment.client}</h4>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <div className="w-0.5 h-6 bg-slate-200"></div>
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Origin</p>
                                                <p className="text-xs font-medium text-slate-700">{shipment.origin}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Destination</p>
                                                <p className="text-xs font-medium text-slate-700">{shipment.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                        <Clock size={10} /> ETA
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{shipment.eta}</p>
                                </div>
                                {shipment.assetId && (
                                    <button 
                                        onClick={() => handleAssetClick(shipment.assetId)}
                                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium bg-indigo-50 px-2 py-1 rounded"
                                    >
                                        <Truck size={12} /> {shipment.assetId} <ExternalLink size={10} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 h-48 md:h-full bg-slate-100 relative border-l border-slate-100">
                            <MapContainer 
                                bounds={boundsPoints} 
                                scrollWheelZoom={false}
                                zoomControl={false}
                                dragging={false}
                                style={{ height: "100%", width: "100%" }}
                                className="z-0"
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Polyline 
                                    positions={[originCoords, destCoords]} 
                                    pathOptions={{ color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '5, 10' }} 
                                />
                                <Marker position={originCoords} icon={originIcon}>
                                    <LeafletTooltip direction="top" offset={[0, -20]} opacity={1}>{shipment.origin}</LeafletTooltip>
                                </Marker>
                                <Marker position={destCoords} icon={destIcon}>
                                    <LeafletTooltip direction="top" offset={[0, -20]} opacity={1}>{shipment.destination}</LeafletTooltip>
                                </Marker>
                                {activeAsset && Number.isFinite(activeAsset.location.lat) && (
                                    <Marker position={currentPos} icon={truckIcon} zIndexOffset={100}>
                                        <LeafletTooltip direction="top" offset={[0, -30]} opacity={1} permanent>
                                            <div className="text-xs font-bold">{activeAsset.id}</div>
                                        </LeafletTooltip>
                                    </Marker>
                                )}
                            </MapContainer>
                            <div className="absolute bottom-2 right-2 z-[400] bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-500 shadow-sm pointer-events-none">
                                Live Telemetry
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Registry & Exception Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Shipment ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {historyShipments.length > 0 ? historyShipments.map((shipment) => (
                     <tr key={shipment.id} className="hover:bg-slate-50 transition-colors group/row opacity-80 hover:opacity-100">
                        <td className="px-6 py-4 font-mono font-medium text-slate-500">
                            {shipment.id}
                        </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{shipment.origin}</span>
                                <ArrowRight size={12} />
                                <span>{shipment.destination}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{shipment.client}</td>
                        <td className="px-6 py-4 relative group/tooltip">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)} cursor-help flex items-center gap-1 w-fit`}>
                                {shipment.status}
                                {shipment.status === 'Delayed' && <Info size={10} />}
                            </span>
                            {shipment.status === 'Delayed' && shipment.delayReason && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-bold mb-1 text-red-200">Delay Reason:</p>
                                    {shipment.delayReason}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {shipment.status === 'Delivered' ? (
                                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                    <CheckCircle size={14} /> Verified
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                    <AlertTriangle size={14} /> Intervention Req.
                                </div>
                            )}
                        </td>
                     </tr>
                )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No history records found.</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Shipments;