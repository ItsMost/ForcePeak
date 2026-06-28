import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Calendar, Plus, Trash2, Edit2, Check, HelpCircle, 
  Sparkles, Dumbbell, Play, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PHASE_COLORS = [
  { hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-50/10 dark:bg-blue-500/10', text: 'text-blue-500', label: 'Blue (Base)' },
  { hex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-50/10 dark:bg-emerald-500/10', text: 'text-emerald-500', label: 'Emerald (Strength)' },
  { hex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-50/10 dark:bg-amber-500/10', text: 'text-amber-500', label: 'Amber (Power)' },
  { hex: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-50/10 dark:bg-rose-500/10', text: 'text-rose-500', label: 'Rose (Peak)' }
];

const DEFICIT_GUIDELINES = {
  FDP: {
    title: "بروتوكول عجز القوة القصوى (FDP)",
    englishTitle: "Max Force Deficit Protocol",
    focus: "بناء أساس متين من القوة المطلقة والتحمل العضلي وتجنيد الوحدات الحركية السريعة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Eccentric Control -> Concentric Acceleration" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "0.30 - 0.50 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "10% - 15% (Strength/Hypertrophy)" },
      { label: "زمن التلامس / Contact Time", value: "غير مؤثر (> 250ms)" },
      { label: "الأحمال المقترحة / Load Target", value: "80% - 90% 1RM" }
    ],
    tips: [
      "التركيز على التمارين المركبة الثقيلة (Squats, Bench Press, Deadlift).",
      "الحفاظ على وقت راحة كافٍ (3-5 دقائق) بين المجموعات لضمان التعافي العصبي الكامل.",
      "استخدم VBT لضبط الحمل اليومي: إذا كانت السرعة أعلى من 0.50 m/s، قم بزيادة الوزن."
    ]
  },
  EDP: {
    title: "بروتوكول عجز الدورة المطاطية (EDP)",
    englishTitle: "Elastic SSC Deficit Protocol",
    focus: "تطوير قدرة العضلات والأوتار على تخزين وإطلاق الطاقة المطاطية (الدورة المطاطية البطيئة).",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Slow SSC (Stretch-Shortening Cycle)" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "0.75 - 1.00 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "< 10% (Avoid fatigue, maintain power)" },
      { label: "زمن التلامس / Contact Time", value: "معتدل (250ms - 400ms)" },
      { label: "الأحمال المقترحة / Load Target", value: "30% - 60% 1RM (Loaded Jumps)" }
    ],
    tips: [
      "تمارين القفز المحمل (Loaded Squat Jumps) والقفز العمودي CMJ.",
      "تجنب الإجهاد العضلي التام؛ الهدف هو إنتاج أقصى قدرة انفجارية تفاعلية.",
      "التركيز على سرعة الانتقال بين النزول والصعود (Amortization Phase)."
    ]
  },
  RSD: {
    title: "بروتوكول عجز الصلابة الارتدادية (RSD)",
    englishTitle: "Reactive & Stiffness Deficit",
    focus: "زيادة صلابة الكاحل والأوتار لتقليل زمن التلامس مع الأرض وزيادة معدل نقل القوة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Fast SSC (Rapid Stretch-Shortening)" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "غير مطبق (تعتمد على ارتفاع القفز والزمن)" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "تجنب هبوط الارتفاع أو زيادة زمن التلامس" },
      { label: "زمن التلامس / Contact Time", value: "سريع جداً (< 200ms - 250ms)" },
      { label: "مؤشر الارتداد / RSI Target", value: "> 2.50 (Reactive Strength Index)" }
    ],
    tips: [
      "تمارين البلايومتركس السريعة (Depth Jumps, Hurdle Hops, Pogo Jumps).",
      "يجب أن تكون الأرض صلبة والتلامس كأنه على سطح ساخن جداً.",
      "توقف فوراً عند زيادة زمن التلامس عن 250 مللي ثانية."
    ]
  },
  HVRP: {
    title: "بروتوكول عجز السرعة ومعدل القوة (HVRP)",
    englishTitle: "High-Velocity RFD Deficit",
    focus: "تطوير أقصى سرعة ممكنة للجهاز العصبي ومعدل نمو القوة السريع بالأوزان الخفيفة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Ballistic / High-Velocity Acceleration" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "1.10 - 1.30 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "< 5% - 8% (Focus on maximum speed)" },
      { label: "زمن التلامس / Contact Time", value: "سريع جداً" },
      { label: "الأحمال المقترحة / Load Target", value: "0% - 30% 1RM (Light/Banded)" }
    ],
    tips: [
      "تمارين دفع الدمبل الخفيف، تمارين الحبال المطاطية، ورمي الكرات الطبية.",
      "التنفيذ بأقصى نية للحركة المتفجرة (Maximal Intent of Velocity).",
      "فترات راحة كاملة لضمان أداء كل تكرار بأعلى سرعة ممكنة."
    ]
  }
};

const getDbDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PeriodizationPlanner({
  athlete, onClose, handleToast, programs, refreshDeploymentsCallback,
  selectedBlockId, setSelectedBlockId,
  isEditingBlock, setIsEditingBlock,
  activeBlockPhaseIndex, setActiveBlockPhaseIndex,
  activeBlockWeekIndex, setActiveBlockWeekIndex,
  blockData, setBlockData,
  athletes = []
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [blockTemplates, setBlockTemplates] = useState([]);
  
  const [activeMesoPhaseIdx, setActiveMesoPhaseIdx] = useState(null);

  // Seasons / Periodization Planner additions
  const [activeTab, setActiveTab] = useState('block_designer');
  const [stagedDeployments, setStagedDeployments] = useState([]);
  const [athleteDeployments, setAthleteDeployments] = useState([]);

  const fetchAthleteDeployments = async () => {
    if (!athlete) return;
    try {
      const { data } = await supabase
        .from('periodization_deployments')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('start_date', { ascending: true });
      setAthleteDeployments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAthleteDeployments();
  }, [athlete]);

  const getMonthsAndWeeks = () => {
    const list = [];
    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth();

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(startYear, startMonth + m, 1);
      const monthName = monthDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      const englishMonthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const weeks = [];
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= numDays; day++) {
        const d = new Date(year, month, day);
        if (d.getDay() === 6) { // Saturday
          const saturdayStr = getDbDateStr(d);
          const friday = new Date(d);
          friday.setDate(friday.getDate() + 6);
          const rangeLabel = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })} - ${friday.getDate()} ${friday.toLocaleDateString('en-US', { month: 'short' })}`;
          weeks.push({
            dateStr: saturdayStr,
            rangeLabel
          });
        }
      }

      list.push({
        monthName: `${monthName} / ${englishMonthName}`,
        weeks
      });
    }
    return list;
  };

  const handleDropWeek = (e, weekStartDateStr) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    const { programId, programName, weeksCount } = JSON.parse(dataStr);

    const start = new Date(weekStartDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + (weeksCount * 7) - 1);

    const newDeploy = {
      id: `staged-${Date.now()}`,
      athlete_id: athlete?.id,
      program_id: programId,
      program_name: programName,
      start_date: getDbDateStr(start),
      end_date: getDbDateStr(end),
      color: PHASE_COLORS[(athleteDeployments.length + stagedDeployments.length) % PHASE_COLORS.length].hex,
      isStaged: true
    };

    setStagedDeployments(prev => [...prev, newDeploy]);
  };

  const getDeployCoverStatus = (dep, dateStr) => {
    const wSat = new Date(dateStr);
    const start = new Date(dep.start_date);
    const end = new Date(dep.end_date);
    wSat.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (wSat.toDateString() === start.toDateString()) {
      return 'start';
    }
    if (wSat > start && wSat <= end) {
      return 'continue';
    }
    return 'none';
  };

  const handleDeleteStaged = (id) => {
    setStagedDeployments(prev => prev.filter(d => d.id !== id));
  };

  const handleDeleteSaved = async (id) => {
    const { error } = await supabase
      .from('periodization_deployments')
      .delete()
      .eq('id', id);
    if (!error) {
      setAthleteDeployments(prev => prev.filter(d => d.id !== id));
      handleToast('تم إزالة الفترة التدريبية بنجاح.');
      if (refreshDeploymentsCallback) refreshDeploymentsCallback(athlete.id);
    } else {
      handleToast('حدث خطأ أثناء حذف الفترة التدريبية');
    }
  };

  const handleSaveSeasonPlan = async () => {
    if (stagedDeployments.length === 0) {
      handleToast('لا يوجد برامج جديدة لحفظها!');
      return;
    }
    setIsLoading(true);
    try {
      for (const dep of stagedDeployments) {
        const { data: program } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', dep.program_id)
          .single();

        if (!program || !program.weeks) continue;

        const start = new Date(dep.start_date);

        for (let i = 0; i < program.weeks.length; i++) {
          const futureWeekStart = new Date(start);
          futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
          const weekTemplateObject = program.weeks[i].drills || {};
          const targetBlockTitle = program.weeks[i].title || 'Block Workout';

          for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
            const dayDate = new Date(futureWeekStart);
            dayDate.setDate(dayDate.getDate() + j);

            let clonedDrills = [];
            if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
              clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ ...drill, id: `season-${Date.now()}-${i}-${j}-${idx}` }));
            } else if (Array.isArray(weekTemplateObject)) {
              clonedDrills = weekTemplateObject.map((drill, idx) => ({ ...drill, id: `season-${Date.now()}-${i}-${j}-${idx}` }));
            }

            await supabase.from('agilitylap_workouts').upsert({
              athlete_id: athlete.id,
              workout_date: getDbDateStr(dayDate),
              workout_title: targetBlockTitle,
              drills: clonedDrills
            }, { onConflict: 'athlete_id,workout_date' });
          }
        }

        await supabase.from('periodization_deployments').insert([{
          athlete_id: athlete.id,
          program_id: dep.program_id,
          program_name: dep.program_name,
          start_date: dep.start_date,
          end_date: dep.end_date,
          color: dep.color
        }]);
      }

      handleToast('تم حفظ وتطبيق خطة الموسم بنجاح!');
      setStagedDeployments([]);
      fetchAthleteDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback(athlete.id);
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء حفظ وتطبيق خطة الموسم.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSeasonPlanner = () => {
    const calendarData = getMonthsAndWeeks();
    const mesoBlocks = programs ? programs.filter(p => p.type !== 'macro_block') : [];

    return (
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
        {/* Sidebar: Draggable Meso-Blocks */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-l border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">البرامج المتاحة للسحب</h4>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Drag programs to timeline</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {mesoBlocks.length > 0 ? (
              mesoBlocks.map(prog => (
                <div
                  key={prog.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      programId: prog.id,
                      programName: prog.program_name,
                      weeksCount: prog.weeks ? prog.weeks.length : 0
                    }));
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-grab active:cursor-grabbing hover:border-orange-500 dark:hover:border-orange-500/50 transition-all select-none group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-500 shrink-0">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate group-hover:text-orange-500 transition-colors">
                      {prog.program_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-250 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8.5px] font-bold">
                      {prog.weeks ? prog.weeks.length : 0} Weeks
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <span className="text-[10px] text-slate-400">لا يوجد برامج Meso-Blocks متاحة.</span>
              </div>
            )}
          </div>

          {/* Staged list actions */}
          {stagedDeployments.length > 0 && (
            <div className="mt-auto bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/20 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-orange-650 dark:text-orange-400 block text-center">لديك خطة دورية غير محفوظة!</span>
              <button
                onClick={handleSaveSeasonPlan}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> حفظ خطة الموسم التدريبية
              </button>
            </div>
          )}
        </div>

        {/* Annual Timeline Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800/80 p-4 border border-slate-200/50 dark:border-slate-800 rounded-2xl shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white font-sans">الخطة السنوية والجدولة للاعب: {athlete ? athlete.name : ''}</h4>
                <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 mt-0.5 uppercase tracking-wide">Annual periodization & schedule mapping</p>
              </div>
              {stagedDeployments.length > 0 && (
                <span className="text-[9px] font-black uppercase bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900/20 animate-pulse">غير محفوظ</span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800/60 border border-slate-250 dark:border-slate-805 rounded-[24px] overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {calendarData.map((mon, mIdx) => (
                  <div key={mIdx} className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Month Label */}
                    <div className="w-full md:w-36 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider md:pt-1">
                      {mon.monthName}
                    </div>

                    {/* Weeks Column Grid */}
                    <div className="flex-1 flex flex-col gap-2.5">
                      {mon.weeks.map((wk, wIdx) => {
                        const weekDeploys = athleteDeployments.concat(stagedDeployments).filter(dep => {
                          const wSat = new Date(wk.dateStr);
                          const start = new Date(dep.start_date);
                          const end = new Date(dep.end_date);
                          return wSat >= start && wSat <= end;
                        });

                        return (
                          <div
                            key={wIdx}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropWeek(e, wk.dateStr)}
                            className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all gap-4 min-h-[50px] relative drop-zone"
                          >
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none">
                              {wk.rangeLabel}
                            </span>

                            {/* Render mapped capsules */}
                            <div className="flex-1 flex flex-col gap-1.5">
                              {weekDeploys.map(dep => {
                                const status = getDeployCoverStatus(dep, wk.dateStr);
                                if (status === 'start') {
                                  return (
                                    <div
                                      key={dep.id}
                                      className="px-3.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center justify-between gap-3 text-white transition-all select-none animate-fadeIn"
                                      style={{ backgroundColor: dep.color, borderColor: dep.color }}
                                    >
                                      <span className="truncate">{dep.program_name}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (dep.isStaged) {
                                            handleDeleteStaged(dep.id);
                                          } else {
                                            if (confirm('هل أنت متأكد من حذف هذه الفترة التدريبية؟ سيتم إزالة السجلات المرتبطة بها.')) {
                                              handleDeleteSaved(dep.id);
                                            }
                                          }
                                        }}
                                        className="p-1 hover:bg-white/20 rounded-md transition-all shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                } else if (status === 'continue') {
                                  return (
                                    <div
                                      key={dep.id}
                                      className="h-3 rounded-md w-full transition-all animate-fadeIn"
                                      style={{ backgroundColor: dep.color, opacity: 0.25 }}
                                      title={`Continuation of ${dep.program_name}`}
                                    />
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modals inside Periodization Planner
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDeficit, setNewBlockDeficit] = useState('FDP');
  const [newBlockLevel, setNewBlockLevel] = useState('Beginner');

  const [showRenameModal, setShowRenameModal] = useState({ isOpen: false, blockId: null, currentName: '', newName: '' });
  const [showDeployModal, setShowDeployModal] = useState({ isOpen: false, blockId: null, athleteId: '', startDate: '' });

  // Fetch block templates (type = 'macro_block')
  const fetchBlockTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('type', 'macro_block')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setBlockTemplates(data);
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تحميل قوالب الكتل.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockTemplates();
  }, []);

  // Creation of a template with 4 predefined phases and empty workouts
  const handleCreateBlock = async () => {
    if (!newBlockName.trim()) {
      handleToast('الرجاء كتابة اسم القالب!');
      return;
    }
    setIsLoading(true);
    try {
      const defaultPhases = [
        { name: 'بناء الأساس / Base Building', durationWeeks: 12, weeks: [] },
        { name: 'القوة القصوى / Max Strength', durationWeeks: 8, weeks: [] },
        { name: 'الـ POWER السريع / Rapid Power', durationWeeks: 6, weeks: [] },
        { name: 'التجهيز للقفز (Peak) / Peak & Jump Prep', durationWeeks: 4, weeks: [] }
      ];
      defaultPhases.forEach(phase => {
        phase.weeks = Array.from({ length: phase.durationWeeks }, (_, idx) => ({
          weekIndex: idx,
          type: 'None',
          title: '',
          drills: (() => {
            const d = {}; DAYS_OF_WEEK.forEach(day => d[day] = []); return d;
          })()
        }));
      });

      const payload = {
        program_name: newBlockName,
        type: 'macro_block',
        weeks: [
          {
            isMacroBlock: true,
            deficitProtocol: newBlockDeficit,
            level: newBlockLevel,
            phases: defaultPhases
          }
        ]
      };

      const { data, error } = await supabase
        .from('agilitylap_programs')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        handleToast(`تم إنشاء القالب "${newBlockName}" بنجاح!`);
        setShowCreateBlockModal(false);
        setNewBlockName('');
        await fetchBlockTemplates();
        await refreshDeploymentsCallback();
        setSelectedBlockId(data[0].id);
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء إنشاء القالب.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renaming block template
  const handleRenameBlockSubmit = async () => {
    const { blockId, newName } = showRenameModal;
    if (!newName.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ program_name: newName })
        .eq('id', blockId);
      if (!error) {
        handleToast('تم تغيير الاسم بنجاح!');
        setShowRenameModal({ isOpen: false, blockId: null, currentName: '', newName: '' });
        await fetchBlockTemplates();
        await refreshDeploymentsCallback();
        if (selectedBlockId === blockId) {
          // force re-trigger load
          setSelectedBlockId(null);
          setTimeout(() => setSelectedBlockId(blockId), 10);
        }
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تعديل الاسم.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deleting block template
  const handleDeleteBlockClick = async (blockId, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف قالب الكتلة "${name}" نهائياً؟`)) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .delete()
        .eq('id', blockId);
      if (!error) {
        handleToast('تم حذف القالب بنجاح!');
        if (selectedBlockId === blockId) {
          setSelectedBlockId(null);
        }
        await fetchBlockTemplates();
        await refreshDeploymentsCallback();
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء حذف القالب.');
    } finally {
      setIsLoading(false);
    }
  };

  // Adjusting week duration of a specific phase
  const handleUpdatePhaseDuration = async (phaseIdx, newDuration) => {
    if (!selectedBlockId || !blockData) return;
    const updated = { ...blockData };
    const phase = updated.phases?.[phaseIdx];
    if (!phase) return;

    const oldDuration = phase.durationWeeks;
    phase.durationWeeks = newDuration;

    if (newDuration > oldDuration) {
      const additionalWeeks = Array.from({ length: newDuration - oldDuration }, (_, idx) => ({
        weekIndex: oldDuration + idx,
        type: 'None',
        title: '',
        drills: (() => {
          const d = {}; DAYS_OF_WEEK.forEach(day => d[day] = []); return d;
        })()
      }));
      phase.weeks = [...(phase.weeks || []), ...additionalWeeks];
    } else if (newDuration < oldDuration) {
      phase.weeks = phase.weeks.slice(0, newDuration);
    }

    setBlockData(updated);

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ weeks: [updated] })
        .eq('id', selectedBlockId);
      if (!error) {
        handleToast('تم تحديث مدة الفترة التدريبية!');
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تحديث مدة الفترة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Adjusting week microcycle focus (None, Load, Deload, Test)
  const handleUpdateWeekType = async (phaseIdx, weekIdx, type) => {
    if (!selectedBlockId || !blockData) return;
    const updated = { ...blockData };
    const week = updated.phases?.[phaseIdx]?.weeks?.[weekIdx];
    if (!week) return;

    week.type = type;
    setBlockData(updated);

    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ weeks: [updated] })
        .eq('id', selectedBlockId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تحديث نوع الأسبوع.');
    }
  };

  // Adjusting weekly title/focus description
  const handleUpdateWeekTitle = async (phaseIdx, weekIdx, title) => {
    if (!selectedBlockId || !blockData) return;
    const updated = { ...blockData };
    const week = updated.phases?.[phaseIdx]?.weeks?.[weekIdx];
    if (!week) return;

    week.title = title;
    setBlockData(updated);

    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ weeks: [updated] })
        .eq('id', selectedBlockId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تحديث عنوان الأسبوع.');
    }
  };

  // Apply template block to player schedule from Periodization Planner
  const handleDeployBlockSubmit = async () => {
    const { blockId, athleteId, startDate } = showDeployModal;
    if (!blockId || !athleteId || !startDate) {
      handleToast('الرجاء تعبئة جميع الحقول!');
      return;
    }
    setIsLoading(true);
    setShowDeployModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' });

    try {
      const { data: program, error: prgErr } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('id', blockId)
        .single();
      
      if (prgErr || !program) throw new Error('Could not fetch block details');

      const details = program.weeks?.[0] || {};
      const phases = details.phases || [];

      const start = new Date(startDate);
      let currentWeekStart = new Date(start);
      const workoutsToUpsert = [];
      let totalWeeksDeployed = 0;

      for (let pIdx = 0; pIdx < phases.length; pIdx++) {
        const phase = phases[pIdx];
        const weeks = phase.weeks || [];
        for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
          const week = weeks[wIdx];
          const drills = week.drills || {};

          for (let dIdx = 0; dIdx < DAYS_OF_WEEK.length; dIdx++) {
            const dayName = DAYS_OF_WEEK[dIdx];
            const targetDate = new Date(currentWeekStart);
            targetDate.setDate(targetDate.getDate() + dIdx);

            const dayDrills = (drills[dayName] || []).map((drill, idx) => ({
              ...drill,
              id: `deployed-${Date.now()}-${pIdx}-${wIdx}-${dIdx}-${idx}-${Math.random()}`
            }));

            workoutsToUpsert.push({
              athlete_id: athleteId,
              workout_date: getDbDateStr(targetDate),
              workout_title: week.title || phase.name?.split('/')[0]?.trim() || 'Block Workout',
              drills: dayDrills
            });
          }
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          totalWeeksDeployed++;
        }
      }

      if (workoutsToUpsert.length > 0) {
        const { error: upsertErr } = await supabase
          .from('agilitylap_workouts')
          .upsert(workoutsToUpsert, { onConflict: 'athlete_id,workout_date' });
        if (upsertErr) throw upsertErr;
      }

      const end = new Date(start);
      end.setDate(end.getDate() + (totalWeeksDeployed * 7) - 1);

      await supabase.from('periodization_deployments').insert([{
        athlete_id: athleteId,
        program_id: blockId,
        program_name: program.program_name,
        start_date: getDbDateStr(start),
        end_date: getDbDateStr(end),
        deficit_protocol: details.deficitProtocol || 'FDP',
        level: details.level || 'Beginner',
        phases_durations: phases.map(p => p.durationWeeks)
      }]);

      handleToast(`تم تطبيق القالب "${program.program_name}" بنجاح على اللاعب!`);
      onClose(); // close planner modal
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تطبيق القالب الدوري.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWeekWorkouts = (phaseIdx, weekIdx) => {
    setActiveBlockPhaseIndex(phaseIdx);
    setActiveBlockWeekIndex(weekIdx);
    setIsEditingBlock(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-2 sm:p-6 print:hidden" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
        
        {/* Main Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                مصمم كتل التدريب الدوري والبرامج العامة — Master Block Designer
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
                قم ببناء وتعديل الخطط الدورية كبرامج مستقلة وتطبيقها على أي لاعب بضغطة واحدة.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 shrink-0 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('block_designer')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'block_designer' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            مصمم البرامج والكتل / Block Designer
          </button>
          <button
            onClick={() => setActiveTab('season_planner')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'season_planner' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            مخطط الموسم السنوي / Season Planner
          </button>
        </div>

        {/* Modal Body Container */}
        {activeTab === 'block_designer' ? (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Main Workspace (Left Area) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
            {!selectedBlockId || !blockData ? (
              /* Empty state when no template is selected */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
                  <Dumbbell className="w-10 h-10 text-slate-400" />
                </div>
                <h4 className="text-base font-black text-slate-800 dark:text-white">لم يتم اختيار أي قالب كتلة</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  اختر أحد القوالب الجاهزة من القائمة الجانبية للتعديل عليه، أو اضغط على زر "إنشاء قالب كتلة جديد" لبناء برنامج دوري متكامل.
                </p>
                <button
                  onClick={() => setShowCreateBlockModal(true)}
                  className="mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> إنشاء قالب كتلة جديد
                </button>
              </div>
            ) : (
              /* Template selected content */
              <div className="space-y-6">
                
                {/* Selected block details header */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-800 dark:text-white">{blockData.program_name || 'قالب كتلة'}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                        {blockData.level || 'Beginner'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                        {blockData.deficitProtocol || 'FDP'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      برنامج دوري عام مقسم لـ 4 فترات متعاقبة (Base &rarr; Strength &rarr; Power &rarr; Peak)
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeployModal({ isOpen: true, blockId: selectedBlockId, athleteId: athlete?.id || '', startDate: '' })}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4 text-white" /> تطبيق ونشر القالب على لاعب
                    </button>
                    {activeMesoPhaseIdx !== null && (
                      <button
                        onClick={() => setActiveMesoPhaseIdx(null)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs"
                      >
                        العودة للمراحل العامة / Back
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                  
                  {/* Left Column: Visual Dashboard */}
                  <div className="flex-1 space-y-6">
                    {activeMesoPhaseIdx === null ? (
                      /* MACRO VIEW: Shows the 4 Phase Cards */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">فترات الدورة الكبرى (Macrocycle Phases)</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(blockData.phases || []).map((phase, pIdx) => {
                            const themeColor = PHASE_COLORS[pIdx] || PHASE_COLORS[0];
                            const weeksCount = phase.durationWeeks || 0;
                            const loadWeeks = (phase.weeks || []).filter(w => w.type === 'Load').length;
                            const deloadWeeks = (phase.weeks || []).filter(w => w.type === 'Deload').length;
                            const testWeeks = (phase.weeks || []).filter(w => w.type === 'Test').length;

                            return (
                              <div 
                                key={pIdx} 
                                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                                style={{ borderRightWidth: '4px', borderRightColor: themeColor.hex }}
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">الفترة {pIdx + 1}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${themeColor.text} ${themeColor.bg}`}>
                                      {weeksCount} أسبوعاً
                                    </span>
                                  </div>
                                  
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                                    {phase.name}
                                  </h4>
                                  
                                  {/* Week preview capsules */}
                                  <div className="flex flex-wrap gap-1 py-2">
                                    {(phase.weeks || []).map((w, wIdx) => {
                                      let wColor = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                                      if (w.type === 'Load') wColor = 'bg-amber-500 border-amber-500 text-white';
                                      if (w.type === 'Deload') wColor = 'bg-emerald-500 border-emerald-500 text-white';
                                      if (w.type === 'Test') wColor = 'bg-blue-500 border-blue-500 text-white';
                                      return (
                                        <div 
                                          key={wIdx} 
                                          className={`w-4 h-4 rounded text-[7.5px] font-black flex items-center justify-center border ${wColor}`}
                                          title={`أسبوع ${wIdx + 1}: ${w.type}`}
                                        >
                                          {w.type === 'None' ? '' : w.type.charAt(0)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
                                  {/* Duration dropdown */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">المدة:</span>
                                    <select
                                      value={weeksCount}
                                      onChange={(e) => handleUpdatePhaseDuration(pIdx, Number(e.target.value))}
                                      className="text-[11px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-700 dark:text-white outline-none"
                                    >
                                      {[4, 6, 8, 12, 16, 24].map(w => (
                                        <option key={w} value={w}>{w} أسابيع</option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => setActiveMesoPhaseIdx(pIdx)}
                                    className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                                  >
                                    عرض وتصنيف الأسابيع 🔍
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* MESO VIEW: Grid of Weeks of Selected Phase */
                      <div className="space-y-4">
                        {(() => {
                          const phase = blockData.phases?.[activeMesoPhaseIdx];
                          const themeColor = PHASE_COLORS[activeMesoPhaseIdx] || PHASE_COLORS[0];
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  أسابيع فترة: {phase?.name}
                                </h5>
                                <button
                                  onClick={() => setActiveMesoPhaseIdx(null)}
                                  className="text-[11px] font-bold text-orange-500 hover:underline"
                                >
                                  &larr; العودة لعرض الفترات الأربعة
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(phase?.weeks || []).map((week, wIdx) => {
                                  const focus = week.type || 'None';
                                  return (
                                    <div 
                                      key={wIdx}
                                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-4 flex flex-col justify-between gap-4"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-800 dark:text-white">أسبوع {wIdx + 1}</span>
                                        
                                        {/* Micro focus selector pills */}
                                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                          {[
                                            { key: 'None', label: 'بدون', activeColor: 'bg-slate-500 text-white font-black' },
                                            { key: 'Load', label: 'شحن', activeColor: 'bg-amber-500 text-white font-black shadow-sm shadow-amber-500/20' },
                                            { key: 'Deload', label: 'استشفاء', activeColor: 'bg-emerald-500 text-white font-black shadow-sm shadow-emerald-500/20' },
                                            { key: 'Test', label: 'اختبار', activeColor: 'bg-blue-500 text-white font-black shadow-sm shadow-blue-500/20' }
                                          ].map(btn => (
                                            <button
                                              key={btn.key}
                                              type="button"
                                              onClick={() => handleUpdateWeekType(activeMesoPhaseIdx, wIdx, btn.key)}
                                              className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-all ${focus === btn.key ? btn.activeColor : 'text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-850'}`}
                                            >
                                              {btn.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Week title input */}
                                      <input
                                        type="text"
                                        placeholder="مثال: أسبوع حمل عالي، أسبوع تفريغ أحمال.."
                                        value={week.title || ''}
                                        onChange={(e) => handleUpdateWeekTitle(activeMesoPhaseIdx, wIdx, e.target.value)}
                                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold"
                                      />

                                      <button
                                        onClick={() => handleEditWeekWorkouts(activeMesoPhaseIdx, wIdx)}
                                        className="w-full py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-black text-[11px] shadow-sm flex items-center justify-center gap-1.5"
                                      >
                                        <Dumbbell className="w-3.5 h-3.5" /> تعديل تمارين هذا الأسبوع بالجدول الرئيسي
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Sports Science Guidance panel (collapsible) */}
                  <div className="w-full xl:w-72 shrink-0">
                    {(() => {
                      const deficit = blockData?.deficitProtocol || 'FDP';
                      const guide = DEFICIT_GUIDELINES[deficit] || DEFICIT_GUIDELINES.FDP;
                      return (
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 border border-slate-200 dark:border-slate-700/60 rounded-3xl space-y-4">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                            <HelpCircle className="w-4.5 h-4.5 text-violet-500 shrink-0" />
                            <div>
                              <h5 className="text-xs font-black text-slate-800 dark:text-white leading-tight">{guide.title}</h5>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">{guide.englishTitle}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                            🎯 {guide.focus}
                          </p>

                          <div className="space-y-2.5 border-t border-b border-slate-200/50 dark:border-slate-800 py-3">
                            {guide.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="flex flex-col gap-0.5 text-[10px]">
                                <span className="font-extrabold text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wide">{m.label}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-350">{m.value}</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-violet-500 block">💡 توصيات علمية هامة:</span>
                            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pr-1">
                              {guide.tips.map((tip, tIdx) => (
                                <li key={tIdx} className="text-right list-none relative pr-3 before:content-['•'] before:absolute before:right-0 before:text-violet-500">
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Sidebar block list (Right Area in RTL) */}
          <div className="w-full lg:w-80 border-r lg:border-r border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/10">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <span className="text-xs font-black text-slate-450 uppercase tracking-wider">قوالب الكتل العامة (Templates)</span>
                <button
                  onClick={() => setShowCreateBlockModal(true)}
                  className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center"
                  title="إنشاء قالب جديد"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List scroll container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {blockTemplates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-450">لا يوجد أي قوالب محفوظة حالياً</div>
                ) : (
                  blockTemplates.map(template => {
                    const isSelected = selectedBlockId === template.id;
                    const details = template.weeks?.[0] || {};
                    return (
                      <div 
                        key={template.id}
                        onClick={() => setSelectedBlockId(template.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-violet-500/10 border-violet-500 dark:border-violet-500/80 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                      >
                        <div className="truncate flex-1 pl-2 text-right">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-white block truncate">
                            {template.program_name}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400 mt-1 block">
                            {details.level || 'Beginner'} | {details.deficitProtocol || 'FDP'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRenameModal({ isOpen: true, blockId: template.id, currentName: template.program_name, newName: template.program_name });
                            }}
                            className="p-1 bg-slate-50 hover:bg-slate-150 dark:bg-slate-700/60 text-slate-400 hover:text-slate-750 dark:hover:text-white rounded-lg transition-all"
                            title="تعديل الاسم"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlockClick(template.id, template.program_name);
                            }}
                            className="p-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-500 rounded-lg transition-all"
                            title="حذف القالب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Close Button / Bottom info */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 text-[10px] text-slate-400 text-center shrink-0">
              Peak Force Periodization Engine v2.0
            </div>
          </div>

        </div>
      ) : (
        renderSeasonPlanner()
      )}

      </div>

      {/* OVERLAY 1: Create Block Modal */}
      {showCreateBlockModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-right border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> إنشاء قالب كتلة دوري جديد
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اسم القالب:</label>
                <input
                  type="text"
                  placeholder="مثال: قالب FDP متوسط 32 أسبوع"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع العجز:</label>
                  <select
                    value={newBlockDeficit}
                    onChange={(e) => setNewBlockDeficit(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="FDP">FDP / عجز قوة</option>
                    <option value="EDP">EDP / عجز مرن</option>
                    <option value="RSD">RSD / عجز صلابة</option>
                    <option value="HVRP">HVRP / عجز سرعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المستوى:</label>
                  <select
                    value={newBlockLevel}
                    onChange={(e) => setNewBlockLevel(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="Beginner">مبتدئ / Beginner</option>
                    <option value="Intermediate">متوسط / Intermediate</option>
                    <option value="Advanced">متقدم / Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCreateBlock}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تأكيد الإنشاء
              </button>
              <button
                onClick={() => setShowCreateBlockModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: Rename Block Modal */}
      {showRenameModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-right border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-orange-500" /> تعديل اسم القالب
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الاسم الجديد:</label>
                <input
                  type="text"
                  value={showRenameModal.newName}
                  onChange={(e) => setShowRenameModal({ ...showRenameModal, newName: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleRenameBlockSubmit}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowRenameModal({ isOpen: false, blockId: null, currentName: '', newName: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 3: Deploy Template Modal */}
      {showDeployModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-right border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500 animate-pulse" /> تطبيق القالب على لاعب
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اختر اللاعب:</label>
                <select
                  value={showDeployModal.athleteId}
                  onChange={(e) => setShowDeployModal({ ...showDeployModal, athleteId: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                >
                  <option value="">-- اختر لاعب --</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاريخ البداية (السبت):</label>
                <input
                  type="date"
                  value={showDeployModal.startDate}
                  onChange={(e) => setShowDeployModal({ ...showDeployModal, startDate: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleDeployBlockSubmit}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تطبيق البرنامج
              </button>
              <button
                onClick={() => setShowDeployModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
