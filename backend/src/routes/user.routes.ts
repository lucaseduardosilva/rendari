import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user!.uid}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

/* ============ CUSTOM OPTIONS ============ */

// Mapeamento scope → { model, field } usado para verificar/contar uso
const SCOPE_USAGE: Record<string, { model: string; field: string; label: string }> = {
  'income.cat':    { model: 'income',   field: 'cat',  label: 'receita(s)' },
  'expense.cat':   { model: 'expense',  field: 'cat',  label: 'despesa(s)' },
  'asset.cat':     { model: 'asset',    field: 'cat',  label: 'ativo(s)' },
  'debt.cat':      { model: 'debt',     field: 'cat',  label: 'dívida(s)' },
  'vehicle.type':  { model: 'vehicle',  field: 'type', label: 'veículo(s)' },
  'property.type': { model: 'property', field: 'type', label: 'imóvel(eis)' },
  'stream.type':   { model: 'stream',   field: 'type', label: 'estratégia(s)' },
};

async function countUsage(userId: string, scope: string, value: string): Promise<{ count: number; label: string }> {
  const map = SCOPE_USAGE[scope];
  if (!map) return { count: 0, label: '' };
  const count = await (prisma as any)[map.model].count({ where: { userId, [map.field]: value } });
  return { count, label: map.label };
}

router.get('/custom-options', async (req, res) => {
  const items = await prisma.customOption.findMany({
    where: { userId: req.user!.uid, active: true },
    orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
  });
  // Anota cada item com usageCount
  const annotated = await Promise.all(items.map(async (i) => {
    const u = await countUsage(req.user!.uid, i.scope, i.value);
    return { ...i, usageCount: u.count, usageLabel: u.label };
  }));
  res.json(annotated);
});

router.post('/custom-options', async (req, res) => {
  const { scope, value, sortOrder } = req.body;
  if (!scope || !value || !String(value).trim()) return res.status(400).json({ error: 'scope e value são obrigatórios' });
  try {
    const item = await prisma.customOption.create({
      data: { userId: req.user!.uid, scope, value: String(value).trim(), sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(item);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Este valor já existe nesse escopo' });
    throw e;
  }
});

router.put('/custom-options/:id', async (req, res) => {
  const existing = await prisma.customOption.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user!.uid) return res.status(404).json({ error: 'Não encontrado' });
  const { value, sortOrder, active } = req.body;
  const data: any = {};
  if (value !== undefined) data.value = String(value).trim();
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  if (active !== undefined) data.active = active;

  // Se mudou o nome, propaga para os registros existentes
  if (data.value && data.value !== existing.value) {
    const map = SCOPE_USAGE[existing.scope];
    if (map) {
      await (prisma as any)[map.model].updateMany({
        where: { userId: req.user!.uid, [map.field]: existing.value },
        data: { [map.field]: data.value },
      });
    }
  }

  try {
    const item = await prisma.customOption.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Este valor já existe nesse escopo' });
    throw e;
  }
});

router.delete('/custom-options/:id', async (req, res) => {
  const existing = await prisma.customOption.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user!.uid) return res.status(404).json({ error: 'Não encontrado' });

  // Bloqueia se em uso
  const usage = await countUsage(req.user!.uid, existing.scope, existing.value);
  if (usage.count > 0) {
    return res.status(409).json({
      error: `Não é possível excluir: "${existing.value}" está sendo usado em ${usage.count} ${usage.label}.`,
      usageCount: usage.count, usageLabel: usage.label,
    });
  }
  await prisma.customOption.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.put('/profile', async (req, res) => {
  const { name, phone, preferences } = req.body;
  const u = await prisma.user.update({
    where: { id: req.user!.uid },
    data: { name, phone, preferences },
  });
  res.json(u);
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Senha mínima 8 caracteres' });
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user) return res.status(404).json({ error: 'Não encontrado' });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

router.put('/whitelabel', async (req, res) => {
  const { brandName, logoUrl, faviconUrl, paletteDark, paletteLight } = req.body;
  const u = await prisma.user.update({
    where: { id: req.user!.uid },
    data: { whitelabel: { brandName, logoUrl, faviconUrl, paletteDark, paletteLight } },
  });
  res.json(u.whitelabel);
});

router.post('/upload/:kind(logo|favicon)', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo ausente' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

/* ============ COMPANY (PJ) ============ */
router.get('/company', async (req, res) => {
  const c = await prisma.company.findUnique({ where: { userId: req.user!.uid } });
  res.json(c);
});

router.put('/company', async (req, res) => {
  const { id, userId, createdAt, ...data } = req.body;
  const existing = await prisma.company.findUnique({ where: { userId: req.user!.uid } });
  const c = existing
    ? await prisma.company.update({ where: { userId: req.user!.uid }, data })
    : await prisma.company.create({ data: { ...data, userId: req.user!.uid } });
  res.json(c);
});

/* CRUD funcionários, payroll, invoices, costcenters, departments — simplificado */
async function ensureCompany(userId: string) {
  const c = await prisma.company.findUnique({ where: { userId } });
  if (!c) throw new Error('Empresa não cadastrada');
  return c;
}

const pjModels = ['employees', 'payrolls', 'invoices', 'costCenters', 'departments'] as const;
const pjMap: Record<typeof pjModels[number], string> = {
  employees: 'employee', payrolls: 'payroll', invoices: 'invoice',
  costCenters: 'costCenter', departments: 'department',
};
pjModels.forEach((path) => {
  const m = pjMap[path];
  router.get(`/${path}`, async (req, res) => {
    try {
      const c = await ensureCompany(req.user!.uid);
      const items = await (prisma as any)[m].findMany({ where: { companyId: c.id }, orderBy: { createdAt: 'desc' } });
      res.json(items);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  router.post(`/${path}`, async (req, res) => {
    try {
      const c = await ensureCompany(req.user!.uid);
      const item = await (prisma as any)[m].create({ data: { ...req.body, companyId: c.id } });
      res.status(201).json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  router.put(`/${path}/:id`, async (req, res) => {
    try {
      const c = await ensureCompany(req.user!.uid);
      const existing = await (prisma as any)[m].findUnique({ where: { id: req.params.id } });
      if (!existing || existing.companyId !== c.id) return res.status(404).json({ error: 'Não encontrado' });
      const { id, companyId, createdAt, ...data } = req.body;
      const item = await (prisma as any)[m].update({ where: { id: req.params.id }, data });
      res.json(item);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  router.delete(`/${path}/:id`, async (req, res) => {
    try {
      const c = await ensureCompany(req.user!.uid);
      const existing = await (prisma as any)[m].findUnique({ where: { id: req.params.id } });
      if (!existing || existing.companyId !== c.id) return res.status(404).json({ error: 'Não encontrado' });
      await (prisma as any)[m].delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
});

export default router;
