import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      nav('/login?reset=ok');
    } catch (e: any) { setErr(e.response?.data?.error || 'Erro'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Nova senha</h1>
        <p className="sub">Defina uma senha forte</p>
        {err && <div className="error-msg">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nova senha (mín 8)</label>
            <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Salvando…' : 'Redefinir'}</button>
        </form>
        <div className="actions"><Link to="/login">Voltar</Link></div>
      </div>
    </div>
  );
}
