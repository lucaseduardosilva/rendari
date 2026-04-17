import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmt, fmtDate } from '../lib/format';
import PageHead from '../components/PageHead';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';

export default function Saved() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => api.get('/finance/saved-simulations').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (id:string) => { if (!confirm('Remover?')) return; await api.delete(`/finance/saved-simulations/${id}`); load(); };

  return (
    <div>
      <PageHead title="Minhas Simulações" subtitle="Cenários salvos. Carregue, compare ou exporte."
        actions={<ExportMenu filename="minhas-simulacoes" title="Simulações Salvas" rows={items} columns={[
          {key:'name',label:'Nome'},{key:'type',label:'Tipo',format:r=>r.type==='simple'?'Simulação':'Carteira'},
          {key:'initial',label:'Inicial',format:r=>fmt(r.data.initial)},
          {key:'monthly',label:'Mensal',format:r=>fmt(r.data.monthly)},
          {key:'years',label:'Anos',format:r=>r.data.years},
          {key:'createdAt',label:'Criado em',format:r=>fmtDate(r.createdAt)},
        ]}/>}/>
      {items.length===0 ? <EmptyState title="Nenhuma simulação salva" hint="Crie no Simulador ou na Carteira Híbrida e salve com um nome."/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:12}}>
          {items.map(s=>(
            <div key={s.id} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <strong>{s.name}</strong>
                  <div style={{fontSize:11, color:'var(--muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'.05em'}}>{s.type==='simple'?'Simulação Simples':'Carteira Híbrida'}</div>
                </div>
                <button className="ghost" onClick={()=>remove(s.id)}>🗑</button>
              </div>
              <div style={{marginTop:8, fontSize:13, color:'var(--text-2)'}}>
                💰 {fmt(s.data.initial)} + {fmt(s.data.monthly)}/mês · ⏱ {s.data.years}a
              </div>
              <div style={{fontSize:11, color:'var(--muted)', marginTop:6}}>{fmtDate(s.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
