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
