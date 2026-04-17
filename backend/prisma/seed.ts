import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

/**
 * Catálogo de páginas/recursos da plataforma. Cada plano libera um subconjunto.
 * `paths` corresponde às rotas do frontend.
 */
export const PAGE_CATALOG = {
  CORE: ['/dashboard', '/income', '/expenses', '/patrimony', '/goals', '/saved'],
  CONTENT: ['/catalog', '/simulator', '/where', '/taxes', '/glossary'],
  ADVANCED: ['/hybrid', '/plan', '/compare', '/ranking', '/vehicles', '/properties', '/streams'],
  PJ: ['/dre', '/payroll', '/employees', '/invoices', '/cost-centers', '/departments', '/business-taxes', '/cashflow'],
  ALL: [] as string[], // preenchido abaixo
};
PAGE_CATALOG.ALL = [...PAGE_CATALOG.CORE, ...PAGE_CATALOG.CONTENT, ...PAGE_CATALOG.ADVANCED, ...PAGE_CATALOG.PJ];

const PLANS = [
  {
    slug: 'free', name: 'Free', description: 'Comece grátis e domine suas finanças',
    priceMonth: 0, priceYear: 0, sortOrder: 1, visibleFor: 'ALL',
    features: {
      pages: [...PAGE_CATALOG.CORE, ...PAGE_CATALOG.CONTENT],
      whitelabel: false, maxSavedSimulations: 5, support: 'community',
      companyTools: false, multiCompany: false,
    },
  },
  {
    slug: 'pro', name: 'Pro', description: 'Para usuários que querem maximizar resultados',
    priceMonth: 19.9, priceYear: 199, sortOrder: 2, visibleFor: 'PF',
    features: {
      pages: [...PAGE_CATALOG.CORE, ...PAGE_CATALOG.CONTENT, ...PAGE_CATALOG.ADVANCED],
      whitelabel: true, maxSavedSimulations: 50, support: 'email',
      companyTools: false, multiCompany: false, advancedSimulations: true,
    },
  },
  {
    slug: 'business', name: 'Business', description: 'Para empresas que querem controle total',
    priceMonth: 79.9, priceYear: 799, sortOrder: 3, visibleFor: 'PJ',
    features: {
      pages: PAGE_CATALOG.ALL,
      whitelabel: true, maxSavedSimulations: 200, support: 'priority',
      companyTools: true, multiCompany: false, payroll: true, invoices: true, costCenters: true,
    },
  },
  {
    slug: 'enterprise', name: 'Enterprise', description: 'Customizado para grandes operações',
    priceMonth: 0, priceYear: 0, sortOrder: 4, visibleFor: 'PJ',
    features: {
      pages: PAGE_CATALOG.ALL,
      whitelabel: true, maxSavedSimulations: -1, support: 'dedicated',
      companyTools: true, multiCompany: true, payroll: true, invoices: true,
      costCenters: true, customIntegrations: true, sso: true, sla: '99.9%',
    },
  },
  {
    slug: 'lifetime', name: 'Lifetime', description: 'Acesso vitalício a todos os recursos (interno)',
    priceMonth: 0, priceYear: 0, sortOrder: 99, visibleFor: 'ALL',
    features: {
      pages: PAGE_CATALOG.ALL,
      whitelabel: true, maxSavedSimulations: -1, support: 'dedicated',
      companyTools: true, multiCompany: true, payroll: true, invoices: true,
      costCenters: true, customIntegrations: true, sso: true, lifetime: true,
    },
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      create: p as any,
      update: {
        name: p.name, description: p.description, priceMonth: p.priceMonth,
        priceYear: p.priceYear, features: p.features as any,
        sortOrder: p.sortOrder, visibleFor: p.visibleFor,
      },
    });
  }
  console.log(`✔ ${PLANS.length} planos criados/atualizados`);

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rendari.com.br';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@2026!';
  const lifetimePlan = await prisma.plan.findUnique({ where: { slug: 'lifetime' } });

  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPass, 12),
        name: 'Admin Rendari',
        type: 'PF',
        documentNumber: '00000000000',
        role: 'ADMIN',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        planId: lifetimePlan?.id,
      },
    });
    console.log(`✔ Admin criado: ${adminEmail} / ${adminPass}`);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { planId: lifetimePlan?.id, role: 'ADMIN', emailVerified: true },
    });
    console.log(`✔ Admin atualizado: ${adminEmail}`);
  }

  // Conta de teste PF (Free)
  const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
  const pfEmail = 'lucasedu.professional@gmail.com';
  const pfPass = 'senha123';
  const pfExists = await prisma.user.findUnique({ where: { email: pfEmail } });
  if (!pfExists) {
    await prisma.user.create({
      data: {
        email: pfEmail,
        passwordHash: await bcrypt.hash(pfPass, 12),
        name: 'Lucas Eduardo',
        type: 'PF',
        documentNumber: '11111111111',
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        planId: freePlan?.id,
      },
    });
    console.log(`✔ Cliente PF criado: ${pfEmail} / ${pfPass} (USER + Free)`);
  } else {
    await prisma.user.update({
      where: { email: pfEmail },
      data: {
        planId: freePlan?.id, role: 'USER', type: 'PF',
        emailVerified: true, emailVerifiedAt: new Date(), active: true,
      },
    });
    console.log(`✔ Cliente PF atualizado: ${pfEmail} (USER + Free)`);
  }

  // Conta de teste PJ (Business)
  const businessPlan = await prisma.plan.findUnique({ where: { slug: 'business' } });
  const pjEmail = 'lucasedu.comercial@gmail.com';
  const pjPass = 'senha123';
  const pjCnpj = '11222333000144';
  const pjExists = await prisma.user.findUnique({ where: { email: pjEmail } });
  if (!pjExists) {
    await prisma.user.create({
      data: {
        email: pjEmail,
        passwordHash: await bcrypt.hash(pjPass, 12),
        name: 'Lucas Eduardo',
        type: 'PJ',
        documentNumber: pjCnpj,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        planId: businessPlan?.id,
        company: {
          create: {
            legalName: 'Lucas Eduardo Comercial LTDA',
            tradeName: 'Lucas Comercial',
            cnpj: pjCnpj,
            taxRegime: 'SIMPLES',
          },
        },
      },
    });
    console.log(`✔ Cliente PJ criado: ${pjEmail} / ${pjPass} (USER + Business + Empresa)`);
  } else {
    await prisma.user.update({
      where: { email: pjEmail },
      data: {
        planId: businessPlan?.id, role: 'USER', type: 'PJ',
        emailVerified: true, emailVerifiedAt: new Date(), active: true,
      },
    });
    // garante company
    const c = await prisma.company.findUnique({ where: { userId: pjExists.id } });
    if (!c) {
      await prisma.company.create({
        data: {
          userId: pjExists.id,
          legalName: 'Lucas Eduardo Comercial LTDA',
          tradeName: 'Lucas Comercial',
          cnpj: pjCnpj,
          taxRegime: 'SIMPLES',
        },
      });
    }
    console.log(`✔ Cliente PJ atualizado: ${pjEmail} (USER + Business)`);
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
