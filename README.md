# Rendari · Plataforma de Gestão Financeira e Investimentos

SaaS multi-tenant (PF e PJ) para gestão financeira pessoal/empresarial e simulação de investimentos.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + React Router + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL 16
- **Auth**: JWT (access + refresh) + bcrypt
- **Email**: Nodemailer (SMTP)
- **SMS/WhatsApp**: Twilio

## Setup local

### Pré-requisitos
- Node 20+
- Docker + Docker Compose (recomendado)

### Subir tudo com Docker
```bash
cp .env.example .env
docker compose up -d
```
- Frontend: http://localhost:5173
- API: http://localhost:3333
- Postgres: localhost:5432

### Setup manual

```bash
# 1. Postgres (Docker)
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev   # http://localhost:3333

# 3. Frontend
cd ../frontend
npm install
npm run dev   # http://localhost:5173
```

## Usuário admin padrão (após seed)
- **Email**: admin@rendari.com.br
- **Senha**: Admin@2026!

## Estrutura

```
rendari/
├── backend/
│   ├── prisma/schema.prisma  ← modelo de dados
│   ├── src/
│   │   ├── routes/           ← endpoints REST
│   │   ├── controllers/
│   │   ├── services/         ← email, SMS, JWT
│   │   ├── middleware/       ← auth, role guard
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            ← rotas React
│   │   ├── components/       ← Sidebar, Navbar, etc
│   │   ├── stores/           ← Zustand: auth, theme, whitelabel
│   │   └── App.tsx
│   └── package.json
└── docker-compose.yml
```

## Funcionalidades

### Comum (PF + PJ)
- Dashboard com KPIs, regra 50/30/20, score de saúde financeira
- CRUD de receitas, despesas (com parcelas), patrimônio, metas
- Simulador de investimentos + Carteira Híbrida
- Catálogo BR/EUA/Cripto, Comparador BR×EUA, Ranking
- Glossário, Onde Investir, Tabela de Impostos

### Só PF
- Estratégias de Renda pessoais (serviços, infoprodutos)
- Plano de Aportes vinculado ao salário

### Só PJ
- DRE (Demonstração de Resultado)
- Folha de Pagamento (funcionários, encargos)
- Notas Fiscais (entrada/saída)
- Centro de Custos & Departamentos
- Impostos PJ (DAS, ICMS, ISS, IRPJ, CSLL, PIS/Cofins)
- Fluxo de Caixa empresarial

### Whitelabel (todos os planos pagos)
- Nome do site customizado
- Logo + favicon próprios
- Paletas dark/light personalizadas

### Admin
- CRUD de usuários e planos
- Métricas de plataforma
- Logs de auditoria
