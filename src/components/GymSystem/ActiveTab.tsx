import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Attendance, type Payment, generateUUID } from '../../db/db';
import { trackWrite } from '../../db/sync';
import { getTodayDateString, DAILY_ENTRY_FEE, GYM_PACKAGES, addDays, sendWhatsAppMessage } from '../../db/utils';
import { Check, Clock, AlertTriangle, Users, ArrowRightLeft, DollarSign, Search, Calendar, Plus, X, Trash2, Edit2, Play } from 'lucide-react';

interface ActiveTabProps {
  billingPlayer: Player | null;
  setBillingPlayer: (player: Player | null) => void;
  onSelectPlayerForSubscription: (player: Player) => void;
}

export default function ActiveTab({ billingPlayer, setBillingPlayer, onSelectPlayerForSubscription }: ActiveTabProps) {
  const today = getTodayDateString();

  // Queries
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.filter(s => !s.isDeleted).toArray()) || [];
  const attendances = useLiveQuery(() => db.attendance.filter(a => !a.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(pay => !pay.isDeleted).toArray()) || [];

  // Filter actual check-ins for today
  const todayCheckIns = attendances.filter(a => a.date === today);

  // ----------------------------------------------------
  // Local States
  // ----------------------------------------------------

  // 1. Expected Attendance Scheduler States
  const [expectedList, setExpectedList] = useState<{ id: string; playerId: string; time: string; type: string }[]>([]);
  const [expectedSearch, setExpectedSearch] = useState('');
  const [expectedShowDropdown, setExpectedShowDropdown] = useState(false);
  const [selectedExpectedPlayer, setSelectedExpectedPlayer] = useState<Player | null>(null);
  const [expectedTime, setExpectedTime] = useState('19:00');
  const [expectedType, setExpectedType] = useState('pkg_8');

  // 2. Billing Form (تسجيل اشتراك ودفع) States
  const [billingSearch, setBillingSearch] = useState('');
  const [billingShowDropdown, setBillingShowDropdown] = useState(false);
  const [selectedBillingPlayer, setSelectedBillingPlayer] = useState<Player | null>(null);
  const [billingPackage, setBillingPackage] = useState('pkg_8');
  const [billingPrice, setBillingPrice] = useState('1450');
  const [billingDate, setBillingDate] = useState(today);

  // 3. Inline date checkers for "الدفع بالشهر" (Mapped by subscription ID)
  const [inlineDates, setInlineDates] = useState<Record<string, string>>({});

  // 4. Archive states
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archiveDate, setArchiveDate] = useState(today);

  // 5. Subscription editor state (For inline edit)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editSubPrice, setEditSubPrice] = useState('');
  const [editSubTotalSessions, setEditSubTotalSessions] = useState('');
  const [editSubEndDate, setEditSubEndDate] = useState('');

  // ----------------------------------------------------
  // Sync Billing Player from Parent
  // ----------------------------------------------------
  useEffect(() => {
    if (billingPlayer) {
      setSelectedBillingPlayer(billingPlayer);
      setBillingSearch(billingPlayer.name);
      // Default to daily single session payment as requested for quick registrations
      setBillingPackage('daily');
      setBillingPrice(String(DAILY_ENTRY_FEE));
      
      // Clear the redirect state after consumption
      setBillingPlayer(null);
    }
  }, [billingPlayer, setBillingPlayer]);

  // Load/Save Expected list
  useEffect(() => {
    const saved = localStorage.getItem(`pf_expected_${today}`);
    if (saved) {
      try {
        setExpectedList(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [today]);

  const saveExpected = (newList: typeof expectedList) => {
    setExpectedList(newList);
    localStorage.setItem(`pf_expected_${today}`, JSON.stringify(newList));
  };

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------

  // A: Add expected attendance
  const handleAddExpected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpectedPlayer) return;

    const isDuplicate = expectedList.some(item => item.playerId === selectedExpectedPlayer.id);
    if (isDuplicate) {
      alert('اللاعب مضاف بالفعل في الحضور المتوقع اليوم!');
      return;
    }

    const newItem = {
      id: generateUUID(),
      playerId: selectedExpectedPlayer.id,
      time: expectedTime,
      type: expectedType
    };

    saveExpected([...expectedList, newItem]);
    setSelectedExpectedPlayer(null);
    setExpectedSearch('');
  };

  const handleRemoveExpected = (id: string) => {
    saveExpected(expectedList.filter(item => item.id !== id));
  };

  // B: Perform Actual Check-In
  const handleCheckIn = async (playerId: string, packageType: string, expectedId?: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Check if already checked in today
    const alreadyChecked = todayCheckIns.some(a => a.playerId === playerId);
    if (alreadyChecked) {
      alert('اللاعب مسجل حضور اليوم بالفعل!');
      if (expectedId) handleRemoveExpected(expectedId);
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      if (packageType === 'daily') {
        // Daily non-member entry
        // Record payment
        const payId = generateUUID();
        const newPay: Payment = {
          id: payId,
          playerId,
          amount: DAILY_ENTRY_FEE,
          date: today,
          type: 'daily',
          isDeleted: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        await trackWrite('payments', newPay);

        // Record attendance
        const newAtt: Attendance = {
          id: generateUUID(),
          playerId,
          date: today,
          time: timeStr,
          type: 'daily',
          isDeleted: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        await trackWrite('attendance', newAtt);
      } else {
        // Subscription check-in
        const playerSubs = subscriptions.filter(s => s.playerId === playerId && s.status === 'active');
        const activeSub = playerSubs.find(s => new Date(s.endDate) >= new Date() && s.sessionsUsed < s.totalSessions);

        if (!activeSub) {
          const confirmDaily = window.confirm('اللاعب لا يملك باقة نشطة! هل ترغب في تسجيله كدخول حصة يومية ودفع 60 ج.م؟');
          if (confirmDaily) {
            await handleCheckIn(playerId, 'daily', expectedId);
          }
          return;
        }

        // Increment sessions
        const updatedSub: Subscription = {
          ...activeSub,
          sessionsUsed: activeSub.sessionsUsed + 1,
          updatedAt: now.toISOString()
        };
        if (updatedSub.sessionsUsed >= updatedSub.totalSessions) {
          updatedSub.status = 'expired';
        }
        await trackWrite('subscriptions', updatedSub);

        // Record attendance
        const newAtt: Attendance = {
          id: generateUUID(),
          playerId,
          subscriptionId: activeSub.id,
          date: today,
          time: timeStr,
          type: 'subscription',
          isDeleted: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        await trackWrite('attendance', newAtt);
      }

      if (expectedId) {
        handleRemoveExpected(expectedId);
      }
      alert(`تم تسجيل حضور اللاعب ${player.name} بنجاح!`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الحضور');
    }
  };

  // C: Cancel Attendance (إلغاء الحضور)
  const handleCancelAttendance = async (attendanceId: string) => {
    const att = attendances.find(a => a.id === attendanceId);
    if (!att) return;

    if (!window.confirm('هل أنت متأكد من إلغاء الحضور اليوم لهذا اللاعب؟')) {
      return;
    }

    try {
      // Soft delete attendance record
      const updatedAtt = {
        ...att,
        isDeleted: true,
        updatedAt: new Date().toISOString()
      };
      await trackWrite('attendance', updatedAtt);

      if (att.type === 'subscription' && att.subscriptionId) {
        // Decrement sessions used in subscription
        const sub = subscriptions.find(s => s.id === att.subscriptionId);
        if (sub) {
          const updatedSub: Subscription = {
            ...sub,
            sessionsUsed: Math.max(0, sub.sessionsUsed - 1),
            status: 'active', // revert to active if it was expired
            updatedAt: new Date().toISOString()
          };
          await trackWrite('subscriptions', updatedSub);
        }
      } else {
        // Daily session: soft-delete the linked payment of 60 EGP
        const pPay = payments.find(p => p.playerId === att.playerId && p.date === att.date && p.type === 'daily');
        if (pPay) {
          const updatedPay = {
            ...pPay,
            isDeleted: true,
            updatedAt: new Date().toISOString()
          };
          await trackWrite('payments', updatedPay);
        }
      }
      alert('تم إلغاء الحضور بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إلغاء الحضور');
    }
  };

  // D: Billing Payment Handler (تأكيد الدفع)
  const handleConfirmBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillingPlayer) {
      alert('الرجاء اختيار لاعب لتأكيد الدفع');
      return;
    }

    try {
      if (billingPackage === 'daily') {
        // Create daily payment
        const payId = generateUUID();
        const newPay: Payment = {
          id: payId,
          playerId: selectedBillingPlayer.id,
          amount: Number(billingPrice),
          date: billingDate,
          type: 'daily',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('payments', newPay);

        // Auto-checkin player for this date
        const newAtt: Attendance = {
          id: generateUUID(),
          playerId: selectedBillingPlayer.id,
          date: billingDate,
          time: '18:00',
          type: 'daily',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('attendance', newAtt);

      } else {
        // Create subscription package
        const pkg = GYM_PACKAGES.find(p => p.id === billingPackage)!;
        const sDays = pkg ? pkg.validityDays : 30;
        const endD = addDays(billingDate, sDays);

        // 1. Expire past subscriptions
        const activeSubs = subscriptions.filter(s => s.playerId === selectedBillingPlayer.id && s.status === 'active');
        for (const s of activeSubs) {
          const updated = {
            ...s,
            status: 'expired' as const,
            updatedAt: new Date().toISOString()
          };
          await trackWrite('subscriptions', updated);
        }

        // 2. Add subscription
        const subId = generateUUID();
        const newSub: Subscription = {
          id: subId,
          playerId: selectedBillingPlayer.id,
          packageType: billingPackage,
          price: Number(billingPrice),
          totalSessions: pkg ? pkg.sessions : 8,
          sessionsUsed: 0,
          startDate: billingDate,
          endDate: endD,
          status: 'active',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('subscriptions', newSub);

        // 3. Add payment ledger
        const newPay: Payment = {
          id: generateUUID(),
          playerId: selectedBillingPlayer.id,
          subscriptionId: subId,
          amount: Number(billingPrice),
          date: billingDate,
          type: 'subscription',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await trackWrite('payments', newPay);
      }

      alert('تم تسجيل المقبوضات وتأكيد الدفع بنجاح!');
      setSelectedBillingPlayer(null);
      setBillingSearch('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الدفع');
    }
  };

  // E: Inline check-in logger inside subscription cards (+ تسجيل / - مسح)
  const handleInlineCheckIn = async (sub: Subscription) => {
    const targetDate = inlineDates[sub.id] || today;

    // Check duplicate check-in on this date
    const isDuplicate = attendances.some(
      a => a.playerId === sub.playerId && a.date === targetDate && a.subscriptionId === sub.id && !a.isDeleted
    );
    if (isDuplicate) {
      alert('هذا اللاعب مسجل حضور بالفعل في هذا التاريخ!');
      return;
    }

    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Increment sessions
      const updatedSub: Subscription = {
        ...sub,
        sessionsUsed: sub.sessionsUsed + 1,
        updatedAt: now.toISOString()
      };
      if (updatedSub.sessionsUsed >= updatedSub.totalSessions) {
        updatedSub.status = 'expired';
      }
      await trackWrite('subscriptions', updatedSub);

      // Record attendance
      const newAtt: Attendance = {
        id: generateUUID(),
        playerId: sub.playerId,
        subscriptionId: sub.id,
        date: targetDate,
        time: timeStr,
        type: 'subscription',
        isDeleted: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      await trackWrite('attendance', newAtt);

      alert('تم تسجيل الحضور في كارت الاشتراك بنجاح!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineCancelCheckIn = async (sub: Subscription) => {
    const targetDate = inlineDates[sub.id] || today;
    const att = attendances.find(
      a => a.playerId === sub.playerId && a.date === targetDate && a.subscriptionId === sub.id && !a.isDeleted
    );

    if (!att) {
      alert('لا يوجد سجل حضور مسجل لهذا التاريخ تحت هذا الاشتراك!');
      return;
    }

    try {
      // Soft delete attendance
      const updatedAtt = {
        ...att,
        isDeleted: true,
        updatedAt: new Date().toISOString()
      };
      await trackWrite('attendance', updatedAtt);

      // Decrement sessions
      const updatedSub: Subscription = {
        ...sub,
        sessionsUsed: Math.max(0, sub.sessionsUsed - 1),
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      await trackWrite('subscriptions', updatedSub);

      alert('تم مسح وإلغاء الحضور من كارت الاشتراك.');
    } catch (err) {
      console.error(err);
    }
  };

  // F: Soft delete subscription
  const handleDeleteSub = async (subId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء/حذف هذا الاشتراك؟')) return;

    const sub = subscriptions.find(s => s.id === subId);
    if (sub) {
      const updated = {
        ...sub,
        isDeleted: true,
        updatedAt: new Date().toISOString()
      };
      await trackWrite('subscriptions', updated);
      alert('تم إلغاء الاشتراك بنجاح.');
    }
  };

  // G: Update Subscription details (Edit Modal action)
  const handleUpdateSubDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    try {
      const updated: Subscription = {
        ...editingSub,
        price: Number(editSubPrice),
        totalSessions: Number(editSubTotalSessions),
        endDate: editSubEndDate,
        updatedAt: new Date().toISOString()
      };

      if (updated.sessionsUsed >= updated.totalSessions) {
        updated.status = 'expired';
      } else {
        updated.status = 'active';
      }

      await trackWrite('subscriptions', updated);
      setEditingSub(null);
      alert('تم تعديل الاشتراك بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تعديل الاشتراك');
    }
  };

  // ----------------------------------------------------
  // Autocomplete Select Filters
  // ----------------------------------------------------
  const filteredBillingPlayers = billingSearch
    ? players.filter(p => p.name.toLowerCase().includes(billingSearch.toLowerCase()) || p.playerNumber.includes(billingSearch))
    : [];

  const filteredExpectedPlayers = expectedSearch
    ? players.filter(p => p.name.toLowerCase().includes(expectedSearch.toLowerCase()) || p.playerNumber.includes(expectedSearch))
    : [];

  // Expiration warnings count
  const expirationAlerts = subscriptions
    .filter(s => {
      if (s.isDeleted || s.status !== 'active') return false;
      const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 3;
    })
    .map(s => {
      const p = players.find(player => player.id === s.playerId);
      const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { sub: s, player: p, daysLeft };
    })
    .filter(item => item.player);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1 text-slate-100" dir="rtl">
      
      {/* LEFT COLUMN: actual checkins grid + "الدفع بالشهر" subscriptions list (Takes 2 columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Actual Attendance Grid: "حضور اليوم كله" */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block"></span>
            <h2 className="text-base font-black text-slate-200">
              حضور اليوم كله ({todayCheckIns.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {todayCheckIns.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                لم يتم تسجيل حضور أي لاعب اليوم بعد.
              </div>
            ) : (
              todayCheckIns.map(a => {
                const player = players.find(p => p.id === a.playerId);
                if (!player) return null;

                let sessionDetails = 'حصة فردية اليوم';
                let isDaily = true;
                if (a.type === 'subscription' && a.subscriptionId) {
                  const sub = subscriptions.find(s => s.id === a.subscriptionId);
                  if (sub) {
                    sessionDetails = `الحصة رقم ${sub.sessionsUsed} من ${sub.totalSessions}`;
                    isDaily = false;
                  }
                }

                return (
                  <div 
                    key={a.id} 
                    className="flex justify-between items-center bg-[#070d19]/80 border border-cyan-500/10 hover:border-cyan-500/30 p-3 rounded-2xl transition-all"
                  >
                    <div>
                      <p className="text-xs font-black text-cyan-400">{player.name} <span className="text-[10px] text-slate-500">#{player.playerNumber}</span></p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">{player.sport}</span>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">{player.club}</span>
                      </div>
                    </div>

                    <div className="text-left flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-sans ${isDaily ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>
                        {sessionDetails}
                      </span>
                      <button
                        onClick={() => handleCancelAttendance(a.id)}
                        className="text-[9px] text-red-400 hover:text-red-350 border border-red-950 hover:border-red-900/50 px-2 py-0.5 rounded transition-all"
                      >
                        إلغاء الحضور
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Subscriptions List: "الدفع بالشهر" */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-black text-slate-200 flex items-center gap-1.5">
              📅 الدفع بالشهر
            </h2>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {subscriptions.length === 0 ? (
              <p className="text-slate-500 text-center py-12">لا توجد اشتراكات مسجلة حالياً.</p>
            ) : (
              subscriptions.map(sub => {
                const player = players.find(p => p.id === sub.playerId);
                if (!player) return null;

                // Calculate sessions attended during subscription period
                const subAtts = attendances.filter(
                  a => a.playerId === sub.playerId && a.date >= sub.startDate && a.date <= sub.endDate && !a.isDeleted
                );
                const attCount = subAtts.length;

                // Finance logic: Gym share is determined by package total sessions (upfront)
                const gymCut = sub.totalSessions * DAILY_ENTRY_FEE;
                const netProfit = sub.price - gymCut;

                const isExpired = sub.status === 'expired' || new Date(sub.endDate) < new Date();
                const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div 
                    key={sub.id} 
                    className="bg-[#070d19]/80 border border-slate-900 hover:border-orange-500/20 p-4 rounded-3xl transition-all relative"
                  >
                    
                    {/* Top Subscription Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-black text-orange-500 flex items-center gap-1">
                          {player.name} <span className="text-xs text-slate-500 font-mono">| #{player.playerNumber}</span>
                        </h4>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                          <span>البداية: {sub.startDate}</span>
                          <span>النهاية: {sub.endDate}</span>
                        </div>
                      </div>

                      {/* Expiration warnings */}
                      <div className="text-left">
                        {isExpired ? (
                          <span className="inline-block text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-bold">
                            ⚠️ منتهي منذ {Math.abs(daysLeft)} أيام
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold">
                            ساري (متبقي {daysLeft} أيام)
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">الرياضة: {player.sport}</p>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-semibold">
                        <span>الحضور: <span className="font-sans font-bold text-slate-200">{attCount} من {sub.totalSessions}</span></span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          style={{ width: `${Math.min(100, (attCount / sub.totalSessions) * 100)}%` }}
                          className="bg-orange-500 h-full rounded-full transition-all"
                        />
                      </div>
                    </div>

                    {/* Finance panel & Inline Logger Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                      
                      {/* Left: Financial cut */}
                      <div className="flex items-center justify-around text-center text-[10px] border-l border-slate-900 pr-1">
                        <div>
                          <span className="text-slate-500 block">دفع</span>
                          <span className="font-bold text-slate-300 font-sans">{sub.price} ج</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">جيم</span>
                          <span className="font-bold text-orange-500 font-sans">{gymCut} ج</span>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                          <span className="text-green-400 block font-bold">مكسب</span>
                          <span className="font-bold text-green-400 font-sans">{netProfit} ج</span>
                        </div>
                      </div>

                      {/* Right: Inline Check-in Logger */}
                      <div className="flex items-center justify-between gap-1.5">
                        <input
                          type="date"
                          value={inlineDates[sub.id] || today}
                          onChange={(e) => setInlineDates({ ...inlineDates, [sub.id]: e.target.value })}
                          className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-center font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => handleInlineCheckIn(sub)}
                          className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-lg text-[9px] transition-colors"
                        >
                          + تسجيل
                        </button>
                        <button
                          onClick={() => handleInlineCancelCheckIn(sub)}
                          className="px-2 py-1 bg-red-950 text-red-400 border border-red-900/40 rounded-lg text-[9px] transition-colors"
                        >
                          - مسح
                        </button>
                      </div>

                    </div>

                    {/* Actions panel */}
                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-950/80">
                      <button
                        onClick={() => onSelectPlayerForSubscription(player)}
                        className="px-2.5 py-1 text-xs bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 font-bold rounded-lg border border-green-500/30 transition-all"
                      >
                        تجديد
                      </button>
                      <button
                        onClick={() => {
                          setEditingSub(sub);
                          setEditSubPrice(String(sub.price));
                          setEditSubTotalSessions(String(sub.totalSessions));
                          setEditSubEndDate(sub.endDate);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-lg border border-slate-800 transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="px-2.5 py-1 text-xs bg-red-950/20 hover:bg-red-950 text-red-400 hover:text-red-200 font-bold rounded-lg border border-red-900/30 hover:border-red-700 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Expirations, Expected Attendance, Direct Billing Form (Takes 1 column) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Expired Warnings Alert */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-slate-850 rounded-3xl p-5 shadow-lg">
          <h3 className="text-sm font-black text-red-500 mb-4 flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5" /> تنبيهات الاشتراكات المنتهية ({expirationAlerts.length})
          </h3>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {expirationAlerts.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">لا توجد تنبيهات اشتراكات منتهية.</p>
            ) : (
              expirationAlerts.map(item => (
                <div key={item.sub.id} className="flex justify-between items-center bg-red-950/10 border border-red-900/20 p-2.5 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-red-400">{item.player?.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">منتهي من {item.daysLeft} أيام ({item.player?.sport})</p>
                  </div>
                  <button
                    onClick={() => sendWhatsAppMessage(item.player!.mobile, item.player!.name, item.player!.sport, true)}
                    className="px-2.5 py-1 text-[9px] bg-red-500/20 text-red-400 border border-red-500/35 hover:bg-red-500 hover:text-slate-950 font-bold rounded-lg transition-all"
                  >
                    تذكير
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expected Attendance scheduler & list */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
              📅 المتوقع حضورهم اليوم ({expectedList.length})
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
            سجل اللاعبين المتوقع حضورهم اليوم لتسجيلهم الفعلي كلاعبين وتفعيل الدفع وتأكيد الحضور بضغطة واحدة.
          </p>

          <form onSubmit={handleAddExpected} className="space-y-3 pb-4 border-b border-slate-950">
            {/* Autocomplete Selector for expected player */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن اسم اللاعب بالقاعدة لاختياره..."
                value={expectedSearch}
                onChange={(e) => {
                  setExpectedSearch(e.target.value);
                  setExpectedShowDropdown(true);
                }}
                onFocus={() => setExpectedShowDropdown(true)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-500 focus:outline-none"
              />
              
              {expectedShowDropdown && filteredExpectedPlayers.length > 0 && (
                <div className="absolute top-10 right-0 left-0 bg-slate-900 border border-slate-800 rounded-xl z-50 max-h-[140px] overflow-y-auto p-1 shadow-2xl">
                  {filteredExpectedPlayers.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedExpectedPlayer(p);
                        setExpectedSearch(p.name);
                        setExpectedShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs hover:bg-slate-950 rounded-lg cursor-pointer text-right flex justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-slate-500">#{p.playerNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={expectedType}
                onChange={(e) => setExpectedType(e.target.value)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="daily">حصة واحدة (دفع يومي)</option>
                {GYM_PACKAGES.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                ))}
              </select>

              <input
                type="time"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-colors"
            >
              + إضافة لقائمة المتوقع اليوم
            </button>
          </form>

          {/* Expected list for today */}
          <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto pr-1">
            {expectedList.length === 0 ? (
              <p className="text-slate-500 text-[10px] text-center py-4">لا يوجد لاعبين في قائمة الانتظار لليوم.</p>
            ) : (
              expectedList.map(item => {
                const player = players.find(p => p.id === item.playerId);
                if (!player) return null;

                let billingText = 'حصة فردية';
                let priceHint = DAILY_ENTRY_FEE;
                if (item.type !== 'daily') {
                  const pkg = GYM_PACKAGES.find(p => p.id === item.type);
                  billingText = pkg ? pkg.name : 'اشتراك';
                  priceHint = pkg ? pkg.price : 0;
                }

                return (
                  <div key={item.id} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                        <h5 className="text-xs font-bold text-slate-200">{player.name}</h5>
                      </div>
                      <div className="text-left text-[10px]">
                        <span className="text-orange-500 font-bold">{billingText}</span>
                        <p className="text-slate-500 font-mono mt-0.5">سيدفع {priceHint} ج</p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1.5 border-t border-slate-900/60">
                      <button
                        onClick={() => handleCheckIn(item.playerId, item.type, item.id)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-slate-950 text-[10px] font-black rounded-lg transition-colors"
                      >
                        تسجيل
                      </button>
                      <button
                        onClick={() => {
                          const newT = prompt('اكتب الوقت الجديد (مثل 20:00):', item.time);
                          if (newT) {
                            const updatedList = expectedList.map(el => el.id === item.id ? { ...el, time: newT } : el);
                            saveExpected(updatedList);
                          }
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] rounded-lg transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleRemoveExpected(item.id)}
                        className="px-2 py-1 bg-red-950/20 hover:bg-red-950 text-red-400 text-[10px] rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Static Billing Form: "تسجيل اشتراك ودفع" */}
        <div id="billing-card-form" className="bg-[#111827]/60 backdrop-blur-md border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.05)] rounded-3xl p-5">
          <h3 className="text-sm font-black text-orange-500 mb-4 flex items-center gap-1.5">
            <DollarSign className="h-4.5 w-4.5 text-orange-500" /> تسجيل اشتراك ودفع
          </h3>

          <form onSubmit={handleConfirmBilling} className="space-y-3.5">
            {/* Autocomplete Selector for billing player */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن اللاعب بالاسم أو الرقم لاختياره..."
                value={billingSearch}
                onChange={(e) => {
                  setBillingSearch(e.target.value);
                  setBillingShowDropdown(true);
                  if (selectedBillingPlayer) setSelectedBillingPlayer(null);
                }}
                onFocus={() => setBillingShowDropdown(true)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-500 focus:outline-none"
                required
              />
              
              {billingShowDropdown && filteredBillingPlayers.length > 0 && (
                <div className="absolute top-11 right-0 left-0 bg-slate-900 border border-slate-800 rounded-xl z-50 max-h-[140px] overflow-y-auto p-1 shadow-2xl">
                  {filteredBillingPlayers.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedBillingPlayer(p);
                        setBillingSearch(p.name);
                        setBillingShowDropdown(false);
                      }}
                      className="px-3 py-1.5 text-xs hover:bg-slate-950 rounded-lg cursor-pointer text-right flex justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-slate-500">#{p.playerNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Player Info bar */}
            {selectedBillingPlayer && (
              <div className="bg-[#070d19] border border-orange-500/20 p-2.5 rounded-xl text-xs flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <span className="text-slate-500 font-bold">اللاعب المختار:</span>{' '}
                  <span className="text-slate-200 font-black">{selectedBillingPlayer.name}</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedBillingPlayer(null);
                    setBillingSearch('');
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Package selector */}
            <div>
              <select
                value={billingPackage}
                onChange={(e) => {
                  const val = e.target.value;
                  setBillingPackage(val);
                  if (val === 'daily') {
                    setBillingPrice(String(DAILY_ENTRY_FEE));
                  } else {
                    const pkg = GYM_PACKAGES.find(p => p.id === val);
                    if (pkg) setBillingPrice(String(pkg.price));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                required
              >
                <option value="daily">حصة واحدة (دفع يومي)</option>
                {GYM_PACKAGES.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.price} ج) - {pkg.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Date input */}
            <div>
              <input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center font-mono focus:outline-none"
                required
              />
            </div>

            {/* Price paid input */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <span className="text-xs text-slate-400 pr-1">دفع كام؟</span>
              <input
                type="number"
                value={billingPrice}
                onChange={(e) => setBillingPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs font-sans text-orange-500 font-bold focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-colors"
            >
              تأكيد الدفع (ACCEPT)
            </button>
          </form>
        </div>

      </div>

      {/* ----------------------------------------------------
          EDIT SUBSCRIPTION MODAL (INLINE REPLACEMENT)
      ---------------------------------------------------- */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-[0_0_50px_rgba(249,115,22,0.15)] animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setEditingSub(null)}
              className="absolute left-4 top-4 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-sm font-black text-orange-500 mb-4 flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-orange-500" /> تعديل بيانات الاشتراك
            </h3>

            <form onSubmit={handleUpdateSubDetails} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">القيمة (ج.م)</label>
                <input
                  type="number"
                  value={editSubPrice}
                  onChange={(e) => setEditSubPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-sans focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">عدد الحصص الإجمالي</label>
                <input
                  type="number"
                  value={editSubTotalSessions}
                  onChange={(e) => setEditSubTotalSessions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-sans focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">تاريخ الانتهاء</label>
                <input
                  type="date"
                  value={editSubEndDate}
                  onChange={(e) => setEditSubEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-mono text-xs focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-2xl shadow-lg transition-colors mt-2"
              >
                تحديث الاشتراك
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
