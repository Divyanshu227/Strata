interface MessagePayload {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

export async function sendDiscordNotification(payload: MessagePayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Discord webhook URL not configured, skipping notification.');
    return;
  }

  try {
    const embed = {
      title: '📬 New Message Received!',
      color: 5814783, // Elegant purplish/blue color (#58BFBF or custom HSL)
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
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Strata Portfolio Notifier',
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

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    console.log('Discord notification sent successfully.');
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
