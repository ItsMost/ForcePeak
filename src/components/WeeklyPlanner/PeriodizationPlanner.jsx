import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Calendar, Plus, Trash2, Edit2, Check, HelpCircle, 
  Sparkles, ChevronRight, ChevronLeft, Dumbbell, Play, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format date as YYYY-MM-DD
const getDbDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Colors matching the main index.jsx
const PHASE_COLORS = [
  { hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Blue (General)' },
  { hex: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-500', label: 'Violet (Preparation)' },
  { hex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Emerald (Strength)' },
  { hex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Amber (Power)' },
  { hex: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Rose (Peak)' },
  { hex: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500', label: 'Cyan (Transition)' }
];

export default function PeriodizationPlanner({ athlete, onClose, handleToast, programs, refreshDeploymentsCallback }) {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals & Panels State
  const [showCreateMacro, setShowCreateMacro] = useState(false);
  const [selectedMonthForMacro, setSelectedMonthForMacro] = useState(null);
  
  // Form values
  const [macroName, setMacroName] = useState('');
  const [macroDuration, setMacroDuration] = useState(6); // 3, 6, 9, 12 months
  const [macroDeficit, setMacroDeficit] = useState('FDP'); // FDP, EDP, RSD, HVRP
  const [macroGoal, setMacroGoal] = useState('General Preparation');
  const [macroColor, setMacroColor] = useState(PHASE_COLORS[0].hex);
  
  // Meso creation values
  const [selectedMacroForMeso, setSelectedMacroForMeso] = useState(null);
  const [showCreateMeso, setShowCreateMeso] = useState(false);
  const [mesoName, setMesoName] = useState('');
  const [mesoStartWeekIndex, setMesoStartWeekIndex] = useState(0); // week index within macro (0-based)
  const [mesoDurationWeeks, setMesoDurationWeeks] = useState(4); // 3, 4, 5 weeks
  const [mesoFocus, setMesoFocus] = useState('Strength');
  const [mesoColor, setMesoColor] = useState(PHASE_COLORS[1].hex);
  const [linkedProgramId, setLinkedProgramId] = useState('');
  const [deployWorkouts, setDeployWorkouts] = useState(false);
  
  // Detail Panel State
  const [activeMacroDetail, setActiveMacroDetail] = useState(null);

  // Fetch deployments for the athlete
  const fetchLocalDeployments = async () => {
    if (!athlete?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('periodization_deployments')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('start_date', { ascending: true });
      if (!error && data) {
        setDeployments(data);
      }
    } catch (err) {
      console.error(err);
      handleToast('Error fetching periodization data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalDeployments();
  }, [athlete]);

  // Generate 12 months starting from current month
  const months = [];
  const now = new Date();
  let currentMonthPointer = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    months.push(new Date(currentMonthPointer));
    currentMonthPointer.setMonth(currentMonthPointer.getMonth() + 1);
  }

  // Get start of week (Saturday-based) matching main index.jsx helper
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const dayOffset = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - dayOffset);
    return d;
  };

  // Get weeks starting in a specific calendar month
  const getWeeksInMonth = (monthDate) => {
    const weeksList = [];
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // Start searching from Saturday before or on the 1st of the month
    let d = new Date(year, month, 1);
    const startOfWeekVal = getStartOfWeek(d);
    d = new Date(startOfWeekVal);
    
    // Loop through Saturdays of the month
    while (true) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // If the Saturday starts in this month, add it.
      if (weekStart.getMonth() === month && weekStart.getFullYear() === year) {
        weeksList.push({
          start: weekStart,
          end: weekEnd,
          startStr: getDbDateStr(weekStart),
          endStr: getDbDateStr(weekEnd)
        });
      } else if (weekStart.getFullYear() > year || (weekStart.getFullYear() === year && weekStart.getMonth() > month)) {
        break;
      }
      
      // Move to next Saturday
      d.setDate(d.getDate() + 7);
    }
    return weeksList;
  };

  // Find macrocycle, mesocycle, or microcycle deployments for a specific date range
  const getMacroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'macro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMesoForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'meso' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMicroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'micro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  // Helper to parse name and deficit protocol
  const getCleanNameAndDeficit = (fullName) => {
    const match = (fullName || '').match(/^\[(FDP|EDP|RSD|HVRP)\]\s*(.*)$/);
    if (match) {
      return { deficit: match[1], name: match[2] };
    }
    return { deficit: null, name: fullName };
  };

  // Add Macrocycle
  const handleCreateMacro = async () => {
    if (!macroName.trim()) {
      handleToast('الرجاء كتابة اسم الدورة الكبرى!');
      return;
    }
    setIsLoading(true);
    try {
      // Find start date: first Saturday of selected start month
      const startOfSelectedMonth = new Date(selectedMonthForMacro.getFullYear(), selectedMonthForMacro.getMonth(), 1);
      const startWeek = getStartOfWeek(startOfSelectedMonth);
      if (startWeek.getMonth() !== selectedMonthForMacro.getMonth()) {
        // If Saturday starts in previous month, push to first Saturday inside selected month
        startWeek.setDate(startWeek.getDate() + 7);
      }
      
      // Duration in weeks: 3 months = 12 weeks, 6 months = 24 weeks, 9 months = 36 weeks, 12 months = 48 weeks
      const totalWeeks = macroDuration === 3 ? 12 : macroDuration === 6 ? 24 : macroDuration === 9 ? 36 : 48;
      
      const endWeek = new Date(startWeek);
      endWeek.setDate(endWeek.getDate() + (totalWeeks * 7) - 1); // Friday of the last week

      const formattedMacroName = `[${macroDeficit}] ${macroName}`;

      const { data, error } = await supabase
        .from('periodization_deployments')
        .insert([{
          athlete_id: athlete.id,
          program_name: formattedMacroName,
          program_type: 'macro',
          start_date: getDbDateStr(startWeek),
          end_date: getDbDateStr(endWeek),
          color: macroColor
        }])
        .select();

      if (!error) {
        handleToast(`تم إنشاء الدورة الكبرى "${macroName}" بنجاح!`);
        setShowCreateMacro(false);
        setMacroName('');
        await fetchLocalDeployments();
        if (refreshDeploymentsCallback) refreshDeploymentsCallback();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء حفظ الدورة الكبرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Deployment (Macro or Meso)
  const handleDeleteDeployment = async (id, name, type) => {
    const isConfirm = window.confirm(`هل أنت متأكد من حذف ${type === 'macro' ? 'الدورة الكبرى' : 'الدورة المتوسطة'} "${name}"؟`);
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      // If deleting a Macro, we also want to delete any Meso/Micro cycles nested inside its date range
      const target = deployments.find(d => d.id === id);
      if (target && type === 'macro') {
        const { error: cascadeError } = await supabase
          .from('periodization_deployments')
          .delete()
          .eq('athlete_id', athlete.id)
          .gte('start_date', target.start_date)
          .lte('end_date', target.end_date);
        
        if (cascadeError) throw cascadeError;
      } else {
        const { error } = await supabase
          .from('periodization_deployments')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }

      handleToast('تم الحذف بنجاح!');
      setActiveMacroDetail(null);
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء الحذف.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weeks within a macrocycle
  const getMacroWeeks = (macro) => {
    const start = new Date(macro.start_date + 'T00:00:00');
    const end = new Date(macro.end_date + 'T00:00:00');
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);
    
    const weeksList = [];
    let current = new Date(start);
    for (let i = 0; i < totalWeeks; i++) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      weeksList.push({
        index: i,
        start: wStart,
        end: wEnd,
        startStr: getDbDateStr(wStart),
        endStr: getDbDateStr(wEnd)
      });
      current.setDate(current.getDate() + 7);
    }
    return weeksList;
  };

  // Add Mesocycle inside Macro
  const handleCreateMeso = async () => {
    if (!mesoName.trim()) {
      handleToast('الرجاء كتابة اسم الدورة المتوسطة!');
      return;
    }
    setIsLoading(true);
    try {
      const macroWeeks = getMacroWeeks(selectedMacroForMeso);
      const startWeekObj = macroWeeks[mesoStartWeekIndex];
      if (!startWeekObj) {
        handleToast('أسبوع البداية غير صالح.');
        return;
      }
      
      const startMesoDate = new Date(startWeekObj.start);
      const endMesoDate = new Date(startMesoDate);
      endMesoDate.setDate(endMesoDate.getDate() + (mesoDurationWeeks * 7) - 1);

      // Validate Meso doesn't exceed Macro dates
      const macroEnd = new Date(selectedMacroForMeso.end_date + 'T00:00:00');
      if (endMesoDate > macroEnd) {
        handleToast('⚠️ الدورة المتوسطة تتعدى نهاية الدورة الكبرى المحددة!');
        setIsLoading(false);
        return;
      }

      // Check if it overlaps with an existing Meso
      const overlap = deployments.find(d => 
        d.program_type === 'meso' && 
        d.athlete_id === athlete.id &&
        ((getDbDateStr(startMesoDate) >= d.start_date && getDbDateStr(startMesoDate) <= d.end_date) ||
         (getDbDateStr(endMesoDate) >= d.start_date && getDbDateStr(endMesoDate) <= d.end_date))
      );

      if (overlap) {
        handleToast(`⚠️ يوجد تداخل مع دورة متوسطة أخرى: "${overlap.program_name}"`);
        setIsLoading(false);
        return;
      }

      // Dual Mode - Apply exercises if linked and checkbox selected
      let appliedProgramId = linkedProgramId || null;
      if (appliedProgramId && deployWorkouts) {
        const program = programs.find(p => p.id === appliedProgramId);
        if (program && program.weeks) {
          // Deploy workouts day by day
          for (let i = 0; i < program.weeks.length; i++) {
            const futureWeekStart = new Date(startMesoDate);
            futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
            const weekTemplateObject = program.weeks[i].drills || {};
            const targetBlockTitle = program.weeks[i].title || 'Meso-Planner Workout';
            
            for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
              const dayDate = new Date(futureWeekStart);
              dayDate.setDate(dayDate.getDate() + j);
              
              let clonedDrills = [];
              if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
                clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                  ...drill, 
                  id: `mesoplanner-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                }));
              } else if (Array.isArray(weekTemplateObject)) {
                clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                  ...drill, 
                  id: `mesoplanner-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                }));
              }
              
              await supabase.from('agilitylap_workouts').upsert({ 
                athlete_id: athlete.id, 
                workout_date: getDbDateStr(dayDate), 
                workout_title: targetBlockTitle, 
                drills: clonedDrills 
              }, { onConflict: 'athlete_id,workout_date' });
            }
          }
        }
      }

      // Insert Mesocycle
      const { error } = await supabase
        .from('periodization_deployments')
        .insert([{
          athlete_id: athlete.id,
          program_id: appliedProgramId,
          program_name: mesoName,
          program_type: 'meso',
          start_date: getDbDateStr(startMesoDate),
          end_date: getDbDateStr(endMesoDate),
          color: mesoColor
        }]);

      if (!error) {
        handleToast(`تم إنشاء الدورة المتوسطة "${mesoName}" وتطبيقها!`);
        setShowCreateMeso(false);
        setMesoName('');
        setDeployWorkouts(false);
        setLinkedProgramId('');
        await fetchLocalDeployments();
        if (refreshDeploymentsCallback) refreshDeploymentsCallback();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء إنشاء الدورة المتوسطة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Set Microcycle Focus (Load / Deload / Test)
  const handleSetMicroFocus = async (weekObj, focusType) => {
    setIsLoading(true);
    try {
      // Find if micro already exists for this week
      const existing = deployments.find(d => 
        d.program_type === 'micro' && 
        d.start_date === weekObj.startStr && 
        d.end_date === weekObj.endStr
      );

      let color = '#f59e0b'; // amber for load
      if (focusType === 'Deload') color = '#10b981'; // emerald for deload
      if (focusType === 'Test') color = '#3b82f6'; // blue for test

      if (existing) {
        if (focusType === 'None') {
          // Delete micro
          await supabase.from('periodization_deployments').delete().eq('id', existing.id);
        } else {
          // Update micro
          await supabase.from('periodization_deployments').update({
            program_name: focusType,
            color: color
          }).eq('id', existing.id);
        }
      } else if (focusType !== 'None') {
        // Create micro
        await supabase.from('periodization_deployments').insert([{
          athlete_id: athlete.id,
          program_name: focusType,
          program_type: 'micro',
          start_date: weekObj.startStr,
          end_date: weekObj.endStr,
          color: color
        }]);
      }

      handleToast('تم تحديث أسبوع الدورة الصغرى!');
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ في تعديل الدورة الصغرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-2 sm:p-6 print:hidden" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
        
        {/* Main Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                مخطط فترات التدريب الدوري — Periodization Planner
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
                اللاعب النشط: <span className="text-orange-500 font-extrabold">{athlete?.name}</span>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Calendar Months Grid (Left/Main side) */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Guide & Explain Banner */}
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 dark:from-orange-500/20 dark:to-transparent border border-orange-200/50 dark:border-orange-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                <Sparkles className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">تخطيط وتوزيع الموسم الرياضي 💡</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    أنشئ دورة كبرى (Macro) لتحديد أبعاد الموسم (3 أو 6 أو 9 شهور). ثم اضغط عليها لتقسيمها إلى كتل متوسطة (Meso) من 3-5 أسابيع، وحدد تركيز كل أسبوع في الدورات الصغرى (Micro).
                  </p>
                </div>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  جاري التحديث...
                </div>
              )}
            </div>

            {/* Months Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {months.map((monthDate, mi) => {
                const monthName = monthDate.toLocaleString('ar-EG', { month: 'long' });
                const monthNameEn = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                const weeksList = getWeeksInMonth(monthDate);
                
                return (
                  <div 
                    key={mi} 
                    className="bg-white dark:bg-slate-855 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    {/* Month Header */}
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {monthName} <span className="text-xs font-normal text-slate-450 dark:text-slate-500">/ {monthNameEn}</span>
                        </h4>
                      </div>
                      
                      {/* Create Macrocycle Trigger if not already covered */}
                      <button
                        onClick={() => {
                          setSelectedMonthForMacro(monthDate);
                          setShowCreateMacro(true);
                        }}
                        className="p-1.5 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-950/20 text-slate-400 rounded-lg transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                        title="إنشاء دورة كبرى تبدأ في هذا الشهر"
                      >
                        <Plus className="w-3.5 h-3.5" /> Macro
                      </button>
                    </div>

                    {/* Weeks in Month */}
                    <div className="space-y-2.5 flex-1">
                      {weeksList.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-4">لا توجد أسابيع تبدأ في هذا الشهر</div>
                      ) : (
                        weeksList.map((week, wi) => {
                          const macro = getMacroForDate(week.startStr);
                          const meso = getMesoForDate(week.startStr);
                          const micro = getMicroForDate(week.startStr);
                          
                          return (
                            <div 
                              key={wi}
                              className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                meso ? 'bg-slate-50 dark:bg-slate-900/60' : 'bg-transparent border-slate-100 dark:border-slate-800'
                              }`}
                              style={{ 
                                borderColor: meso ? meso.color + '40' : undefined,
                                borderLeftWidth: macro ? '4px' : undefined,
                                borderLeftColor: macro ? macro.color : undefined
                              }}
                            >
                              <div className="flex flex-col gap-0.5 truncate max-w-[60%]">
                                <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500">
                                  {week.start.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {week.end.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                </span>
                                {meso && (
                                  <span className="font-extrabold truncate text-[11px]" style={{ color: meso.color }}>
                                    Meso: {meso.program_name}
                                  </span>
                                )}
                                {macro && !meso && (() => {
                                  const { deficit, name } = getCleanNameAndDeficit(macro.program_name);
                                  return (
                                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] truncate flex items-center gap-1">
                                      Macro: 
                                      {deficit && (
                                        <span className={`px-1 py-0.2 rounded text-[7.5px] font-black text-white shrink-0 ${
                                          deficit === 'FDP' ? 'bg-red-500' :
                                          deficit === 'EDP' ? 'bg-violet-500' :
                                          deficit === 'RSD' ? 'bg-cyan-500' :
                                          'bg-amber-500 text-slate-950'
                                        }`}>
                                          {deficit}
                                        </span>
                                      )}
                                      <span className="truncate">{name}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Micro badge if active */}
                                {micro && (
                                  <span 
                                    className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider text-white"
                                    style={{ backgroundColor: micro.color }}
                                  >
                                    {micro.program_name === 'Load' ? 'شحن' : micro.program_name === 'Deload' ? 'استشفاء' : 'اختبار'}
                                  </span>
                                )}

                                {/* Clicking week takes to macro detail or lets you view macro detail */}
                                {macro ? (
                                  <button
                                    onClick={() => setActiveMacroDetail(macro)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
                                    title="عرض تفاصيل الدورة الكبرى والتقسيم"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Detail & Config Panel (Right side) */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
            
            {/* Active Macrocycle Details Panel */}
            {activeMacroDetail ? (
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex flex-col justify-between h-full min-h-[500px]">
                <div>
                  {/* Panel Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                    <div>
                      <span 
                        className="px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider text-white mb-1 inline-block"
                        style={{ backgroundColor: activeMacroDetail.color }}
                      >
                        دورة كبرى نشطة / Macrocycle
                      </span>
                      {(() => {
                        const { deficit, name } = getCleanNameAndDeficit(activeMacroDetail.program_name);
                        return (
                          <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 flex-wrap">
                            {deficit && (
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black text-white shrink-0 ${
                                deficit === 'FDP' ? 'bg-red-500' :
                                deficit === 'EDP' ? 'bg-violet-500' :
                                deficit === 'RSD' ? 'bg-cyan-500' :
                                'bg-amber-500 text-slate-950'
                              }`}>
                                {deficit}
                              </span>
                            )}
                            <span>{name}</span>
                          </h4>
                        );
                      })()}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                        {new Date(activeMacroDetail.start_date + 'T00:00:00').toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(activeMacroDetail.end_date + 'T00:00:00').toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteDeployment(activeMacroDetail.id, activeMacroDetail.program_name, 'macro')}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                      title="حذف الدورة الكبرى بالكامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weeks timeline listing inside this macro */}
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    <h5 className="text-[11px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest mb-2">
                      قائمة أسابيع الدورة التدريبية ({getMacroWeeks(activeMacroDetail).length} أسبوع):
                    </h5>
                    
                    {getMacroWeeks(activeMacroDetail).map((week, idx) => {
                      const meso = getMesoForDate(week.startStr);
                      const micro = getMicroForDate(week.startStr);
                      
                      return (
                        <div 
                          key={idx}
                          className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                          style={{ borderRight: meso ? `4px solid ${meso.color}` : undefined }}
                        >
                          <div className="flex flex-col gap-0.5 truncate max-w-[55%]">
                            <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-350">
                              الأسبوع {idx + 1}
                            </span>
                            <span className="text-[9.5px] text-slate-450 dark:text-slate-500 font-medium">
                              {week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {meso && (
                              <span className="font-bold text-[9.5px] truncate" style={{ color: meso.color }}>
                                {meso.program_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Microcycle Focus Selector */}
                            <select
                              value={micro?.program_name || 'None'}
                              onChange={(e) => handleSetMicroFocus(week, e.target.value)}
                              className="text-[10px] bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-1.5 rounded-lg outline-none font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="None">- لا دورة صغرى -</option>
                              <option value="Load">شحن / Load</option>
                              <option value="Deload">استشفاء / Deload</option>
                              <option value="Test">اختبار / Test</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions inside Macro details */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedMacroForMeso(activeMacroDetail);
                      setShowCreateMeso(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> تقسيم إلى دورة متوسطة (Meso)
                  </button>
                  <button
                    onClick={() => setActiveMacroDetail(null)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>
              </div>
            ) : (
              // Informational Side Card (Default when no macro selected)
              <div className="bg-slate-50/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-3">
                    مستويات التخطيط الدوري 🔬
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">الدورة الكبرى (Macrocycle)</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          تمثل موسم الإعداد بالكامل وعادة ما تكون 3 أشهر أو 6 أشهر أو 9 أشهر. تحدد الهدف الموسمي الرئيسي.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">الدورة المتوسطة (Mesocycle)</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          كتل شهرية تتراوح بين 3 إلى 5 أسابيع تركز على صفات فسيولوجية محددة مثل القوة القصوى، التحمل البدني، أو السرعة.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">الدورة الصغرى (Microcycle)</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          التخطيط الأسبوعي المحدد، ويتم تصنيفه حسب الجهد لأسابيع شحن (Load)، أسابيع استعادة واستشفاء (Deload)، أو أسابيع قياسات واختبارات (Test).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl leading-relaxed mt-4">
                  💡 اضغط على أي شهر لإنشاء دورة كبرى جديدة، أو اضغط على أيقونة التعديل في أسبوع نشط لمشاهدة تفاصيل الموسم الحالي وتعديله.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: Create Macrocycle */}
        {showCreateMacro && selectedMonthForMacro && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" /> إنشاء دورة كبرى جديدة (Macrocycle)
              </h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم الدورة الكبرى:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: الإعداد للموسم الجديد"
                    value={macroName}
                    onChange={(e) => setMacroName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  />
                </div>

                {/* Deficit Protocol */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بروتوكول العجز البدني (Deficit Protocol):</label>
                  <select
                    value={macroDeficit}
                    onChange={(e) => setMacroDeficit(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  >
                    <option value="FDP">Force Deficit Protocol (FDP) / عجز القوة القصوى</option>
                    <option value="EDP">Elastic Deficit Protocol (EDP) / عجز الدورة المطاطية</option>
                    <option value="RSD">Reactive & Stiffness Deficit (RSD) / عجز الصلابة الارتدادية</option>
                    <option value="HVRP">High-Velocity RFD Deficit (HVRP) / عجز السرعة ومعدل القوة</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الزمنية (أشهر):</label>
                  <select
                    value={macroDuration}
                    onChange={(e) => setMacroDuration(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  >
                    <option value={3}>3 أشهر (12 أسبوع إعدادي)</option>
                    <option value={6}>6 أشهر (24 أسبوع إعدادي)</option>
                    <option value={9}>9 أشهر (36 أسبوع إعدادي)</option>
                    <option value={12}>12 شهراً (48 أسبوع إعدادي كامل)</option>
                  </select>
                </div>

                {/* Goal */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الهدف الرئيسي:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: القوة البدنية والسرعة القصوى"
                    value={macroGoal}
                    onChange={(e) => setMacroGoal(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  />
                </div>

                {/* Color selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">لون المخطط الدوري:</label>
                  <div className="flex gap-2">
                    {PHASE_COLORS.map((pc, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setMacroColor(pc.hex)}
                        className={`w-6 h-6 rounded-full border transition-transform ${macroColor === pc.hex ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: pc.hex }}
                        title={pc.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateMacro}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ الدورة الكبرى
                </button>
                <button
                  onClick={() => setShowCreateMacro(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Create Mesocycle inside Macro */}
        {showCreateMeso && selectedMacroForMeso && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" /> إضافة دورة متوسطة (Mesocycle)
              </h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم الدورة المتوسطة:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: دورة التحمل العضلي"
                    value={mesoName}
                    onChange={(e) => setMesoName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  />
                </div>

                {/* Start week selection within macro */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">أسبوع البداية في الموسم:</label>
                  <select
                    value={mesoStartWeekIndex}
                    onChange={(e) => setMesoStartWeekIndex(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  >
                    {getMacroWeeks(selectedMacroForMeso).map((w, idx) => (
                      <option key={idx} value={idx}>
                        الأسبوع {idx + 1} ({w.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الزمنية (أسابيع):</label>
                  <select
                    value={mesoDurationWeeks}
                    onChange={(e) => setMesoDurationWeeks(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  >
                    <option value={3}>3 أسابيع تدريبية</option>
                    <option value={4}>4 أسابيع تدريبية</option>
                    <option value={5}>5 أسابيع تدريبية</option>
                  </select>
                </div>

                {/* Color Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اللون المميز:</label>
                  <div className="flex gap-2">
                    {PHASE_COLORS.map((pc, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setMesoColor(pc.hex)}
                        className={`w-6 h-6 rounded-full border transition-transform ${mesoColor === pc.hex ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: pc.hex }}
                        title={pc.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

                {/* Dual Mode: Link to actual program templates */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-orange-500" /> ربط كتلة تمارين فعلية (Meso Program)
                    </span>
                    <span className="text-[9.5px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-black px-1.5 py-0.5 rounded-md">
                      اختياري
                    </span>
                  </div>

                  <div className="space-y-1">
                    <select
                      value={linkedProgramId}
                      onChange={(e) => {
                        setLinkedProgramId(e.target.value);
                        if (e.target.value) setDeployWorkouts(true);
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-xl outline-none"
                    >
                      <option value="">-- اختر برنامج تمارين لتعبئته --</option>
                      {programs.filter(p => p.type === 'meso').map(p => (
                        <option key={p.id} value={p.id}>{p.program_name} ({p.weeks?.length || 0} أسابيع)</option>
                      ))}
                    </select>
                  </div>

                  {linkedProgramId && (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="checkbox" 
                        id="deploy-workouts-chk"
                        checked={deployWorkouts}
                        onChange={(e) => setDeployWorkouts(e.target.checked)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="deploy-workouts-chk" className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
                        تنزيل وتعبئة جدول الرياضي الفعلي بالتمارين فور الحفظ (تنزيل ذكي)
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateMeso}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ وتوزيع التمارين
                </button>
                <button
                  onClick={() => setShowCreateMeso(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
