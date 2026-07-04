const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');

// Load environment variables from .env.local first, fallback to .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const isDummy = !connectionString || connectionString.includes('[YOUR-PROJECT-REF]') || connectionString.includes('[PASSWORD]');
const dbUrl = isDummy ? 'postgresql://postgres:postgres@localhost:5432/postgres' : connectionString;

const pool = new Pool({
  connectionString: dbUrl,
  max: 2
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding mock projects and messages into Supabase PostgreSQL using Prisma with Driver Adapter...');
  
  // Clear existing messages, projects, and users
  await prisma.message.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Create default owner user
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync('12345678', salt, 1000, 64, 'sha512').toString('hex');
  const hashedPassword = `${salt}:${hash}`;

  const user = await prisma.user.create({
    data: {
      id: 'default-owner-uuid',
      name: 'Strata Administrator',
      username: 'admin',
      email: 'admin@strata-app.com',
      password: hashedPassword
    }
  });
  console.log(`Created default user: ${user.name} (username: ${user.username})`);
  
  // Create default project
  const project = await prisma.project.create({
    data: {
      id: 'default-project-uuid',
      ownerId: user.id,
      name: 'My Portfolio',
      apiKey: 'strata_token_default_123',
      discordEnabled: !!process.env.DISCORD_WEBHOOK_URL,
      discordWebhook: process.env.DISCORD_WEBHOOK_URL || null,
      telegramEnabled: false,
      emailEnabled: false
    }
  });
  console.log(`Created default project: ${project.name} (id: ${project.id}, apiKey: ${project.apiKey})`);
  
  // Create mock messages under the project with optional AI metrics
  await prisma.message.create({
    data: {
      id: 'msg_uuid_1001',
      projectId: project.id,
      name: 'Sarah Connor',
      email: 'sarah.c@resistance.io',
      subject: 'Project Consultation Request',
      message: 'Hi there,\n\nI came across your portfolio website while looking for developers skilled in full-stack systems. We are building a secure communication node and would love to consult with you on architectural decisions.\n\nAre you available for freelance projects this quarter?\n\nBest,\nSarah Connor',
      status: 'unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      
      // Optional AI metrics
      spamScore: 0.02,
      priority: 'high',
      sentiment: 'positive'
    }
  });

  await prisma.message.create({
    data: {
      id: 'msg_uuid_1002',
      projectId: project.id,
      name: 'Bruce Wayne',
      email: 'bruce@wayneenterprise.com',
      subject: 'Security Operations Dashboard',
      message: 'Hello,\n\nI require a high-frequency monitoring interface for secure telemetry data storage. Your portfolio showcases clean design aesthetics which fit our criteria.\n\nPlease let me know your rates and availability for a custom software project. Cost is not a limiting factor.\n\nRegards,\nBruce Wayne',
      status: 'unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      
      // Optional AI metrics
      spamScore: 0.05,
      priority: 'high',
      sentiment: 'neutral'
    }
  });

  await prisma.message.create({
    data: {
      id: 'msg_uuid_1003',
      projectId: project.id,
      name: 'Linus Torvalds',
      email: 'torvalds@linuxfoundation.org',
      subject: 'Feedback on Git Repo Architecture',
      message: 'Hey,\n\nI looked at your portfolio\'s source repositories. You have solid separation of concerns and avoid unnecessary dependencies. Keep your code modular and focus on performance.\n\nGood work,\nLinus',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      
      // Optional AI metrics
      spamScore: 0.01,
      priority: 'medium',
      sentiment: 'positive'
    }
  });

  await prisma.message.create({
    data: {
      id: 'msg_uuid_1004',
      projectId: project.id,
      name: 'Spammer Joe',
      email: 'joe@spambot.ru',
      subject: 'Buy cheap watches and crypto!',
      message: 'Hello friend! Do you want to double your money in 24 hours? Go to http://fake-crypto-spambot.ru and buy coins now! Cheap Rolex watches also available inside.',
      status: 'unread',
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      
      // Optional AI metrics (Clearly spammy)
      spamScore: 0.98,
      priority: 'low',
      sentiment: 'negative'
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
    await pool.end();
  });
