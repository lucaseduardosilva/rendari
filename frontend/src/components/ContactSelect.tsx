import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { maskCPF, maskCNPJ, unmask } from '../lib/masks';

export interface ContactLite {
  id: string; name: string; tradeName?: string; document?: string; type?: string;
}

interface Props {
  /** Valor atual do nome (controlado externamente) */
  name: string;
  /** Documento (CPF/CNPJ sem máscara) */
  doc?: string;
  /** Callback quando seleciona/digita */
  onChange: (data: { name: string; document?: string; contactId?: string }) => void;
  /** Filtro por tipo (opcional): só clientes, fornecedores, ou ambos */
  filterType?: 'CLIENT' | 'SUPPLIER' | 'ALL';
  placeholder?: string;
  required?: boolean;
}

function fmtDoc(d?: string) {
  if (!d) return '';
  const digits = unmask(d);
  return digits.length === 11 ? maskCPF(digits) : digits.length === 14 ? maskCNPJ(digits) : d;
}

export default function ContactSelect({ name, doc, onChange, filterType = 'ALL', placeholder = 'Buscar ou digitar nome…', required }: Props) {
  const [contacts, setContacts] = useState<ContactLite[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(name);
  const ref = useRef<HTMLDivElement>(null);

  // Sincroniza query quando o nome muda externamente
  useEffect(() => { setQuery(name); }, [name]);

  useEffect(() => {
    api.get('/user/contacts').then(r => setContacts(r.data)).catch(() => setContacts([]));
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = contacts.filter(c => {
    if (filterType !== 'ALL' && c.type !== filterType && c.type !== 'BOTH') return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q)
        || (c.tradeName || '').toLowerCase().includes(q)
        || (c.document || '').includes(unmask(query));
  }).slice(0, 8);

  const select = (c: ContactLite) => {
    onChange({ name: c.name, document: c.document || '', contactId: c.id });
    setQuery(c.name);
    setOpen(false);
  };

  const handleType = (v: string) => {
    setQuery(v);
    onChange({ name: v, document: doc });
    if (!open) setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => handleType(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-lg)', zIndex: 100, maxHeight: 260, overflowY: 'auto',
        }}>
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 12px', background: 'transparent', border: 0,
                borderBottom: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, color: 'var(--text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                {c.tradeName && <span>{c.tradeName}</span>}
                {c.document && <span style={{ fontFamily: 'JetBrains Mono,monospace' }}>{fmtDoc(c.document)}</span>}
                {c.type && <span style={{ padding: '1px 6px', borderRadius: 4, background: 'var(--surface-2)' }}>{c.type === 'CLIENT' ? 'Cliente' : c.type === 'SUPPLIER' ? 'Fornec.' : 'Ambos'}</span>}
              </div>
            </button>
          ))}
          {query && !filtered.some(c => c.name.toLowerCase() === query.toLowerCase()) && (
            <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', textAlign: 'center', background: 'var(--surface-2)' }}>
              Não encontrou? Digite o nome livremente — vai gravar como avulso.
            </div>
          )}
        </div>
      )}
      {open && filtered.length === 0 && contacts.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '10px 12px', fontSize: 12, color: 'var(--muted)', zIndex: 100,
          boxShadow: 'var(--shadow)',
        }}>
          Nenhum contato cadastrado. Vá em <a href="/contacts" target="_blank" style={{ color: 'var(--primary)' }}>Contatos</a> para cadastrar.
        </div>
      )}
    </div>
  );
}
