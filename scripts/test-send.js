const path = require('path');

// Load env configurations from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const token = process.env.API_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const endpoint = `${appUrl}/api/messages`;

if (!token || token === 'NOT_CONFIGURED') {
  console.error('❌ Error: API_TOKEN is not configured in .env.local. Make sure you set it first.');
  process.exit(1);
}

const mockMessage = {
  name: 'John Connor',
  email: 'john.connor@resistance.net',
  subject: 'Local System Test Submission',
  message: 'This is a test message to verify the complete event-driven synchronization flow (Next.js -> SQLite Local Cache -> Redis Rate Limiter -> Kafka -> Discord Notification).'
};

async function testRequest() {
  console.log(`Sending API request to: ${endpoint}`);
  console.log(`Using Bearer Token: ${token}`);
  console.log(`Payload:`, mockMessage);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(mockMessage)
    });

    const data = await response.json();
    console.log('\n--- API RESPONSE ---');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Success! The API successfully processed the submission.');
      console.log('\nNext checks to verify:');
      console.log('1. Open Dashboard: Go to http://localhost:3000 to verify the message appears (or click "Sync" if offline).');
      console.log('2. Verify Kafka Consumer: Look at your running consumer console to confirm it logged the consumed event.');
      console.log('3. Check Discord: Verify the notification embed has been posted to your channel.');
    } else {
      console.log('\n❌ API returned an error. Check the response logs above.');
    }
  } catch (error) {
    console.error('\n❌ Connection error:', error.message);
    console.log('Please ensure that the Next.js development server is active (running npm run dev on port 3000).');
  }
}

testRequest();
