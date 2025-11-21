import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { Truck, Eye, EyeOff, Layers, Crosshair, Navigation } from 'lucide-react';
import { INITIAL_GEOFENCES } from '../constants';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for status
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

interface LiveTrackingProps {
  assets: Asset[];
}

// Component to center map on bounds
// We only run this when `shouldFocus` is true to prevent map jumping while user is panning
const MapFocus: React.FC<{ assets: Asset[], shouldFocus: boolean, setShouldFocus: (v: boolean) => void }> = ({ assets, shouldFocus, setShouldFocus }) => {
    const map = useMap();
    
    useEffect(() => {
        if (shouldFocus && assets.length > 0) {
            const bounds = L.latLngBounds(assets.map(a => [a.location.lat, a.location.lng]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
                setShouldFocus(false); // Disable auto-focus after execution so user can pan freely
            }
        }
    }, [assets, map, shouldFocus, setShouldFocus]);
    
    return null;
};

const LiveTracking: React.FC<LiveTrackingProps> = ({ assets }) => {
  const [filters, setFilters] = useState<{ [key in AssetCategory]: boolean }>({
      'Heavy Transport': true,
      'Shuttle': true,
      'Construction': true,
      'Support': true
  });
  const [showGeofences, setShowGeofences] = useState(true);
  const [shouldFocus, setShouldFocus] = useState(true);

  const toggleFilter = (category: AssetCategory) => {
      setFilters(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const visibleAssets = assets.filter(a => filters[a.category]);

  const getIcon = (asset: Asset) => {
      if (asset.status === AssetStatus.BREAKDOWN) return errorIcon;
      if (asset.category === 'Shuttle') return shuttleIcon;
      if (asset.category === 'Construction') return constructionIcon;
      return movingIcon;
  };

  return (
    <div className="relative z-0" style={{ height: 'calc(100vh - 64px)' }}>
        {/* HUD Panel */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl max-w-xs border border-slate-200">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider mb-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Operations Center
            </h2>
            
            <div className="space-y-2 mb-4">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Active Units</span>
                    <span className="font-mono font-bold">{assets.filter(a => a.status === AssetStatus.MOVING).length}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Alerts</span>
                    <span className="font-mono font-bold text-red-500">{assets.filter(a => a.status === AssetStatus.BREAKDOWN).length}</span>
                 </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Layer Controls</p>
                
                <button 
                    onClick={() => setShowGeofences(!showGeofences)}
                    className={`flex items-center justify-between w-full p-2 rounded text-xs font-medium transition-colors mb-2 ${showGeofences ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}
                >
                    <span className="flex items-center gap-2"><Layers size={14} /> Geofences</span>
                    {showGeofences ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {(Object.keys(filters) as AssetCategory[]).map(cat => (
                    <button 
                        key={cat}
                        onClick={() => toggleFilter(cat)}
                        className={`flex items-center justify-between w-full p-2 rounded text-xs font-medium transition-colors ${filters[cat] ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400 opacity-60'}`}
                    >
                        <span>{cat}</span>
                        {filters[cat] ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                ))}
            </div>

             <div className="border-t border-slate-100 pt-3 mt-2">
                <button 
                    onClick={() => setShouldFocus(true)}
                    className="flex items-center justify-center gap-2 w-full p-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-md"
                >
                    <Crosshair size={14} /> Recenter Map
                </button>
            </div>