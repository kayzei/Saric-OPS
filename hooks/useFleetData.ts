
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Asset, AssetStatus } from '../types';
import { INITIAL_ASSETS } from '../constants';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

const mapDbAsset = (d: any): Asset => ({
  id: d.id,
  name: d.name,
  category: d.category,
  driver: d.driver_name,
  status: (d.status as AssetStatus) || AssetStatus.IDLE,
  location: { lat: d.lat || 0, lng: d.lng || 0 },
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

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !isAuthenticated) return;
    
    try {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAssets(data.map(mapDbAsset));
      }
    } catch (err: any) {
      console.warn("Fleet telemetry sync deferred.");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
    
    // Real-time Telemetry Subscription
    if (supabase) {
        const channel = supabase.channel('fleet-telemetry')
          .on('postgres_changes', { 
            event: '*', 
            table: 'assets', 
            schema: 'public' 
          }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setAssets(prev => [...prev, mapDbAsset(payload.new)]);
            } else if (payload.eventType === 'UPDATE') {
              setAssets(prev => prev.map(a => a.id === payload.new.id ? mapDbAsset(payload.new) : a));
              
              // Alert on critical events like breakdowns
              if (payload.new.status === 'BREAKDOWN' && payload.old.status !== 'BREAKDOWN') {
                toast.error(`ALERT: Unit ${payload.new.id} reported a breakdown at ${payload.new.location_name}`, { duration: 6000 });
              }
            } else if (payload.eventType === 'DELETE') {
              setAssets(prev => prev.filter(a => a.id !== payload.old.id));
            }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }
  }, [isAuthenticated, fetchData]);

  const updateAsset = async (updatedAsset: Asset) => {
    // Optimistic Update
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    try {
      await dbService.updateAsset(updatedAsset);
    } catch (error: any) {
      toast.error("Telemetry uplink failure: Queued.");
    }
  };

  return { assets, updateAsset, isLoading };
};
