
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { Truck, Eye, EyeOff, Layers, Crosshair, Navigation, MapPin, Radio, Brain, ShieldAlert, Sparkles, RefreshCw, WifiOff } from 'lucide-react';
import { INITIAL_GEOFENCES } from '../constants';
import { askAssistant } from '../services/geminiService';
import toast from 'react-hot-toast';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const movingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const errorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const shuttleIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const constructionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icon for no SIM / Radio only
const noSimIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LiveTrackingProps {
  assets: Asset[];
  userRole?: 'admin' | 'user';
}

const MapFocus: React.FC<{ assets: Asset[], shouldFocus: boolean, setShouldFocus: (v: boolean) => void }> = ({ assets, shouldFocus, setShouldFocus }) => {
    const map = useMap();
    useEffect(() => {
        if (shouldFocus && assets.length > 0) {
            const validCoords = assets
                .filter(a => a.location && typeof a.location.lat === 'number' && typeof a.location.lng === 'number' && isFinite(a.location.lat) && isFinite(a.location.lng))
                .map(a => [a.location.lat, a.location.lng] as [number, number]);
            
            if (validCoords.length > 0) {
                const bounds = L.latLngBounds(validCoords);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
                    setShouldFocus(false);
                }
            }
        }
    }, [assets, map, shouldFocus, setShouldFocus]);
    return null;
};

const LiveTracking: React.FC<LiveTrackingProps> = ({ assets, userRole = 'user' }) => {
  const [filters, setFilters] = useState<{ [key in AssetCategory]: boolean }>({
      'Heavy Transport': true,
      'Shuttle': true,
      'Construction': true,
      'Support': true
  });
  const [showGeofences, setShowGeofences] = useState(true);
  const [shouldFocus, setShouldFocus] = useState(true);
  const [isRiskAnalyzing, setIsRiskAnalyzing] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<string | null>(null);

  const visibleAssets = useMemo(() => {
    return (userRole === 'admin' 
      ? assets.filter(a => filters[a.category])
      : assets.filter(a => a.id === 'SRC-104'))
      .filter(a => a.location && Number.isFinite(a.location.lat) && Number.isFinite(a.location.lng));
  }, [assets, filters, userRole]);

  const toggleFilter = (category: AssetCategory) => {
      setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleRouteRiskAssessment = async () => {
    setIsRiskAnalyzing(true);
    try {
      const fleetContext = visibleAssets.map(a => `${a.id}: ${a.status} at ${a.location.lat}, ${a.location.lng}`).join(', ');
      const response = await askAssistant("Analyze route risks for the current moving assets. Identify potential bottlenecks or security risks in Zambia's logistics corridors.", fleetContext);
      setRiskAssessment(response);
      toast.success("Intelligence Sequence Deciphered");
    } catch (e) {
      toast.error("Vanguard SOC Failure");
    } finally {
      setIsRiskAnalyzing(false);
    }
  };

  const getIcon = (asset: Asset) => {
      if (asset.status === AssetStatus.BREAKDOWN) return errorIcon;
      // In a real app, we'd check the linked profile's noSim status here.
      // For simulation, let's say SRC-104 has No SIM if flagged.
      if (asset.category === 'Shuttle') return shuttleIcon;
      if (asset.category === 'Construction') return constructionIcon;
      return movingIcon;
  };

  return (
    <div className="relative z-0" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl max-w-xs border border-slate-800 text-slate-300">
            <h2 className="font-black text-white flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                {userRole === 'admin' ? 'OPERATIONAL HUD' : 'MISSION HUD'}
            </h2>
            
            {userRole === 'admin' ? (
                <>
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Active Units</span>
                            <span className="font-mono font-black text-white">{visibleAssets.filter(a => a.status === AssetStatus.MOVING).length}</span>
                        </div>
                        <button 
                            onClick={handleRouteRiskAssessment}
                            disabled={isRiskAnalyzing}
                            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {isRiskAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : <Brain size={14} />}
                            {isRiskAnalyzing ? 'Calculating Risk...' : 'Execute Risk Intel'}
                        </button>
                    </div>

                    {riskAssessment && (
                        <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles size={12} /> Strategic Insight
                             </p>
                             <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-3">"{riskAssessment}"</p>
                             <button onClick={() => setRiskAssessment(null)} className="mt-2 text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase underline">Clear</button>
                        </div>
                    )}

                    <div className="space-y-1 border-t border-slate-800 pt-4">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Telemetry Filters</p>
                        
                        <button 
                            onClick={() => setShowGeofences(!showGeofences)}
                            className={`flex items-center justify-between w-full p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-2 ${showGeofences ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'}`}
                        >
                            <span className="flex items-center gap-2"><Layers size={14} /> Geofences</span>
                            {showGeofences ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>

                        {(Object.keys(filters) as AssetCategory[]).map(cat => (
                            <button 
                                key={cat}
                                onClick={() => toggleFilter(cat)}
                                className={`flex items-center justify-between w-full p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters[cat] ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-950 text-slate-600 border border-slate-800 opacity-60'}`}
                            >
                                <span>{cat}</span>
                                {filters[cat] ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Active Asset</span>
                        <div className="flex items-center gap-2 font-black text-white text-lg tracking-tight">
                             <Truck size={18} className="text-indigo-500" /> SRC-104
                        </div>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Destination Node</span>
                        <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold">
                             <MapPin size={14} /> Ndola Hub
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase tracking-widest">
                            <Radio size={14} className="animate-pulse" /> Signal Established
                        </div>
                    </div>
                </div>
            )}

             <div className="border-t border-slate-800 pt-4 mt-4">
                <button 
                    onClick={() => setShouldFocus(true)}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 transition-all shadow-xl active:scale-95"
                >
                    <Crosshair size={14} /> Recenter
                </button>
            </div>
        </div>

        <MapContainer center={[-13.1339, 27.8493]} zoom={7} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFocus assets={visibleAssets} shouldFocus={shouldFocus} setShouldFocus={setShouldFocus} />
            
            {showGeofences && INITIAL_GEOFENCES.map(geo => (
                <Polygon 
                    key={geo.id} 
                    positions={geo.coordinates}
                    pathOptions={{ color: geo.color, fillColor: geo.color, fillOpacity: 0.15, weight: 1.5, dashArray: '5, 5' }}
                >
                    <LeafletTooltip sticky>{geo.name}</LeafletTooltip>
                </Polygon>
            ))}

            {visibleAssets.map((asset) => (
                <Marker 
                    key={asset.id} 
                    position={[asset.location.lat, asset.location.lng]}
                    icon={getIcon(asset)}
                >
                    <Popup>
                        <div className="p-1 min-w-[180px] bg-white text-slate-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                                <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600">{asset.id}</h3>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase text-white ${asset.status === AssetStatus.BREAKDOWN ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {asset.status}
                                </span>
                            </div>
                            <div className="space-y-1 text-[11px] font-medium">
                                <p className="flex items-center gap-2"><Truck size={12} className="text-slate-400" /> {asset.name}</p>
                                <p className="flex items-center gap-2"><Radio size={12} className="text-slate-400" /> {asset.driver}</p>
                                <p className="flex items-center gap-2 text-indigo-600 font-bold">
                                    <MapPin size={12} /> {asset.locationName || 'Unknown Site'}
                                </p>
                                
                                <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{width: `${asset.fuelLevel}%`}}></div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">Fuel Energy: {Math.round(asset.fuelLevel)}%</p>
                                
                                {/* Radio Only Badge in Popup */}
                                <div className="mt-3 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-2">
                                    <WifiOff size={14} className="text-amber-600" />
                                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Radio Protocol Enabled</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    </div>
  );
};

export default LiveTracking;
