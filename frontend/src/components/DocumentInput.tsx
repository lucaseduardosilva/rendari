import { maskCPF, maskCNPJ, unmask, isValidCPF, isValidCNPJ } from '../lib/masks';

interface Props {
  value: string;
  onChange: (v: string) => void;
  type?: 'CPF' | 'CNPJ' | 'AUTO';   // AUTO: detecta pelo tamanho dos dígitos
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showError?: boolean;               // mostrar borda vermelha se inválido
  autoFocus?: boolean;
}

/**
 * Input de CPF/CNPJ com máscara automática.
 * - type='CPF': aplica máscara 000.000.000-00 (11 dígitos)
 * - type='CNPJ': aplica máscara 00.000.000/0000-00 (14 dígitos)
 * - type='AUTO': aplica CPF até 11 dígitos, depois CNPJ
 */
export default function DocumentInput({ value, onChange, type = 'AUTO', required, placeholder, disabled, showError, autoFocus }: Props) {
  const handle = (v: string) => {
    const digits = unmask(v);
    if (type === 'CPF') return onChange(maskCPF(v));
    if (type === 'CNPJ') return onChange(maskCNPJ(v));
    // AUTO
    if (digits.length <= 11) return onChange(maskCPF(v));
    return onChange(maskCNPJ(v));
  };

  const digits = unmask(value);
  const invalid = showError && value && (
    type === 'CPF' ? !isValidCPF(value) :
    type === 'CNPJ' ? !isValidCNPJ(value) :
    digits.length === 11 ? !isValidCPF(value) :
    digits.length === 14 ? !isValidCNPJ(value) :
    digits.length > 0
  );

  const ph = placeholder || (type === 'CPF' ? '000.000.000-00' : type === 'CNPJ' ? '00.000.000/0000-00' : 'CPF ou CNPJ');

  return (
    <input
      type="text"
      value={value}
      onChange={e => handle(e.target.value)}
      placeholder={ph}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="numeric"
      maxLength={type === 'CPF' ? 14 : type === 'CNPJ' ? 18 : 18}
      style={invalid ? { borderColor: 'var(--bad)', boxShadow: '0 0 0 3px rgba(220,38,38,.12)' } : undefined}
    />
  );
}
