import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Payment, type Attendance, generateUUID } from '../../db/db';
import { trackWrite, getSyncStatus, subscribeSyncStatus, syncData } from '../../db/sync';
import { getCurrentMonthString, formatMonthArabic, GYM_PACKAGES, DAILY_ENTRY_FEE, addDays } from '../../db/utils';

// Tab components
import RosterTab from './RosterTab';
import ActiveTab from './ActiveTab';
import SportsTab from './SportsTab';
import ProfileTab from './ProfileTab';
import ForecastsTab from './ForecastsTab';

import { Sun, Moon, Wifi, WifiOff, CloudLightning, ShieldAlert, Download, Sparkles, Check, Dumbbell, Award, Plus, Calendar, DollarSign, X } from 'lucide-react';

export default function GymSystem() {
  const currentMonth = getCurrentMonthString();
  const [activeTab, setActiveTab] = useState<'roster' | 'active' | 'sports' | 'profile' | 'forecasts'>('roster');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [syncState, setSyncState] = useState<string>('synced');
  
  // Shared state: when selecting a player in Roster/Forecasts for billing/registration
  const [billingPlayer, setBillingPlayer] = useState<Player | null>(null);

  // PWA Deferred Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Sync state subscriber
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncState(status);
    });
    return () => unsubscribe();
  }, []);

  // Listen to PWA install prompt
  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  // Dark mode class toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Dexie Queries
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(p => !p.isDeleted).toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.filter(e => !e.isDeleted).toArray()) || [];
  const attendances = useLiveQuery(() => db.attendance.filter(a => !a.isDeleted).toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.filter(s => !s.isDeleted).toArray()) || [];

  // 1. Calculate safe metrics for current month
  const monthPayments = payments.filter(p => p.date.startsWith(currentMonth));
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const monthAttendances = attendances.filter(a => a.date.startsWith(currentMonth));

  // Business Model calculations:
  // - Total Revenues = Sum of payments in the month (subscriptions + daily entries)
  // - Gym Share = Sum of (total sessions * 60 EGP) for subscription payments in the month + (60 EGP) for daily entry payments in the month
  // - Total Expenses = Sum of expenses in the month
  // - Net Profit = Total Revenues - Gym Share - Total Expenses
  const totalRevenues = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const gymShare = monthPayments.reduce((sum, p) => {
    if (p.type === 'daily') {
      return sum + DAILY_ENTRY_FEE;
    } else {
      // Find the subscription corresponding to this payment to get its total sessions
      const sub = subscriptions.find(s => s.id === p.subscriptionId);
      const sessions = sub ? sub.totalSessions : 8; // default to 8 sessions if not found
      return sum + (sessions * DAILY_ENTRY_FEE);
    }
  }, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenues - gymShare - totalExpenses;

  // 2. Financial Performance (مقياس الأداء المالي)
  // Target values matching user mockup: Target = 11,325 EGP (April 2026)
  const highestMonthProfit = 11325;
  const highestMonthName = 'أبريل 2026';

  const performancePercentage = highestMonthProfit > 0 ? (netProfit / highestMonthProfit) * 100 : 0;
  const remainingToRecord = highestMonthProfit - netProfit;

  let performanceLevel = 'ضعيف ⚡';
  let badgeColorClass = 'bg-red-500/10 text-red-500 border-red-500/20';
  let badgeDotClass = 'bg-red-500';

  if (performancePercentage >= 80) {
    performanceLevel = 'ممتاز 🔥';
    badgeColorClass = 'bg-green-500/10 text-green-500 border-green-500/20';
    badgeDotClass = 'bg-green-500';
  } else if (performancePercentage >= 50) {
    performanceLevel = 'متوسط ⚡';
    badgeColorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    badgeDotClass = 'bg-yellow-500';
  }

  // 3. Expected attendance today checklist
  const todayDate = new Date().toISOString().substring(0, 10);
  const [expectedList, setExpectedList] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`pf_expected_${todayDate}`);
    if (saved) {
      try {
        setExpectedList(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [todayDate]);

  // Load from local storage dynamically when changed
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(`pf_expected_${todayDate}`);
      if (saved) {
        try {
          setExpectedList(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setExpectedList([]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [todayDate]);

  const handleExpectedCheckIn = async (playerId: string, type: 'subscription' | 'daily', id: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      if (type === 'subscription') {
        const playerSubs = subscriptions.filter(s => s.playerId === playerId && s.status === 'active');
        const activeSub = playerSubs.find(s => new Date(s.endDate) >= new Date() && s.sessionsUsed < s.totalSessions);

        if (!activeSub) {
          const confirmDaily = window.confirm(`اللاعب لا يملك اشتراك ساري! هل تريد تسجيله كحضور يومي ودفع ${DAILY_ENTRY_FEE} ج.م؟`);
          if (confirmDaily) {
            await handleExpectedCheckIn(playerId, 'daily', id);
          }
          return;
        }

        const updatedSub: Subscription = {
          ...activeSub,
          sessionsUsed: activeSub.sessionsUsed + 1,
          updatedAt: new Date().toISOString()
        };
        if (updatedSub.sessionsUsed >= updatedSub.totalSessions) {
          updatedSub.status = 'expired';
        }
        await trackWrite('subscriptions', updatedSub);

        const newAtt: Attendance = {
          id: generateUUID(),
          playerId,
          subscriptionId: activeSub.id,
          date: todayDate,
          time: timeStr,
          type: 'subscription',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('attendance', newAtt);
      } else {
        const newPay: Payment = {
          id: generateUUID(),
          playerId,
          amount: DAILY_ENTRY_FEE,
          date: todayDate,
          type: 'daily',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('payments', newPay);

        const newAtt: Attendance = {
          id: generateUUID(),
          playerId,
          date: todayDate,
          time: timeStr,
          type: 'daily',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('attendance', newAtt);
      }

      // Remove from expected list
      const newList = expectedList.filter(item => item.id !== id);
      setExpectedList(newList);
      localStorage.setItem(`pf_expected_${todayDate}`, JSON.stringify(newList));
      alert(`تم تسجيل حضور اللاعب ${player.name} بنجاح!`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الحضور');
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('التطبيق مثبت بالفعل على جهازك أو المتصفح لا يدعم التثبيت المباشر.');
    }
  };

  const handleSelectPlayerForBilling = (player: Player) => {
    setBillingPlayer(player);
    setActiveTab('active');
    
    // Smooth scroll to the billing form
    setTimeout(() => {
      const billingForm = document.getElementById('billing-card-form');
      if (billingForm) {
        billingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/20" dir="rtl">
      
      {/* 1. Header Navigation Bar */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-900/60 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name (Renamed to System) */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wide text-slate-100 font-sans flex items-center gap-1.5">
              System <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-normal">V2.0</span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Sync Status */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
            title="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
          </button>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallPWA}
              className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors focus:outline-none shadow-[0_0_15px_rgba(249,115,22,0.1)]"
            >
              <Download className="h-3.5 w-3.5" /> تثبيت التطبيق
            </button>
          )}

          {/* Sync Status Pill */}
          <div className="flex items-center">
            {syncState === 'synced' && (
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl font-bold">
                <Wifi className="h-3.5 w-3.5" /> متصل (Supabase)
              </span>
            )}
            {syncState === 'syncing' && (
              <span className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl font-bold animate-pulse">
                <CloudLightning className="h-3.5 w-3.5 animate-spin" /> جاري المزامنة...
              </span>
            )}
            {syncState === 'offline' && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
                <WifiOff className="h-3.5 w-3.5" /> غير متصل (محلي)
              </span>
            )}
            {syncState === 'error' && (
              <span 
                onClick={() => syncData()}
                className="flex items-center gap-1.5 text-xs text-red-450 bg-red-500/15 border border-red-550 px-3 py-1.5 rounded-xl font-bold cursor-pointer hover:bg-red-500/25 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                title="اضغط لإعادة المحاولة"
              >
                <ShieldAlert className="h-3.5 w-3.5 animate-bounce" /> خطأ بالمزامنة ↻
              </span>
            )}
          </div>

        </div>
      </header>

      {/* 2. Main Dashboard Layout (Grid) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Sidebar Cards (Takes 1 column) */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          
          {/* Financial Performance Indicator */}
          <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${remainingToRecord <= 0 ? 'record-breaker-card' : ''}`}>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
                  📊 مقياس الأداء المالي
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">مقارنة أرباح الشهر الحالي بأعلى شهر تاريخي</p>
            </div>

            <div className="flex gap-4 items-end mt-2">
              {/* Vertical Progress Bar */}
              <div className="w-14 h-48 bg-slate-950 rounded-2xl border border-slate-900 relative overflow-hidden p-1">
                {/* 100% Mark */}
                <div className="absolute top-2 right-1.5 z-10 text-[8px] text-slate-500 font-mono">100%</div>
                {/* 0% Mark */}
                <div className="absolute bottom-2 right-1.5 z-10 text-[8px] text-slate-500 font-mono">0%</div>

                {/* Filled Level - Positioned Absolutely to be 100% browser proof */}
                <div 
                  style={{ height: `${Math.min(100, Math.max(0, performancePercentage))}%` }}
                  className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-orange-600 to-orange-500 rounded-xl transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:brightness-110"
                />
              </div>

              {/* Data Breakdown */}
              <div className="flex-1 flex flex-col justify-between h-48 py-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">أرباح ({formatMonthArabic(currentMonth)})</span>
                  <span className="text-xl font-black text-orange-500 font-sans mt-0.5">{netProfit} ج.م</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الهدف (أعلى شهر)</span>
                  <span className="text-sm font-black text-slate-200 font-sans">{highestMonthProfit} ج.م</span>
                  <span className="text-[9px] text-slate-500 block">({highestMonthName})</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">مستوى الأداء</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 font-bold mt-1.5 ${badgeColorClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badgeDotClass}`} />
                    {performanceLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Achievement Info */}
            <div className="mt-4 pt-4 border-t border-slate-950/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">النسبة المحققة</span>
                <span className="text-sm font-bold text-orange-500 font-sans">{performancePercentage.toFixed(1)}%</span>
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-500 block">متبقي لكسر الرقم القياسي</span>
                <span className="text-xs font-bold text-slate-300 font-sans">
                  {remainingToRecord > 0 ? `${remainingToRecord} ج.م` : 'رقم قياسي جديد! 🎉'}
                </span>
              </div>
            </div>

          </div>

          {/* Expected Attendance Today Card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
                📅 الحضور المتوقع اليوم
              </h3>
              <span className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                {expectedList.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {expectedList.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">لا يوجد حضور متوقع متبقي لليوم.</p>
              ) : (
                expectedList.map(item => {
                  const player = players.find(p => p.id === item.playerId);
                  if (!player) return null;

                  return (
                    <div key={item.id} className="flex justify-between items-center bg-slate-950/60 border border-slate-950 p-2.5 rounded-xl hover:border-slate-850 transition-colors">
                      <div className="min-w-0 flex-1 pl-2">
                        <p className="text-xs font-bold text-slate-200 truncate">{player.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{item.time} | {player.sport}</p>
                      </div>
                      <button
                        onClick={() => handleExpectedCheckIn(item.playerId, item.type, item.id)}
                        className="bg-orange-500/20 hover:bg-orange-500 border border-orange-500/30 text-orange-400 hover:text-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all"
                      >
                        وصل
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Columns: Main content & tabs (Takes 3 columns) */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Top Monthly safe banner */}
          <div className="bg-slate-900/60 border border-slate-900/60 rounded-3xl p-5 text-center relative overflow-hidden group">
            <span className="text-xs text-orange-500 font-black bg-orange-500/10 border border-orange-500/20 px-4 py-1 rounded-full uppercase tracking-wider">
              [ SYSTEM ]
            </span>
            
            <h2 className="text-2xl font-black text-slate-100 mt-4">
              أرباح شهر ({formatMonthArabic(currentMonth)})
            </h2>
            <div className="text-3xl font-black text-orange-500 font-sans mt-2">{netProfit} ج.م</div>

            <div className="grid grid-cols-3 gap-2 mt-4 max-w-lg mx-auto bg-slate-950/60 rounded-2xl p-3 border border-slate-900">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">إيرادات</span>
                <span className="text-sm font-bold text-green-400 font-sans">{totalRevenues} ج.م</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">جيم</span>
                <span className="text-sm font-bold text-slate-200 font-sans">{gymShare} ج.م</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">مصروفات</span>
                <span className="text-sm font-bold text-red-400 font-sans">{totalExpenses} ج.m</span>
              </div>
            </div>
          </div>

          {/* Segmented Control navigation (iOS Style) */}
          <div className="segmented-container p-1 rounded-2xl border flex items-center justify-between w-full shadow-inner">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 text-center py-2 rounded-xl text-xs transition-all duration-300 font-bold ${activeTab === 'roster' ? 'segmented-button-active text-orange-500 border' : 'text-slate-400 hover:text-slate-200'}`}
            >
              القاعدة
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 text-center py-2 rounded-xl text-xs transition-all duration-300 font-bold ${activeTab === 'active' ? 'segmented-button-active text-orange-500 border' : 'text-slate-400 hover:text-slate-200'}`}
            >
              الاشتراكات
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`flex-1 text-center py-2 rounded-xl text-xs transition-all duration-300 font-bold ${activeTab === 'sports' ? 'segmented-button-active text-orange-500 border' : 'text-slate-400 hover:text-slate-200'}`}
            >
              الرياضات
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 text-center py-2 rounded-xl text-xs transition-all duration-300 font-bold ${activeTab === 'profile' ? 'segmented-button-active text-orange-500 border' : 'text-slate-400 hover:text-slate-200'}`}
            >
              البروفايل
            </button>
            <button
              onClick={() => setActiveTab('forecasts')}
              className={`flex-1 text-center py-2 rounded-xl text-xs transition-all duration-300 font-bold ${activeTab === 'forecasts' ? 'segmented-button-active text-orange-500 border' : 'text-slate-400 hover:text-slate-200'}`}
            >
              التوقعات
            </button>
          </div>

          {/* Active Panel View */}
          <div className="bg-slate-950/20 rounded-2xl flex-1">
            {activeTab === 'roster' && (
              <RosterTab onSelectPlayerForSubscription={handleSelectPlayerForBilling} />
            )}
            {activeTab === 'active' && (
              <ActiveTab 
                billingPlayer={billingPlayer} 
                setBillingPlayer={setBillingPlayer} 
                onSelectPlayerForSubscription={handleSelectPlayerForBilling}
              />
            )}
            {activeTab === 'sports' && <SportsTab />}
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'forecasts' && (
              <ForecastsTab onSelectPlayerForSubscription={handleSelectPlayerForBilling} />
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
