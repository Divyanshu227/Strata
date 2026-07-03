import { getMessages } from '@/lib/db-service';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let messages = [];
  let isOffline = true;
  
  try {
    const res = await getMessages();
    messages = res.messages;
    isOffline = res.isOffline;
  } catch (error) {
    console.error('Error fetching messages in Page Server Component:', error);
  }

  const apiToken = process.env.API_TOKEN || 'NOT_CONFIGURED';
  const discordConfigured = !!process.env.DISCORD_WEBHOOK_URL;

  return (
    <DashboardClient
      initialMessages={messages}
      apiToken={apiToken}
      discordConfigured={discordConfigured}
      isOffline={isOffline}
    />
  );
}
