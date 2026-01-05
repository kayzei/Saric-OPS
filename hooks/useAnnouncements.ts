
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Announcement } from '../types';
import toast from 'react-hot-toast';

export const useAnnouncements = (isAuthenticated: boolean) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured() || !supabase) return;

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setAnnouncements(data.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          authorName: d.author_name,
          date: d.created_at
        })));
      }
    };

    fetchAnnouncements();

    const channel = supabase.channel('ops-announcements')
      .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'announcements', 
        schema: 'public' 
      }, (payload) => {
        const newAnn = {
          id: payload.new.id,
          title: payload.new.title,
          content: payload.new.content,
          authorName: payload.new.author_name,
          date: payload.new.created_at
        };
        setAnnouncements(prev => [newAnn, ...prev]);
        toast.success(`NEW BROADCAST: ${newAnn.title}`, { icon: '📢' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  return { announcements };
};
