const { Kafka } = require('kafkajs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');

// Load env variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

// Prisma client initialization with adapter
const connectionString = process.env.DATABASE_URL;
const isDummy = !connectionString || connectionString.includes('[YOUR-PROJECT-REF]') || connectionString.includes('[PASSWORD]');
const dbUrl = isDummy ? 'postgresql://postgres:postgres@localhost:5432/postgres' : connectionString;

const pool = new Pool({
  connectionString: dbUrl,
  max: 2
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Kafka client setup
const kafkaConfig = {
  clientId: 'strata-workers',
  brokers: brokers,
  connectionTimeout: 3000,
  requestTimeout: 3000
};

if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  kafkaConfig.ssl = { rejectUnauthorized: false };
  kafkaConfig.sasl = {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  };
}

const kafka = new Kafka(kafkaConfig);

const consumer = kafka.consumer({ groupId: 'strata-workers-group' });

async function run() {
  console.log('🔄 Connecting Strata Background Workers to Kafka...');
  await consumer.connect();
  console.log('✅ Connected to Kafka Broker.');

  await consumer.subscribe({ topic: 'strata-messages', fromBeginning: false });
  console.log('📬 Monitoring "strata-messages" event stream...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      console.log(`📩 [Kafka] Received message event:`);
      
      try {
        const eventEnvelope = JSON.parse(rawValue);
        if (eventEnvelope.event !== 'MESSAGE_RECEIVED') {
          return;
        }

        const msgPayload = eventEnvelope.payload;
        if (!msgPayload || !msgPayload.projectId) {
          console.warn('⚠️ Warning: Event payload is missing a valid projectId.');
          return;
        }

        console.log(`🔎 [Dispatcher] Lookup settings for Project ID: ${msgPayload.projectId}`);
        // Fetch project notifications settings
        const project = await prisma.project.findUnique({
          where: { id: msgPayload.projectId },
          include: { owner: true }
        });

        if (!project) {
          console.error(`❌ Project not found in database for ID: ${msgPayload.projectId}`);
          return;
        }

        // Execute workers in parallel
        await Promise.all([
          handleDiscordNotification(project, msgPayload),
          handleTelegramNotification(project, msgPayload),
          handleEmailNotification(project, msgPayload)
        ]);

      } catch (err) {
        console.error('❌ Failed to process Kafka event:', err.message);
      }
    }
  });
}

// -------------------------------------------------------------
// 1. Discord Notification Worker
// -------------------------------------------------------------
async function handleDiscordNotification(project, payload) {
  if (!project.discordEnabled || !project.discordWebhook) {
    console.log(`  [Discord Worker] Skipped (Disabled or missing webhook URL)`);
    return;
  }

  try {
    const embed = {
      title: '📬 New Message Received (Strata)!',
      color: 5814783,
      fields: [
        {
          name: '👤 Name',
          value: payload.name || 'Anonymous',
          inline: true,
        },
        {
          name: '✉️ Email',
          value: payload.email || 'No email provided',
          inline: true,
        },
        {
          name: '📝 Subject',
          value: payload.subject || 'No subject',
          inline: false,
        },
        {
          name: '💬 Message',
          value: payload.message || '*Empty message*',
          inline: false,
        },
      ],
      timestamp: payload.createdAt || new Date().toISOString(),
      footer: {
        text: `Strata Worker | Project: ${project.name}`,
      },
    };

    if (payload.spamClassification) {
      const scoreStr = payload.spamScore != null ? `\n**Score**: ${Math.round(payload.spamScore * 100)}%` : '';
      embed.fields.push({
        name: '🛡️ Spam Analysis',
        value: `${payload.spamClassification === 'Spam' ? '🔴 Spam' : payload.spamClassification === 'Suspicious' ? '🟡 Suspicious' : '🟢 Safe'}${scoreStr}`,
        inline: false,
      });
    }

    const response = await fetch(project.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (response.ok) {
      console.log(`✅ [Discord Worker] Dispatched successfully for project ${project.name}`);
    } else {
      console.error(`❌ [Discord Worker] API responded with error status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ [Discord Worker] Connection failed:', error.message);
  }
}

// -------------------------------------------------------------
// 2. Telegram Notification Worker
// -------------------------------------------------------------
async function handleTelegramNotification(project, payload) {
  if (!project.telegramEnabled || !project.telegramToken || !project.telegramChatId) {
    console.log(`  [Telegram Worker] Skipped (Disabled or missing token/chatId)`);
    return;
  }

  try {
    const endpoint = `https://api.telegram.org/bot${project.telegramToken}/sendMessage`;
    const text = `📬 *New Message (Strata)*\n\n*Project*: ${project.name}\n*Sender*: ${payload.name}\n*Email*: ${payload.email}\n*Subject*: ${payload.subject || 'N/A'}\n\n*Message*:\n${payload.message}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: project.telegramChatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      console.log(`✅ [Telegram Worker] Sent successfully for project ${project.name}`);
    } else {
      const errBody = await response.text();
      console.error(`❌ [Telegram Worker] API error status ${response.status}: ${errBody}`);
    }
  } catch (error) {
    console.error('❌ [Telegram Worker] Failed to send telegram notification:', error.message);
  }
}

// -------------------------------------------------------------
// 3. Email Notification Worker (Mocked / Optional SMTP)
// -------------------------------------------------------------
async function handleEmailNotification(project, payload) {
  if (!project.emailEnabled || !project.emailRecipient) {
    console.log(`  [Email Worker] Skipped (Disabled or missing recipient)`);
    return;
  }

  if (project.owner && !project.owner.emailVerified) {
    console.warn(`⚠️ [Email Worker] Skipped: Owner email is NOT verified. Routing disabled.`);
    return;
  }

  console.log(`📧 [Email Worker] dispatching email notification to <${project.emailRecipient}>...`);

  // Check if SMTP is configured to support real sending, else mock it
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });

      await transporter.sendMail({
        from: SMTP_FROM || '"Strata Portal" <no-reply@strata-app.com>',
        to: project.emailRecipient,
        subject: `📬 [Strata] New message from ${payload.name}: ${payload.subject || 'No Subject'}`,
        text: `You received a new submission on Strata!\n\nName: ${payload.name}\nEmail: ${payload.email}\nSubject: ${payload.subject || 'N/A'}\n\nMessage:\n${payload.message}`
      });

      console.log(`✅ [Email Worker] Sent email successfully to <${project.emailRecipient}>`);
    } catch (err) {
      console.error('❌ [Email Worker] Nodemailer failed to send:', err.message);
    }
  } else {
    // Elegant fallback mock console output
    console.log(`  --------------------------------------------------`);
    console.log(`  [MOCK EMAIL SENT SUCCESS]`);
    console.log(`  To: ${project.emailRecipient}`);
    console.log(`  Subject: New message on Strata: ${payload.subject || 'No Subject'}`);
    console.log(`  Body: Sender ${payload.name} (${payload.email}) wrote: ${payload.message}`);
    console.log(`  --------------------------------------------------`);
  }
}

// Global cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function cleanup() {
  console.log('🔌 Shutting down Strata workers...');
  try {
    await consumer.disconnect();
    await prisma.$disconnect();
    await pool.end();
  } catch (err) {}
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Fatal error running Strata parallel workers:', err.message);
  process.exit(1);
});

// Start a dummy HTTP server so Render/Railway doesn't crash the container,
// and so you can use UptimeRobot to ping it every 10 minutes to keep it awake!
const http = require('http');
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Strata Worker is ALIVE\n');
}).listen(PORT, () => {
  console.log(`🌐 Keep-alive HTTP server running on port ${PORT}`);
});
