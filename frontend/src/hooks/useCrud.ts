import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useCrud<T extends { id: string }>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [signal, setSignal] = useState(0);

  const reload = useCallback(() => setSignal(s => s + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(endpoint).then(r => { if (!cancelled) { setItems(r.data); setLoading(false); } }).catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [endpoint, signal]);

  const create = async (data: Partial<T>) => { await api.post(endpoint, data); reload(); };
  const update = async (id: string, data: Partial<T>) => { await api.put(`${endpoint}/${id}`, data); reload(); };
  const remove = async (id: string) => { await api.delete(`${endpoint}/${id}`); reload(); };

  return { items, loading, reload, create, update, remove, signal };
}
