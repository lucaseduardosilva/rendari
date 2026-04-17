import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import { toast } from '../stores/toast';
import { maskCPF, maskCNPJ, maskPhone, unmask, isValidEmail, isValidCPF, isValidCNPJ, isValidPhone, isStrongPassword } from '../lib/masks';

export default function Register() {
  const nav = useNavigate();
  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    documentNumber: '', phone: '',
    companyLegalName: '', companyTradeName: '', taxRegime: 'SIMPLES',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const v = useMemo(() => ({
    email: form.email === '' || isValidEmail(form.email),
    document: form.documentNumber === '' || (type === 'PF' ? isValidCPF(form.documentNumber) : isValidCNPJ(form.documentNumber)),
    phone: form.phone === '' || isValidPhone(form.phone),
  }), [form, type]);

  const change = (k: string, val: string) => setForm({ ...form, [k]: val });
  const blur = (k: string) => setTouched({ ...touched, [k]: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação obrigatória — mostra toast pra cada campo faltando
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Nome');
    if (type === 'PJ' && !form.companyLegalName.trim()) missing.push('Razão Social');
    if (!form.documentNumber.trim()) missing.push(type === 'PF' ? 'CPF' : 'CNPJ');
    if (!form.phone.trim()) missing.push('Telefone');
    if (!form.email.trim()) missing.push('Email');
    if (!form.password) missing.push('Senha');
    if (!form.confirmPassword) missing.push('Confirmar senha');

    if (missing.length > 0) {
      toast(`Preencha: ${missing.join(', ')}`, 'warn', 4000);
      return;
    }

    if (!isValidEmail(form.email)) { toast('Email inválido', 'error'); return; }
    if (type === 'PF' && !isValidCPF(form.documentNumber)) { toast('CPF inválido', 'error'); return; }
    if (type === 'PJ' && !isValidCNPJ(form.documentNumber)) { toast('CNPJ inválido', 'error'); return; }
    if (!isValidPhone(form.phone)) { toast('Telefone inválido', 'error'); return; }
    if (!isStrongPassword(form.password)) { toast('A senha não atende aos requisitos (8+, maiúscula, número, especial)', 'error', 5000); return; }
    if (form.password !== form.confirmPassword) { toast('As senhas não coincidem', 'error'); return; }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        type,
        documentNumber: unmask(form.documentNumber),
        phone: unmask(form.phone),
        ...(type === 'PJ' ? {
          companyLegalName: form.companyLegalName,
          companyTradeName: form.companyTradeName,
          taxRegime: form.taxRegime,
        } : {}),
      });
      toast('Conta criada! Verifique seu email.', 'success', 4000);
      setSuccess(true);
      setTimeout(() => nav('/login'), 2500);
    } catch (e: any) {
      toast(e.response?.data?.error || 'Erro no cadastro', 'error');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Conta criada! 🎉</h1>
          <p className="sub">Enviamos um email de confirmação para <strong>{form.email}</strong>.</p>
          <div className="success-msg">Você será redirecionado para o login em instantes…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
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

        <form onSubmit={submit} noValidate>
          <Field label={type === 'PF' ? 'Nome completo' : 'Nome do responsável'}>
            <input value={form.name} onChange={e => change('name', e.target.value)} />
          </Field>

          {type === 'PJ' && (
            <>
              <Field label="Razão Social"><input value={form.companyLegalName} onChange={e => change('companyLegalName', e.target.value)} /></Field>
              <div className="row">
                <Field label="Nome Fantasia"><input value={form.companyTradeName} onChange={e => change('companyTradeName', e.target.value)} /></Field>
                <Field label="Regime Tributário">
                  <select value={form.taxRegime} onChange={e => change('taxRegime', e.target.value)}>
                    <option value="SIMPLES">Simples Nacional</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                    <option value="LUCRO_REAL">Lucro Real</option>
                    <option value="MEI">MEI</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          <div className="row">
            <Field label={type === 'PF' ? 'CPF' : 'CNPJ'} error={touched.documentNumber && form.documentNumber && !v.document ? `${type === 'PF' ? 'CPF' : 'CNPJ'} inválido` : undefined}>
              <input
                value={form.documentNumber}
                onChange={e => change('documentNumber', type === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value))}
                onBlur={() => blur('documentNumber')}
                placeholder={type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
            </Field>
            <Field label="Telefone" error={touched.phone && form.phone && !v.phone ? 'Telefone inválido' : undefined}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => change('phone', maskPhone(e.target.value))}
                onBlur={() => blur('phone')}
                placeholder="(11) 99999-9999"
              />
            </Field>
          </div>

          <Field label="Email" error={touched.email && form.email && !v.email ? 'Email inválido' : undefined}>
            <input
              type="email"
              value={form.email}
              onChange={e => change('email', e.target.value)}
              onBlur={() => blur('email')}
            />
          </Field>

          <Field label="Senha">
            <PasswordInput value={form.password} onChange={v => change('password', v)} minLength={8} />
          </Field>

          <Field label="Confirmar senha">
            <PasswordInput value={form.confirmPassword} onChange={v => change('confirmPassword', v)} minLength={8} />
          </Field>

          {(form.password.length > 0 || form.confirmPassword.length > 0) && (
            <PasswordStrength password={form.password} confirmPassword={form.confirmPassword} />
          )}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <div className="actions" style={{ justifyContent: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-2)' }}>Já tem conta? <strong style={{ color: 'var(--primary)' }}>Entrar</strong></Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {error && <span style={{ color: 'var(--bad)', fontSize: 10, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>{error}</span>}
      </label>
      {children}
    </div>
  );
}
