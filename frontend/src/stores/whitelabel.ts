import { create } from 'zustand';

interface Whitelabel {
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  paletteDark?: Record<string, string>;
  paletteLight?: Record<string, string>;
}

interface WlState {
  wl: Whitelabel;
  apply: (wl: Whitelabel) => void;
  reset: () => void;
}

const DEFAULT_FAVICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%23000000'/><text x='32' y='46' font-family='Cinzel,Trajan Pro,serif' font-size='44' font-weight='800' text-anchor='middle' fill='%23b8860b'>R</text></svg>";
const DEFAULT_TITLE = 'Rendari · Gestão Financeira e Investimentos';

// Lista de variáveis CSS que o whitelabel pode sobrescrever — devem ser limpas no reset
const WL_VARS = ['primary','primary-2','primary2','primary-3','accent','good','bad','warn','bg','bg-elev','bg-2','surface','surface-2','text','text-2','muted','border'];

function applyPalette(palette: Record<string, string> | undefined, theme: 'dark' | 'light') {
  if (!palette) return;
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== theme) return;
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
}

function clearPalette() {
  const root = document.documentElement;
  WL_VARS.forEach(v => root.style.removeProperty(`--${v}`));
}

function applyFavicon(url?: string) {
  const link = document.getElementById('app-favicon') as HTMLLinkElement | null;
  if (link) link.href = url || DEFAULT_FAVICON;
}

function applyTitle(name?: string) {
  document.title = name ? `${name} · Gestão Financeira` : DEFAULT_TITLE;
}

export const useWhitelabel = create<WlState>((set) => ({
  wl: {},
  apply: (wl) => {
    // Limpa antes de aplicar para evitar resíduos da paleta anterior
    clearPalette();
    applyPalette(wl.paletteDark, 'dark');
    applyPalette(wl.paletteLight, 'light');
    applyFavicon(wl.faviconUrl);
    applyTitle(wl.brandName);
    set({ wl });
  },
  reset: () => {
    clearPalette();
    applyFavicon(undefined);
    applyTitle(undefined);
    set({ wl: {} });
  },
}));
