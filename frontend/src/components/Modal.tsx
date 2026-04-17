import { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 500 }: Props) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(4px)', zIndex:90, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24, width:'100%', maxWidth:width, boxShadow:'var(--shadow-lg)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'transparent', border:0, color:'var(--muted)', cursor:'pointer', fontSize:22, lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
