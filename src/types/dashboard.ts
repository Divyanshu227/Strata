export interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified?: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  apiKey: string;
  discordEnabled: boolean;
  discordWebhook: string | null;
  telegramEnabled: boolean;
  telegramToken: string | null;
  telegramChatId: string | null;
  emailEnabled: boolean;
  emailRecipient: string | null;
  platform?: string | null;
  platformUrl?: string | null;
}

export interface Message {
  id: string;
  projectId: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  spamScore?: number | null;
  priority?: string | null;
  sentiment?: string | null;
}
