import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { signAccess, signRefresh, refreshExpiryDate } from '../lib/jwt.js';
import { token as randomToken } from '../utils/random.js';

const router = Router();
router.use(authRequired, requireRole('ADMIN'));

router.get('/users', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const search = String(req.query.q || '').trim();
  const where = search
    ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }, { documentNumber: { contains: search } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { plan: true, _count: { select: { incomes: true, expenses: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
});

router.get('/users/:id', async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { plan: true, company: true },
  });
  if (!u) return res.status(404).json({ error: 'Não encontrado' });
  res.json(u);
});

router.put('/users/:id', async (req, res) => {
  const { active, planId, role, name, email, phone, type, documentNumber, password, emailVerified, phoneVerified } = req.body;
  const data: any = {};
  if (active !== undefined) data.active = active;
  if (planId !== undefined) data.planId = planId || null;
  if (role !== undefined) data.role = role;
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone || null;
  if (type !== undefined) data.type = type;
  if (documentNumber !== undefined) data.documentNumber = documentNumber;
  if (emailVerified !== undefined) {
    data.emailVerified = emailVerified;
    data.emailVerifiedAt = emailVerified ? new Date() : null;
  }
  if (phoneVerified !== undefined) {
    data.phoneVerified = phoneVerified;
    data.phoneVerifiedAt = phoneVerified ? new Date() : null;
  }
  if (password) {
    if (password.length < 8) return res.status(400).json({ error: 'Senha mínima 8 caracteres' });
    data.passwordHash = await bcrypt.hash(password, 12);
    // Revoga sessões ativas
    await prisma.session.updateMany({ where: { userId: req.params.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  try {
    const u = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(u);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email ou documento já cadastrado para outro usuário' });
    throw e;
  }
});

router.delete('/users/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/**
 * Impersonate: gera tokens em nome do usuário-alvo.
 * O frontend deve guardar o token admin atual antes de aplicar os retornados.
 */
router.post('/users/:id/impersonate', async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, include: { plan: true } });
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (!target.active) return res.status(400).json({ error: 'Usuário suspenso' });

  const session = await prisma.session.create({
    data: {
      userId: target.id,
      refreshToken: randomToken(),
      expiresAt: refreshExpiryDate(),
      userAgent: `impersonate by ${req.user!.uid}`,
      ip: req.ip,
    },
  });
  const accessToken = signAccess({ uid: target.id, role: target.role, type: target.type });
  const refreshToken = signRefresh({ uid: target.id, sid: session.id });
  await prisma.session.update({ where: { id: session.id }, data: { refreshToken } });

  // Audit
  await prisma.auditLog.create({
    data: { userId: req.user!.uid, action: 'IMPERSONATE', entity: 'User', entityId: target.id, ip: req.ip, userAgent: req.headers['user-agent'] || undefined },
  });

  res.json({
    accessToken, refreshToken,
    user: {
      id: target.id, email: target.email, name: target.name, role: target.role, type: target.type,
      emailVerified: target.emailVerified, phoneVerified: target.phoneVerified,
      whitelabel: target.whitelabel, planId: target.planId, plan: target.plan,
    },
  });
});

router.get('/plans', async (_req, res) => {
  const items = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(items);
});

router.post('/plans', async (req, res) => {
  const item = await prisma.plan.create({ data: req.body });
  res.status(201).json(item);
});

router.put('/plans/:id', async (req, res) => {
  const item = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
  res.json(item);
});

router.delete('/plans/:id', async (req, res) => {
  await prisma.plan.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ ok: true });
});

router.get('/stats', async (_req, res) => {
  const [totalUsers, activeUsers, totalPF, totalPJ, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { type: 'PF' } }),
    prisma.user.count({ where: { type: 'PJ' } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);
  res.json({ totalUsers, activeUsers, totalPF, totalPJ, recentUsers });
});

export default router;
