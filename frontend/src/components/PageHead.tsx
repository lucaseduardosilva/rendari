import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHead({ title, subtitle, actions }: Props) {
  return (
    <div className="page-head" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:18 }}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>{actions}</div>}
    </div>
  );
}
