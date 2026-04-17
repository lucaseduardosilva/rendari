import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import financeRoutes from './routes/finance.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import plansRoutes from './routes/plans.routes.js';

const app = express();
const PORT = Number(process.env.PORT || 3333);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/finance', financeRoutes);
app.use('/user', userRoutes);
app.use('/plans', plansRoutes);
app.use('/admin', adminRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`✔ Rendari API rodando em http://localhost:${PORT}`);
});
