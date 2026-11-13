import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

/**
 * Online/offline status + replay of unsynced edits.
 * Same localStorage key (agilitylap_offline_queue), same table and upsert payload as before.
 * The queue is only cleared after EVERY item synced without error.
 */
export function useOfflineSync(handleToast) {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState('synced');

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('agilitylap_offline_queue') || '[]');
    if (queue.length === 0) {
      setSyncStatus('synced');
      return;
    }
    setSyncStatus('syncing');
    let hasError = false;
    for (const item of queue) {
      try {
        const { error } = await supabase.from('agilitylap_workouts').upsert({
          athlete_id: item.athlete_id,
          workout_date: item.workout_date,
          workout_title: item.workout_title,
          drills: item.drills,
          is_completed: item.is_completed || false
        }, { onConflict: 'athlete_id,workout_date' });
        if (error) hasError = true;
      } catch {
        hasError = true;
      }
    }
    if (!hasError) {
      localStorage.setItem('agilitylap_offline_queue', '[]');
      setSyncStatus('synced');
      handleToast('Offline changes synced successfully!');
    } else {
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const handleOffline = () => { setIsOnline(false); setSyncStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncOfflineQueue();
    else setSyncStatus('offline');
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // Runs once on mount, exactly like before.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, setIsOnline, syncStatus, setSyncStatus };
}
