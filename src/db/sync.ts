import { db, type Player, type Subscription, type Attendance, type Payment, type Expense } from './db';
import { supabase } from '../supabaseClient';
import { type Table } from 'dexie';

// ----------------------------------------------------
// Mapping Helpers (Dexie camelCase <-> Supabase snake_case)
// ----------------------------------------------------

export function dbToPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    playerNumber: row.player_number,
    birthYear: row.birth_year,
    mobile: row.mobile,
    club: row.club,
    sport: row.sport,
    position: row.position,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function playerToDb(p: Player) {
  return {
    id: p.id,
    name: p.name,
    player_number: p.playerNumber,
    birth_year: p.birthYear,
    mobile: p.mobile,
    club: p.club,
    sport: p.sport,
    position: p.position,
    is_deleted: p.isDeleted,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function dbToSubscription(row: any): Subscription {
  return {
    id: row.id,
    playerId: row.player_id,
    packageType: row.package_type,
    price: Number(row.price),
    totalSessions: row.total_sessions,
    sessionsUsed: row.sessions_used,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as 'active' | 'expired',
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function subscriptionToDb(s: Subscription) {
  return {
    id: s.id,
    player_id: s.playerId,
    package_type: s.packageType,
    price: s.price,
    total_sessions: s.totalSessions,
    sessions_used: s.sessionsUsed,
    start_date: s.startDate,
    end_date: s.endDate,
    status: s.status,
    is_deleted: s.isDeleted,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function dbToAttendance(row: any): Attendance {
  return {
    id: row.id,
    playerId: row.player_id,
    subscriptionId: row.subscription_id || undefined,
    date: row.date,
    time: row.time,
    type: row.type as 'subscription' | 'daily',
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function attendanceToDb(a: Attendance) {
  return {
    id: a.id,
    player_id: a.playerId,
    subscription_id: a.subscriptionId || null,
    date: a.date,
    time: a.time,
    type: a.type,
    is_deleted: a.isDeleted,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

export function dbToPayment(row: any): Payment {
  return {
    id: row.id,
    playerId: row.player_id,
    subscriptionId: row.subscription_id || undefined,
    amount: Number(row.amount),
    date: row.date,
    type: row.type as 'subscription' | 'daily',
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function paymentToDb(p: Payment) {
  return {
    id: p.id,
    player_id: p.playerId,
    subscription_id: p.subscriptionId || null,
    amount: p.amount,
    date: p.date,
    type: p.type,
    is_deleted: p.isDeleted,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function dbToExpense(row: any): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    date: row.date,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function expenseToDb(e: Expense) {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    is_deleted: e.isDeleted,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

// ----------------------------------------------------
// Sync Status State and Listeners
// ----------------------------------------------------

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let syncStatus: SyncStatus = 'synced';
const listeners: ((status: SyncStatus) => void)[] = [];

export function getSyncStatus(): SyncStatus {
  if (!navigator.onLine) return 'offline';
  return syncStatus;
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  listeners.push(listener);
  listener(getSyncStatus());
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function updateSyncStatus(status: SyncStatus) {
  syncStatus = status;
  const current = getSyncStatus();
  listeners.forEach((l) => l(current));
}

// ----------------------------------------------------
// Core Sync Actions (Push & Pull)
// ----------------------------------------------------

let isSyncing = false;

export async function syncData() {
  if (isSyncing) return;
  if (!navigator.onLine) {
    updateSyncStatus('offline');
    return;
  }

  isSyncing = true;
  updateSyncStatus('syncing');

  try {
    // 1. Push Phase: Upload items in the local sync queue
    const queue = await db.syncQueue.orderBy('id').toArray();
    for (const item of queue) {
      let mappedPayload: any;
      const tableName = 'pf_' + (item.tableName === 'expenses' ? 'expenses' : item.tableName);

      switch (item.tableName) {
        case 'players':
          mappedPayload = playerToDb(item.payload);
          break;
        case 'subscriptions':
          mappedPayload = subscriptionToDb(item.payload);
          break;
        case 'attendance':
          mappedPayload = attendanceToDb(item.payload);
          break;
        case 'payments':
          mappedPayload = paymentToDb(item.payload);
          break;
        case 'expenses':
          mappedPayload = expenseToDb(item.payload);
          break;
      }

      // Upsert into Supabase (insert or update on conflict)
      const { error } = await supabase.from(tableName).upsert(mappedPayload);

      if (error) {
        console.error(`Error syncing record in ${tableName}:`, error);
        updateSyncStatus('error');
        isSyncing = false;
        return; // Stop queue processing to maintain database consistency/order
      }

      // Remove item from local queue on success
      await db.syncQueue.delete(item.id!);
    }

    // 2. Pull Phase: Download modifications made on remote since last sync
    const lastSyncTime = localStorage.getItem('pf_last_sync_time') || new Date(0).toISOString();
    const newSyncTime = new Date().toISOString();

    const tables = [
      { name: 'players', dbName: 'pf_players', mapper: dbToPlayer, localTable: db.players },
      { name: 'subscriptions', dbName: 'pf_subscriptions', mapper: dbToSubscription, localTable: db.subscriptions },
      { name: 'attendance', dbName: 'pf_attendance', mapper: dbToAttendance, localTable: db.attendance },
      { name: 'payments', dbName: 'pf_payments', mapper: dbToPayment, localTable: db.payments },
      { name: 'expenses', dbName: 'pf_expenses', mapper: dbToExpense, localTable: db.expenses },
    ];

    for (const t of tables) {
      const { data, error } = await supabase
        .from(t.dbName)
        .select('*')
        .gt('updated_at', lastSyncTime);

      if (error) {
        console.error(`Error pulling from ${t.dbName}:`, error);
        updateSyncStatus('error');
        isSyncing = false;
        return;
      }

      if (data && data.length > 0) {
        for (const row of data) {
          const remoteObj = t.mapper(row);

          // Check if there is an unsynced local change for this record
          const pending = await db.syncQueue
            .where('recordId')
            .equals(remoteObj.id)
            .toArray();

          if (pending.length === 0) {
            // Overwrite locally since there are no local edits pending upload
            await (t.localTable as Table<any>).put(remoteObj);
          }
        }
      }
    }

    // Store sync timestamp
    localStorage.setItem('pf_last_sync_time', newSyncTime);
    updateSyncStatus('synced');
  } catch (err) {
    console.error('Sync process failed:', err);
    updateSyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

// ----------------------------------------------------
// Database Modification Wrappers (Ensure queueing)
// ----------------------------------------------------

export async function trackWrite<T extends { id: string; updatedAt: string }>(
  tableName: 'players' | 'subscriptions' | 'attendance' | 'payments' | 'expenses',
  record: T
) {
  record.updatedAt = new Date().toISOString();

  // 1. Save locally in IndexedDB
  const localTable = db[tableName] as Table<any>;
  await localTable.put(record);

  // 2. Queue in local sync table
  await db.syncQueue.add({
    tableName,
    action: 'UPDATE',
    recordId: record.id,
    payload: record,
    createdAt: Date.now(),
  });

  // 3. Trigger background synchronization
  triggerSync();
}

// Trigger background sync
let syncDebounceTimer: any = null;
export function triggerSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncData();
  }, 1000); // Debounce by 1 second to batch quick modifications
}

// ----------------------------------------------------
// Event Listeners for Network Events
// ----------------------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('App is online. Starting sync...');
    syncData();
  });
  window.addEventListener('offline', () => {
    console.log('App went offline.');
    updateSyncStatus('offline');
  });

  // Initial sync attempt after load
  setTimeout(() => {
    syncData();
  }, 2000);

  // Periodic sync every 30 seconds
  setInterval(() => {
    syncData();
  }, 30000);
}
