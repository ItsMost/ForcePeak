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
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' or 'templates'
  const [deployments, setDeployments] = useState([]);
  const [masterTemplates, setMasterTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Deploy Template modal states
  const [showDeployTemplateModal, setShowDeployTemplateModal] = useState(false);
  const [selectedTemplateToDeploy, setSelectedTemplateToDeploy] = useState('');
  const [deployStartDate, setDeployStartDate] = useState('');
  
  // Master Template Designer Modal states
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDeficit, setTplDeficit] = useState('FDP'); // FDP, EDP, RSD, HVRP
  const [tplDurationWeeks, setTplDurationWeeks] = useState(24); // 12, 24, 36, 48
  const [tplMicros, setTplMicros] = useState({}); // mapping: weekIndex -> 'Load' | 'Deload' | 'Test'
  
  // Meso blocks creation inside template
  const [tplMesos, setTplMesos] = useState([]); // list of mesos: { id, name, startWeek, durationWeeks, focus, color, programId }
  const [showAddMesoBlock, setShowAddMesoBlock] = useState(false);
  const [newMesoName, setNewMesoName] = useState('');
  const [newMesoStartWeek, setNewMesoStartWeek] = useState(1);
  const [newMesoDuration, setNewMesoDuration] = useState(4);
  const [newMesoFocus, setNewMesoFocus] = useState('Strength');
  const [newMesoColor, setNewMesoColor] = useState(PHASE_COLORS[0].hex);
  const [newMesoProgramId, setNewMesoProgramId] = useState('');

  // Local Athlete View states
  const [activeMacroDetail, setActiveMacroDetail] = useState(null);

  // Helper to parse name and deficit protocol
  const getCleanNameAndDeficit = (fullName) => {
    const match = (fullName || '').match(/^\[(FDP|EDP|RSD|HVRP)\]\s*(.*)$/);
    if (match) {
      return { deficit: match[1], name: match[2] };
    }
    return { deficit: null, name: fullName };
  };

  // Fetch deployments for the athlete
  const fetchLocalDeployments = async () => {
    if (!athlete?.id) return;
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
    }
  };

  // Fetch Master Periodization Templates from agilitylap_programs
  const fetchMasterTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('type', 'periodization_template')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMasterTemplates(data);
      }
    } catch (err) {
      console.error(err);
      handleToast('Error fetching periodization templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalDeployments();
    fetchMasterTemplates();
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

  // Get weeks starting in a calendar month
  const getWeeksInMonth = (monthDate) => {
    const weeksList = [];
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    let d = new Date(year, month, 1);
    const startOfWeekVal = getStartOfWeek(d);
    d = new Date(startOfWeekVal);
    
    while (true) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
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
      d.setDate(d.getDate() + 7);
    }
    return weeksList;
  };

  const getMacroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'macro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMesoForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'meso' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMicroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'micro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  // Delete Deployment (Macro or Meso)
  const handleDeleteDeployment = async (id, name, type) => {
    const isConfirm = window.confirm(`هل أنت متأكد من حذف ${type === 'macro' ? 'الدورة الكبرى' : 'الدورة المتوسطة'} "${name}"؟`);
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const target = deployments.find(d => d.id === id);
      if (target && type === 'macro') {
        // Cascade delete all deployments within date range
        await supabase
          .from('periodization_deployments')
          .delete()
          .eq('athlete_id', athlete.id)
          .gte('start_date', target.start_date)
          .lte('end_date', target.end_date);
      } else {
        await supabase
          .from('periodization_deployments')
          .delete()
          .eq('id', id);
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

  // Create Periodization Master Template
  const handleSaveMasterTemplate = async () => {
    if (!tplName.trim()) {
      handleToast('الرجاء كتابة اسم القالب!');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        program_name: tplName,
        type: 'periodization_template',
        weeks: [
          {
            isPeriodizationTemplate: true,
            deficitProtocol: tplDeficit,
            durationWeeks: tplDurationWeeks,
            mesocycles: tplMesos,
            microcycles: tplMicros
          }
        ]
      };

      const { error } = await supabase
        .from('agilitylap_programs')
        .insert([payload]);

      if (!error) {
        handleToast(`تم حفظ القالب الدوري "${tplName}" بنجاح!`);
        setShowCreateTemplate(false);
        setTplName('');
        setTplMesos([]);
        setTplMicros({});
        await fetchMasterTemplates();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء حفظ القالب الدوري.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Master Template
  const handleDeleteMasterTemplate = async (id, name) => {
    const isConfirm = window.confirm(`هل أنت متأكد من حذف القالب العام "${name}" نهائياً؟`);
    if (!isConfirm) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .delete()
        .eq('id', id);
      if (!error) {
        handleToast('تم حذف القالب بنجاح!');
        await fetchMasterTemplates();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ في الحذف.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deploy Master Template to selected Athlete
  const handleDeployTemplateToAthlete = async () => {
    if (!selectedTemplateToDeploy) {
      handleToast('الرجاء اختيار قالب تدريبي لتطبيقه!');
      return;
    }
    if (!deployStartDate) {
      handleToast('الرجاء اختيار تاريخ البداية!');
      return;
    }

    setIsLoading(true);
    try {
      const templateRecord = masterTemplates.find(t => t.id === selectedTemplateToDeploy);
      if (!templateRecord || !templateRecord.weeks?.[0]) {
        handleToast('فشل تحميل بيانات القالب.');
        setIsLoading(false);
        return;
      }

      const tplDetails = templateRecord.weeks[0];
      const startBaseDate = getStartOfWeek(new Date(deployStartDate)); // Saturday start
      const totalWeeks = Number(tplDetails.durationWeeks) || 12;
      const endBaseDate = new Date(startBaseDate);
      endBaseDate.setDate(endBaseDate.getDate() + (totalWeeks * 7) - 1); // Friday end

      // 1. Clean overlapping deployments inside this date range
      await supabase
        .from('periodization_deployments')
        .delete()
        .eq('athlete_id', athlete.id)
        .gte('start_date', getDbDateStr(startBaseDate))
        .lte('end_date', getDbDateStr(endBaseDate));

      // 2. Deploy Macrocycle row
      const macroNameFormatted = `[${tplDetails.deficitProtocol}] ${templateRecord.program_name}`;
      await supabase
        .from('periodization_deployments')
        .insert([{
          athlete_id: athlete.id,
          program_name: macroNameFormatted,
          program_type: 'macro',
          start_date: getDbDateStr(startBaseDate),
          end_date: getDbDateStr(endBaseDate),
          color: '#3b82f6'
        }]);

      // 3. Deploy Mesocycles & clone workouts
      const mesos = tplDetails.mesocycles || [];
      for (const meso of mesos) {
        const startOffsetWeeks = Number(meso.startWeek) - 1;
        const mesoWeeksCount = Number(meso.durationWeeks);
        
        const mStart = new Date(startBaseDate);
        mStart.setDate(mStart.getDate() + (startOffsetWeeks * 7));
        const mEnd = new Date(mStart);
        mEnd.setDate(mEnd.getDate() + (mesoWeeksCount * 7) - 1);

        // Save meso deployment
        await supabase
          .from('periodization_deployments')
          .insert([{
            athlete_id: athlete.id,
            program_id: meso.programId || null,
            program_name: meso.name,
            program_type: 'meso',
            start_date: getDbDateStr(mStart),
            end_date: getDbDateStr(mEnd),
            color: meso.color
          }]);

        // Copy daily exercises to athlete schedule (if a Meso Program Template is linked)
        if (meso.programId) {
          const program = programs.find(p => p.id === meso.programId);
          if (program && program.weeks) {
            for (let i = 0; i < program.weeks.length; i++) {
              const futureWeekStart = new Date(mStart);
              futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
              const weekTemplateObject = program.weeks[i].drills || {};
              const targetBlockTitle = program.weeks[i].title || 'Meso-Template Workout';
              
              for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
                const dayDate = new Date(futureWeekStart);
                dayDate.setDate(dayDate.getDate() + j);
                
                let clonedDrills = [];
                if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
                  clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                    ...drill, 
                    id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                  }));
                } else if (Array.isArray(weekTemplateObject)) {
                  clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                    ...drill, 
                    id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
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
      }

      // 4. Deploy Microcycles
      const micros = tplDetails.microcycles || {};
      for (const [wIdx, focusType] of Object.entries(micros)) {
        if (focusType && focusType !== 'None') {
          const wOffset = Number(wIdx);
          const wStart = new Date(startBaseDate);
          wStart.setDate(wStart.getDate() + (wOffset * 7));
          const wEnd = new Date(wStart);
          wEnd.setDate(wEnd.getDate() + 6);

          let color = '#f59e0b'; // amber for load
          if (focusType === 'Deload') color = '#10b981'; // emerald for deload
          if (focusType === 'Test') color = '#3b82f6'; // blue for test

          await supabase.from('periodization_deployments').insert([{
            athlete_id: athlete.id,
            program_name: focusType,
            program_type: 'micro',
            start_date: getDbDateStr(wStart),
            end_date: getDbDateStr(wEnd),
            color: color
          }]);
        }
      }

      handleToast(`تم تطبيق ونشر القالب الدوري "${templateRecord.program_name}" للاعب بنجاح!`);
      setShowDeployTemplateModal(false);
      setDeployStartDate('');
      setSelectedTemplateToDeploy('');
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تطبيق القالب.');
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

  // Add Meso block into the local template designer array
  const handleAddMesoToTemplate = () => {
    if (!newMesoName.trim()) {
      handleToast('الرجاء كتابة اسم الدورة المتوسطة!');
      return;
    }
    
    // Check overlaps within the template weeks
    const endWeek = Number(newMesoStartWeek) + Number(newMesoDuration) - 1;
    if (endWeek > tplDurationWeeks) {
      handleToast('⚠️ الدورة المتوسطة تتجاوز عدد أسابيع القالب الكلية!');
      return;
    }

    const overlap = tplMesos.find(m => 
      (Number(newMesoStartWeek) >= m.startWeek && Number(newMesoStartWeek) < m.startWeek + m.durationWeeks) ||
      (endWeek >= m.startWeek && endWeek < m.startWeek + m.durationWeeks)
    );

    if (overlap) {
      handleToast(`⚠️ تداخل مع دورة متوسطة أخرى: "${overlap.name}"`);
      return;
    }

    setTplMesos([...tplMesos, {
      id: Date.now(),
      name: newMesoName,
      startWeek: Number(newMesoStartWeek),
      durationWeeks: Number(newMesoDuration),
      focus: newMesoFocus,
      color: newMesoColor,
      programId: newMesoProgramId
    }]);

    setNewMesoName('');
    setShowAddMesoBlock(false);
    handleToast('تمت إضافة الدورة المتوسطة للقالب!');
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
          
          <div className="flex items-center gap-3">
            {/* Tabs Controller */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('roadmap')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'roadmap' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                تخطيط اللاعب / Athlete Roadmap
              </button>
              <button 
                onClick={() => setActiveTab('templates')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'templates' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                البرامج العامة / Master Templates
              </button>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Athlete Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Deploy Template Header Banner */}
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 dark:from-orange-500/20 dark:to-transparent border border-orange-200/50 dark:border-orange-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <Sparkles className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">تخطيط وتوزيع الموسم الرياضي 💡</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      اعرض التقويم الفعلي للرياضي حالياً. يمكنك تلوين وتقسيم الموسم يدوياً أو تطبيق برنامج كامل جاهز من القوالب العامة دفعة واحدة.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDeployTemplateModal(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> تطبيق قالب عام (Deploy)
                </button>
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
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {monthName} <span className="text-xs font-normal text-slate-450 dark:text-slate-500">/ {monthNameEn}</span>
                        </h4>
                      </div>

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
                                  {micro && (
                                    <span 
                                      className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider text-white"
                                      style={{ backgroundColor: micro.color }}
                                    >
                                      {micro.program_name === 'Load' ? 'شحن' : micro.program_name === 'Deload' ? 'استشفاء' : 'اختبار'}
                                    </span>
                                  )}

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

            {/* Sidebar info */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
              {activeMacroDetail ? (
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between h-full min-h-[500px]">
                  <div>
                    <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                      <div>
                        <span className="px-2 py-0.5 bg-blue-500 rounded-md text-[8.5px] font-black uppercase tracking-wider text-white mb-1 inline-block">
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

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
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

                            <select
                              value={micro?.program_name || 'None'}
                              onChange={(e) => handleSetMicroFocus(week, e.target.value)}
                              className="text-[10px] bg-slate-50 dark:bg-slate-850 border dark:border-slate-700 p-1.5 rounded-lg outline-none font-bold text-slate-600 dark:text-slate-300"
                            >
                              <option value="None">- لا دورة صغرى -</option>
                              <option value="Load">شحن / Load</option>
                              <option value="Deload">استشفاء / Deload</option>
                              <option value="Test">اختبار / Test</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                      onClick={() => setActiveMacroDetail(null)}
                      className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs text-center"
                    >
                      إغلاق التفاصيل
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 min-h-[350px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider mb-3">تطبيق الخطط الدورية 🧪</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      القوالب العامة تمكنك من توزيع التخطيط السنوي بالكامل على أي رياضي بضغطة زر. صمم برامجك في علامة التبويب المجاورة، ثم طبقها هنا لتنزل التمارين تلقائياً.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Master Templates Manager */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">قوالب الفترات الدورية العامة (Master Templates)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  صمم برامج فترات عامة مخصصة لمعالجة العجز الرياضي والبدني، وقم بحفظها لإعادة تطبيقها على أي رياضي لاحقاً.
                </p>
              </div>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> تصميم قالب عام جديد
              </button>
            </div>

            {/* Templates Grid List */}
            {masterTemplates.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 border border-dashed rounded-3xl">
                <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا يوجد قوالب دورية عامة محفوظة حالياً</p>
                <p className="text-xs text-slate-400 mt-1">اضغط على زر "تصميم قالب عام جديد" بالأعلى لتبدأ تخطيط برنامجك الرياضي الأول.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {masterTemplates.map((template) => {
                  const details = template.weeks?.[0] || {};
                  const protocol = details.deficitProtocol || 'FDP';
                  const weeksCount = details.durationWeeks || 12;
                  const mesosCount = details.mesocycles?.length || 0;
                  
                  return (
                    <div 
                      key={template.id}
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black text-white ${
                            protocol === 'FDP' ? 'bg-red-500' :
                            protocol === 'EDP' ? 'bg-violet-500' :
                            protocol === 'RSD' ? 'bg-cyan-500' :
                            'bg-amber-500 text-slate-950'
                          }`}>
                            {protocol}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {weeksCount} أسبوع ({Math.round(weeksCount/4)} شهور)
                          </span>
                        </div>
                        
                        <h5 className="text-sm font-black text-slate-800 dark:text-white truncate">
                          {template.program_name}
                        </h5>
                        
                        <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            عدد الكتل المتوسطة (Meso): <span className="font-bold text-slate-700 dark:text-slate-300">{mesosCount}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                            الدورات الصغرى (Micro): <span className="font-bold text-slate-700 dark:text-slate-300">{Object.keys(details.microcycles || {}).length} أسابيع محددة</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <button
                          onClick={() => {
                            setSelectedTemplateToDeploy(template.id);
                            setShowDeployTemplateModal(true);
                            setActiveTab('roadmap');
                          }}
                          className="px-3.5 py-1.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> تطبيق للاعب الفعلي
                        </button>
                        
                        <button
                          onClick={() => handleDeleteMasterTemplate(template.id, template.program_name)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: Create/Design Master Template */}
        {showCreateTemplate && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-2 sm:p-6" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" /> تصميم وإعداد قالب دوري عام جديد
                </h3>
                <button onClick={() => setShowCreateTemplate(false)} className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 rounded-full"><X className="w-4 h-4 dark:text-white"/></button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                
                {/* Inputs & Config (Left side inside modal) */}
                <div className="flex-1 space-y-4">
                  
                  {/* Template Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم القالب الدوري:</label>
                    <input 
                      type="text" 
                      placeholder="مثال: برنامج تحسين عجز القوة 6 شهور"
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Deficit Protocol */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بروتوكول العجز البدني:</label>
                      <select
                        value={tplDeficit}
                        onChange={(e) => setTplDeficit(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                      >
                        <option value="FDP">FDP / عجز القوة القصوى</option>
                        <option value="EDP">EDP / عجز الدورة المطاطية</option>
                        <option value="RSD">RSD / عجز الصلابة الارتدادية</option>
                        <option value="HVRP">HVRP / عجز السرعة ومعدل القوة</option>
                      </select>
                    </div>

                    {/* Total Duration */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الكلية:</label>
                      <select
                        value={tplDurationWeeks}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setTplDurationWeeks(w);
                          // Clean up out-of-range mesos
                          setTplMesos(tplMesos.filter(m => m.startWeek + m.durationWeeks - 1 <= w));
                        }}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                      >
                        <option value={12}>12 أسبوعاً (3 أشهر)</option>
                        <option value={24}>24 أسبوعاً (6 أشهر)</option>
                        <option value={36}>36 أسبوعاً (9 أشهر)</option>
                        <option value={48}>48 أسبوعاً (12 شهراً)</option>
                      </select>
                    </div>
                  </div>

                  {/* Add Mesocycle Block container */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-orange-500" /> إضافة دورة متوسطة (Mesocycle)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMesoBlock(!showAddMesoBlock)}
                        className="text-[10px] text-orange-500 font-bold bg-white dark:bg-slate-800 border p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {showAddMesoBlock ? 'إخفاء' : 'إضافة دورة متوسطة'}
                      </button>
                    </div>

                    {showAddMesoBlock && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">اسم الدورة المتوسطة:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: دورة التحمل العضلي"
                              value={newMesoName}
                              onChange={(e) => setNewMesoName(e.target.value)}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">التركيز الفسيولوجي:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: Absolute Strength"
                              value={newMesoFocus}
                              onChange={(e) => setNewMesoFocus(e.target.value)}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">أسبوع البداية في القالب:</label>
                            <select
                              value={newMesoStartWeek}
                              onChange={(e) => setNewMesoStartWeek(Number(e.target.value))}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            >
                              {Array.from({ length: tplDurationWeeks }, (_, k) => k + 1).map(w => (
                                <option key={w} value={w}>الأسبوع {w}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">المدة الزمنية (أسابيع):</label>
                            <select
                              value={newMesoDuration}
                              onChange={(e) => setNewMesoDuration(Number(e.target.value))}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            >
                              <option value={3}>3 أسابيع</option>
                              <option value={4}>4 أسابيع</option>
                              <option value={5}>5 أسابيع</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">اللون المميز للفترة:</label>
                            <div className="flex gap-1 items-center justify-center h-9">
                              {PHASE_COLORS.map((pc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setNewMesoColor(pc.hex)}
                                  className={`w-4 h-4 rounded-full border transition-transform ${newMesoColor === pc.hex ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'}`}
                                  style={{ backgroundColor: pc.hex }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Link program block */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">ربط كتلة تمارين فعلية (Meso Program Template):</label>
                          <select
                            value={newMesoProgramId}
                            onChange={(e) => setNewMesoProgramId(e.target.value)}
                            className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                          >
                            <option value="">-- اختياري: اختر برنامج تمارين لربطه بالكتلة --</option>
                            {programs.filter(p => p.type === 'meso').map(p => (
                              <option key={p.id} value={p.id}>{p.program_name} ({p.weeks?.length || 0} أسابيع)</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMesoToTemplate}
                          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs"
                        >
                          حفظ وإدراج الدورة المتوسطة داخل القالب
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weeks visual timeline designer (Right side inside modal) */}
                <div className="w-full md:w-96 border-r md:border-r border-slate-200 dark:border-slate-700 pr-0 md:pr-6 flex flex-col">
                  <h5 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3">أسابيع وتفاصيل القالب</h5>
                  
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1.5">
                    {Array.from({ length: tplDurationWeeks }, (_, idx) => {
                      const weekIndex = idx;
                      const weekNum = idx + 1;
                      
                      // Check if week belongs to any meso
                      const meso = tplMesos.find(m => weekNum >= m.startWeek && weekNum < m.startWeek + m.durationWeeks);
                      const activeFocus = tplMicros[weekIndex] || 'None';

                      return (
                        <div 
                          key={weekIndex}
                          className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs transition-all"
                          style={{ borderRight: meso ? `4px solid ${meso.color}` : undefined }}
                        >
                          <div className="truncate max-w-[50%]">
                            <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-350 block">
                              الأسبوع {weekNum}
                            </span>
                            {meso && (
                              <span className="font-bold text-[9px] truncate block mt-0.5" style={{ color: meso.color }}>
                                {meso.name}
                              </span>
                            )}
                          </div>

                          {/* Set Micro focus */}
                          <select
                            value={activeFocus}
                            onChange={(e) => setTplMicros({ ...tplMicros, [weekIndex]: e.target.value })}
                            className="text-[10px] bg-white dark:bg-slate-800 border p-1 rounded-lg font-bold"
                          >
                            <option value="None">- لا دورة صغرى -</option>
                            <option value="Load">شحن / Load</option>
                            <option value="Deload">استشفاء / Deload</option>
                            <option value="Test">اختبار / Test</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                <button
                  onClick={handleSaveMasterTemplate}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ القالب العام
                </button>
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 3: Deploy/Apply Master Template Modal */}
        {showDeployTemplateModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 font-sans" dir="rtl">
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-orange-500 animate-pulse" /> تطبيق ونشر قالب دوري عام
              </h3>

              <div className="space-y-4 text-right">
                
                {/* Select template */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اختر القالب الدوري العام:</label>
                  <select
                    value={selectedTemplateToDeploy}
                    onChange={(e) => setSelectedTemplateToDeploy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="">-- اختر قالب للبدء --</option>
                    {masterTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.program_name}</option>
                    ))}
                  </select>
                </div>

                {/* Choose start date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">تاريخ بداية التطبيق للاعب (السبت):</label>
                  <input
                    type="date"
                    value={deployStartDate}
                    onChange={(e) => setDeployStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    ⚠️ ملحوظة: سيقوم النظام بتعديل التواريخ تلقائياً لتوافق أقرب يوم **سبت** (بداية الأسبوع التدريبي).
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 p-3 rounded-2xl text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  ⚠️ تحذير: تطبيق قالب دوري جديد سيقوم بإلغاء وإعادة كتابة أي فترات تدريبية متداخلة أو تمارين يومية مخزنة مسبقاً للاعب الحالي ضمن نطاق تاريخ القالب.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeployTemplateToAthlete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> تأكيد ونشر الجدول
                </button>
                <button
                  onClick={() => setShowDeployTemplateModal(false)}
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
