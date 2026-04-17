import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password',
        mode === 'email' ? { email, channel: 'email' } : { phone, channel });
      setDone(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Recuperar senha</h1>
        <p className="sub">Receba um link/código para redefinir</p>
        {done ? (
          <div className="success-msg">Se a conta existir, enviaremos as instruções por {mode === 'email' ? 'email' : channel}.</div>
        ) : (
          <>
            <div className="toggle-type">
              <button type="button" className={mode === 'email' ? 'active' : ''} onClick={() => setMode('email')}>Email</button>
              <button type="button" className={mode === 'phone' ? 'active' : ''} onClick={() => setMode('phone')}>Telefone</button>
            </div>
            <form onSubmit={submit}>
              {mode === 'email' ? (
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Canal</label>
                    <select value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </>
              )}
              <button type="submit" className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar instruções'}</button>
            </form>
          </>
        )}
        <div className="actions">
          <Link to="/login">← Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
