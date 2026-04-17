import { useEffect, useMemo } from 'react';
import { useCustomOptions } from '../stores/customOptions';
import { getScope } from '../lib/options';

/**
 * Retorna os valores combinados (defaults + customs) para um scope.
 */
export function useOptions(scope: string): string[] {
  const items = useCustomOptions(s => s.items);
  const load = useCustomOptions(s => s.load);

  useEffect(() => { load(); }, [load]);

  return useMemo(() => {
    const meta = getScope(scope);
    const defaults = meta?.defaults || [];
    const customs = items.filter(i => i.scope === scope && i.active).sort((a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value)).map(i => i.value);
    // Mantém defaults primeiro, depois customs (sem duplicar caso usuário tenha cadastrado igual a um default)
    const seen = new Set(defaults.map(d => d.toLowerCase()));
    const merged = [...defaults];
    for (const c of customs) {
      if (!seen.has(c.toLowerCase())) { merged.push(c); seen.add(c.toLowerCase()); }
    }
    return merged;
  }, [items, scope]);
}
