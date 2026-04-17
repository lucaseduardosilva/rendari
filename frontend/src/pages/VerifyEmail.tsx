import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'err'>('loading');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!token) { setStatus('err'); setMsg('Token ausente'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('ok'))
      .catch((e) => { setStatus('err'); setMsg(e.response?.data?.error || 'Falha ao verificar'); });
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && <p>Verificando…</p>}
        {status === 'ok' && (
          <>
            <h1>Email confirmado ✓</h1>
            <p className="sub">Sua conta está pronta para uso</p>
            <Link to="/login"><button className="primary" style={{ marginTop: 12 }}>Fazer login</button></Link>
          </>
        )}
        {status === 'err' && (
          <>
            <h1>Erro</h1>
            <div className="error-msg">{msg}</div>
            <Link to="/login">Voltar</Link>
          </>
        )}
      </div>
    </div>
  );
}
