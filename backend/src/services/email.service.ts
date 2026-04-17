import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'Rendari <noreply@rendari.com.br>';

let transporter: nodemailer.Transporter | null = null;

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, html: string, text?: string) {
  if (!transporter) {
    console.log('[EMAIL DEV MODE]', { to, subject, html });
    return { mocked: true };
  }
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return info;
}

export function tplVerifyEmail(name: string, link: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f6f8fc">
      <h2 style="color:#0f172a">Bem-vindo(a) ao Rendari, ${name}!</h2>
      <p>Para começar, confirme seu email clicando no link abaixo:</p>
      <p style="text-align:center;margin:32px 0">
        <a href="${link}" style="background:#3d6fd8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Confirmar Email</a>
      </p>
      <p style="color:#64748b;font-size:13px">Se o botão não funcionar, copie este link: ${link}</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Link válido por 24h. Se não foi você, ignore este email.</p>
    </div>
  `;
}

export function tplResetPassword(name: string, link: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f6f8fc">
      <h2 style="color:#0f172a">Recuperar senha — Rendari</h2>
      <p>Olá ${name}, recebemos um pedido para redefinir sua senha.</p>
      <p style="text-align:center;margin:32px 0">
        <a href="${link}" style="background:#3d6fd8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Redefinir Senha</a>
      </p>
      <p style="color:#64748b;font-size:13px">Link válido por 1 hora. Se não foi você, ignore este email.</p>
    </div>
  `;
}
