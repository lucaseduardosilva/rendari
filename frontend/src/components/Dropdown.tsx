import { ReactNode, useState, useRef, useEffect, useLayoutEffect } from 'react';

export interface DropdownItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface Props {
  trigger?: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: number;
}

export default function Dropdown({ trigger, items, align = 'right', width = 220 }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const calc = () => {
      const rect = btnRef.current!.getBoundingClientRect();
      const menuH = menuRef.current?.offsetHeight || items.length * 36 + 8;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Vertical: abre pra baixo se couber, senão pra cima
      let top = rect.bottom + 4;
      if (top + menuH > vh - 8) top = Math.max(8, rect.top - menuH - 4);
      // Horizontal
      let left = align === 'right' ? rect.right - width : rect.left;
      if (left + width > vw - 8) left = vw - width - 8;
      if (left < 8) left = 8;
      setPos({ top, left });
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc, true);
      window.removeEventListener('resize', calc);
    };
  }, [open, align, width, items.length]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(v => !v)} style={trigger ? { background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' } : triggerBtn}>
        {trigger || <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--muted)' }}>⋯</span>}
      </button>
      {open && pos && (
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, width,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: 'var(--shadow-lg)', padding: 4, zIndex: 9999,
        }}>
          {items.map((it, i) => it.divider ? (
            <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          ) : (
            <button
              key={i}
              onClick={() => { if (!it.disabled) { it.onClick(); setOpen(false); } }}
              disabled={it.disabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: 'transparent', border: 0, width: '100%', textAlign: 'left',
                cursor: it.disabled ? 'not-allowed' : 'pointer',
                color: it.disabled ? 'var(--muted-2)' : it.danger ? 'var(--bad)' : 'var(--text-2)',
                borderRadius: 6, fontFamily: 'inherit', fontSize: 13, opacity: it.disabled ? .55 : 1,
              }}
              onMouseEnter={(e) => !it.disabled && (e.currentTarget.style.background = it.danger ? 'rgba(239,68,68,.08)' : 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {it.icon && <span style={{ width: 16, fontSize: 14, color: it.danger ? 'var(--bad)' : 'var(--muted)' }}>{it.icon}</span>}
              <span style={{ flex: 1 }}>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const triggerBtn: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6,
  padding: '4px 10px', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, minWidth: 30, justifyContent: 'center',
};
