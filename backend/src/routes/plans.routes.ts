import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/public', async (_req, res) => {
  const items = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(items);
});

export default router;
