import Dexie, { type Table } from 'dexie';

export interface Player {
  id: string; // UUID
  name: string;
  playerNumber: string; // unique
  birthYear: number;
  mobile: string;
  club: string;
  sport: string;
  position: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string; // UUID
  playerId: string;
  packageType: string; // e.g. '4_sessions', '6_sessions', '8_sessions', '12_sessions', '16_sessions', '1_session', 'daily'
  price: number;
  totalSessions: number; // e.g. 4, 6, 8, 12, 16, 1, 0
  sessionsUsed: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'expired';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string; // UUID
  playerId: string;
  subscriptionId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'subscription' | 'daily';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string; // UUID
  playerId: string;
  subscriptionId?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'subscription' | 'daily';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string; // UUID
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number; // Auto-incrementing local ID
  tableName: 'players' | 'subscriptions' | 'attendance' | 'payments' | 'expenses';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: any;
  createdAt: number;
}

class PeakForceDatabase extends Dexie {
  players!: Table<Player>;
  subscriptions!: Table<Subscription>;
  attendance!: Table<Attendance>;
  payments!: Table<Payment>;
  expenses!: Table<Expense>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('PeakForceGymDB');
    this.version(1).stores({
      players: 'id, name, playerNumber, birthYear, mobile, club, sport, position, isDeleted, createdAt, updatedAt',
      subscriptions: 'id, playerId, packageType, price, totalSessions, sessionsUsed, startDate, endDate, status, isDeleted, createdAt, updatedAt',
      attendance: 'id, playerId, subscriptionId, date, time, type, isDeleted, createdAt, updatedAt',
      payments: 'id, playerId, subscriptionId, amount, date, type, isDeleted, createdAt, updatedAt',
      expenses: 'id, description, amount, date, isDeleted, createdAt, updatedAt',
      syncQueue: '++id, tableName, action, recordId, createdAt'
    });
  }
}

export const db = new PeakForceDatabase();

// Helper to generate UUIDs locally
export function generateUUID(): string {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
