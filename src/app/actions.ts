'use server';

import { markRead, toggleArchive, removeMessage, syncDatabases } from '@/lib/db-service';
import { revalidatePath } from 'next/cache';
import Database from 'better-sqlite3';
import path from 'path';

export async function triggerManualSync() {
  try {
    const success = await syncDatabases();
    revalidatePath('/');
    return success;
  } catch (error) {
    console.error('Failed to trigger manual sync:', error);
    return false;
  }
}

export async function markMessageAsRead(id: string) {
  try {
    await markRead(id);
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to mark message as read Server Action:', error);
  }
}

export async function toggleMessageArchive(id: string, currentStatus: string) {
  try {
    await toggleArchive(id, currentStatus);
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to toggle archive status Server Action:', error);
  }
}

export async function deleteMessage(id: string) {
  try {
    await removeMessage(id);
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete message Server Action:', error);
  }
}

export async function getStats() {
  try {
    const localDbPath = path.join(process.cwd(), 'local.db');
    const localDb = new Database(localDbPath);
    const total = (localDb.prepare("SELECT COUNT(*) as count FROM Message").get() as any).count;
    const unread = (localDb.prepare("SELECT COUNT(*) as count FROM Message WHERE status = 'unread'").get() as any).count;
    const archived = (localDb.prepare("SELECT COUNT(*) as count FROM Message WHERE status = 'archived'").get() as any).count;
    const inbox = total - archived;
    localDb.close();
    return { total, unread, archived, inbox };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { total: 0, unread: 0, archived: 0, inbox: 0 };
  }
}
