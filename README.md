# 📬 Strata

**Strata** is an intelligent, multi-channel message routing and notification platform designed for modern portfolios, SaaS applications, and contact forms. 

Instead of relying on basic email for contact submissions, Strata gives you a dedicated Inbox Dashboard and automatically routes incoming messages directly to where you work: **Discord**, **Telegram**, and **Email**. Plus, it features built-in **AI Spam Detection** to keep your notifications clean.

---

## ✨ Key Features

- **Centralized Inbox Dashboard**: View, search, archive, and reply to all your contact form submissions from a beautiful, responsive web UI.
- **Multi-Workspace Support**: Manage API keys and routing rules for multiple different websites/platforms from a single Strata instance.
- **TrustGate AI Integration**: Every incoming message is analyzed by TrustGate to detect spam, phishing, or toxic content. Get clear `Spam`, `Suspicious`, or `Safe` indicators with percentage scores.
- **Flexible Notification Routing**:
  - **Discord**: Route messages directly into a Discord channel via Webhooks.
  - **Telegram**: Send messages to your phone via a custom Telegram Bot.
  - **Email**: Fallback to standard SMTP email notifications.
- **Dual Architecture (Scale as you go)**:
  - **Serverless Mode**: Deploys seamlessly to platforms like Vercel with direct API routing.
  - **Enterprise Mode**: Supports Apache Kafka (`kafkajs`) and parallel background worker processes for high-throughput queues.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React 19, Framer Motion, Vanilla CSS.
- **Backend**: Next.js API Routes (Node.js).
- **Database**: PostgreSQL (via Prisma ORM). Supports local fallback to SQLite/Better-SQLite3.
- **Message Broker (Optional)**: Apache Kafka.
- **Integrations**: Discord Webhooks, Telegram Bot API, Nodemailer, TrustGate API.

---

## 🚀 Getting Started (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/strata.git
cd strata
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory. You can use a local SQLite database for quick testing, or connect to a real PostgreSQL instance.

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/strata"

# TrustGate Spam API
TRUSTGATE_API_URL="https://trustgateweb.netlify.app/api/v1/analyze"

# Optional: Kafka (Leave empty to use direct Serverless Dispatch mode)
KAFKA_BROKERS=""
```

### 3. Initialize the Database
Push the Prisma schema to your database to create the required tables.
```bash
npx prisma db push
```

*(Optional) Seed the database with mock data:*
```bash
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

### 5. (Optional) Run Background Workers
If you are using Kafka (Enterprise Mode), you need to run the background consumer in a separate terminal:
```bash
npm run consumer
```

---

## 🔌 API Integration

To send a message from your website's contact form to Strata, make a simple `POST` request:

**Endpoint:** `POST /api/messages`

**Headers:**
- `Content-Type: application/json`
- `x-project-id: <YOUR_PROJECT_ID>`
- `Authorization: Bearer <YOUR_PROJECT_API_KEY>`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Freelance Inquiry",
  "message": "I would love to hire you for a project!"
}
```

---

## ☁️ Deployment

Strata is built to be deployed anywhere. For a complete guide on how to deploy Strata (including both Serverless and Kafka-based approaches), please see the **[Deployment Guide](deployment.md)**.
