'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Marks a message as read in Supabase PostgreSQL.
 */
export async function markMessageAsRead(id: string) {
  try {
    console.log(`[Server Action] Marking message ${id} as read...`);
    const updated = await prisma.message.update({
      where: { id },
      data: { status: 'read' },
    });
    revalidatePath('/');
    return updated;
  } catch (error) {
    console.error('[Server Action] Failed to mark message as read:', error);
    throw new Error('Database connection failed (you might be offline).');
  }
}

/**
 * Toggles the archived status of a message in Supabase PostgreSQL.
 */
export async function toggleMessageArchive(id: string, currentStatus: string) {
  try {
    const nextStatus = currentStatus === 'archived' ? 'read' : 'archived';
    console.log(`[Server Action] Toggling archive status for ${id} to ${nextStatus}...`);
    const updated = await prisma.message.update({
      where: { id },
      data: { status: nextStatus },
    });
    revalidatePath('/');
    return updated;
  } catch (error) {
    console.error('[Server Action] Failed to toggle archive status:', error);
    throw new Error('Database connection failed (you might be offline).');
  }
}

/**
 * Deletes a message permanently from Supabase PostgreSQL.
 */
export async function deleteMessage(id: string) {
  try {
    console.log(`[Server Action] Deleting message ${id} from Supabase...`);
    const deleted = await prisma.message.delete({
      where: { id },
    });
    revalidatePath('/');
    return deleted;
  } catch (error) {
    console.error('[Server Action] Failed to delete message:', error);
    throw new Error('Database connection failed (you might be offline).');
  }
}

/**
 * Computes and returns project-specific statistics directly from Supabase PostgreSQL.
 */
export async function getStats(projectId: string) {
  try {
    console.log(`[Server Action] Querying real-time stats for project ${projectId} from Supabase...`);
    const total = await prisma.message.count({ where: { projectId } });
    const unread = await prisma.message.count({ where: { projectId, status: 'unread' } });
    const archived = await prisma.message.count({ where: { projectId, status: 'archived' } });
    const inbox = total - archived;
    return { total, unread, archived, inbox };
  } catch (error) {
    console.error('[Server Action] Failed to fetch stats:', error);
    return { total: 0, unread: 0, archived: 0, inbox: 0 };
  }
}

/**
 * Updates settings and configurations for a specific Project.
 */
export async function updateProjectSettings(projectId: string, data: {
  discordEnabled?: boolean;
  discordWebhook?: string | null;
  telegramEnabled?: boolean;
  telegramToken?: string | null;
  telegramChatId?: string | null;
  emailEnabled?: boolean;
  emailRecipient?: string | null;
}) {
  try {
    console.log(`[Server Action] Updating settings for project ${projectId}...`);
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        discordEnabled: data.discordEnabled,
        discordWebhook: data.discordWebhook,
        telegramEnabled: data.telegramEnabled,
        telegramToken: data.telegramToken,
        telegramChatId: data.telegramChatId,
        emailEnabled: data.emailEnabled,
        emailRecipient: data.emailRecipient,
      }
    });
    revalidatePath('/');
    return updated;
  } catch (error) {
    console.error('[Server Action] Failed to update project settings:', error);
    throw new Error('Database connection failed (you might be offline).');
  }
}

/**
 * Retrieves the default project from Supabase, creating it dynamically if missing.
 */
export async function getOrCreateDefaultProject() {
  try {
    let project = await prisma.project.findUnique({
      where: { id: 'default-project-uuid' }
    });
    if (!project) {
      console.log('[Server Action] Default project not found. Seeding it dynamically...');
      project = await prisma.project.create({
        data: {
          id: 'default-project-uuid',
          name: 'My Portfolio',
          apiKey: 'strata_token_default_123',
          discordEnabled: false,
          telegramEnabled: false,
          emailEnabled: false
        }
      });
    }
    return project;
  } catch (error) {
    console.error('[Server Action] Failed to retrieve default project:', error);
    return {
      id: 'default-project-uuid',
      name: 'My Portfolio (Offline Fallback)',
      apiKey: 'strata_token_default_123',
      discordEnabled: false,
      discordWebhook: null,
      telegramEnabled: false,
      telegramToken: null,
      telegramChatId: null,
      emailEnabled: false,
      emailRecipient: null,
      createdAt: new Date()
    };
  }
}
