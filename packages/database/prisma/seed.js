const { PrismaClient, UserRole, UserPlan } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed default Super Admin user
  const adminEmail = 'admin@wavo.io';
  const adminPassword = 'wavo_admin_2026';
  const hashedPassword = bcrypt.hashSync(adminPassword, 12);

  // Check if any SUPER_ADMIN already exists (e.g. if the admin has updated their email)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN }
  });

  let adminUser;
  if (existingSuperAdmin) {
    adminUser = existingSuperAdmin;
    console.log(`ℹ️ Super Admin already exists in the system: ${adminUser.email} (Skipped default seeding to prevent duplicates)`);
  } else {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Wavo Super Admin',
        role: UserRole.SUPER_ADMIN,
        plan: UserPlan.ENTERPRISE,
        isActive: true,
      },
    });
  }

  // 2. Seed default dynamic system configurations
  const configs = [
    {
      key: 'rate_limit.free.daily',
      value: 100,
      description: 'Daily outbound message limit for Free tier users',
    },
    {
      key: 'rate_limit.pro.daily',
      value: 5000,
      description: 'Daily outbound message limit for Pro tier users',
    },
    {
      key: 'rate_limit.business.daily',
      value: 50000,
      description: 'Daily outbound message limit for Business tier users',
    },
  ];

  for (const config of configs) {
    const record = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description,
      },
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
    console.log(`✅ Config seeded: ${record.key} = ${record.value}`);
  }

  console.log('🌿 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
