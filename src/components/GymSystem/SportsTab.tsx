import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Payment, type Attendance } from '../../db/db';
import { getCurrentMonthString, formatMonthArabic } from '../../db/utils';
import { TrendingUp, BarChart2, Award, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SportsTab() {
  const currentMonth = getCurrentMonthString();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [showDailyPlayers, setShowDailyPlayers] = useState(false);

  // Queries
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.filter(s => !s.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(pay => !pay.isDeleted).toArray()) || [];
  const attendances = useLiveQuery(() => db.attendance.filter(a => !a.isDeleted).toArray()) || [];

  // 1. Get List of Unique Sports
  const allSports = Array.from(new Set(players.map(p => p.sport).filter(Boolean)));

  // If no sport is selected, default to the first sport in the list
  React.useEffect(() => {
    if (!selectedSport && allSports.length > 0) {
      setSelectedSport(allSports[0]);
    }
  }, [allSports, selectedSport]);

  // 2. Financial Calculations for Doughnut Chart (by Sport for the selected month)
  // Filter payments for the selected month
  const monthPayments = payments.filter(pay => pay.date.startsWith(selectedMonth));

  // Map players to their sports for quick lookup
  const playerSportMap = new Map<string, string>();
  players.forEach(p => {
    playerSportMap.set(p.id, p.sport);
  });

  // Calculate revenue per sport
  const sportRevenue: Record<string, number> = {};
  let totalMonthRevenue = 0;

  monthPayments.forEach(pay => {
    const sportName = playerSportMap.get(pay.playerId) || 'أخرى';
    sportRevenue[sportName] = (sportRevenue[sportName] || 0) + pay.amount;
    totalMonthRevenue += pay.amount;
  });

  // Convert to array of segments
  const chartColors = [
    'stroke-orange-500', 
    'stroke-cyan-500', 
    'stroke-purple-500', 
    'stroke-emerald-500', 
    'stroke-yellow-500', 
    'stroke-pink-500'
  ];
  const textColors = [
    'text-orange-500', 
    'text-cyan-500', 
    'text-purple-500', 
    'text-emerald-500', 
    'text-yellow-500', 
    'text-pink-500'
  ];
  const bgColors = [
    'bg-orange-500', 
    'bg-cyan-500', 
    'bg-purple-500', 
    'bg-emerald-500', 
    'bg-yellow-500', 
    'bg-pink-500'
  ];

  const chartData = Object.entries(sportRevenue).map(([sport, rev], index) => {
    const percentage = totalMonthRevenue > 0 ? (rev / totalMonthRevenue) * 100 : 0;
    return {
      sport,
      revenue: rev,
      percentage,
      color: chartColors[index % chartColors.length],
      textColor: textColors[index % textColors.length],
      bgColor: bgColors[index % bgColors.length]
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // SVG parameters for doughnut
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  let accumulatedPercentage = 0;

  // 3. Player details list for selected sport in selected month
  // Filter players by selected sport
  const sportPlayers = players.filter(p => p.sport === selectedSport);

  // Map players to their stats in selected month
  const detailedPlayers = sportPlayers.map(p => {
    // A: Renewals count: subscriptions created in selected month
    const renewals = subscriptions.filter(
      s => s.playerId === p.id && s.startDate.startsWith(selectedMonth)
    );
    
    // Check if player is daily (has no subscriptions in selected month, or has a 'daily' subscription)
    const hasActiveSubscription = renewals.some(s => s.packageType !== 'daily');

    // B: Total paid this month
    const pMonthPayments = payments.filter(
      pay => pay.playerId === p.id && pay.date.startsWith(selectedMonth)
    );
    const totalPaidThisMonth = pMonthPayments.reduce((sum, pay) => sum + pay.amount, 0);

    // C: Attendance count this month
    const pMonthAttendances = attendances.filter(
      a => a.playerId === p.id && a.date.startsWith(selectedMonth)
    );
    const attendanceCount = pMonthAttendances.length;

    return {
      player: p,
      renewalsCount: renewals.length,
      totalPaidThisMonth,
      attendanceCount,
      isDailyOnly: !hasActiveSubscription && totalPaidThisMonth > 0 && pMonthPayments.some(pay => pay.type === 'daily'),
      isMonthlySubscriber: hasActiveSubscription || (totalPaidThisMonth > 0 && pMonthPayments.some(pay => pay.type === 'subscription'))
    };
  });

  // Filter based on subscriber/daily toggle
  const finalPlayers = detailedPlayers
    .filter(dp => {
      if (showDailyPlayers) {
        // Daily players (non-subscribers who paid daily entry or attended daily sessions)
        return dp.attendanceCount > 0 && !dp.isMonthlySubscriber;
      } else {
        // Monthly subscribers
        return dp.isMonthlySubscriber || dp.renewalsCount > 0;
      }
    })
    // Sort by attendance (highest first)
    .sort((a, b) => b.attendanceCount - a.attendanceCount);

  // Generate unique list of months from database payments to populate filter
  const allMonths = Array.from(new Set(payments.map(pay => pay.date.substring(0, 7)).filter(Boolean)))
    .sort((a, b) => b.localeCompare(a));
  
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-1 text-slate-100" dir="rtl">
      
      {/* Left Column: Financial Profitability & SVG Doughnut Chart */}
      <div className="xl:col-span-1 space-y-6">
        
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-orange-500 flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5" /> ربحية الرياضات
            </h3>
            
            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              {allMonths.map(m => (
                <option key={m} value={m}>{formatMonthArabic(m)} {m.substring(0, 4)}</option>
              ))}
            </select>
          </div>

          {/* SVG Doughnut Chart */}
          <div className="flex flex-col items-center justify-center py-4">
            {totalMonthRevenue === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                لا توجد إيرادات مسجلة لهذا الشهر.
              </div>
            ) : (
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Gray background track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-slate-950 fill-none"
                    strokeWidth="12"
                  />
                  {/* Colorful segments */}
                  {chartData.map((seg) => {
                    const strokeLength = (seg.percentage / 100) * circumference;
                    const strokeOffset = circumference - strokeLength;
                    const accumulatedOffset = (accumulatedPercentage / 100) * circumference;
                    
                    accumulatedPercentage += seg.percentage;

                    return (
                      <circle
                        key={seg.sport}
                        cx="60"
                        cy="60"
                        r={radius}
                        className={`fill-none ${seg.color} transition-all duration-500 hover:stroke-[14px] cursor-pointer`}
                        strokeWidth="10"
                        strokeDasharray={`${strokeLength} ${strokeOffset}`}
                        strokeDashoffset={-accumulatedOffset}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                {/* Text in the Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold">إجمالي الأرباح</span>
                  <span className="text-lg font-bold text-orange-500 font-sans mt-0.5">{totalMonthRevenue}</span>
                  <span className="text-[9px] text-slate-500">جنيهاً مصرياً</span>
                </div>
              </div>
            )}

            {/* Chart Legend */}
            <div className="w-full mt-6 space-y-2 max-h-[160px] overflow-y-auto">
              {chartData.map(seg => (
                <div key={seg.sport} className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${seg.bgColor}`}></span>
                    <span className="text-xs font-bold text-slate-300">{seg.sport}</span>
                  </div>
                  <div className="text-left font-sans text-xs">
                    <span className="text-slate-200 font-bold">{seg.revenue} ج.م</span>
                    <span className="text-slate-500 text-[10px] mr-1.5">({seg.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Middle/Right Columns: Detailed Sport Ledger */}
      <div className="xl:col-span-2 space-y-6">
        
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-orange-500" /> كشف تفصيلي باللاعبين
              </h3>
              
              {/* Sport Selector */}
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-orange-500 font-bold focus:outline-none"
              >
                {allSports.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Toggle Button: Subscribers vs Daily */}
            <button
              onClick={() => setShowDailyPlayers(!showDailyPlayers)}
              className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500/30 transition-colors"
            >
              {showDailyPlayers ? (
                <>
                  <ToggleRight className="h-5 w-5 text-orange-500" /> إظهار المشتركين شهرياً
                </>
              ) : (
                <>
                  <ToggleLeft className="h-5 w-5 text-slate-500" /> إظهار لاعبي الحصص اليومية
                </>
              )}
            </button>
          </div>

          {/* Players Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                  <th className="pb-3 pr-2">اللاعب</th>
                  <th className="pb-3 text-center">عدد التجديدات</th>
                  <th className="pb-3 text-center">إجمالي المدفوع</th>
                  <th className="pb-3 text-center">الحضور</th>
                  <th className="pb-3 text-center">المركز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {finalPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      لا يوجد لاعبين مسجلين في هذا القسم للشهر المختار.
                    </td>
                  </tr>
                ) : (
                  finalPlayers.map(dp => (
                    <tr key={dp.player.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="font-bold text-slate-200">{dp.player.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{dp.player.playerNumber} | {dp.player.club}</div>
                      </td>
                      
                      <td className="py-3.5 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${dp.renewalsCount > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-slate-500'}`}>
                          {dp.renewalsCount} مرات
                        </span>
                      </td>

                      <td className="py-3.5 text-center font-bold text-orange-500 font-sans">
                        {dp.totalPaidThisMonth} ج.م
                      </td>

                      <td className="py-3.5 text-center">
                        <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-sans text-xs font-bold flex items-center justify-center gap-1 w-16 mx-auto">
                          <Award className="h-3.5 w-3.5 text-orange-500" /> {dp.attendanceCount}
                        </span>
                      </td>

                      <td className="py-3.5 text-center text-xs text-slate-400 max-w-[150px] truncate">
                        {dp.player.position || 'غير محدد'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
