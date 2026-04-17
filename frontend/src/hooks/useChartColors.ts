import { useTheme } from '../stores/theme';

export const PALETTE = ['#7aa2ff','#22c55e','#f59e0b','#ef4444','#a78bfa','#ec4899','#14b8a6','#fbbf24','#60a5fa','#34d399','#f97316','#c084fc'];

export function useChartColors() {
  const t = useTheme(s => s.theme);
  const dark = t === 'dark';
  return {
    grid: dark ? '#222b3d' : '#e2e8f0',
    text: dark ? '#eef2f8' : '#0f172a',
    muted: dark ? '#7d8aa3' : '#64748b',
    surface: dark ? '#141a25' : '#ffffff',
    primary: dark ? '#7aa2ff' : '#3d6fd8',
    good: dark ? '#22c55e' : '#16a34a',
    warn: dark ? '#f59e0b' : '#d97706',
    bad: dark ? '#ef4444' : '#dc2626',
    accent: dark ? '#a78bfa' : '#7c3aed',
    palette: PALETTE,
  };
}
