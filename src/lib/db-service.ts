import { prisma } from './db';
import Database from 'better-sqlite3';
import path from 'path';

// Local SQLite cache file setup
const localDbPath = path.join(process.cwd(), 'local.db');
console.log(`[DEBUG] Initializing local SQLite cache database at: ${localDbPath}`);
const localDb = new Database(localDbPath);

// Initialize SQLite tables if they do not exist
console.log('[DEBUG] Running SQLite local table initialization...');
localDb.exec(`
  CREATE TABLE IF NOT EXISTS Message (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS PendingSync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- 'read' | 'archive' | 'unarchive' | 'delete' | 'create'
    messageId TEXT NOT NULL,
    status TEXT
  );
`);
console.log('[DEBUG] Local SQLite database initialization completed.');

/**
 * Checks if Supabase (PostgreSQL) is reachable and online.
 */
export async function isSupabaseOnline(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('[YOUR-PROJECT-REF]') || dbUrl.includes('[PASSWORD]')) {
    console.log('[DEBUG] [isSupabaseOnline] Connection URL not set or contains default placeholders.');
    return false;
  }
  
  console.log('[DEBUG] [isSupabaseOnline] Pinging Supabase PostgreSQL server...');
  try {
    // Run a quick query with a 2-second timeout to check connection
    const connectPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database Connection Timeout')), 2000)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('[DEBUG] [isSupabaseOnline] ✅ Connected successfully. Supabase is ONLINE.');
    return true;
  } catch (error) {
    console.warn('[DEBUG] [isSupabaseOnline] ❌ Connection failed. Operating in OFFLINE mode.', 
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

export async function syncDatabases(): Promise<boolean> {
  console.log('[DEBUG] [syncDatabases] Triggering database synchronization...');
  const online = await isSupabaseOnline();
  if (!online) {
    console.log('[DEBUG] [syncDatabases] ⚠️ System is offline. Sync skipped. Serving from local cache.');
    return false;
  }

  try {
    console.log('[DEBUG] [syncDatabases] System is online. Merging local SQLite and Supabase PostgreSQL...');

    // 1. Process and execute pending local offline actions on Supabase
    const pendingActions = localDb.prepare("SELECT * FROM PendingSync ORDER BY id ASC").all() as any[];
    console.log(`[DEBUG] [syncDatabases] Found ${pendingActions.length} pending offline actions in SQLite queue.`);
    
    if (pendingActions.length > 0) {
      for (const action of pendingActions) {
        console.log(`[DEBUG] [syncDatabases] Syncing pending action: ID=${action.id}, Action=${action.action}, MessageID=${action.messageId}`);
        try {
          if (action.action === 'read') {
            await prisma.message.update({
              where: { id: action.messageId },
              data: { status: 'read' }
            });
            console.log(`[DEBUG] [syncDatabases]   - Successfully marked read on Supabase: ${action.messageId}`);
          } else if (action.action === 'archive') {
            await prisma.message.update({
              where: { id: action.messageId },
              data: { status: 'archived' }
            });
            console.log(`[DEBUG] [syncDatabases]   - Successfully archived on Supabase: ${action.messageId}`);
          } else if (action.action === 'unarchive') {
            await prisma.message.update({
              where: { id: action.messageId },
              data: { status: action.status || 'read' }
            });
            console.log(`[DEBUG] [syncDatabases]   - Successfully unarchived on Supabase: ${action.messageId}`);
          } else if (action.action === 'delete') {
            await prisma.message.delete({
              where: { id: action.messageId }
            }).catch(() => {});
            console.log(`[DEBUG] [syncDatabases]   - Successfully deleted on Supabase: ${action.messageId}`);
          } else if (action.action === 'create') {
            const localMsg = localDb.prepare("SELECT * FROM Message WHERE id = ?").get(action.messageId) as any;
            if (localMsg) {
              await prisma.message.create({
                data: {
                  id: localMsg.id,
                  name: localMsg.name,
                  email: localMsg.email,
                  subject: localMsg.subject,
                  message: localMsg.message,
                  status: localMsg.status,
                  createdAt: new Date(localMsg.createdAt)
                }
              }).catch(() => {});
              console.log(`[DEBUG] [syncDatabases]   - Successfully pushed offline submission to Supabase: ${action.messageId}`);
            }
          }

          // Successfully processed: remove from queue
          localDb.prepare("DELETE FROM PendingSync WHERE id = ?").run(action.id);
        } catch (actionErr: any) {
          console.error(`[DEBUG] [syncDatabases] ❌ Failed to execute pending action ID ${action.id} on Supabase:`, actionErr.message);
        }
      }
    }

    // 2. Fetch all messages from Supabase and SQLite
    console.log('[DEBUG] [syncDatabases] Pulling messages from Supabase PostgreSQL...');
    const supabaseMessages = await prisma.message.findMany();
    const localMessages = localDb.prepare("SELECT * FROM Message").all() as any[];

    console.log(`[DEBUG] [syncDatabases] Server Messages: ${supabaseMessages.length}, Cache Messages: ${localMessages.length}`);

    const supabaseMap = new Map(supabaseMessages.map(m => [m.id, m]));
    const localMap = new Map(localMessages.map(m => [m.id, m]));

    // 3. Bidirectional Sync & Merge Transaction
    console.log('[DEBUG] [syncDatabases] Merging databases in a single transaction...');
    const syncTx = localDb.transaction(() => {
      // A. Supabase -> SQLite: Download and Update
      for (const sbMsg of supabaseMessages) {
        const localMsg = localMap.get(sbMsg.id);
        if (!localMsg) {
          // Message exists on Supabase but not SQLite -> Download it
          localDb.prepare(`
            INSERT INTO Message (id, name, email, subject, message, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            sbMsg.id,
            sbMsg.name,
            sbMsg.email,
            sbMsg.subject,
            sbMsg.message,
            sbMsg.status,
            sbMsg.createdAt.toISOString()
          );
          console.log(`[DEBUG] [syncDatabases] downloaded message ${sbMsg.id} from Supabase.`);
        } else {
          // Message exists in both -> align local status to server (source of truth)
          if (localMsg.status !== sbMsg.status) {
            localDb.prepare("UPDATE Message SET status = ? WHERE id = ?").run(sbMsg.status, sbMsg.id);
            console.log(`[DEBUG] [syncDatabases] aligned local status of ${sbMsg.id} with Supabase.`);
          }
        }
      }

      // B. SQLite -> Supabase: Check for local-only messages and upload them
      for (const localMsg of localMessages) {
        if (!supabaseMap.has(localMsg.id)) {
          const isDeletedPending = localDb.prepare("SELECT 1 FROM PendingSync WHERE action = 'delete' AND messageId = ?").get(localMsg.id);
          if (!isDeletedPending) {
            console.log(`[DEBUG] [syncDatabases] Uploading local-only message ${localMsg.id} to Supabase...`);
            // Run asynchronously outside transaction to avoid SQLite lock blocks with network awaits
            prisma.message.create({
              data: {
                id: localMsg.id,
                name: localMsg.name,
                email: localMsg.email,
                subject: localMsg.subject,
                message: localMsg.message,
                status: localMsg.status,
                createdAt: new Date(localMsg.createdAt)
              }
            }).catch(e => console.warn(`[DEBUG] [syncDatabases] Local upload failed for ${localMsg.id}:`, e.message));
          }
        }
      }

      // C. Handle Deletes: Prune local entries if deleted on Supabase
      for (const localMsg of localMessages) {
        if (!supabaseMap.has(localMsg.id)) {
          const isCreatedPending = localDb.prepare("SELECT 1 FROM PendingSync WHERE action = 'create' AND messageId = ?").get(localMsg.id);
          const isDeletedPending = localDb.prepare("SELECT 1 FROM PendingSync WHERE action = 'delete' AND messageId = ?").get(localMsg.id);
          if (!isCreatedPending && !isDeletedPending) {
            localDb.prepare("DELETE FROM Message WHERE id = ?").run(localMsg.id);
            console.log(`[DEBUG] [syncDatabases] pruned local message ${localMsg.id} (deleted on server).`);
          }
        }
      }
    });

    syncTx();
    console.log('[DEBUG] [syncDatabases] Bidirectional sync completed successfully.');
    return true;
  } catch (error: any) {
    console.error('[DEBUG] [syncDatabases] ❌ Error during synchronization:', error.message);
    return false;
  }
}

/**
 * Returns all messages, prioritizing Supabase sync and falling back to SQLite cache.
 */
export async function getMessages() {
  console.log('[DEBUG] [getMessages] Invoked getMessages(). Checking connection & syncing...');
  const isOnline = await syncDatabases();
  
  // Read sorted entries from local SQLite cache
  console.log('[DEBUG] [getMessages] Querying local SQLite cache messages table...');
  const messages = localDb.prepare("SELECT * FROM Message ORDER BY createdAt DESC").all() as any[];
  console.log(`[DEBUG] [getMessages] Read ${messages.length} messages from local SQLite.`);
  
  const mappedMessages = messages.map(m => ({
    ...m,
    createdAt: new Date(m.createdAt)
  }));

  return {
    messages: mappedMessages,
    isOffline: !isOnline
  };
}

/**
 * Save incoming message from contact endpoint.
 */
export async function saveIncomingMessage(data: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}) {
  const id = crypto.randomUUID ? crypto.randomUUID() : 'msg_' + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date();
  console.log(`[DEBUG] [saveIncomingMessage] New message received. ID assigned: ${id}`);

  const msgPayload = {
    id,
    name: data.name,
    email: data.email,
    subject: data.subject || null,
    message: data.message,
    status: 'unread',
    createdAt: createdAt.toISOString()
  };

  // Write to local cache immediately
  console.log('[DEBUG] [saveIncomingMessage] Writing submission to local SQLite cache database...');
  localDb.prepare(`
    INSERT INTO Message (id, name, email, subject, message, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    msgPayload.id,
    msgPayload.name,
    msgPayload.email,
    msgPayload.subject,
    msgPayload.message,
    msgPayload.status,
    msgPayload.createdAt
  );
  console.log('[DEBUG] [saveIncomingMessage] Written to SQLite cache.');

  const online = await isSupabaseOnline();
  if (online) {
    try {
      console.log('[DEBUG] [saveIncomingMessage] Writing submission to Supabase PostgreSQL database...');
      const saved = await prisma.message.create({
        data: {
          id: msgPayload.id,
          name: msgPayload.name,
          email: msgPayload.email,
          subject: msgPayload.subject,
          message: msgPayload.message,
          status: msgPayload.status,
          createdAt: createdAt
        }
      });
      console.log('[DEBUG] [saveIncomingMessage] ✅ Successfully stored on Supabase.');
      return saved;
    } catch (error: any) {
      console.error('[DEBUG] [saveIncomingMessage] ❌ Failed to write to Supabase. Queuing push action...', error.message);
      localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('create', ?)").run(id);
      return { ...msgPayload, createdAt };
    }
  } else {
    // Offline: queue creation task
    console.log('[DEBUG] [saveIncomingMessage] ⚠️ Offline. Queuing push action in PendingSync SQLite table...');
    localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('create', ?)").run(id);
    return { ...msgPayload, createdAt };
  }
}

/**
 * Mark a message as read.
 */
export async function markRead(id: string) {
  console.log(`[DEBUG] [markRead] Invoked for message ID: ${id}`);
  const online = await isSupabaseOnline();

  // Update SQLite locally first
  console.log(`[DEBUG] [markRead] Updating status to 'read' in local SQLite for: ${id}`);
  localDb.prepare("UPDATE Message SET status = 'read' WHERE id = ?").run(id);

  if (online) {
    try {
      console.log(`[DEBUG] [markRead] Updating status to 'read' in Supabase for: ${id}`);
      await prisma.message.update({
        where: { id },
        data: { status: 'read' }
      });
      console.log('[DEBUG] [markRead] ✅ Status updated in Supabase.');
    } catch (error: any) {
      console.warn('[DEBUG] [markRead] ❌ Supabase write failed. Queuing read action:', error.message);
      localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('read', ?)").run(id);
    }
  } else {
    console.log('[DEBUG] [markRead] Offline. Queuing read action in PendingSync table.');
    localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('read', ?)").run(id);
  }
}

/**
 * Toggle archiving status.
 */
export async function toggleArchive(id: string, currentStatus: string) {
  console.log(`[DEBUG] [toggleArchive] Invoked for ID: ${id}, Current Status: ${currentStatus}`);
  const online = await isSupabaseOnline();
  const nextStatus = currentStatus === 'archived' ? 'read' : 'archived';
  const actionType = currentStatus === 'archived' ? 'unarchive' : 'archive';

  // Update SQLite locally first
  console.log(`[DEBUG] [toggleArchive] Updating status to '${nextStatus}' in local SQLite for: ${id}`);
  localDb.prepare("UPDATE Message SET status = ? WHERE id = ?").run(nextStatus, id);

  if (online) {
    try {
      console.log(`[DEBUG] [toggleArchive] Updating status to '${nextStatus}' in Supabase for: ${id}`);
      await prisma.message.update({
        where: { id },
        data: { status: nextStatus }
      });
      console.log('[DEBUG] [toggleArchive] ✅ Status updated in Supabase.');
    } catch (error: any) {
      console.warn('[DEBUG] [toggleArchive] ❌ Supabase write failed. Queuing action:', error.message);
      localDb.prepare("INSERT INTO PendingSync (action, messageId, status) VALUES (?, ?, ?)")
        .run(actionType, id, nextStatus);
    }
  } else {
    console.log('[DEBUG] [toggleArchive] Offline. Queuing archive/unarchive action in PendingSync.');
    localDb.prepare("INSERT INTO PendingSync (action, messageId, status) VALUES (?, ?, ?)")
      .run(actionType, id, nextStatus);
  }
}

/**
 * Delete a message permanently.
 */
export async function removeMessage(id: string) {
  console.log(`[DEBUG] [removeMessage] Invoked for ID: ${id}`);
  const online = await isSupabaseOnline();

  // Delete from SQLite locally first
  console.log(`[DEBUG] [removeMessage] Deleting message from local SQLite: ${id}`);
  localDb.prepare("DELETE FROM Message WHERE id = ?").run(id);

  if (online) {
    try {
      console.log(`[DEBUG] [removeMessage] Deleting message from Supabase: ${id}`);
      await prisma.message.delete({
        where: { id }
      });
      console.log('[DEBUG] [removeMessage] ✅ Message deleted from Supabase.');
    } catch (error: any) {
      console.warn('[DEBUG] [removeMessage] ❌ Supabase delete failed. Queuing delete action:', error.message);
      localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('delete', ?)").run(id);
    }
  } else {
    console.log('[DEBUG] [removeMessage] Offline. Queuing delete action in PendingSync.');
    localDb.prepare("INSERT INTO PendingSync (action, messageId) VALUES ('delete', ?)").run(id);
  }
}
