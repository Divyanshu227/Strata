const { Kafka } = require('kafkajs');
const path = require('path');

// Load env variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  console.warn('⚠️ Warning: DISCORD_WEBHOOK_URL is not set in .env.local. Consumer will log events but cannot send notifications.');
}

const kafka = new Kafka({
  clientId: 'strata-consumer',
  brokers: brokers,
  connectionTimeout: 3000,
  requestTimeout: 3000
});

const consumer = kafka.consumer({ groupId: 'strata-group' });

async function run() {
  console.log('🔄 Connecting Kafka Consumer...');
  await consumer.connect();
  console.log('✅ Connected to Kafka Broker.');

  await consumer.subscribe({ topic: 'portfolio-messages', fromBeginning: false });
  console.log('📬 Subscribed to topic "portfolio-messages". Monitoring event streams...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      console.log(`📩 Received event on partition ${partition}:`);
      
      try {
        const eventEnvelope = JSON.parse(rawValue);
        console.log(`  Event Type: ${eventEnvelope.event}`);
        console.log(`  Message ID: ${eventEnvelope.payload?.id}`);

        if (eventEnvelope.event === 'MESSAGE_RECEIVED') {
          if (!webhookUrl) {
            console.log('  [Webhook Skipped] Discord Webhook URL is not configured.');
            return;
          }
          await sendDiscordNotification(eventEnvelope.payload);
        }
      } catch (err) {
        console.error('❌ Failed to process event payload:', err.message);
      }
    }
  });
}

async function sendDiscordNotification(payload) {
  try {
    const embed = {
      title: '📬 New Message Received (via Kafka Event Stream)!',
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
        text: 'Strata Kafka Decoupled Worker',
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (response.ok) {
      console.log(`✅ Discord Notification successfully dispatched for message ID ${payload.id}`);
    } else {
      console.error(`❌ Discord API responded with error status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Failed to send Discord notification from worker:', error.message);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at Promise:', reason);
});

run().catch((err) => {
  console.error('❌ Fatal error running Kafka consumer worker:', err.message);
  console.log('Please ensure that Docker is running and "docker compose up" has successfully started Zookeeper and Kafka brokers.');
  process.exit(1);
});
