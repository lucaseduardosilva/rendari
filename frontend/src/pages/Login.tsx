import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data);
      nav(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Erro ao entrar');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <div className="brand-mark">R</div>
          <span>Rendari</span>
        </div>
        <h1>Entrar</h1>
        <p className="sub">Bem-vindo de volta</p>
        {err && <div className="error-msg">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <div className="actions">
          <Link to="/forgot-password">Esqueci a senha</Link>
          <Link to="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
