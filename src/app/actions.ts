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
 * Computes and returns mailbox statistics directly from Supabase PostgreSQL.
 */
export async function getStats() {
  try {
    console.log('[Server Action] Querying real-time stats from Supabase...');
    const total = await prisma.message.count();
    const unread = await prisma.message.count({ where: { status: 'unread' } });
    const archived = await prisma.message.count({ where: { status: 'archived' } });
    const inbox = total - archived;
    return { total, unread, archived, inbox };
  } catch (error) {
    console.error('[Server Action] Failed to fetch stats:', error);
    return { total: 0, unread: 0, archived: 0, inbox: 0 };
  }
}
