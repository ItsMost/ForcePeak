import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Subscription, type Payment, type Attendance, generateUUID } from '../../db/db';
import { trackWrite } from '../../db/sync';
import { getCurrentMonthString, GYM_PACKAGES } from '../../db/utils';
import { UserPlus, Search, Phone, Edit2, Trash2, CheckCircle2, XCircle, FileText, PlusCircle, MessageSquare } from 'lucide-react';

interface RosterTabProps {
  onSelectPlayerForSubscription: (player: Player) => void;
}

export default function RosterTab({ onSelectPlayerForSubscription }: RosterTabProps) {
  // Local states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);

  // Form states (For adding new player)
  const [name, setName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 15);
  const [mobile, setMobile] = useState('');
  const [club, setClub] = useState('');
  const [sport, setSport] = useState('');
  const [position, setPosition] = useState('');

  // Fetch data with Dexie hooks
  const players = useLiveQuery(() => db.players.filter(p => !p.isDeleted).toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.filter(s => !s.isDeleted).toArray()) || [];
  const payments = useLiveQuery(() => db.payments.filter(pay => !pay.isDeleted).toArray()) || [];
  const attendances = useLiveQuery(() => db.attendance.filter(a => !a.isDeleted).toArray()) || [];

  // Extract unique sports from players for filtering
  const allSports = Array.from(new Set(players.map(p => p.sport).filter(Boolean)));

  // Volleyball Positions List
  const VOLLEYBALL_POSITIONS = [
    { value: 'Center 4: Outside Hitter (OH)', label: 'Center 4: Outside Hitter (OH)' },
    { value: 'Center 3: Middle Blocker (MB)', label: 'Center 3: Middle Blocker (MB)' },
    { value: 'Center 2: Opposite Hitter (OPP)', label: 'Center 2: Opposite Hitter (OPP)' },
    { value: 'Setter: Setter (S)', label: 'Setter: Setter (S)' },
    { value: 'Libero: Libero (L)', label: 'Libero: Libero (L)' },
  ];

  const handleSportChange = (val: string) => {
    setSport(val);
    if (val.trim().toLowerCase() === 'volleyball' || val.trim() === 'كرة طائرة') {
      setPosition(VOLLEYBALL_POSITIONS[0].value);
    } else {
      setPosition('');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !playerNumber) {
      alert('الرجاء كتابة الاسم ورقم اللاعب');
      return;
    }

    const isDuplicate = players.some(p => p.playerNumber === playerNumber);
    if (isDuplicate) {
      alert('رقم اللاعب موجود بالفعل! الرجاء استخدام رقم فريد.');
      return;
    }

    const newPlayer: Player = {
      id: generateUUID(),
      name,
      playerNumber,
      birthYear: Number(birthYear),
      mobile,
      club,
      sport,
      position,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await trackWrite('players', newPlayer);
      setName('');
      setPlayerNumber('');
      setBirthYear(new Date().getFullYear() - 15);
      setMobile('');
      setClub('');
      setSport('');
      setPosition('');
      alert('تم تسجيل اللاعب بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ اللاعب');
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer) return;

    const isDuplicate = players.some(
      p => p.playerNumber === editPlayer.playerNumber && p.id !== editPlayer.id
    );
    if (isDuplicate) {
      alert('رقم اللاعب موجود بالفعل!');
      return;
    }

    try {
      await trackWrite('players', editPlayer);
      setEditPlayer(null);
      alert('تم تعديل بيانات اللاعب بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التعديل');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm('هل أنت متأكد من مسح هذا اللاعب؟ سيتم إخفاؤه محلياً ومزامنته بالسحاب كـ محذوف مع الاحتفاظ بسجلاته المالية.')) {
      return;
    }

    const player = players.find(p => p.id === playerId);
    if (player) {
      const updatedPlayer: Player = {
        ...player,
        isDeleted: true,
        updatedAt: new Date().toISOString()
      };
      await trackWrite('players', updatedPlayer);

      const playerSubs = subscriptions.filter(s => s.playerId === playerId);
      for (const sub of playerSubs) {
        const updatedSub: Subscription = {
          ...sub,
          isDeleted: true,
          updatedAt: new Date().toISOString()
        };
        await trackWrite('subscriptions', updatedSub);
      }
      alert('تم حذف اللاعب بنجاح.');
    }
  };

  const handleWhatsAppMessage = (mobile: string, name: string, sport: string, isReminder: boolean) => {
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
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.playerNumber.includes(searchQuery);
    const matchesSport = selectedSport === 'All' || p.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  const currentMonth = getCurrentMonthString();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-1 text-slate-100" dir="rtl">
      
      {/* Search and List (Takes 3 columns) */}
      <div className="xl:col-span-3 flex flex-col space-y-4">
        
        {/* Filters Panel */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-2/3">
            <Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن لاعب بالاسم أو الرقم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors text-right"
            />
          </div>
          
          <div className="w-full md:w-1/3 flex gap-2">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500/50"
            >
              <option value="All">كل الرياضات</option>
              {allSports.map(sportName => (
                <option key={sportName} value={sportName}>{sportName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Players Cards Grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans">
              {filteredPlayers.length}
            </span>
            <h2 className="text-lg font-black text-slate-200">كل اللاعبين</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlayers.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                لا يوجد لاعبين مطابقين للبحث حالياً.
              </div>
            ) : (
              filteredPlayers.map(p => {
                // Calculate Stats
                const pSubs = subscriptions.filter(s => s.playerId === p.id);
                const pPayments = payments.filter(pay => pay.playerId === p.id);
                const pAttendances = attendances.filter(att => att.playerId === p.id);

                const activeSub = pSubs.find(s => s.status === 'active');
                const isSubActive = activeSub && new Date(activeSub.endDate) >= new Date();

                const totalAttendances = pAttendances.length;
                const totalPaid = pPayments.reduce((acc, pay) => acc + pay.amount, 0);
                const thisMonthPaymentCount = pPayments.filter(pay => pay.date.startsWith(currentMonth)).length;

                return (
                  <div 
                    key={p.id} 
                    className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-orange-500/30 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.05)] group relative"
                  >
                    {/* Active Subscription Badge */}
                    <div className="absolute left-4 top-4">
                      {isSubActive ? (
                        <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> اشتراك ساري
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">
                          <XCircle className="h-3 w-3" /> غير مسدد/منتهي
                        </span>
                      )}
                    </div>

                    {/* Header Info */}
                    <div className="mb-4">
                      <h3 className="text-base font-black text-orange-500 group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                        {p.name} <span className="text-xs text-slate-500 font-mono">#{p.playerNumber}</span>
                      </h3>
                      
                      <div className="mt-2 text-xs space-y-1 text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">المواليد:</span> {p.birthYear || '-'} | 
                          <span className="text-slate-500 font-bold">الرياضة:</span> {p.sport} | 
                          <span className="text-slate-500 font-bold">النادي:</span> {p.club}
                        </p>
                        
                        <p className="flex items-center gap-1 text-slate-300">
                          <span className="text-orange-500 font-bold">★</span> 
                          <span className="text-slate-500 font-bold">المركز:</span> 
                          <span className="font-semibold text-slate-200">{p.position || 'غير محدد'}</span>
                        </p>

                        <p className="flex items-center gap-1.5 text-slate-350 pt-1 font-mono">
                          <Phone className="h-3 w-3 text-slate-550" /> {p.mobile || 'لا يوجد'}
                        </p>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-2.5 text-center text-[10px] border border-slate-900">
                      <div>
                        <div className="text-slate-500 font-bold mb-0.5">حضور اللاعب</div>
                        <div className="text-slate-200 font-bold font-sans">{totalAttendances} مرات</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-bold mb-0.5">إجمالي المدفوع</div>
                        <div className="text-orange-500 font-bold font-sans">{totalPaid} ج.م</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-bold mb-0.5">دفعات الشهر</div>
                        <div className="text-slate-200 font-bold font-sans">{thisMonthPaymentCount} مرات</div>
                      </div>
                    </div>

                    {/* Action Buttons matching mockup grid: مسح | السجل | + دفع | تعديل */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-950/80">
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs bg-red-950/20 hover:bg-red-950 border border-red-900/30 hover:border-red-700 text-red-400 hover:text-red-200 font-bold rounded-lg transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> مسح
                      </button>
                      <button
                        onClick={() => alert(`تقرير اللاعب المالي للحضور الإجمالي: ${totalAttendances} مرة\nإجمالي المدفوعات: ${totalPaid} ج.م`)}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-lg transition-all"
                      >
                        <FileText className="h-3.5 w-3.5" /> السجل
                      </button>
                      <button
                        onClick={() => onSelectPlayerForSubscription(p)}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs bg-green-500/15 hover:bg-green-500 border border-green-500/20 hover:border-green-400 text-green-400 hover:text-slate-950 font-bold rounded-lg transition-all"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> + دفع
                      </button>
                      <button
                        onClick={() => setEditPlayer(p)}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-orange-500 hover:text-orange-400 font-bold rounded-lg transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> تعديل
                      </button>
                    </div>

                    {/* WhatsApp links under the buttons */}
                    <div className="mt-3 text-center border-t border-slate-950/40 pt-2 flex justify-center items-center">
                      {isSubActive ? (
                        <button
                          onClick={() => handleWhatsAppMessage(p.mobile, p.name, p.sport, false)}
                          className="flex items-center justify-center gap-1 text-[11px] text-green-400 hover:text-green-300 font-bold transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block"></span>
                          مراسلة 💬
                        </button>
                      ) : (
                        <button
                          onClick={() => handleWhatsAppMessage(p.mobile, p.name, p.sport, true)}
                          className="flex items-center justify-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block"></span>
                          تذكر بالدفع 🚨
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Register Form or Edit Form */}
      <div className="xl:col-span-1">
        {editPlayer ? (
          /* Edit Player Card */
          <div className="bg-slate-900/50 backdrop-blur-md border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)] rounded-2xl p-5 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-orange-500 flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-orange-500" /> تعديل بيانات لاعب
              </h3>
              <button 
                onClick={() => setEditPlayer(null)}
                className="text-xs text-slate-500 hover:text-slate-300 bg-slate-950 px-2 py-1 rounded"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleUpdatePlayer} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم اللاعب (مطلوب)</label>
                <input
                  type="text"
                  required
                  value={editPlayer.name}
                  onChange={(e) => setEditPlayer({ ...editPlayer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">رقم اللاعب</label>
                  <input
                    type="text"
                    required
                    value={editPlayer.playerNumber}
                    onChange={(e) => setEditPlayer({ ...editPlayer, playerNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">سنة الميلاد</label>
                  <input
                    type="number"
                    value={editPlayer.birthYear || ''}
                    onChange={(e) => setEditPlayer({ ...editPlayer, birthYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">النادي</label>
                <input
                  type="text"
                  value={editPlayer.club}
                  onChange={(e) => setEditPlayer({ ...editPlayer, club: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الرياضة</label>
                <input
                  type="text"
                  value={editPlayer.sport}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isVolley = val.trim().toLowerCase() === 'volleyball' || val.trim() === 'كرة طائرة';
                    setEditPlayer({ 
                      ...editPlayer, 
                      sport: val, 
                      position: isVolley ? VOLLEYBALL_POSITIONS[0].value : '' 
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">المركز</label>
                {(editPlayer.sport.trim().toLowerCase() === 'volleyball' || editPlayer.sport.trim() === 'كرة طائرة') ? (
                  <select
                    value={editPlayer.position}
                    onChange={(e) => setEditPlayer({ ...editPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    {VOLLEYBALL_POSITIONS.map(pos => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editPlayer.position}
                    onChange={(e) => setEditPlayer({ ...editPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رقم الموبايل</label>
                <input
                  type="text"
                  value={editPlayer.mobile}
                  onChange={(e) => setEditPlayer({ ...editPlayer, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-left font-mono focus:outline-none focus:border-orange-500"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl shadow-lg transition-colors mt-2"
              >
                تحديث البيانات
              </button>
            </form>
          </div>
        ) : (
          /* Register New Player Card */
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sticky top-4">
            <h3 className="text-base font-black text-orange-500 flex items-center gap-1.5 mb-4">
              <UserPlus className="h-4.5 w-4.5 text-orange-500" /> تسجيل لاعب جديد
            </h3>

            <form onSubmit={handleAddPlayer} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  required
                  placeholder="اسم اللاعب (مطلوب)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="رقم اللاعب"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="سنة الميلاد (081)"
                    value={birthYear || ''}
                    onChange={(e) => setBirthYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-center font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="النادي"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="الرياضة (اكتب Volleyball للطائرة)"
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                {(sport.trim().toLowerCase() === 'volleyball' || sport.trim() === 'كرة طائرة') ? (
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5 mr-1 font-bold">اختر مركز كرة الطائرة:</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-orange-500/50"
                    >
                      {VOLLEYBALL_POSITIONS.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="المركز الذي يلعب فيه (مثل: صانع)"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="رقم الموبايل (مهم للواتساب)"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-left font-mono focus:outline-none focus:border-orange-500/50"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl shadow-lg transition-colors mt-2"
              >
                إضافة للقاعدة
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
