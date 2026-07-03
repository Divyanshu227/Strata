import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const apiToken = process.env.API_TOKEN || 'NOT_CONFIGURED';
  const discordConfigured = !!process.env.DISCORD_WEBHOOK_URL;

  return (
    <DashboardClient
      apiToken={apiToken}
      discordConfigured={discordConfigured}
    />
  );
}
