import { useState, useEffect, useCallback } from 'react';
import { readBin, writeBin } from '../lib/jsonbin';

const CACHE_KEY = 'caminho-cache';
const QUEUE_KEY = 'caminho-queue';

// Validate that a bin object has all the essential fields before writing.
// This prevents a stale/corrupt local cache from destroying the real bin.
function isValidBin(data) {
  if (!data) return false;
  if (!data.pilgrim || !data.pilgrim.followToken) return false;
  if (!Array.isArray(data.stages) || data.stages.length !== 11) return false;
  if (!Array.isArray(data.journal)) return false;
  if (!Array.isArray(data.bingo)) return false;
  return true;
}

export function useCaminho() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const fresh = await readBin();
      if (isValidBin(fresh)) {
        setData(fresh);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        setError(null);
      } else {
        // Server returned invalid data — don't overwrite local cache
        throw new Error('Invalid bin structure received from server');
      }
    } catch (err) {
      // Offline fallback: use cached data if available and valid
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isValidBin(parsed)) {
          setData(parsed);
          setError('offline');
        } else {
          // Cache is also bad — clear it to force a fresh fetch next time
          localStorage.removeItem(CACHE_KEY);
          setError(err.message);
        }
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

  const update = useCallback(async (updater) => {
    const newData = updater(data);

    // Guard: refuse to write an invalid bin. This prevents a bug anywhere in
    // the app from accidentally destroying the follow token or corrupting
    // the stage list.
    if (!isValidBin(newData)) {
      console.error('Refused to write invalid bin:', newData);
      setError('invalid-write-blocked');
      return;
    }

    // Optimistic update: show the change immediately
    setData(newData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newData));

    try {
      await writeBin(newData);
      localStorage.setItem(QUEUE_KEY, '[]');
      setError(null);
    } catch (err) {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({ timestamp: Date.now(), data: newData });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setError('offline');
    }
  }, [data]);

  useEffect(() => {
    const handleOnline = () => {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (queue.length > 0) {
        const latestCache = localStorage.getItem(CACHE_KEY);
        if (latestCache) {
          const cached = JSON.parse(latestCache);
          if (isValidBin(cached)) {
            update(() => cached);
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [update]);

  return { data, loading, error, refresh, update };
}