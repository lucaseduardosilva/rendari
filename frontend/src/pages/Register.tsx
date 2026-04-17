import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const nav = useNavigate();
  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [form, setForm] = useState({
    name: '', email: '', password: '', documentNumber: '', phone: '',
    companyLegalName: '', companyTradeName: '', taxRegime: 'SIMPLES',
  });
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await api.post('/auth/register', { ...form, type });
      setSuccess(true);
      setTimeout(() => nav('/login'), 2500);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Erro no cadastro');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Conta criada! 🎉</h1>
          <p className="sub">Enviamos um email de confirmação para <strong>{form.email}</strong>. Confirme seu email para começar.</p>
          <div className="success-msg">Você será redirecionado para o login em instantes…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <div className="brand-mark">R</div>
          <span>Rendari</span>
        </div>
        <h1>Criar conta</h1>
        <p className="sub">Comece grátis em segundos</p>
        <div className="toggle-type">
          <button type="button" className={type === 'PF' ? 'active' : ''} onClick={() => setType('PF')}>Pessoa Física</button>
          <button type="button" className={type === 'PJ' ? 'active' : ''} onClick={() => setType('PJ')}>Pessoa Jurídica</button>
        </div>
        {err && <div className="error-msg">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>{type === 'PF' ? 'Nome completo' : 'Nome do responsável'}</label>
            <input value={form.name} onChange={change('name')} required />
          </div>
          {type === 'PJ' && (
            <>
              <div className="form-group">
                <label>Razão Social</label>
                <input value={form.companyLegalName} onChange={change('companyLegalName')} required />
              </div>
              <div className="row">
                <div className="form-group">
                  <label>Nome Fantasia</label>
                  <input value={form.companyTradeName} onChange={change('companyTradeName')} />
                </div>
                <div className="form-group">
                  <label>Regime Tributário</label>
                  <select value={form.taxRegime} onChange={change('taxRegime')}>
                    <option value="SIMPLES">Simples Nacional</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                    <option value="LUCRO_REAL">Lucro Real</option>
                    <option value="MEI">MEI</option>
                  </select>
                </div>
              </div>
            </>
          )}
          <div className="row">
            <div className="form-group">
              <label>{type === 'PF' ? 'CPF' : 'CNPJ'}</label>
              <input value={form.documentNumber} onChange={change('documentNumber')} required />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="tel" value={form.phone} onChange={change('phone')} placeholder="+55 11 99999-9999" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={change('email')} required />
          </div>
          <div className="form-group">
            <label>Senha (mínimo 8 caracteres)</label>
            <input type="password" minLength={8} value={form.password} onChange={change('password')} required />
          </div>
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Criando…' : 'Criar conta'}</button>
        </form>
        <div className="actions">
          <span style={{ color: 'var(--muted)' }}>Já tem conta?</span>
          <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
