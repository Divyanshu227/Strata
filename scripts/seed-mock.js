const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

// Target the SQLite database file relative to the project root
const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding mock messages into the local database using Prisma Client...');
  
  // Clear any existing messages to avoid primary key constraints
  await prisma.message.deleteMany({});
  
  // Create mock messages
  await prisma.message.create({
    data: {
      id: 'msg_uuid_1001',
      name: 'Sarah Connor',
      email: 'sarah.c@resistance.io',
      subject: 'Project Consultation Request',
      message: 'Hi there,\n\nI came across your portfolio website while looking for developers skilled in full-stack systems. We are building a secure communication node and would love to consult with you on architectural decisions.\n\nAre you available for freelance projects this quarter?\n\nBest,\nSarah Connor',
      status: 'unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    }
  });

  await prisma.message.create({
    data: {
      id: 'msg_uuid_1002',
      name: 'Bruce Wayne',
      email: 'bruce@wayneenterprise.com',
      subject: 'Security Operations Dashboard',
      message: 'Hello,\n\nI require a high-frequency monitoring interface for secure telemetry data storage. Your portfolio showcases clean design aesthetics which fit our criteria.\n\nPlease let me know your rates and availability for a custom software project. Cost is not a limiting factor.\n\nRegards,\nBruce Wayne',
      status: 'unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    }
  });

  await prisma.message.create({
    data: {
      id: 'msg_uuid_1003',
      name: 'Linus Torvalds',
      email: 'torvalds@linuxfoundation.org',
      subject: 'Feedback on Git Repo Architecture',
      message: 'Hey,\n\nI looked at your portfolio\'s source repositories. You have solid separation of concerns and avoid unnecessary dependencies. Keep your code modular and focus on performance.\n\nGood work,\nLinus',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    }
  });
  
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
