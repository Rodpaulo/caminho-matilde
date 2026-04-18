import { useState, useEffect, useCallback } from 'react';
import { readBin, writeBin } from '../lib/jsonbin';

const CACHE_KEY = 'caminho-cache';
const QUEUE_KEY = 'caminho-queue';

export function useCaminho() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const fresh = await readBin();
      setData(fresh);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      setError(null);
    } catch (err) {
      // Offline fallback: use cached data if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setError('offline');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Update data and sync to JSONBin
  // If offline, queue it; the next successful write flushes the queue
  const update = useCallback(async (updater) => {
    // updater is a function that takes current data and returns new data
    const newData = updater(data);
    // Optimistic update: show the change immediately
    setData(newData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newData));

    try {
      await writeBin(newData);
      // Clear any pending queued writes — this one superseded them
      localStorage.setItem(QUEUE_KEY, '[]');
      setError(null);
    } catch (err) {
      // Offline: queue the latest state
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({ timestamp: Date.now(), data: newData });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setError('offline');
    }
  }, [data]);

  // Auto-flush the queue when the browser regains network connection
  useEffect(() => {
    const handleOnline = () => {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (queue.length > 0) {
        const latestCache = localStorage.getItem(CACHE_KEY);
        if (latestCache) {
          const cached = JSON.parse(latestCache);
          // Push the latest cached state up to JSONBin
          update(() => cached);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [update]);

  return { data, loading, error, refresh, update };
}