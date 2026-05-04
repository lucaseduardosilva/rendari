import { useCallback, useState } from 'react';
import { toast } from '../stores/toast';

interface AsyncOpts {
  successMsg?: string;
  errorMsg?: string;
  onSuccess?: (result: any) => void;
  onError?: (err: any) => void;
}

/**
 * Wrapper para chamadas assíncronas (saves, deletes) com:
 * - estado de loading
 * - try/catch automático
 * - toast de sucesso/erro
 *
 * `run(...)` retorna `true` em sucesso e `false` em erro.
 */
export function useAsync<TArgs extends any[]>(
  fn: (...args: TArgs) => Promise<any>,
  opts: AsyncOpts = {}
) {
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (...args: TArgs): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await fn(...args);
      if (opts.successMsg) toast(opts.successMsg, 'success');
      opts.onSuccess?.(result);
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.error || opts.errorMsg || e?.message || 'Erro inesperado';
      toast(msg, 'error', 5000);
      opts.onError?.(e);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { run, loading };
}
