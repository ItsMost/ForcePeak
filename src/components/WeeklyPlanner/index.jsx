import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, BookmarkPlus, Plus, Sparkles, Trash, Percent, UserPlus, X, Calendar as CalendarIcon } from 'lucide-react';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import TimelineCard from './TimelineCard.jsx';
import ExerciseLibrary from './ExerciseLibrary.jsx';
import AthleteProfileModal from './AthleteProfileModal.jsx';
import { INITIAL_ATHLETES, INITIAL_SCHEDULE, INITIAL_LIBRARY, DAYS_OF_WEEK, DRILL_TYPES } from '../../data/constants.js';
import { supabase } from '../../supabaseClient.js';

export default function WeeklyPlanner() {
  // === إدارة الحالة (State) ===
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // بيانات اللاعبين (سيتم تحديثها من Supabase)
  const [athletes, setAthletes] = useState(INITIAL_ATHLETES);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0] || null;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newAthleteData, setNewAthleteData] = useState({ name: '', birthYear: '', weight: '' });
  const [isAthleteDropdownOpen, setIsAthleteDropdownOpen] = useState(false);
  
  // بيانات الجدول والتواريخ (تم ضبط البداية لشهر مايو 2026)
  const [currentDate, setCurrentDate] = useState(new Date("2026-05-14T00:00:00"));
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [dayTitles, setDayTitles] = useState({});
  const [library, setLibrary] = useState(INITIAL_LIBRARY);
  
  // النوافذ المنبثقة والإشعارات
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, targetDay: null });
  const [saveTemplateModal, setSaveTemplateModal] = useState({ isOpen: false, day: null, name: '' });
  const [saveWeekTemplateModal, setSaveWeekTemplateModal] = useState({ isOpen: false, name: '' });
  const [addExerciseModal, setAddExerciseModal] = useState({ isOpen: false, title: '', details: '', type: 'physical', percentage: '' });
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // === الدوال المساعدة (Helpers) ===
  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // === جلب بيانات اللاعبين من Supabase ===
  useEffect(() => {
    const fetchAthletes = async () => {
      const { data, error } = await supabase
        .from('agilitylap_athletes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching athletes:', error);
      } else if (data && data.length > 0) {
        const formattedData = data.map(athlete => ({
          ...athlete,
          birthYear: athlete.birth_year,
          bodyFat: athlete.body_fat,
          verticalJump: athlete.vertical_jump,
          halfSquat: athlete.half_squat,
          quarterSquat: athlete.quarter_squat
        }));
        setAthletes(formattedData);
        setSelectedAthleteId(formattedData[0].id);
      }
    };
    fetchAthletes();
  }, []);

  // === دوال التواريخ والأجندة ===
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  const currentWeekStart = getStartOfWeek(currentDate);
  const monthYearString = currentWeekStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  const getDatesForWeek = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const weekDatesFull = getDatesForWeek();
  const weekDates = weekDatesFull.map(d => d.getDate());

  const renderLargeCalendarDays = () => {
    const days = [];
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for(let i=0; i<startDay; i++) days.push(<div key={`empty-${i}`} className="p-4 border border-transparent"></div>); 
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelectedWeek = weekDates.includes(i);
      let dayTitle = "";
      if (isSelectedWeek) {
          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
          const dayName = DAYS_OF_WEEK[dateObj.getDay()];
          dayTitle = dayTitles[dayName] || "Untitled Workout";
      }
      days.push(
        <button key={i} onClick={() => { const newDate = new Date(currentDate); newDate.setDate(i); setCurrentDate(newDate); setShowMonthCalendar(false); }} className={`h-28 w-full rounded-2xl p-3 flex flex-col items-start justify-start border transition-all ${isSelectedWeek ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
          <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-2 ${isSelectedWeek ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{i}</span>
          {isSelectedWeek && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-left line-clamp-2">{dayTitle}</span>}
        </button>
      );
    }
    return days;
  };

  // === دوال السحب والإفلات ===
  const [draggedItem, setDraggedItem] = useState(null);
  const handleDragStart = (e, day, drill, index) => { setDraggedItem({ source: 'timeline', day, drill, index }); e.dataTransfer.effectAllowed = 'move'; };
  const handleLibraryDragStart = (e, item, isTemplate = false) => { setDraggedItem({ source: 'library', item, isTemplate }); e.dataTransfer.effectAllowed = 'copy'; };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, targetDay, targetIndex = null) => {
    e.preventDefault(); e.stopPropagation();
    if (!draggedItem) return;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      if (draggedItem.source === 'timeline') {
        const { day: sourceDay, drill, index: sourceIndex } = draggedItem;
        newSchedule[sourceDay] = [...newSchedule[sourceDay]]; newSchedule[sourceDay].splice(sourceIndex, 1);
        newSchedule[targetDay] = [...newSchedule[targetDay]];
        if (targetIndex !== null) { let adjustedIndex = targetIndex; if (sourceDay === targetDay && sourceIndex < targetIndex) adjustedIndex -= 1; newSchedule[targetDay].splice(adjustedIndex, 0, drill); } 
        else { newSchedule[targetDay].push(drill); }
      } 
      else if (draggedItem.source === 'library') {
        const { item, isTemplate } = draggedItem;
        newSchedule[targetDay] = [...newSchedule[targetDay]];
        if (isTemplate) { const newDrills = item.drills.map((d, i) => ({ ...d, id: `lib-tpl-${Date.now()}-${i}` })); if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, ...newDrills); else newSchedule[targetDay].push(...newDrills); handleToast(`تم إضافة قالب: ${item.title}`); } 
        else { const newDrill = { ...item, id: `lib-drill-${Date.now()}` }; if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, newDrill); else newSchedule[targetDay].push(newDrill); }
      }
      return newSchedule;
    });
    setDraggedItem(null);
  };

  // === دوال التعديل على التمارين ===
  const handleAddExercise = (day) => { setSchedule(prev => { const newWorkout = { id: `w-${Date.now()}`, type: 'physical', title: '', details: '', percentage: '', isNew: true }; return { ...prev, [day]: [...prev[day], newWorkout] }; }); };
  const handleUpdateExercise = (day, id, updatedDrill) => { setSchedule(prev => ({ ...prev, [day]: prev[day].map(w => w.id === id ? updatedDrill : w) })); };
  const handleDeleteExercise = (day, id) => { setSchedule(prev => ({ ...prev, [day]: prev[day].filter(w => w.id !== id) })); };
  const handleDayTitleChange = (day, newTitle) => setDayTitles(prev => ({ ...prev, [day]: newTitle }));

  const confirmDelete = () => {
    if (deleteConfirmation.type === 'week') { setSchedule(DAYS_OF_WEEK.reduce((acc, day) => ({...acc, [day]: []}), {})); setDayTitles({}); handleToast('تم تفريغ الأسبوع بالكامل'); } 
    else if (deleteConfirmation.type === 'day' && deleteConfirmation.targetDay) { setSchedule(prev => ({ ...prev, [deleteConfirmation.targetDay]: [] })); const newTitles = {...dayTitles}; delete newTitles[deleteConfirmation.targetDay]; setDayTitles(newTitles); handleToast(`تم تفريغ تمارين يوم ${deleteConfirmation.targetDay}`); }
    setDeleteConfirmation({ isOpen: false, type: null, targetDay: null });
  };

  const handleSaveTemplate = () => { if(!saveTemplateModal.name.trim()) return; const drillsToSave = schedule[saveTemplateModal.day].map(d => ({...d})); const newTemplate = { id: `tpl-user-${Date.now()}`, title: saveTemplateModal.name, type: 'mixed', drills: drillsToSave }; setLibrary(prev => ({ ...prev, templates: [newTemplate, ...prev.templates] })); setSaveTemplateModal({ isOpen: false, day: null, name: '' }); handleToast(`تم حفظ القالب: ${newTemplate.title}`); };
  const handleSaveWeekTemplate = () => { if(!saveWeekTemplateModal.name.trim()) return; const allDrills = []; DAYS_OF_WEEK.forEach(day => { schedule[day].forEach(drill => allDrills.push({...drill})); }); if(allDrills.length === 0) { handleToast('الأسبوع فارغ، لا يوجد شيء لحفظه'); return; } const newTemplate = { id: `tpl-week-${Date.now()}`, title: saveWeekTemplateModal.name, type: 'mixed', drills: allDrills }; setLibrary(prev => ({ ...prev, templates: [newTemplate, ...prev.templates] })); setSaveWeekTemplateModal({ isOpen: false, name: '' }); handleToast(`تم حفظ الأسبوع كقالب: ${newTemplate.title}`); };
  const handleSaveLibraryExercise = () => { if(!addExerciseModal.title.trim()) { handleToast('يرجى كتابة اسم التمرين!'); return; } const newExercise = { id: `lib-user-${Date.now()}`, title: addExerciseModal.title, details: addExerciseModal.details, type: addExerciseModal.type, percentage: addExerciseModal.percentage }; setLibrary(prev => ({ ...prev, drills: [newExercise, ...prev.drills] })); setAddExerciseModal({ isOpen: false, title: '', details: '', type: 'physical', percentage: '' }); handleToast('تم إضافة التمرين للمكتبة'); };

  // === دوال بيانات اللاعبين (الاتصال بـ Supabase) ===
  const handleAddAthlete = async () => {
    if(newAthleteData.name.trim()) {
      const newAthlete = {
        name: newAthleteData.name,
        birth_year: newAthleteData.birthYear ? parseInt(newAthleteData.birthYear) : null,
        weight: newAthleteData.weight ? parseFloat(newAthleteData.weight) : null,
      };

      const { data, error } = await supabase
        .from('agilitylap_athletes')
        .insert([newAthlete])
        .select();

      if (error) {
        handleToast('حدث خطأ أثناء إضافة اللاعب');
        console.error(error);
      } else if (data && data.length > 0) {
        const addedAthlete = {
          ...data[0],
          birthYear: data[0].birth_year,
          bodyFat: data[0].body_fat,
          verticalJump: data[0].vertical_jump,
          halfSquat: data[0].half_squat,
          quarterSquat: data[0].quarter_squat
        };
        setAthletes([addedAthlete, ...athletes]);
        setSelectedAthleteId(addedAthlete.id);
        setNewAthleteData({ name: '', birthYear: '', weight: '' });
        setShowAddAthleteModal(false);
        handleToast(`تمت إضافة: ${addedAthlete.name}`);
      }
    }
  };

  const handleSaveProfile = async (updatedProfile) => {
    const { error } = await supabase
      .from('agilitylap_athletes')
      .update({
        name: updatedProfile.name,
        birth_year: updatedProfile.birthYear ? parseInt(updatedProfile.birthYear) : null,
        weight: updatedProfile.weight ? parseFloat(updatedProfile.weight) : null,
        height: updatedProfile.height ? parseFloat(updatedProfile.height) : null,
        body_fat: updatedProfile.bodyFat ? parseFloat(updatedProfile.bodyFat) : null,
        vertical_jump: updatedProfile.verticalJump ? parseFloat(updatedProfile.verticalJump) : null,
        clean: updatedProfile.clean ? parseFloat(updatedProfile.clean) : null,
        half_squat: updatedProfile.halfSquat ? parseFloat(updatedProfile.halfSquat) : null,
        quarter_squat: updatedProfile.quarterSquat ? parseFloat(updatedProfile.quarterSquat) : null,
        bench: updatedProfile.bench ? parseFloat(updatedProfile.bench) : null,
      })
      .eq('id', updatedProfile.id);

    if (error) {
      handleToast('حدث خطأ أثناء حفظ الملف');
      console.error(error);
    } else {
      setAthletes(prev => prev.map(a => a.id === updatedProfile.id ? updatedProfile : a));
      setShowProfileModal(false);
      handleToast('تم تحديث بيانات اللاعب بنجاح');
    }
  };

  // === دوال التصدير والطباعة ===
  const handleExportPDF = () => { setIsPreviewMode(true); handleToast('يتم التجهيز للطباعة/PDF...'); setTimeout(() => { window.print(); }, 500); };
  
  const handleExportExcel = () => {
    if (!selectedAthlete) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Day,Date,Exercise Title,Type,Percentage,Details\n";
    DAYS_OF_WEEK.forEach((day, index) => {
      const fullDate = weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      schedule[day].forEach(drill => {
        const title = `"${drill.title.replace(/"/g, '""')}"`;
        const details = `"${drill.details.replace(/"/g, '""')}"`;
        const type = DRILL_TYPES[drill.type]?.label || drill.type;
        const percentage = drill.percentage ? `${drill.percentage}%` : "N/A";
        csvContent += `${day},${fullDate},${title},${type},${percentage},${details}\n`;
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Weekly_Plan_${selectedAthlete.name.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleToast('تم تصدير الجدول إلى Excel بنجاح');
  };

  // === دالة حساب الحمل التدريبي ===
  const calculateDayVolume = (dayDrills) => {
    let totalExercises = dayDrills.length; let totalVolumeScore = 0; let validIntensityCount = 0; let sumIntensity = 0;
    dayDrills.forEach(drill => {
      const match = drill.details.match(/(\d+)\s*[xX*]\s*(\d+)/);
      let repsMultiplier = 1; if (match) { repsMultiplier = parseInt(match[1]) * parseInt(match[2]); }
      const intensity = parseInt(drill.percentage) || 0;
      if (intensity > 0) { validIntensityCount++; sumIntensity += intensity; }
      totalVolumeScore += repsMultiplier * (intensity > 0 ? (intensity/100) : 1);
    });
    const avgIntensity = validIntensityCount > 0 ? Math.round(sumIntensity / validIntensityCount) : 0;
    return { totalExercises, totalVolumeScore: Math.round(totalVolumeScore * 10), avgIntensity };
  };

  // === العرض (Render) ===
  return (
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F4F5F7] text-slate-800'} print:bg-white print:text-black`}>
      
      {/* الإشعارات */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-[bounce_0.3s_ease-out] print:hidden">
          <Check className="w-5 h-5 text-green-400 dark:text-green-600" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* النوافذ المنبثقة (Modals) */}
      {showProfileModal && selectedAthlete && ( 
        <AthleteProfileModal athlete={selectedAthlete} onClose={() => setShowProfileModal(false)} onSave={handleSaveProfile} /> 
      )}

      {showMonthCalendar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden" onClick={() => setShowMonthCalendar(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-4xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold dark:text-white flex items-center gap-3"><CalendarIcon className="w-8 h-8 text-orange-500" />{monthYearString}</h3>
              <button onClick={() => setShowMonthCalendar(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <div className="grid grid-cols-7 gap-4 text-center mb-4">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => ( <div key={d} className="text-sm font-bold text-slate-400 uppercase">{d}</div> ))}</div>
            <div className="grid grid-cols-7 gap-4">{renderLargeCalendarDays()}</div>
          </div>
        </div>
      )}

      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-lg font-bold mb-2">هل أنت متأكد؟</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{deleteConfirmation.type === 'week' ? "سيتم مسح جميع التمارين في هذا الأسبوع بشكل نهائي." : `سيتم مسح جميع تمارين يوم ${deleteConfirmation.targetDay}.`}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation({isOpen: false})} className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors font-medium text-sm">إلغاء</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">نعم، امسح</button>
            </div>
          </div>
        </div>
      )}

      {saveTemplateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
             <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> حفظ قالب لليوم</h3>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم القالب</label>
             <input type="text" value={saveTemplateModal.name} onChange={(e) => setSaveTemplateModal({...saveTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all dark:text-white mb-6" autoFocus />
             <div className="flex justify-end gap-3">
                <button onClick={() => setSaveTemplateModal({isOpen: false, day: null, name: ''})} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm">إلغاء</button>
                <button onClick={handleSaveTemplate} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">حفظ بالمكتبة</button>
              </div>
          </div>
        </div>
      )}

      {saveWeekTemplateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
             <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> حفظ الأسبوع كقالب</h3>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم البرنامج</label>
             <input type="text" value={saveWeekTemplateModal.name} onChange={(e) => setSaveWeekTemplateModal({...saveWeekTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all dark:text-white mb-6" autoFocus />
             <div className="flex justify-end gap-3">
                <button onClick={() => setSaveWeekTemplateModal({isOpen: false, name: ''})} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm">إلغاء</button>
                <button onClick={handleSaveWeekTemplate} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">حفظ بالمكتبة</button>
              </div>
          </div>
        </div>
      )}

      {addExerciseModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
             <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Plus className="w-5 h-5 text-orange-500" /> إضافة تمرين للمكتبة</h3>
             <div className="space-y-4">
               <div className="flex gap-2">
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-slate-500 mb-1">نوع التمرين</label>
                   <select value={addExerciseModal.type} onChange={(e) => setAddExerciseModal({...addExerciseModal, type: e.target.value})} className="w-full text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-orange-500">
                      {Object.entries(DRILL_TYPES).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                   </select>
                 </div>
                 <div className="w-24">
                   <label className="block text-xs font-medium text-slate-500 mb-1">النسبة (%)</label>
                   <div className="relative w-full">
                     <input type="number" value={addExerciseModal.percentage} onChange={(e) => setAddExerciseModal({...addExerciseModal, percentage: e.target.value})} className="w-full text-sm p-2 pl-7 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-orange-500" placeholder="0" />
                     <Percent className="w-3.5 h-3.5 absolute left-2 top-3 text-slate-400" />
                   </div>
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">اسم التمرين</label>
                 <input type="text" value={addExerciseModal.title} onChange={(e) => setAddExerciseModal({...addExerciseModal, title: e.target.value})} placeholder="مثال: Barbell Back Squat" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-orange-500 transition-all dark:text-white" autoFocus/>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">التفاصيل (عدات، وقت...)</label>
                 <textarea value={addExerciseModal.details} onChange={(e) => setAddExerciseModal({...addExerciseModal, details: e.target.value})} placeholder="5 sets x 5 reps..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-orange-500 transition-all dark:text-white h-20 resize-none" />
               </div>
             </div>
             <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setAddExerciseModal({...addExerciseModal, isOpen: false})} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm">إلغاء</button>
                <button onClick={handleSaveLibraryExercise} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">إضافة</button>
              </div>
          </div>
        </div>
      )}

      {showAddAthleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-500" /> Add New Athlete</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input type="text" value={newAthleteData.name} onChange={(e) => setNewAthleteData({...newAthleteData, name: e.target.value})} placeholder="e.g. Mostafa Ali" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" autoFocus />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Birth Year</label>
                  <input type="number" value={newAthleteData.birthYear} onChange={(e) => setNewAthleteData({...newAthleteData, birthYear: e.target.value})} placeholder="2007" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label>
                  <input type="number" value={newAthleteData.weight} onChange={(e) => setNewAthleteData({...newAthleteData, weight: e.target.value})} placeholder="75" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddAthleteModal(false)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium">Cancel</button>
              <button onClick={handleAddAthlete} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium">Add Athlete</button>
            </div>
          </div>
        </div>
      )}

      <Header 
        currentDate={currentDate} setCurrentDate={setCurrentDate} currentWeekStart={currentWeekStart} setShowMonthCalendar={setShowMonthCalendar}
        selectedAthlete={selectedAthlete} setSelectedAthleteId={setSelectedAthleteId} athletes={athletes} isAthleteDropdownOpen={isAthleteDropdownOpen} setIsAthleteDropdownOpen={setIsAthleteDropdownOpen}
        setShowAddAthleteModal={setShowAddAthleteModal} setShowProfileModal={setShowProfileModal} isMobileView={isMobileView} setIsMobileView={setIsMobileView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
        showLibrary={showLibrary} setShowLibrary={setShowLibrary} handleToast={handleToast} setSaveWeekTemplateModal={setSaveWeekTemplateModal}
      />

      <div className="flex transition-all duration-300 mx-auto h-[calc(100vh-64px)] overflow-hidden relative print:h-auto print:overflow-visible w-full">
        
        <Sidebar 
          isMobileView={isMobileView} isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} 
          onCopy={() => handleToast('تم نسخ الجدول')} onClearWeek={() => setDeleteConfirmation({isOpen: true, type: 'week'})} 
          onShare={() => handleToast('تم النسخ للمشاركة')} onPrint={handleExportPDF} onExportExcel={handleExportExcel} 
        />

        <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 print:bg-white print:overflow-visible w-full">
          
          <div className="hidden print:block mb-8 w-full border-b-2 border-slate-800 pb-4 pt-4 px-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-widest text-black">Weekly Training Plan</h1>
                <p className="text-lg font-medium text-slate-600 mt-2">Athlete: <span className="text-black font-bold">{selectedAthlete?.name || 'Unknown'}</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 uppercase">Week of</p>
                <p className="text-lg font-bold text-black">{monthYearString}</p>
              </div>
            </div>
          </div>

          <div className={`flex h-full p-4 gap-2 print:grid print:grid-cols-2 print:gap-x-12 print:gap-y-6 print:p-4 ${isMobileView ? 'flex-col w-full' : 'min-w-[1200px]'}`}>
            {DAYS_OF_WEEK.map((day, index) => {
              // تنسيق التاريخ الكامل ليتم عرضه بشكل احترافي للمتابعة الدقيقة
              const fullDateStr = weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              
              return (
              <div key={day} className={`flex flex-col ${isMobileView ? 'w-full mb-6 border-b border-slate-200 dark:border-slate-700 pb-6' : 'flex-1 min-w-[220px]'} print:break-inside-avoid print:mb-0`}>
                
                <div className="mb-4 flex flex-col group border-b border-slate-200 dark:border-slate-700 pb-3 px-2 print:border-slate-400">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase print:text-slate-600">{day}</span>
                    <span className="text-[10px] font-medium text-slate-400/80 print:text-slate-500">{fullDateStr}</span>
                  </div>
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-8 h-8 shrink-0 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 relative print:border-slate-500 print:text-black">
                        {weekDates[index]}
                      </div>
                      <input 
                         type="text" value={dayTitles[day] || ''} onChange={(e) => handleDayTitleChange(day, e.target.value)}
                         placeholder="Untitled Workout" className="text-[14px] font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none placeholder-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded px-1 -ml-1 transition-colors w-full focus:ring-2 focus:ring-orange-500/50 print:placeholder-transparent print:text-black"
                         readOnly={isPreviewMode}
                      />
                    </div>
                    {!isPreviewMode && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                         <button onClick={() => setSaveTemplateModal({isOpen: true, day, name: dayTitles[day] || ''})} className="p-1 text-slate-400 hover:text-orange-500" title="حفظ هذا اليوم كقالب"><BookmarkPlus className="w-4 h-4" /></button>
                         <button onClick={() => handleToast('اقتراحات الذكاء الاصطناعي تم تطبيقها')} className="p-1 text-orange-400 hover:text-orange-500"><Sparkles className="w-3.5 h-3.5" /></button>
                         <button onClick={() => setDeleteConfirmation({isOpen: true, type: 'day', targetDay: day})} className="p-1 text-slate-300 hover:text-red-500"><Trash className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 px-2 pb-20 ${draggedItem && draggedItem.sourceDay !== day ? 'bg-slate-100/50 dark:bg-slate-800/30 border-dashed border border-slate-200 dark:border-slate-700 rounded-xl' : ''} print:pb-0`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day)}>
                  {schedule[day].map((drill, drillIndex) => (
                    <TimelineCard 
                      key={drill.id} drill={drill} day={day} index={drillIndex}
                      isLast={drillIndex === schedule[day].length - 1} isPreviewMode={isPreviewMode}
                      onUpdate={handleUpdateExercise} onDelete={handleDeleteExercise}
                      onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                    />
                  ))}
                  
                  {!isPreviewMode && (
                    <div className="flex items-center gap-2 mt-2 group cursor-pointer print:hidden" onClick={() => handleAddExercise(day)}>
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors ml-[1px]">
                         <Plus className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Add Exercise</span>
                    </div>
                  )}

                  {schedule[day].length > 0 && !isPreviewMode && (
                    <div className="mt-4 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center text-[10px] sm:text-xs font-medium print:hidden">
                      <div className="flex flex-col items-center text-slate-500" title="عدد التمارين">
                        <span className="text-slate-400 text-[9px] uppercase">Drills</span>
                        <span>{calculateDayVolume(schedule[day]).totalExercises}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-center text-blue-500" title="متوسط الشدة المئوية">
                        <span className="text-blue-400/70 text-[9px] uppercase">Avg Int</span>
                        <span>{calculateDayVolume(schedule[day]).avgIntensity}%</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-center text-orange-500" title="مؤشر الحمل التدريبي التقريبي">
                        <span className="text-orange-400/70 text-[9px] uppercase">Load</span>
                        <span>{calculateDayVolume(schedule[day]).totalVolumeScore}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
        
        <ExerciseLibrary 
          showLibrary={showLibrary} setShowLibrary={setShowLibrary} library={library}
          handleLibraryDragStart={handleLibraryDragStart} setAddExerciseModal={setAddExerciseModal}
          setSaveWeekTemplateModal={setSaveWeekTemplateModal}
        />

      </div>
    </div>
  );
}