import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/** Garante que o usuário tem acesso a determinada feature/page do plano. */
export function requireFeature(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.uid },
      include: { plan: true },
    });
    if (!user || !user.plan) return res.status(403).json({ error: 'Sem plano ativo' });
    const features = (user.plan.features as any) || {};
    if (features.lifetime || user.role === 'ADMIN') return next();
    if (Array.isArray(features.pages) && features.pages.includes(featureKey)) return next();
    if (features[featureKey]) return next();
    return res.status(402).json({
      error: 'Recurso não disponível no seu plano',
      upgrade: true,
      requiredFeature: featureKey,
    });
  };
}
