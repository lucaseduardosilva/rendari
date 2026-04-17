// Máscaras para inputs brasileiros

export function maskCPF(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCNPJ(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function unmask(v: string): string {
  return v.replace(/\D/g, '');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidCPF(cpf: string): boolean {
  const c = unmask(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

export function isValidCNPJ(cnpj: string): boolean {
  const c = unmask(cnpj);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (size: number) => {
    let sum = 0, pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(c[size - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13]);
}

export function isValidPhone(phone: string): boolean {
  const d = unmask(phone);
  return d.length === 10 || d.length === 11;
}

export interface PasswordChecks {
  length: boolean;     // ≥ 8
  uppercase: boolean;  // 1 maiúscula
  number: boolean;     // 1 número
  special: boolean;    // 1 caractere especial
}

export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function isStrongPassword(pw: string): boolean {
  const c = checkPassword(pw);
  return c.length && c.uppercase && c.number && c.special;
}
