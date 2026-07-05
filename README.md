# 📬 Strata

**Strata** is an intelligent, multi-channel message routing and notification platform designed for modern portfolios, SaaS applications, and contact forms. 

Instead of relying on basic email for contact submissions, Strata gives you a dedicated Inbox Dashboard and automatically routes incoming messages directly to where you work: **Discord**, **Telegram**, and **Email**. Plus, it features built-in **AI Spam Detection** to keep your notifications clean.

---

## ✨ Key Features

- **Centralized Inbox Dashboard**: View, search, archive, and reply to all your contact form submissions from a beautiful, responsive web UI (recently refactored into a scalable component architecture).
- **Multi-Workspace Support**: Manage API keys and routing rules for multiple different websites/platforms from a single Strata instance.
- **TrustGate AI Integration**: Every incoming message is analyzed by TrustGate to detect spam, phishing, or toxic content. Get clear `Spam`, `Suspicious`, or `Safe` indicators with percentage scores.
- **Flexible Notification Routing**:
  - **Discord**: Route messages directly into a Discord channel via Webhooks.
  - **Telegram**: Send messages to your phone via a custom Telegram Bot.
  - **Email**: Fallback to standard SMTP email notifications (supports Gmail SMTP for reliable delivery).
- **Dual Architecture (Scale as you go)**:
  - **Serverless Mode**: Deploys seamlessly to platforms like Vercel with direct API routing.
  - **Enterprise Mode**: Supports Apache Kafka (`kafkajs`) and parallel background worker processes for high-throughput queues.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React 19, Vanilla CSS.
- **Backend**: Next.js API Routes (Node.js).
- **Database**: PostgreSQL on Supabase (via Prisma ORM & Supavisor Connection Pooling).
- **Message Broker**: Apache Kafka (Aiven) for async event streaming.
- **Rate Limiting**: Upstash Redis.
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
Create a `.env` file in the root directory.

> **⚠️ Supabase Important Note:** Supabase requires the **Connection Pooler URL** (IPv4) for Vercel/Render compatibility. Do *not* use the direct database URL. Ensure it looks like `aws-0-...pooler.supabase.com:6543`.

```env
# Database
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Rate Limiting
REDIS_URL="rediss://..."

# TrustGate Spam API
TRUSTGATE_API_URL="https://trustgateweb.netlify.app/api/v1/analyze"

# Kafka (Aiven)
KAFKA_BROKERS="..."
KAFKA_USERNAME="avnadmin"
KAFKA_PASSWORD="..."

# SMTP for Email Dispatch
SMTP_HOST="smtp.gmail.com"
SMTP_USER="youremail@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM='"Strata Portal" <youremail@gmail.com>'
```

### 3. Initialize the Database
Push the Prisma schema to your database to create the required tables.
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

### 5. Run Background Workers
Strata uses Kafka to process notifications asynchronously. Run the consumer in a separate terminal:
```bash
npm run consumer
```

---

## 🌍 Deployment Guide

Strata's architecture is split into two parts for optimal performance and cost-efficiency:

### 1. The Frontend & API (Vercel)
Deploy your Next.js application to Vercel. 
- Ensure all environment variables are added to Vercel.
- **Note on Updates:** If you update environment variables in Vercel, you must **Redeploy** the project for them to take effect.
- The `postinstall` script in `package.json` automatically generates the Prisma Client.

### 2. The Background Worker (Render / Railway)
Serverless functions (like Vercel) cannot run continuous background listeners. Host your Kafka consumer on a service like Render.
- **Build Command:** `npm install`
- **Start Command:** `npm run consumer`
- **Keep-Alive Server:** The worker script includes a built-in lightweight HTTP server listening on `process.env.PORT`. You can use a free service like [UptimeRobot](https://uptimerobot.com) to ping this URL every 10 minutes, completely bypassing Render's 15-minute free-tier shutdown!

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