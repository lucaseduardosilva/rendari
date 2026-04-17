import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signAccess, signRefresh, verifyRefresh, refreshExpiryDate } from '../lib/jwt.js';
import { token as randomToken, code6 } from '../utils/random.js';
import { sendMail, tplVerifyEmail, tplResetPassword } from '../services/email.service.js';
import { sendSms, sendWhatsApp } from '../services/sms.service.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
const FRONT = process.env.FRONTEND_URL || 'http://localhost:5173';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  type: z.enum(['PF', 'PJ']),
  documentNumber: z.string().min(11),
  phone: z.string().optional(),
  // PJ-only
  companyLegalName: z.string().optional(),
  companyTradeName: z.string().optional(),
  taxRegime: z.enum(['SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI']).optional(),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.errors });
  const data = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { documentNumber: data.documentNumber }] },
  });
  if (exists) return res.status(409).json({ error: 'Email ou documento já cadastrado' });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      type: data.type,
      documentNumber: data.documentNumber,
      phone: data.phone,
      planId: freePlan?.id,
      ...(data.type === 'PJ'
        ? {
            company: {
              create: {
                legalName: data.companyLegalName || data.name,
                tradeName: data.companyTradeName,
                cnpj: data.documentNumber,
                taxRegime: data.taxRegime || 'SIMPLES',
              },
            },
          }
        : {}),
    },
  });

  // Token de verificação de email
  const verifyToken = randomToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: 'EMAIL_VERIFY',
      token: verifyToken,
      channel: 'email',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const link = `${FRONT}/verify-email?token=${verifyToken}`;
  await sendMail(user.email, 'Confirme seu email — Rendari', tplVerifyEmail(user.name, link));

  res.status(201).json({ id: user.id, email: user.email, message: 'Conta criada. Verifique seu email.' });
});

router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token ausente' });
  const t = await prisma.verificationToken.findUnique({ where: { token } });
  if (!t || t.type !== 'EMAIL_VERIFY' || t.usedAt || t.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } }),
    prisma.verificationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
  ]);
  res.json({ ok: true });
});

router.post('/resend-verify-email', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user || user.emailVerified) return res.status(400).json({ error: 'Email já verificado' });
  const t = randomToken();
  await prisma.verificationToken.create({
    data: { userId: user.id, type: 'EMAIL_VERIFY', token: t, channel: 'email', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const link = `${FRONT}/verify-email?token=${t}`;
  await sendMail(user.email, 'Confirme seu email — Rendari', tplVerifyEmail(user.name, link));
  res.json({ ok: true });
});

router.post('/send-phone-code', authRequired, async (req, res) => {
  const { channel = 'sms' } = req.body as { channel?: 'sms' | 'whatsapp' };
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user?.phone) return res.status(400).json({ error: 'Cadastre um telefone primeiro' });
  const code = code6();
  await prisma.verificationToken.create({
    data: { userId: user.id, type: 'PHONE_VERIFY', token: code, channel, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  const msg = `Rendari: seu código é ${code}. Válido por 10 minutos.`;
  if (channel === 'whatsapp') await sendWhatsApp(user.phone, msg);
  else await sendSms(user.phone, msg);
  res.json({ ok: true });
});

router.post('/verify-phone', authRequired, async (req, res) => {
  const { code } = req.body;
  const t = await prisma.verificationToken.findFirst({
    where: { userId: req.user!.uid, type: 'PHONE_VERIFY', token: String(code), usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!t || t.expiresAt < new Date()) return res.status(400).json({ error: 'Código inválido ou expirado' });
  await prisma.$transaction([
    prisma.user.update({ where: { id: req.user!.uid }, data: { phoneVerified: true, phoneVerifiedAt: new Date() } }),
    prisma.verificationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
  ]);
  res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  if (!user.active) return res.status(403).json({ error: 'Conta suspensa' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: randomToken(),
      expiresAt: refreshExpiryDate(),
      userAgent: req.headers['user-agent'] || undefined,
      ip: req.ip,
    },
  });
  const accessToken = signAccess({ uid: user.id, role: user.role, type: user.type });
  const refreshToken = signRefresh({ uid: user.id, sid: session.id });
  await prisma.session.update({ where: { id: session.id }, data: { refreshToken } });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, include: { plan: true } });
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: fullUser!.id, email: fullUser!.email, name: fullUser!.name,
      role: fullUser!.role, type: fullUser!.type,
      emailVerified: fullUser!.emailVerified, phoneVerified: fullUser!.phoneVerified,
      whitelabel: fullUser!.whitelabel, planId: fullUser!.planId,
      plan: fullUser!.plan,
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken ausente' });
  try {
    const decoded = verifyRefresh(refreshToken);
    const session = await prisma.session.findUnique({ where: { id: decoded.sid } });
    if (!session || session.refreshToken !== refreshToken || session.revokedAt) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.uid } });
    if (!user || !user.active) return res.status(401).json({ error: 'Usuário inválido' });
    const newAccess = signAccess({ uid: user.id, role: user.role, type: user.type });
    res.json({ accessToken: newAccess });
  } catch {
    res.status(401).json({ error: 'Refresh inválido' });
  }
});

router.post('/logout', authRequired, async (req, res) => {
  await prisma.session.updateMany({ where: { userId: req.user!.uid, revokedAt: null }, data: { revokedAt: new Date() } });
  res.json({ ok: true });
});

router.post('/forgot-password', async (req, res) => {
  const { email, phone, channel = 'email' } = req.body;
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : phone
    ? await prisma.user.findFirst({ where: { phone } })
    : null;
  // Resposta sempre 200 para não vazar existência de conta
  if (!user) return res.json({ ok: true });

  if (channel === 'email' || !user.phoneVerified) {
    const t = randomToken();
    await prisma.verificationToken.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', token: t, channel: 'email', expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await sendMail(user.email, 'Recuperar senha — Rendari', tplResetPassword(user.name, `${FRONT}/reset-password?token=${t}`));
  } else {
    const code = code6();
    await prisma.verificationToken.create({
      data: { userId: user.id, type: 'PASSWORD_RESET', token: code, channel, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    const msg = `Rendari: código de recuperação ${code}. Válido por 15 minutos.`;
    if (channel === 'whatsapp') await sendWhatsApp(user.phone!, msg);
    else await sendSms(user.phone!, msg);
  }
  res.json({ ok: true });
});

router.post('/reset-password', async (req, res) => {
  const { token, code, email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Senha mínima 8 caracteres' });
  let t = null as any;
  if (token) t = await prisma.verificationToken.findUnique({ where: { token } });
  else if (code && email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      t = await prisma.verificationToken.findFirst({
        where: { userId: user.id, type: 'PASSWORD_RESET', token: String(code), usedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }
  }
  if (!t || t.type !== 'PASSWORD_RESET' || t.usedAt || t.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token/código inválido ou expirado' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
    prisma.session.updateMany({ where: { userId: t.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  res.json({ ok: true });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.uid },
    include: { plan: true, company: true },
  });
  if (!user) return res.status(404).json({ error: 'Não encontrado' });
  res.json({
    id: user.id, email: user.email, name: user.name, role: user.role, type: user.type,
    documentNumber: user.documentNumber, phone: user.phone,
    emailVerified: user.emailVerified, phoneVerified: user.phoneVerified,
    whitelabel: user.whitelabel, preferences: user.preferences,
    plan: user.plan, company: user.company, createdAt: user.createdAt,
  });
});

export default router;
