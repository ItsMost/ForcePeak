import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Payment, type Attendance, type Expense, generateUUID } from '../../db/db';
import { trackWrite } from '../../db/sync';
import { getCurrentMonthString, formatMonthArabic, exportToCSV } from '../../db/utils';
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, Download, Upload, Database, FileText } from 'lucide-react';

export default function ProfileTab() {
  const currentMonth = getCurrentMonthString();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'daily'>('all');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Expense form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));

  // Queries
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(p => !p.isDeleted).toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.filter(e => !e.isDeleted).toArray()) || [];

  // Generate unique list of months
  const allMonths = Array.from(
    new Set([
      ...payments.map(p => p.date.substring(0, 7)),
      ...expenses.map(e => e.date.substring(0, 7))
    ].filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  // 1. Calculate financials for selected month
  const monthPayments = payments.filter(p => p.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));

  const totalRevenues = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const subscriptionRev = monthPayments.filter(p => p.type === 'subscription').reduce((sum, p) => sum + p.amount, 0);
  const dailyGymRev = monthPayments.filter(p => p.type === 'daily').reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenues - totalExpenses;

  // 2. Ledger / History compilation
  const playerMap = new Map<string, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const ledgerItems: {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: 'payment_subscription' | 'payment_daily' | 'expense';
  }[] = [];

  // Add payments to ledger
  monthPayments.forEach(pay => {
    const player = playerMap.get(pay.playerId);
    const playerName = player ? player.name : 'لاعب غير معروف';
    const playerNum = player ? ` (#${player.playerNumber})` : '';

    if (pay.type === 'subscription') {
      ledgerItems.push({
        id: pay.id,
        description: `تجديد اشتراك اللاعب: ${playerName}${playerNum}`,
        amount: pay.amount,
        date: pay.date,
        type: 'payment_subscription'
      });
    } else {
      ledgerItems.push({
        id: pay.id,
        description: `دخول جيم حصة منفردة: ${playerName}${playerNum}`,
        amount: pay.amount,
        date: pay.date,
        type: 'payment_daily'
      });
    }
  });

  // Add expenses to ledger
  monthExpenses.forEach(exp => {
    ledgerItems.push({
      id: exp.id,
      description: `مصروف: ${exp.description}`,
      amount: exp.amount,
      date: exp.date,
      type: 'expense'
    });
  });

  // Sort ledger by date desc, then by type
  const sortedLedger = ledgerItems
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(item => {
      if (ledgerFilter === 'daily') {
        return item.type === 'payment_daily';
      }
      return true;
    });

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) {
      alert('الرجاء تعبئة كافة حقول المصروف');
      return;
    }

    const newExpense: Expense = {
      id: generateUUID(),
      description: expenseDesc,
      amount: Number(expenseAmount),
      date: expenseDate,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await trackWrite('expenses', newExpense);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().substring(0, 10));
      alert('تم تسجيل المصروف بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المصروف');
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['التاريخ', 'الوصف/المعاملة', 'القيمة (ج.م)', 'النوع'];
    const rows = sortedLedger.map(item => {
      let typeLabel = '';
      if (item.type === 'payment_subscription') typeLabel = 'اشتراك شهري';
      else if (item.type === 'payment_daily') typeLabel = 'حصة جيم فردية';
      else typeLabel = 'مصروفات عامة';

      return [
        item.date,
        item.description,
        item.type === 'expense' ? `-${item.amount}` : `+${item.amount}`,
        typeLabel
      ];
    });

    const filename = `تقرير_الخزينة_${selectedMonth}.csv`;
    exportToCSV(filename, headers, rows);
  };

  // Export full database backup as JSON
  const handleExportBackup = async () => {
    try {
      const allPlayers = await db.players.toArray();
      const allSubs = await db.subscriptions.toArray();
      const allAtt = await db.attendance.toArray();
      const allPay = await db.payments.toArray();
      const allExp = await db.expenses.toArray();

      const backupObj = {
        players: allPlayers,
        subscriptions: allSubs,
        attendance: allAtt,
        payments: allPay,
        expenses: allExp,
        version: 1,
        exportedAt: new Date().toISOString()
      };

      const dataStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `نسخة_احتياطية_PeakForce_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية');
    }
  };

  // Import database backup from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('إن استيراد النسخة الاحتياطية سيقوم بدمج البيانات مع البيانات الحالية. هل ترغب في الاستمرار؟')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupObj = JSON.parse(event.target?.result as string);
        if (!backupObj.players || !backupObj.subscriptions) {
          alert('ملف النسخة الاحتياطية غير صالح!');
          return;
        }

        // Import records in Dexie
        for (const p of backupObj.players) {
          await db.players.put(p);
          await db.syncQueue.add({ tableName: 'players', action: 'UPDATE', recordId: p.id, payload: p, createdAt: Date.now() });
        }
        for (const s of backupObj.subscriptions) {
          await db.subscriptions.put(s);
          await db.syncQueue.add({ tableName: 'subscriptions', action: 'UPDATE', recordId: s.id, payload: s, createdAt: Date.now() });
        }
        if (backupObj.attendance) {
          for (const a of backupObj.attendance) {
            await db.attendance.put(a);
            await db.syncQueue.add({ tableName: 'attendance', action: 'UPDATE', recordId: a.id, payload: a, createdAt: Date.now() });
          }
        }
        if (backupObj.payments) {
          for (const pay of backupObj.payments) {
            await db.payments.put(pay);
            await db.syncQueue.add({ tableName: 'payments', action: 'UPDATE', recordId: pay.id, payload: pay, createdAt: Date.now() });
          }
        }
        if (backupObj.expenses) {
          for (const exp of backupObj.expenses) {
            await db.expenses.put(exp);
            await db.syncQueue.add({ tableName: 'expenses', action: 'UPDATE', recordId: exp.id, payload: exp, createdAt: Date.now() });
          }
        }

        alert('تمت استعادة البيانات ووضعها في طابور المزامنة بنجاح!');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-1 text-slate-100" dir="rtl">
      
      {/* Left Column: Financial safe statistics & Expense Form */}
      <div className="xl:col-span-1 space-y-6">
        
        {/* Treasury Statistics */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-[0_0_15px_rgba(56,189,248,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-orange-500 flex items-center gap-1.5">
              <Landmark className="h-4.5 w-4.5 text-orange-500" /> 📊 إحصائيات الخزينة
            </h3>
            
            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:border-orange-500/30"
            >
              {allMonths.map(m => (
                <option key={m} value={m}>{formatMonthArabic(m)} {m.substring(0, 4)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {/* Revenue card */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 transition-all hover:border-green-500/20">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الإيرادات (المقبوضات)</span>
              <div className="text-2xl font-black text-green-400 mt-1 font-sans">{totalRevenues} ج.م</div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold border-t border-slate-900/50 pt-2">
                <span>الاشتراكات: {subscriptionRev} ج.م</span>
                <span>الحصص اليومية: {dailyGymRev} ج.م</span>
              </div>
            </div>

            {/* Expense card */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 transition-all hover:border-red-500/20">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي المصروفات العامة</span>
              <div className="text-2xl font-black text-red-400 mt-1 font-sans">{totalExpenses} ج.م</div>
            </div>

            {/* Profit card */}
            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.05)] transition-all hover:brightness-110">
              <span className="text-[10px] text-orange-500 font-extrabold block">صافي الأرباح</span>
              <div className="text-2xl font-black text-orange-500 mt-1 font-sans">{netProfit} ج.م</div>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-[0_0_15px_rgba(56,189,248,0.02)]">
          <h3 className="text-sm font-black text-orange-500 mb-4 flex items-center gap-1.5">
            <Plus className="h-4.5 w-4.5 text-orange-500" /> 💸 إضافة مصروفات عامة
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-3.5">
            <div>
              <input
                type="text"
                placeholder="تفاصيل المصروف (مثال: إيجار، كهرباء)"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="المبلغ (ج.م)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-sans text-center placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>
              <div>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono text-center focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-500/15 hover:bg-red-500 border border-red-550 text-red-400 hover:text-slate-950 font-black rounded-xl shadow-lg transition-all text-xs"
            >
              حفظ المصروف
            </button>
          </form>
        </div>

      </div>

      {/* Middle/Right Columns: Transaction Ledger & Data Tools */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Ledger & History List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-[0_0_15px_rgba(56,189,248,0.02)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-200">📖 دفتر المعاملات اليومي ({formatMonthArabic(selectedMonth)})</h3>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setLedgerFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${ledgerFilter === 'all' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
              >
                عرض الكل
              </button>
              <button
                onClick={() => setLedgerFilter('daily')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${ledgerFilter === 'daily' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
              >
                عرض الحصص اليومية فقط
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {sortedLedger.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-12">لا توجد معاملات مسجلة في هذا الشهر حالياً.</p>
            ) : (
              sortedLedger.map(item => {
                const isExpense = item.type === 'expense';
                const isDaily = item.type === 'payment_daily';
                const isActive = selectedCardId === item.id;

                let borderHoverClass = 'hover:border-green-500/20';
                if (isExpense) borderHoverClass = 'hover:border-red-500/20';
                else if (isDaily) borderHoverClass = 'hover:border-cyan-500/20';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCardId(isActive ? null : item.id)}
                    className={`flex justify-between items-center bg-slate-950/40 p-3.5 rounded-2xl border cursor-pointer transition-all hover:bg-slate-950/60 ${isActive ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.08)]' : `border-slate-900 ${borderHoverClass}`}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl border ${isExpense ? 'bg-red-500/10 text-red-400 border-red-500/20' : isDaily ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                        {isExpense ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-200">{item.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date}</p>
                      </div>
                    </div>

                    <div className={`text-xs font-black font-sans ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                      {isExpense ? '-' : '+'}{item.amount} ج.م
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Data Tools Panel (Backup, Export) */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-[0_0_15px_rgba(56,189,248,0.02)]">
          <h3 className="text-sm font-black text-slate-200 mb-4 flex items-center gap-1.5">
            <Database className="h-4.5 w-4.5 text-orange-500" /> ⚙️ أدوات البيانات والنسخ الاحتياطي
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-850 hover:border-orange-500/40 rounded-xl text-slate-350 hover:text-orange-400 text-xs font-black transition-all"
            >
              <FileText className="h-4 w-4" /> تصدير الكشف إلى Excel
            </button>

            {/* Export JSON Backup */}
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-850 hover:border-orange-500/40 rounded-xl text-slate-350 hover:text-orange-400 text-xs font-black transition-all"
            >
              <Download className="h-4 w-4" /> تصدير نسخة JSON
            </button>

            {/* Import JSON Backup */}
            <label className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-855 hover:border-orange-500/40 rounded-xl text-slate-350 hover:text-orange-400 text-xs font-black transition-all cursor-pointer text-center">
              <Upload className="h-4 w-4" /> استيراد نسخة JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
