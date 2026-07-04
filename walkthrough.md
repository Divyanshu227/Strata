# Walkthrough: Strata - Universal Communication Infrastructure

We have successfully migrated the application to a high-availability, multi-tenant communication gateway (**Strata**):

1. **Multi-Tenant Relationships**: Re-structured the database schema from single-tenant messages to a dynamic relational map where every `Message` is associated with a distinct `Project` model (cascade deleted on cascade drops).
2. **Project-Scoped Security**: Authentication validates client key headers (`x-project-id` and `Authorization: Bearer <api_key>`) directly against the database credentials before saving submissions.
3. **Multi-Channel Parallel Workers**: Background processing consumes events from the `strata-messages` Kafka topic and dispatches alerts concurrently through parallel handlers:
   * **Discord Webhook**: Sends styled embed notifications.
   * **Telegram Bot**: Sends markdown alert updates to target chats.
   * **Email Recipient**: Dispatches SMTP emails (falling back to mock console logs if local configs are omitted).
4. **Optional AI Metrics Layer**: Ingestion runs a regex-based parser that classifies incoming messages (spam score probability, urgency priority levels, and text sentiment emoji tags) without blocking key storage flows if errors occur (fails open).
5. **Interactive Toggles Dashboard**: Overhauled settings to let you toggle active states and configure tokens for all three notification channels, write details to Supabase Postgres on save, and display AI analysis telemetry cards on message views.

---

## 🚀 How to Run and Test

### Step 1: Start Zookeeper, Kafka, and Redis Brokers
Spin up local docker compose brokers:
```bash
docker compose up -d
```

### Step 2: Seed the Default Project
Execute the seeding script to drop the legacy single-tenant structures, initialize your schema on Supabase, and insert the default project (`default-project-uuid`) and dummy messages:
```bash
node scripts/seed-mock.js
```

### Step 3: Run the Parallel Consumer Workers
Start the background consumer script listening to the event pipeline:
```bash
npm run consumer
```

### Step 4: Run the Next.js Dashboard
Start your local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
* In the **Inbox view**, click any card to inspect the **AI Telemetry & Analysis** metrics panel (Sentiment rating, Spam score, and Priority level).
* Go to **Integration & Settings** to toggle Discord, Telegram, and Email alerts, fill in target variables, and click **Save Settings** to synchronize configuration fields on Supabase.

---

## 📬 Testing Ingestion via cURL
You can send a test submission to the endpoint using a standard terminal POST request:

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "x-project-id: default-project-uuid" \
  -H "Authorization: Bearer strata_token_default_123" \
  -d '{
    "name": "Sarah Connor",
    "email": "sarah.c@resistance.io",
    "subject": "Urgent consultation",
    "message": "Hi, I immediately need your help to configure a secure network node. Please get back to me ASAP!"
  }'
```
On submission:
1. The message will save to Supabase Postgres.
2. The regex classifier will automatically identify this as `priority: "high"` due to `"immediately"`/`"ASAP"` keywords, and `sentiment: "neutral"`.
3. An event is published to Kafka, triggering the background consumer workers to route notifications to your active channels!
