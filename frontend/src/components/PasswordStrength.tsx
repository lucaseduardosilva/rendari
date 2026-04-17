import { checkPassword } from '../lib/masks';

interface Props {
  password: string;
  confirmPassword?: string;
}

export default function PasswordStrength({ password, confirmPassword }: Props) {
  const c = checkPassword(password);
  const showMatch = confirmPassword !== undefined;
  const match = showMatch && password.length > 0 && password === confirmPassword;
  const reqs: { key: string; label: string; ok: boolean }[] = [
    { key: 'length',    label: 'Mínimo 8 caracteres',    ok: c.length },
    { key: 'uppercase', label: '1 letra maiúscula',      ok: c.uppercase },
    { key: 'number',    label: '1 número',               ok: c.number },
    { key: 'special',   label: '1 caractere especial',   ok: c.special },
  ];
  if (showMatch) reqs.push({ key: 'match', label: 'As senhas coincidem', ok: match });

  const baseChecks = Object.values(c).filter(Boolean).length;
  const score = baseChecks; // 0-4
  const colors = ['var(--bad)', 'var(--bad)', 'var(--warn)', '#facc15', 'var(--good)'];
  const labels = ['—', 'Muito fraca', 'Fraca', 'Média', 'Forte'];

  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, background: i < score ? colors[score] : 'var(--bg-2)', borderRadius: 2, transition: 'background .2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
        <span style={{ color: 'var(--muted)' }}>Força:</span>
        <span style={{ color: colors[score], fontWeight: 700 }}>{labels[score]}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {reqs.map(r => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: r.ok ? 'var(--good)' : 'var(--muted)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: r.ok ? 'var(--good)' : 'transparent', border: r.ok ? 'none' : '1.5px solid var(--border-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
              {r.ok ? '✓' : ''}
            </span>
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}
