import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Payment } from '../../db/db';
import { getTodayDateString, GYM_PACKAGES, DAILY_ENTRY_FEE, addDays } from '../../db/utils';
import { LineChart, Calendar, AlertTriangle, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react';

interface ForecastsTabProps {
  onSelectPlayerForSubscription: (player: Player) => void;
}

export default function ForecastsTab({ onSelectPlayerForSubscription }: ForecastsTabProps) {
  const today = getTodayDateString();

  // Queries
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.filter(s => !s.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(pay => !pay.isDeleted).toArray()) || [];

  // Load expected attendance from localstorage for today's forecast
  const savedExpected = localStorage.getItem(`pf_expected_${today}`);
  let expectedList: any[] = [];
  if (savedExpected) {
    try {
      expectedList = JSON.parse(savedExpected);
    } catch (e) {
      console.error(e);
    }
  }

  // 1. STATISTICAL PROJECTIONS MODEL

  // A: Today's Revenue Forecast
  // - Expected daily check-ins today * 60 EGP
  // - Plus subscriptions expiring today (assumed to renew today)
  const expectedDailyCount = expectedList.filter(item => item.type === 'daily').length;
  const dailyGymExpectedRevenue = expectedDailyCount * DAILY_ENTRY_FEE;

  const subsExpiringToday = subscriptions.filter(s => {
    if (s.status !== 'active') return false;
    return s.endDate === today || (s.totalSessions - s.sessionsUsed <= 0);
  });
  const renewalExpectedRevenueToday = subsExpiringToday.reduce((sum, s) => {
    const pkg = GYM_PACKAGES.find(p => p.id === s.packageType);
    return sum + (pkg ? pkg.price : s.price);
  }, 0);

  const todayForecast = dailyGymExpectedRevenue + renewalExpectedRevenueToday;

  // B: Weekly Revenue Forecast
  // - Average weekly income from past 4 weeks
  // - Plus value of subscriptions expiring in the next 7 days
  const sevenDaysAgo = addDays(today, -7);
  const twentyEightDaysAgo = addDays(today, -28);

  const pastFourWeeksPayments = payments.filter(p => p.date >= twentyEightDaysAgo && p.date <= today);
  const averageWeeklyRevenue = pastFourWeeksPayments.reduce((sum, p) => sum + p.amount, 0) / 4;

  const nextSevenDays = addDays(today, 7);
  const subsExpiringNextWeek = subscriptions.filter(s => {
    if (s.status !== 'active') return false;
    return s.endDate > today && s.endDate <= nextSevenDays;
  });
  
  const weeklyRenewalProjection = subsExpiringNextWeek.reduce((sum, s) => {
    const pkg = GYM_PACKAGES.find(p => p.id === s.packageType);
    return sum + (pkg ? pkg.price : s.price);
  }, 0);

  // Forecast: average + renewals (with 80% renewal probability factor)
  const weeklyForecast = Math.round(averageWeeklyRevenue + (weeklyRenewalProjection * 0.8));

  // C: Next Month's Revenue Forecast (Recurring Subscription Value)
  // - Sum of package values of all subscriptions expiring in the next 30 days (assumed to renew)
  const nextThirtyDays = addDays(today, 30);
  const subsExpiringNextMonth = subscriptions.filter(s => {
    if (s.status !== 'active') return false;
    return s.endDate > today && s.endDate <= nextThirtyDays;
  });

  const nextMonthForecast = subsExpiringNextMonth.reduce((sum, s) => {
    const pkg = GYM_PACKAGES.find(p => p.id === s.packageType);
    return sum + (pkg ? pkg.price : s.price);
  }, 0);

  // 2. EXPIRING SOON LIST
  // Subscriptions expiring in next 7 days, or having <= 1 session left
  const expiringSoonList = subscriptions
    .filter(s => {
      if (s.status !== 'active') return false;
      const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const sessionsLeft = s.totalSessions - s.sessionsUsed;

      return (daysLeft >= 0 && daysLeft <= 7) || sessionsLeft <= 1;
    })
    .map(s => {
      const player = players.find(p => p.id === s.playerId);
      const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const sessionsLeft = s.totalSessions - s.sessionsUsed;

      return {
        sub: s,
        player,
        daysLeft,
        sessionsLeft
      };
    })
    .filter(item => item.player)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-1 text-slate-100" dir="rtl">
      
      {/* Left Columns: Forecasting Models Card */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Treasury Safe Forecast Dashboard */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-orange-500 mb-6 flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5" /> النماذج الإحصائية لتوقع الأرباح
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Today Forecast Card */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 text-right flex flex-col justify-between h-40">
              <div>
                <span className="text-xs text-slate-400 font-semibold">توقعات أرباح اليوم</span>
                <p className="text-xs text-slate-500 mt-1">بناءً على الحضور المتوقع وحصص اليوم</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 font-sans">{todayForecast} ج.م</div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  جيم يومي: {dailyGymExpectedRevenue} ج.م | تجديدات: {renewalExpectedRevenueToday} ج.م
                </div>
              </div>
            </div>

            {/* Weekly Forecast Card */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 text-right flex flex-col justify-between h-40">
              <div>
                <span className="text-xs text-slate-400 font-semibold">توقعات أرباح الأسبوع القادم</span>
                <p className="text-xs text-slate-500 mt-1">متوسط الأداء المالي + 80% من التجديدات</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 font-sans">{weeklyForecast} / {Math.round(averageWeeklyRevenue)} ج.م</div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  متوسط أسبوعي: {Math.round(averageWeeklyRevenue)} ج.م | تجديدات متوقعة: {weeklyRenewalProjection} ج.م
                </div>
              </div>
            </div>

            {/* Monthly Forecast Card */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 text-right flex flex-col justify-between h-40">
              <div>
                <span className="text-xs text-slate-400 font-semibold">توقعات أرباح الشهر القادم</span>
                <p className="text-xs text-slate-500 mt-1">مجموع الباقات النشطة التي تنتهي قريباً</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 font-sans">{nextMonthForecast} ج.م</div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  عدد الاشتراكات المتوقع تجديدها: {subsExpiringNextMonth.length} باقة
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              تعتمد هذه النماذج على فرضية تجديد اللاعبين لاشتراكاتهم بنفس الباقات الحالية بمجرد انتهاء صلاحيتها. يمكنك تعزيز دقة التوقعات اليومية عبر تسجيل الحضور المتوقع في تبويب <span className="text-slate-200 font-bold">"الاشتراكات"</span>.
            </p>
          </div>
        </div>

      </div>

      {/* Right Column: Expirations Checklist */}
      <div className="xl:col-span-1">
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-[415px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5" /> ينتهي اشتراكهم قريباً
            </h3>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {expiringSoonList.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {expiringSoonList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                لا يوجد لاعبين تنتهي اشتراكاتهم قريباً.
              </div>
            ) : (
              expiringSoonList.map(item => {
                const sub = item.sub;
                const p = item.player!;
                const isUrgent = item.daysLeft <= 2 || item.sessionsLeft <= 1;

                return (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-xl border flex justify-between items-center transition-colors bg-slate-950/40 ${isUrgent ? 'border-red-950/50 hover:border-red-900/40' : 'border-slate-900 hover:border-slate-800'}`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {p.sport} | {p.position || 'بدون مركز'}
                      </p>
                      <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-mono">
                        <span>متبقي {item.sessionsLeft} حصة</span>
                        <span>|</span>
                        <span>ينتهي خلال {item.daysLeft} أيام</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectPlayerForSubscription(p)}
                      className="px-2.5 py-1.5 text-[10px] bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg transition-colors"
                    >
                      تجديد الباقة
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
