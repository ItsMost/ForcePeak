import { db, type Player, type Subscription, type Attendance, type Payment, type Expense, generateUUID } from './db';
import { trackWrite } from './sync';

// ----------------------------------------------------
// Subscription Packages & Pricing Definitions
// ----------------------------------------------------

export interface GymPackage {
  id: string;
  name: string;
  sessions: number;
  price: number;
  validityDays: number;
  description: string;
}

export const GYM_PACKAGES: GymPackage[] = [
  { id: 'pkg_4', name: '4 حصص', sessions: 4, price: 750, validityDays: 14, description: 'صلاحية أسبوعين' },
  { id: 'pkg_6', name: '6 حصص', sessions: 6, price: 1050, validityDays: 14, description: 'صلاحية أسبوعين' },
  { id: 'pkg_8', name: '8 حصص', sessions: 8, price: 1450, validityDays: 30, description: 'شهر كامل' },
  { id: 'pkg_12', name: '12 حصة', sessions: 12, price: 2100, validityDays: 30, description: 'شهر كامل' },
  { id: 'pkg_16', name: '16 حصة', sessions: 16, price: 2800, validityDays: 30, description: 'شهر كامل' },
  { id: 'pkg_1', name: 'حصة أكاديمية', sessions: 1, price: 250, validityDays: 7, description: 'أكاديميات مخصصة' },
];

export const DAILY_ENTRY_FEE = 60; // تكلفة الحصة للاعبين بدون اشتراك

// ----------------------------------------------------
// Date Utilities
// ----------------------------------------------------

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`; // YYYY-MM
}

export function formatMonthArabic(monthStr: string): string {
  // input: YYYY-MM
  const [_, m] = monthStr.split('-');
  const months: Record<string, string> = {
    '01': 'يناير',
    '02': 'فبراير',
    '03': 'مارس',
    '04': 'أبريل',
    '05': 'مايو',
    '06': 'يونيو',
    '07': 'يوليو',
    '08': 'أغسطس',
    '09': 'سبتمبر',
    '10': 'أكتوبر',
    '11': 'نوفمبر',
    '12': 'ديسمبر'
  };
  return months[m] || monthStr;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// Database Seeding (Mock Data)
// ----------------------------------------------------

export async function seedMockDataIfEmpty() {
  const wasCleared = localStorage.getItem('db_mock_cleared_v5');
  if (!wasCleared) {
    try {
      console.log('Clearing database of mock players and resolving sync queue conflicts...');
      await db.players.clear();
      await db.subscriptions.clear();
      await db.payments.clear();
      await db.attendance.clear();
      await db.expenses.clear();
      await db.syncQueue.clear();
      localStorage.removeItem('pf_last_sync_time');
      localStorage.setItem('db_mock_cleared_v5', 'true');
      console.log('Database successfully cleared. Starting clean!');
    } catch (e) {
      console.error('Failed to clear database tables:', e);
    }
  }
}

// ----------------------------------------------------
// CSV / Excel Export Utilities
// ----------------------------------------------------

export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  // Prefix UTF-8 BOM to make Excel display Arabic characters correctly
  const BOM = '\uFEFF';
  const allRows = [headers, ...rows];
  const csvContent = BOM + allRows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sendWhatsAppMessage(mobile: string, name: string, sport: string, isReminder: boolean) {
  if (!mobile) {
    alert('رقم الموبايل غير مسجل لهذا اللاعب!');
    return;
  }
  let cleanMobile = mobile.replace(/[\s\+-]/g, '');
  if (!cleanMobile.startsWith('20') && cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
    cleanMobile = '2' + cleanMobile; 
  }
  
  const text = isReminder 
    ? `مرحباً يا الكابتن/اللاعب ${name}، نود تذكيرك بأن اشتراكك في رياضة ${sport} قد انتهى أو يوشك على الانتهاء. يرجى الحضور لتجديد الاشتراك ودفع القيمة المطلوبة لتجنب إيقاف الحصص. شكراً لك!`
    : `مرحباً يا الكابتن/اللاعب ${name}، نود التواصل معك بخصوص حصص ${sport} في الأكاديمية.`;
    
  const url = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
