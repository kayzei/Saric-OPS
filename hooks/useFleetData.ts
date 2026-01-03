import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Asset, AssetStatus } from '../types';
import { INITIAL_ASSETS } from '../constants';
import toast from 'react-hot-toast';

const mapDbAsset = (d: any): Asset => ({
  id: d.id,
  name: d.name,
  category: d.category,
  driver: d.driver_name,
  status: d.status as AssetStatus,
  location: { lat: d.lat, lng: d.lng },
  locationName: d.location_name,
  destination: { lat: d.dest_lat || 0, lng: d.dest_lng || 0 },
  cargoType: d.cargo_type,
  speed: d.speed || 0,
  fuelLevel: d.fuel_level || 0,
  revenueMonthToDate: d.revenue_mtd,
  costMonthToDate: d.cost_mtd,
  co2Emissions: d.co2_emissions
});

export const useFleetData = (isAuthenticated: boolean) => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !isAuthenticated) {
        setIsSimulationMode(true);
        setAssets(INITIAL_ASSETS);
        return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAssets(data.map(mapDbAsset));
        setIsSimulationMode(false);
      } else {
        setAssets(INITIAL_ASSETS);
      }
    } catch (err: any) {
      if (err.message?.includes('fetch')) {
        console.warn("Vanguard Hub Unreachable: Switching to local simulation.");
      }
      setIsSimulationMode(true);
      setAssets(INITIAL_ASSETS);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();
    
    if (isSupabaseConfigured() && supabase && !isSimulationMode) {
      try {
          const channel = supabase
            .channel('live-fleet-updates')
            .on(
              'postgres_changes', 
              { event: '*', table: 'assets', schema: 'public' }, 
              (payload) => {
                if (payload.eventType === 'UPDATE') {
                  setAssets(current => current.map(asset => 
                    asset.id === payload.new.id ? mapDbAsset(payload.new) : asset
                  ));
                } else if (payload.eventType === 'INSERT') {
                  setAssets(current => [...current, mapDbAsset(payload.new)]);
                } else if (payload.eventType === 'DELETE') {
                  setAssets(current => current.filter(asset => asset.id !== payload.old.id));
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
      } catch (e) {
          console.warn("Realtime sync unavailable.");
      }
    }
  }, [isAuthenticated, fetchData, isSimulationMode]);

  const updateAsset = async (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    
    if (isSupabaseConfigured() && supabase && !isSimulationMode) {
      try {
          const { error } = await supabase
            .from('assets')
            .update({
              name: updatedAsset.name,
              status: updatedAsset.status,
              location_name: updatedAsset.locationName,
              driver_name: updatedAsset.driver,
              lat: updatedAsset.location.lat,
              lng: updatedAsset.location.lng,
              speed: updatedAsset.speed,
              fuel_level: updatedAsset.fuelLevel
            })
            .eq('id', updatedAsset.id);
          
          if (error) throw error;
      } catch (error: any) {
        toast.error("Cloud Sync Suspended");
      }
    }
  };

  return { assets, updateAsset, isLoading, isSimulationMode };
};
