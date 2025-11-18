import { useState, useEffect, useRef } from 'react';
import { Asset, AssetStatus } from '../types';
import { INITIAL_ASSETS } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';
import toast from 'react-hot-toast';

export const useFleetSimulation = (isAuthenticated: boolean) => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const { addNotification } = useNotifications();
  const prevAssetsRef = useRef<Asset[]>(INITIAL_ASSETS);

  useEffect(() => {
    if (!isAuthenticated) return;

    const simulationInterval = setInterval(() => {
      setAssets(prevAssets => {
        const newAssets = prevAssets.map(asset => {
          if (asset.status !== AssetStatus.MOVING) return asset;

          // Simulate simple movement towards destination
          const latDiff = asset.destination.lat - asset.location.lat;
          const lngDiff = asset.destination.lng - asset.location.lng;
          
          // Move 1% of the distance per tick
          const newLat = asset.location.lat + (latDiff * 0.01);
          const newLng = asset.location.lng + (lngDiff * 0.01);

          // Random fuel consumption
          const newFuel = Math.max(0, asset.fuelLevel - (Math.random() * 0.2));

          // Random Breakdown Chance (very low probability per tick)
          const isBreakdown = Math.random() > 0.995; 
          
          if (isBreakdown && asset.status !== AssetStatus.BREAKDOWN) {
             return { ...asset, status: AssetStatus.BREAKDOWN, speed: 0 };
          }

          return {
            ...asset,
            location: { lat: newLat, lng: newLng },
            fuelLevel: newFuel
          };
        });
        return newAssets;
      });
    }, 2000);

    return () => clearInterval(simulationInterval);
  }, [isAuthenticated]);

  // Monitor changes for alerts
  useEffect(() => {
    assets.forEach(asset => {
        const prevAsset = prevAssetsRef.current.find(a => a.id === asset.id);
        
        // Breakdown Alert
        if (prevAsset && prevAsset.status !== AssetStatus.BREAKDOWN && asset.status === AssetStatus.BREAKDOWN) {
            const msg = `Vehicle ${asset.name} (${asset.id}) has broken down near ${asset.location.lat.toFixed(2)}, ${asset.location.lng.toFixed(2)}`;
            
            // Add to system notifications
            addNotification({
                title: 'Asset Breakdown',
                message: msg,
                type: 'error'
            });

            // Show immediate toast
            toast.error(msg, { duration: 5000 });
        }

        // Low Fuel Alert
        if (prevAsset && prevAsset.fuelLevel > 15 && asset.fuelLevel <= 15) {
             addNotification({
                title: 'Low Fuel Warning',
                message: `${asset.name} is running low on fuel (${Math.round(asset.fuelLevel)}%)`,
                type: 'warning'
            });
        }
    });
    prevAssetsRef.current = assets;
  }, [assets, addNotification]);

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    toast.success(`Asset ${updatedAsset.id} updated successfully`);
  };

  return { assets, updateAsset };
};