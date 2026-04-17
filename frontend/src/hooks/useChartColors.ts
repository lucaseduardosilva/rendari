import { useTheme } from '../stores/theme';

const PALETTE_DARK = ['#7aa2ff','#22c55e','#f59e0b','#ef4444','#a78bfa','#ec4899','#14b8a6','#fbbf24','#60a5fa','#34d399','#f97316','#c084fc'];
const PALETTE_LIGHT = ['#3b5bff','#15803d','#ea580c','#dc2626','#7c3aed','#db2777','#0d9488','#ca8a04','#1d4ed8','#16a34a','#c2410c','#9333ea'];

export const PALETTE = PALETTE_DARK; // export legado

export function useChartColors() {
  const t = useTheme(s => s.theme);
  const dark = t === 'dark';
  return {
    grid: dark ? '#222b3d' : '#e8eaef',
    text: dark ? '#eef2f8' : '#16181f',
    muted: dark ? '#7d8aa3' : '#5a5e6a',
    surface: dark ? '#141a25' : '#ffffff',
    primary: dark ? '#7aa2ff' : '#3b5bff',
    good: dark ? '#22c55e' : '#16a34a',
    warn: dark ? '#f59e0b' : '#ea580c',
    bad: dark ? '#ef4444' : '#dc2626',
    accent: dark ? '#a78bfa' : '#8b5cf6',
    palette: dark ? PALETTE_DARK : PALETTE_LIGHT,
  };
}
