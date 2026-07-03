const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;

console.log('Diagnostic: Testing connection to Supabase...');
console.log('Database URL configured:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'Not Configured');

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL is not set.');
  process.exit(1);
}

async function runDiagnostics() {
  const pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('1. Testing raw pg connection pool...');
    const client = await pool.connect();
    console.log('✅ Success: Raw pg connection established.');
    
    console.log('2. Running test query (SELECT 1)...');
    const res = await client.query('SELECT 1 as val');
    console.log(`✅ Success: Query returned value:`, res.rows[0].val);
    client.release();
  } catch (err) {
    console.error('❌ Error during raw pg connection:', err.message);
    console.log('Please check your password, internet connection, or if your database is active on Supabase.');
    pool.end();
    process.exit(1);
  }

  // Test Prisma client
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('3. Testing Prisma Client connection...');
    await prisma.$connect();
    console.log('✅ Success: Prisma Client connected.');

    console.log('4. Testing query on Message table...');
    const messageCount = await prisma.message.count();
    console.log(`✅ Success: Message table is accessible. Total records: ${messageCount}`);
    
    console.log('\n🎉 Supabase is fully configured, online, and migration tables exist.');
  } catch (err) {
    console.error('❌ Prisma / Message table error:', err.message);
    if (err.message.includes('relation "Message" does not exist') || err.message.includes('Table "Message" does not exist') || err.code === 'P2021') {
      console.log('\n💡 Fix: The database is online, but the Message table is missing.');
      console.log('Run the following command to push the tables to Supabase:');
      console.log('   npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

runDiagnostics();
