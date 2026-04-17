import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

/* ============ HELPERS ============ */
type Model =
  | 'income' | 'expense' | 'asset' | 'debt' | 'goal' | 'allocationPlan'
  | 'vehicle' | 'vehicleExpense' | 'property' | 'propertyEntry'
  | 'stream' | 'streamEntry' | 'savedSimulation';

function model(name: Model): any {
  return (prisma as any)[name];
}

function userFilter(req: Request) {
  return { userId: req.user!.uid };
}

function crudRoutes(path: string, mdl: Model) {
  router.get(`/${path}`, async (req, res) => {
    const items = await model(mdl).findMany({ where: userFilter(req), orderBy: { createdAt: 'desc' } });
    res.json(items);
  });
  router.post(`/${path}`, async (req, res) => {
    const item = await model(mdl).create({ data: { ...req.body, userId: req.user!.uid } });
    res.status(201).json(item);
  });
  router.put(`/${path}/:id`, async (req, res) => {
    const existing = await model(mdl).findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.uid) return res.status(404).json({ error: 'Não encontrado' });
    const { id, userId, createdAt, ...data } = req.body;
    const item = await model(mdl).update({ where: { id: req.params.id }, data });
    res.json(item);
  });
  router.delete(`/${path}/:id`, async (req, res) => {
    const existing = await model(mdl).findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.uid) return res.status(404).json({ error: 'Não encontrado' });
    await model(mdl).delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  });
}

crudRoutes('incomes', 'income');
crudRoutes('expenses', 'expense');
crudRoutes('assets', 'asset');
crudRoutes('debts', 'debt');
crudRoutes('goals', 'goal');
crudRoutes('allocations', 'allocationPlan');
crudRoutes('vehicles', 'vehicle');
crudRoutes('vehicle-expenses', 'vehicleExpense');
crudRoutes('properties', 'property');
crudRoutes('property-entries', 'propertyEntry');
crudRoutes('streams', 'stream');
crudRoutes('stream-entries', 'streamEntry');
crudRoutes('saved-simulations', 'savedSimulation');

/* ============ EXPENSE PAYMENTS (toggle pago/não-pago) ============ */
router.get('/expense-payments', async (req, res) => {
  const items = await prisma.expensePayment.findMany({ where: userFilter(req) });
  res.json(items);
});
router.post('/expense-payments/toggle', async (req, res) => {
  const { expenseId, refMonth, paid } = req.body;
  if (!expenseId || !refMonth) return res.status(400).json({ error: 'expenseId e refMonth obrigatórios' });
  const exp = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!exp || exp.userId !== req.user!.uid) return res.status(404).json({ error: 'Não encontrado' });
  if (paid) {
    const item = await prisma.expensePayment.upsert({
      where: { expenseId_refMonth: { expenseId, refMonth } },
      create: { userId: req.user!.uid, expenseId, refMonth },
      update: { paidAt: new Date() },
    });
    res.json(item);
  } else {
    await prisma.expensePayment.deleteMany({ where: { expenseId, refMonth, userId: req.user!.uid } });
    res.json({ ok: true });
  }
});

/* ============ DASHBOARD SUMMARY ============ */
router.get('/summary', async (req, res) => {
  const uid = req.user!.uid;
  const [incomes, expenses, assets, debts, goals] = await Promise.all([
    prisma.income.findMany({ where: { userId: uid } }),
    prisma.expense.findMany({ where: { userId: uid } }),
    prisma.asset.findMany({ where: { userId: uid } }),
    prisma.debt.findMany({ where: { userId: uid } }),
    prisma.goal.findMany({ where: { userId: uid } }),
  ]);
  const monthlyIncome = incomes.reduce((s, i) => s + freqMonthly(Number(i.value), i.freq), 0);
  const monthlyExpense = expenses.reduce((s, e) => s + freqMonthly(Number(e.value), e.freq), 0);
  const totalAssets = assets.reduce((s, a) => s + Number(a.value), 0);
  const totalDebts = debts.reduce((s, d) => s + Number(d.value), 0);
  res.json({
    monthlyIncome, monthlyExpense, surplus: monthlyIncome - monthlyExpense,
    totalAssets, totalDebts, netWorth: totalAssets - totalDebts,
    counts: { incomes: incomes.length, expenses: expenses.length, assets: assets.length, debts: debts.length, goals: goals.length },
  });
});

function freqMonthly(v: number, freq: string) {
  if (freq === 'monthly') return v;
  if (freq === 'annual') return v / 12;
  if (freq === 'one-time') return v / 12;
  if (freq === 'installments') return v; // a definir por cálculo de parcela
  return v;
}

export default router;
