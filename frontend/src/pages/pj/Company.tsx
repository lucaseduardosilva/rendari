import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import PageHead from '../../components/PageHead';
import SubmitButton from '../../components/SubmitButton';
import DocumentInput from '../../components/DocumentInput';
import { useAsync } from '../../hooks/useAsync';
import { toast } from '../../stores/toast';
import { maskCNPJ, maskPhone, unmask, isValidCNPJ } from '../../lib/masks';

const REGIMES = [
  { v: 'SIMPLES', l: 'Simples Nacional' },
  { v: 'LUCRO_PRESUMIDO', l: 'Lucro Presumido' },
  { v: 'LUCRO_REAL', l: 'Lucro Real' },
  { v: 'MEI', l: 'MEI' },
] as const;

export default function Company() {
  const [form, setForm] = useState<any>({
    legalName: '', tradeName: '', cnpj: '', taxRegime: 'SIMPLES',
    stateReg: '', municipalReg: '', address: '', city: '', state: '', zipCode: '',
    foundedAt: '', phone: '', website: '',
  });
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/company').then(({ data }) => {
      if (data) {
        setExists(true);
        setForm({
          ...data,
          cnpj: maskCNPJ(data.cnpj || ''),
          phone: data.phone ? maskPhone(data.phone) : '',
          foundedAt: data.foundedAt ? data.foundedAt.slice(0, 10) : '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveAction = useAsync(async (payload: any) => {
    await api.put('/user/company', payload);
  }, { successMsg: exists ? 'Empresa atualizada' : 'Empresa cadastrada — recarregue para liberar as telas PJ' });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.legalName?.trim()) { toast('Informe a Razão Social', 'warn'); return; }
    if (!isValidCNPJ(form.cnpj)) { toast('CNPJ inválido', 'error'); return; }

    const payload = {
      ...form,
      cnpj: unmask(form.cnpj),
      phone: form.phone ? unmask(form.phone) : null,
      foundedAt: form.foundedAt ? new Date(form.foundedAt).toISOString() : null,
    };
    const ok = await saveAction.run(payload);
    if (ok && !exists) {
      // Primeira criação — recarrega pra liberar páginas PJ
      setTimeout(() => location.reload(), 1500);
    }
  };

  if (loading) return <div className="card">Carregando…</div>;

  return (
    <div>
      <PageHead title="Dados da Empresa" subtitle={exists ? 'Atualize os dados cadastrais da sua empresa.' : 'Cadastre sua empresa para liberar as telas PJ (DRE, Folha, Notas Fiscais, etc).'}/>

      {!exists && (
        <div className="info-box" style={{ marginBottom: 14 }}>
          ⚠ Você ainda não cadastrou os dados da empresa. Sem isso as páginas <strong>Notas Fiscais, Funcionários, Folha de Pagamento, Centros de Custo, Departamentos, DRE e Fluxo de Caixa</strong> não funcionam.
        </div>
      )}

      <div className="card">
        <form onSubmit={save}>
          <SectionTitle>Identificação</SectionTitle>
          <div className="row">
            <div className="form-group"><label>Razão Social *</label>
              <input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} required placeholder="Ex: Lucas Eduardo Comercial LTDA"/>
            </div>
            <div className="form-group"><label>Nome Fantasia</label>
              <input value={form.tradeName || ''} onChange={e => setForm({ ...form, tradeName: e.target.value })} placeholder="Ex: Lucas Comercial"/>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>CNPJ *</label>
              <DocumentInput type="CNPJ" value={form.cnpj} onChange={v => setForm({ ...form, cnpj: v })} required showError/>
            </div>
            <div className="form-group"><label>Regime Tributário *</label>
              <select value={form.taxRegime} onChange={e => setForm({ ...form, taxRegime: e.target.value })}>
                {REGIMES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>Inscrição Estadual</label>
              <input value={form.stateReg || ''} onChange={e => setForm({ ...form, stateReg: e.target.value })}/>
            </div>
            <div className="form-group"><label>Inscrição Municipal</label>
              <input value={form.municipalReg || ''} onChange={e => setForm({ ...form, municipalReg: e.target.value })}/>
            </div>
          </div>

          <SectionTitle>Endereço</SectionTitle>
          <div className="form-group"><label>Endereço completo</label>
            <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, complemento, bairro"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px', gap: 8 }}>
            <div className="form-group"><label>Cidade</label>
              <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })}/>
            </div>
            <div className="form-group"><label>UF</label>
              <input value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2}/>
            </div>
            <div className="form-group"><label>CEP</label>
              <input value={form.zipCode || ''} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="00000-000"/>
            </div>
          </div>

          <SectionTitle>Contato</SectionTitle>
          <div className="row">
            <div className="form-group"><label>Telefone</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: maskPhone(e.target.value) })} placeholder="(11) 99999-9999"/>
            </div>
            <div className="form-group"><label>Website</label>
              <input value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://"/>
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 220 }}><label>Data de Fundação</label>
            <input type="date" value={form.foundedAt || ''} onChange={e => setForm({ ...form, foundedAt: e.target.value })}/>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <SubmitButton type="submit" loading={saveAction.loading} style={{ width: 'auto', minWidth: 200 }}>
              {exists ? 'Salvar alterações' : 'Cadastrar empresa'}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 8, marginTop: 14, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}
