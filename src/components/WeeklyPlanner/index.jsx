import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, BookmarkPlus, Plus, Sparkles, Trash, Percent, UserPlus, X, Calendar as CalendarIcon, Loader2, Copy, ClipboardPaste, Undo2, Redo2, Save, Edit2 } from 'lucide-react';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import TimelineCard from './TimelineCard.jsx';
import ExerciseLibrary from './ExerciseLibrary.jsx';
import AthleteProfileModal from './AthleteProfileModal.jsx';
import { INITIAL_ATHLETES, INITIAL_SCHEDULE, INITIAL_LIBRARY, DAYS_OF_WEEK } from '../../data/constants.js';
import { supabase } from '../../supabaseClient.js';

const EXERCISE_CATEGORIES = {
  mobility: 'Mobility (حركية)',
  core: 'Core (جذع)',
  isometric: 'Isometric (ثبات)',
  power: 'Power (قدرة)',
  strength: 'Strength (قوة)',
  physical: 'Physical (بدني عام)'
};

export default function WeeklyPlanner() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [athletes, setAthletes] = useState(INITIAL_ATHLETES);
  const [selectedAthleteId, setSelectedAthleteId] = useState(() => localStorage.getItem('lastSelectedAthlete') || null);
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0] || null;
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newAthleteData, setNewAthleteData] = useState({ name: '', birthYear: '', weight: '' });
  const [isAthleteDropdownOpen, setIsAthleteDropdownOpen] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date("2026-05-14T00:00:00"));
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [dayTitles, setDayTitles] = useState({});
  const [library, setLibrary] = useState({ drills: [], templates: [] }); 
  
  const [clipboard, setClipboard] = useState(null); 
  const [history, setHistory] = useState([]); 
  const [historyIndex, setHistoryIndex] = useState(-1); 

  const [toastMessage, setToastMessage] = useState(null);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, targetDay: null });
  const [saveTemplateModal, setSaveTemplateModal] = useState({ isOpen: false, day: null, name: '' });
  const [saveWeekTemplateModal, setSaveWeekTemplateModal] = useState({ isOpen: false, name: '' });
  
  const [addExerciseModal, setAddExerciseModal] = useState({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '' });
  const [dayDrillModal, setDayDrillModal] = useState({ isOpen: false, day: null, drill: null, isNew: false });
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const getDbDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const getStartOfWeek = (date) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d; };
  const currentWeekStart = getStartOfWeek(currentDate);
  const monthYearString = currentWeekStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const weekStartDateStr = getDbDateStr(currentWeekStart);

  const getDatesForWeek = () => { const dates = []; for (let i = 0; i < 7; i++) { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); dates.push(d); } return dates; };
  const weekDatesFull = getDatesForWeek();
  const weekDates = weekDatesFull.map(d => d.getDate());

  const pushToHistory = (newSchedule, newTitles) => {
    const newState = { schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)) };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift(); 
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    const fetchAthletes = async () => {
      const { data } = await supabase.from('agilitylap_athletes').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const formattedData = data.map(a => ({ ...a, birthYear: a.birth_year, bodyFat: a.body_fat, verticalJump: a.vertical_jump, halfSquat: a.half_squat, quarterSquat: a.quarter_squat }));
        setAthletes(formattedData); 
        const savedId = localStorage.getItem('lastSelectedAthlete');
        if (savedId && formattedData.some(a => a.id === savedId)) { setSelectedAthleteId(savedId); } 
        else { setSelectedAthleteId(formattedData[0].id); }
      }
    };
    fetchAthletes();
  }, []);

  useEffect(() => { if (selectedAthleteId) localStorage.setItem('lastSelectedAthlete', selectedAthleteId); }, [selectedAthleteId]);

  useEffect(() => {
    const fetchLibrary = async () => {
      const { data: drillsData } = await supabase.from('library_drills').select('*').order('created_at', { ascending: false });
      const { data: templatesData } = await supabase.from('agilitylap_templates').select('*').order('created_at', { ascending: false });
      const formattedTemplates = (templatesData || []).map(t => ({ id: t.id, title: t.template_name, type: t.template_type, drills: t.drills }));
      setLibrary({ drills: drillsData || [], templates: formattedTemplates });
    };
    fetchLibrary();
  }, []);

  useEffect(() => {
    const fetchWeekData = async () => {
      if (!selectedAthleteId) return;
      setIsLoading(true);
      const endStr = getDbDateStr(weekDatesFull[6]);
      const { data } = await supabase.from('agilitylap_workouts').select('*').eq('athlete_id', selectedAthleteId).gte('workout_date', weekStartDateStr).lte('workout_date', endStr);

      const newSchedule = {}; const newTitles = {};
      DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; });

      if (data) {
        data.forEach(record => {
          const recordDate = new Date(record.workout_date); const dayName = DAYS_OF_WEEK[recordDate.getDay()];
          if (dayName) { newSchedule[dayName] = record.drills || []; newTitles[dayName] = record.workout_title || ''; }
        });
      }
      
      setSchedule(newSchedule); setDayTitles(newTitles);
      setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)) }]);
      setHistoryIndex(0);
      setIsLoading(false);
    };
    fetchWeekData();
  }, [selectedAthleteId, weekStartDateStr]);

  const autoSaveDay = async (day, drillsToSave, titleToSave) => {
    if (!selectedAthleteId) return;
    const dayIndex = DAYS_OF_WEEK.indexOf(day); const dateStr = getDbDateStr(weekDatesFull[dayIndex]);
    const finalTitle = titleToSave !== undefined ? titleToSave : (dayTitles[day] || '');
    const finalDrills = drillsToSave !== undefined ? drillsToSave : (schedule[day] || []);
    await supabase.from('agilitylap_workouts').upsert({ athlete_id: selectedAthleteId, workout_date: dateStr, workout_title: finalTitle, drills: finalDrills }, { onConflict: 'athlete_id,workout_date' });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setSchedule(prevState.schedule);
      setDayTitles(prevState.titles);
      setHistoryIndex(newIndex);
      DAYS_OF_WEEK.forEach(day => autoSaveDay(day, prevState.schedule[day], prevState.titles[day]));
      handleToast('تم التراجع');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setSchedule(nextState.schedule);
      setDayTitles(nextState.titles);
      setHistoryIndex(newIndex);
      DAYS_OF_WEEK.forEach(day => autoSaveDay(day, nextState.schedule[day], nextState.titles[day]));
      handleToast('تم الإعادة');
    }
  };

  const handleCopyExercise = (drill) => { setClipboard({ type: 'exercise', data: drill }); handleToast('تم نسخ التمرين'); };
  const handleCopyDay = (day) => { if (schedule[day].length === 0) { handleToast('لا يوجد تمارين في هذا اليوم لنسخها'); return; } setClipboard({ type: 'day', data: schedule[day] }); handleToast(`تم نسخ تمارين يوم ${day}`); };
  const handleCopyWeek = () => { setClipboard({ type: 'week', data: { schedule, dayTitles } }); handleToast('تم نسخ الأسبوع بالكامل'); };

  const handlePasteIntoDay = (targetDay) => {
    if (!clipboard) { handleToast('لا يوجد شيء لنسخه'); return; }
    let newDrills = [];
    if (clipboard.type === 'exercise') { newDrills = [{ ...clipboard.data, id: `w-${Date.now()}-${Math.random()}` }]; } 
    else if (clipboard.type === 'day') { newDrills = clipboard.data.map((d, i) => ({ ...d, id: `w-${Date.now()}-${i}` })); } 
    else if (clipboard.type === 'week') { handleToast('استخدم زر اللصق في القائمة الجانبية للصق أسبوع كامل'); return; }

    const updatedDrills = [...(schedule[targetDay] || []), ...newDrills];
    const newSchedule = { ...schedule, [targetDay]: updatedDrills };
    setSchedule(newSchedule); pushToHistory(newSchedule, dayTitles); autoSaveDay(targetDay, updatedDrills, dayTitles[targetDay]); handleToast('تم اللصق بنجاح');
  };

  const handlePasteWeek = () => {
    if (!clipboard || clipboard.type !== 'week') { handleToast('يجب نسخ أسبوع أولاً لتقوم بلصقه هنا'); return; }
    const newSchedule = {}; const newTitles = { ...clipboard.data.dayTitles };
    DAYS_OF_WEEK.forEach(day => { newSchedule[day] = (clipboard.data.schedule[day] || []).map((d, i) => ({ ...d, id: `w-${Date.now()}-${day}-${i}` })); });
    setSchedule(newSchedule); setDayTitles(newTitles); pushToHistory(newSchedule, newTitles);
    DAYS_OF_WEEK.forEach(day => autoSaveDay(day, newSchedule[day], newTitles[day])); handleToast('تم لصق الأسبوع بنجاح');
  };

  const renderLargeCalendarDays = () => {
    const days = []; const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for(let i=0; i<startDay; i++) days.push(<div key={`empty-${i}`} className="p-1 sm:p-4 border border-transparent"></div>); 
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelectedWeek = weekDates.includes(i); let dayTitle = "";
      if (isSelectedWeek) { const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i); const dayName = DAYS_OF_WEEK[dateObj.getDay()]; dayTitle = dayTitles[dayName] || "Workout"; }
      days.push(
        <button key={i} onClick={() => { const newDate = new Date(currentDate); newDate.setDate(i); setCurrentDate(newDate); setShowMonthCalendar(false); }} 
          className={`h-20 sm:h-28 w-full rounded-xl sm:rounded-2xl p-1 sm:p-3 flex flex-col items-center sm:items-start justify-start border transition-all overflow-hidden ${isSelectedWeek ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
          <span className={`text-[10px] sm:text-sm font-bold w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full mb-1 sm:mb-2 shrink-0 ${isSelectedWeek ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{i}</span>
          {isSelectedWeek && ( <span className="text-[8px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 text-center sm:text-left line-clamp-2 leading-tight break-words w-full">{dayTitle}</span> )}
        </button>
      );
    } return days;
  };

  // ===============================================
  // === إصلاح الـ Drag and Drop (منع التكرار نهائياً) ===
  // ===============================================
  const [draggedItem, setDraggedItem] = useState(null);
  const handleDragStart = (e, day, drill, index) => { setDraggedItem({ source: 'timeline', day, drill, index }); e.dataTransfer.effectAllowed = 'move'; };
  const handleLibraryDragStart = (e, item, isTemplate = false) => { setDraggedItem({ source: 'library', item, isTemplate }); e.dataTransfer.effectAllowed = 'copy'; };
  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = (e, targetDay, targetIndex = null) => {
    e.preventDefault(); e.stopPropagation(); if (!draggedItem) return;
    
    setSchedule(prev => {
      const newSchedule = { ...prev }; 
      
      if (draggedItem.source === 'timeline') {
        const { day: sourceDay, drill, index: sourceIndex } = draggedItem;
        
        if (sourceDay === targetDay) {
          // النقل داخل نفس اليوم
          if (sourceIndex === targetIndex) return prev;
          
          const updatedDrills = Array.from(newSchedule[sourceDay]);
          updatedDrills.splice(sourceIndex, 1);
          
          let finalTargetIndex = targetIndex !== null ? targetIndex : updatedDrills.length;
          if (targetIndex !== null && sourceIndex < targetIndex) { finalTargetIndex -= 1; }
          
          updatedDrills.splice(finalTargetIndex, 0, drill);
          newSchedule[sourceDay] = updatedDrills;

          pushToHistory(newSchedule, dayTitles);
          autoSaveDay(sourceDay, updatedDrills, dayTitles[sourceDay]);

        } else {
          // النقل ليوم مختلف
          const sourceDrills = Array.from(newSchedule[sourceDay]);
          sourceDrills.splice(sourceIndex, 1);
          newSchedule[sourceDay] = sourceDrills;

          const targetDrills = Array.from(newSchedule[targetDay]);
          if (targetIndex !== null) targetDrills.splice(targetIndex, 0, drill);
          else targetDrills.push(drill);
          newSchedule[targetDay] = targetDrills;

          pushToHistory(newSchedule, dayTitles);
          autoSaveDay(sourceDay, sourceDrills, dayTitles[sourceDay]);
          autoSaveDay(targetDay, targetDrills, dayTitles[targetDay]);
        }

      } else if (draggedItem.source === 'library') {
        const { item, isTemplate } = draggedItem; newSchedule[targetDay] = [...newSchedule[targetDay]];
        if (isTemplate) { 
          const newDrills = item.drills.map((d, i) => ({ ...d, id: `lib-tpl-${Date.now()}-${i}` })); 
          if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, ...newDrills); else newSchedule[targetDay].push(...newDrills); 
          handleToast(`تم إضافة قالب: ${item.title}`); 
        } else { 
          const newDrill = { ...item, id: `lib-drill-${Date.now()}` }; 
          if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, newDrill); else newSchedule[targetDay].push(newDrill); 
        }
        pushToHistory(newSchedule, dayTitles); autoSaveDay(targetDay, newSchedule[targetDay], dayTitles[targetDay]);
      } 
      return newSchedule;
    }); setDraggedItem(null);
  };

  // ===============================================
  // === دوال الأسهم للترتيب اليدوي (أعلى / أسفل) ===
  // ===============================================
  const moveDrillUp = (day, index) => {
    if (index === 0) return;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const drills = [...newSchedule[day]];
      [drills[index - 1], drills[index]] = [drills[index], drills[index - 1]]; // تبديل الأماكن
      newSchedule[day] = drills;
      pushToHistory(newSchedule, dayTitles);
      autoSaveDay(day, drills, dayTitles[day]);
      return newSchedule;
    });
  };

  const moveDrillDown = (day, index) => {
    if (index === schedule[day].length - 1) return;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const drills = [...newSchedule[day]];
      [drills[index + 1], drills[index]] = [drills[index], drills[index + 1]]; // تبديل الأماكن
      newSchedule[day] = drills;
      pushToHistory(newSchedule, dayTitles);
      autoSaveDay(day, drills, dayTitles[day]);
      return newSchedule;
    });
  };

  // ===============================================
  // === دوال فتح الشاشة الجديدة الموحدة (بدون أخطاء بيضاء) ===
  // ===============================================
  const handleAddExerciseBtn = (day) => { 
    setDayDrillModal({ 
      isOpen: true, 
      day: day, 
      drill: { id: `w-${Date.now()}`, type: 'strength', title: '', details: '', percentage: '' }, 
      isNew: true 
    }); 
  };

  const handleEditExerciseBtn = (day, drill) => { 
    setDayDrillModal({ isOpen: true, day: day, drill: { ...drill }, isNew: false }); 
  };

  const handleSaveDayDrillModal = () => {
    const { day, drill, isNew } = dayDrillModal;
    
    // حماية تمنع الحفظ بتمرين فارغ
    if (!drill.title || !drill.title.trim()) {
      handleToast('يرجى كتابة اسم التمرين أولاً!');
      return;
    }

    let updatedDrills;
    if (isNew) {
      updatedDrills = [...(schedule[day] || []), drill]; // الترتيب اليدوي (يتم إضافته في النهاية)
    } else {
      updatedDrills = schedule[day].map(w => w.id === drill.id ? drill : w);
    }
    
    const newSchedule = { ...schedule, [day]: updatedDrills };
    setSchedule(newSchedule); 
    pushToHistory(newSchedule, dayTitles); 
    autoSaveDay(day, updatedDrills, dayTitles[day]);
    setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false });
  };

  const handleDeleteExercise = (day, id) => { const updatedDrills = schedule[day].filter(w => w.id !== id); const newSchedule = { ...schedule, [day]: updatedDrills }; setSchedule(newSchedule); pushToHistory(newSchedule, dayTitles); autoSaveDay(day, updatedDrills, dayTitles[day]); };
  const handleDayTitleChange = (day, newTitle) => { const newTitles = { ...dayTitles, [day]: newTitle }; setDayTitles(newTitles); pushToHistory(schedule, newTitles); autoSaveDay(day, schedule[day], newTitle); };

  const confirmDelete = () => {
    if (deleteConfirmation.type === 'week') { const emptySchedule = DAYS_OF_WEEK.reduce((acc, day) => ({...acc, [day]: []}), {}); setSchedule(emptySchedule); setDayTitles({}); pushToHistory(emptySchedule, {}); DAYS_OF_WEEK.forEach(day => autoSaveDay(day, [], '')); handleToast('تم تفريغ الأسبوع بالكامل'); } 
    else if (deleteConfirmation.type === 'day' && deleteConfirmation.targetDay) { const tDay = deleteConfirmation.targetDay; const newSchedule = { ...schedule, [tDay]: [] }; const newTitles = { ...dayTitles, [tDay]: '' }; setSchedule(newSchedule); setDayTitles(newTitles); pushToHistory(newSchedule, newTitles); autoSaveDay(tDay, [], ''); handleToast(`تم تفريغ تمارين يوم ${tDay}`); }
    setDeleteConfirmation({ isOpen: false, type: null, targetDay: null });
  };

  const handleSaveTemplate = async () => { if(!saveTemplateModal.name.trim()) return; const drillsToSave = schedule[saveTemplateModal.day].map(d => ({...d})); const newTemplate = { template_name: saveTemplateModal.name, template_type: 'day', drills: drillsToSave }; const { data, error } = await supabase.from('agilitylap_templates').insert([newTemplate]).select(); if(!error && data) { const formatted = { id: data[0].id, title: data[0].template_name, type: data[0].template_type, drills: data[0].drills }; setLibrary(prev => ({ ...prev, templates: [formatted, ...prev.templates] })); setSaveTemplateModal({ isOpen: false, day: null, name: '' }); handleToast(`تم حفظ القالب: ${formatted.title}`); } };
  const handleSaveWeekTemplate = async () => { if(!saveWeekTemplateModal.name.trim()) return; const allDrills = []; DAYS_OF_WEEK.forEach(day => { schedule[day].forEach(drill => allDrills.push({...drill})); }); if(allDrills.length === 0) { handleToast('الأسبوع فارغ، لا يوجد شيء لحفظه'); return; } const newTemplate = { template_name: saveWeekTemplateModal.name, template_type: 'week', drills: allDrills }; const { data, error } = await supabase.from('agilitylap_templates').insert([newTemplate]).select(); if(!error && data) { const formatted = { id: data[0].id, title: data[0].template_name, type: data[0].template_type, drills: data[0].drills }; setLibrary(prev => ({ ...prev, templates: [formatted, ...prev.templates] })); setSaveWeekTemplateModal({ isOpen: false, name: '' }); handleToast(`تم حفظ الأسبوع كقالب: ${formatted.title}`); } };
  
  const handleAddAthlete = async () => { if(newAthleteData.name.trim()) { const newAthlete = { name: newAthleteData.name, birth_year: newAthleteData.birthYear ? parseInt(newAthleteData.birthYear) : null, weight: newAthleteData.weight ? parseFloat(newAthleteData.weight) : null }; const { data } = await supabase.from('agilitylap_athletes').insert([newAthlete]).select(); if (data && data.length > 0) { const addedAthlete = { ...data[0], birthYear: data[0].birth_year, bodyFat: data[0].body_fat, verticalJump: data[0].vertical_jump, halfSquat: data[0].half_squat, quarterSquat: data[0].quarter_squat }; setAthletes([addedAthlete, ...athletes]); setSelectedAthleteId(addedAthlete.id); setNewAthleteData({ name: '', birthYear: '', weight: '' }); setShowAddAthleteModal(false); handleToast(`تمت إضافة: ${addedAthlete.name}`); } } };
  const handleSaveProfile = async (updatedProfile) => { const { error } = await supabase.from('agilitylap_athletes').update({ name: updatedProfile.name, birth_year: updatedProfile.birthYear ? parseInt(updatedProfile.birthYear) : null, weight: updatedProfile.weight ? parseFloat(updatedProfile.weight) : null, height: updatedProfile.height ? parseFloat(updatedProfile.height) : null, body_fat: updatedProfile.bodyFat ? parseFloat(updatedProfile.bodyFat) : null, vertical_jump: updatedProfile.verticalJump ? parseFloat(updatedProfile.verticalJump) : null, clean: updatedProfile.clean ? parseFloat(updatedProfile.clean) : null, half_squat: updatedProfile.halfSquat ? parseFloat(updatedProfile.halfSquat) : null, quarter_squat: updatedProfile.quarterSquat ? parseFloat(updatedProfile.quarterSquat) : null, bench: updatedProfile.bench ? parseFloat(updatedProfile.bench) : null, }).eq('id', updatedProfile.id); if (!error) { setAthletes(prev => prev.map(a => a.id === updatedProfile.id ? updatedProfile : a)); setShowProfileModal(false); handleToast('تم تحديث بيانات اللاعب بنجاح'); } };

  const calculateDayVolume = (dayDrills) => { let totalExercises = dayDrills.length; let totalVolumeScore = 0; let validIntensityCount = 0; let sumIntensity = 0; dayDrills.forEach(drill => { const match = drill.details.match(/(\d+)\s*[xX*]\s*(\d+)/); let repsMultiplier = 1; if (match) { repsMultiplier = parseInt(match[1]) * parseInt(match[2]); } const intensity = parseInt(drill.percentage) || 0; if (intensity > 0) { validIntensityCount++; sumIntensity += intensity; } totalVolumeScore += repsMultiplier * (intensity > 0 ? (intensity/100) : 1); }); const avgIntensity = validIntensityCount > 0 ? Math.round(sumIntensity / validIntensityCount) : 0; return { totalExercises, totalVolumeScore: Math.round(totalVolumeScore * 10), avgIntensity }; };

  const handleDeleteLibraryDrill = async (id) => { const { error } = await supabase.from('library_drills').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, drills: prev.drills.filter(d => d.id !== id) })); handleToast('تم مسح التمرين'); } };
  const handleEditLibraryDrill = (drill) => { setAddExerciseModal({ isOpen: true, id: drill.id, title: drill.title || '', details: drill.details || '', type: drill.type || 'strength', percentage: drill.percentage || '' }); };
  const handleDeleteLibraryTemplate = async (id) => { const { error } = await supabase.from('agilitylap_templates').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) })); handleToast('تم مسح القالب بنجاح'); } };
  const handleEditTemplate = (tpl) => { handleToast('نصيحة: لتعديل قالب، اسحبه لأي يوم، قم بتعديله، ثم احفظه كقالب جديد.'); };
  
  const handleSaveLibraryExercise = async () => { 
    if(!addExerciseModal.title.trim()) { handleToast('يرجى كتابة اسم التمرين!'); return; } 
    const drillData = { title: addExerciseModal.title, details: addExerciseModal.details, type: addExerciseModal.type, percentage: addExerciseModal.percentage ? parseFloat(addExerciseModal.percentage) : null }; 
    if (addExerciseModal.id) {
      const { data, error } = await supabase.from('library_drills').update(drillData).eq('id', addExerciseModal.id).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: prev.drills.map(d => d.id === addExerciseModal.id ? data[0] : d) })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '' }); handleToast('تم تحديث التمرين بنجاح'); }
    } else {
      const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '' }); handleToast('تم إضافة التمرين للمكتبة'); }
    }
  };


  return (
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F4F5F7] text-slate-800'} print:bg-white print:text-black`}>
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-[bounce_0.3s_ease-out] print:hidden">
          <Check className="w-5 h-5 text-green-400 dark:text-green-600" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {showProfileModal && selectedAthlete && ( 
        <AthleteProfileModal athlete={selectedAthlete} onClose={() => setShowProfileModal(false)} onSave={handleSaveProfile} /> 
      )}

      {showMonthCalendar && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 print:hidden" onClick={() => setShowMonthCalendar(false)}> <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-4 sm:mb-8"> <h3 className="text-xl sm:text-2xl font-bold dark:text-white flex items-center gap-2 sm:gap-3"><CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />{monthYearString}</h3> <button onClick={() => setShowMonthCalendar(false)} className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6"/></button> </div> <div className="grid grid-cols-7 gap-1 sm:gap-4 text-center mb-2 sm:mb-4"> {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => ( <div key={d} className="text-[9px] sm:text-sm font-bold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{d}</div> ))} </div> <div className="grid grid-cols-7 gap-1 sm:gap-4">{renderLargeCalendarDays()}</div> </div> </div> )}
      {deleteConfirmation.isOpen && ( <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6 text-center"> <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div> <h3 className="text-lg font-bold mb-2">هل أنت متأكد؟</h3> <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{deleteConfirmation.type === 'week' ? "سيتم مسح جميع التمارين في هذا الأسبوع بشكل نهائي." : `سيتم مسح جميع تمارين يوم ${deleteConfirmation.targetDay}.`}</p> <div className="flex gap-3"> <button onClick={() => setDeleteConfirmation({isOpen: false})} className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors font-medium text-sm">إلغاء</button> <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">نعم، امسح</button> </div> </div> </div> )}
      {saveTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6"> <h3 className="text-lg font-bold mb-1 text-slate-800 dark:text-white flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> حفظ قالب لليوم</h3> <p className="text-[11px] text-slate-500 mb-4">أسهل طريقة لعمل Template هي بناء التمارين في أي يوم، ثم الضغط على علامة الحفظ 🔖 أعلى اليوم.</p> <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم القالب</label> <input type="text" value={saveTemplateModal.name} onChange={(e) => setSaveTemplateModal({...saveTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all dark:text-white mb-6" autoFocus /> <div className="flex justify-end gap-3"> <button onClick={() => setSaveTemplateModal({isOpen: false, day: null, name: ''})} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm">إلغاء</button> <button onClick={handleSaveTemplate} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">حفظ بالمكتبة</button> </div> </div> </div> )}
      {saveWeekTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6"> <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> حفظ الأسبوع كقالب</h3> <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم البرنامج</label> <input type="text" value={saveWeekTemplateModal.name} onChange={(e) => setSaveWeekTemplateModal({...saveWeekTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all dark:text-white mb-6" autoFocus /> <div className="flex justify-end gap-3"> <button onClick={() => setSaveWeekTemplateModal({isOpen: false, name: ''})} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm">إلغاء</button> <button onClick={handleSaveWeekTemplate} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm">حفظ بالمكتبة</button> </div> </div> </div> )}
      
      {/* نافذة المكتبة - تمرين جديد */}
      {addExerciseModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6"> <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Plus className="w-6 h-6 text-orange-500" /> {addExerciseModal.id ? 'تعديل بيانات التمرين' : 'إضافة تمرين للمكتبة'}</h3> <div className="space-y-4"> <div className="flex gap-3"> <div className="flex-1"> <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">نوع التمرين</label> <select value={addExerciseModal.type} onChange={(e) => setAddExerciseModal({...addExerciseModal, type: e.target.value})} className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"> {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))} </select> </div> <div className="w-28"> <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">النسبة (%)</label> <div className="relative w-full"> <input type="number" value={addExerciseModal.percentage} onChange={(e) => setAddExerciseModal({...addExerciseModal, percentage: e.target.value})} className="w-full text-sm py-2.5 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="0" /> <Percent className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" /> </div> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">اسم التمرين</label> <input type="text" value={addExerciseModal.title} onChange={(e) => setAddExerciseModal({...addExerciseModal, title: e.target.value})} placeholder="مثال: Barbell Back Squat" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:text-white font-medium" autoFocus/> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">التفاصيل (عدات، وقت...)</label> <textarea value={addExerciseModal.details} onChange={(e) => setAddExerciseModal({...addExerciseModal, details: e.target.value})} placeholder="مثال: 5 sets x 5 reps..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:text-white h-24 resize-none" /> </div> </div> <div className="flex justify-end gap-3 mt-8"> <button onClick={() => setAddExerciseModal({isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: ''})} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold text-sm">إلغاء</button> <button onClick={handleSaveLibraryExercise} className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm">{addExerciseModal.id ? 'حفظ التعديلات' : 'إضافة للمكتبة'}</button> </div> </div> </div> )}

      {/* ==================================================== */}
      {/* النافذة الجديدة الموحدة (إضافة أو تعديل داخل اليوم) */}
      {/* ==================================================== */}
      {dayDrillModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {dayDrillModal.isNew ? <Plus className="w-5 h-5 text-green-500" /> : <Edit2 className="w-5 h-5 text-blue-500" />}
                {dayDrillModal.isNew ? 'إضافة تمرين جديد' : 'تعديل التمرين'}
              </h3>
              <button onClick={() => setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false })} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">النوع</label>
                  <select
                    value={dayDrillModal.drill.type}
                    onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, type: e.target.value}})}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">النسبة (%)</label>
                  <div className="relative w-full">
                    <input
                      type="number"
                      value={dayDrillModal.drill.percentage || ''}
                      onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, percentage: e.target.value}})}
                      className="w-full text-sm py-2.5 pl-7 pr-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                    <Percent className="w-3.5 h-3.5 absolute left-2 top-3 text-slate-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">الاسم</label>
                <input
                  type="text"
                  value={dayDrillModal.drill.title}
                  onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, title: e.target.value}})}
                  placeholder="اسم التمرين..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white font-medium"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">التفاصيل (عدات، وقت...)</label>
                <textarea
                  value={dayDrillModal.drill.details}
                  onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, details: e.target.value}})}
                  placeholder="مثال: 5 sets x 5 reps..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white h-24 resize-none"
                />
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
               {!dayDrillModal.isNew ? (
                 <button onClick={() => { handleDeleteExercise(dayDrillModal.day, dayDrillModal.drill.id); setDayDrillModal({isOpen: false, day: null, drill: null, isNew: false}); }} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                   <Trash2 className="w-4 h-4"/> مسح
                 </button>
               ) : <div></div>}
              <div className="flex gap-2">
                <button onClick={() => setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false })} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm">
                  إلغاء
                </button>
                <button onClick={handleSaveDayDrillModal} className={`px-6 py-2 ${dayDrillModal.isNew ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center gap-2`}>
                  <Save className="w-4 h-4"/> {dayDrillModal.isNew ? 'إضافة' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAthleteModal && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-500" /> Add New Athlete</h3> <div className="space-y-3 mb-6"> <div> <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label> <input type="text" value={newAthleteData.name} onChange={(e) => setNewAthleteData({...newAthleteData, name: e.target.value})} placeholder="e.g. Mostafa Ali" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" autoFocus /> </div> <div className="flex gap-3"> <div className="flex-1"> <label className="block text-xs font-medium text-slate-500 mb-1">Birth Year</label> <input type="number" value={newAthleteData.birthYear} onChange={(e) => setNewAthleteData({...newAthleteData, birthYear: e.target.value})} placeholder="2007" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" /> </div> <div className="flex-1"> <label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label> <input type="number" value={newAthleteData.weight} onChange={(e) => setNewAthleteData({...newAthleteData, weight: e.target.value})} placeholder="75" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white" /> </div> </div> </div> <div className="flex justify-end gap-3"> <button onClick={() => setShowAddAthleteModal(false)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium">Cancel</button> <button onClick={handleAddAthlete} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium">Add Athlete</button> </div> </div> </div> )}

      <Header 
        currentDate={currentDate} setCurrentDate={setCurrentDate} currentWeekStart={currentWeekStart} setShowMonthCalendar={setShowMonthCalendar}
        selectedAthlete={selectedAthlete} setSelectedAthleteId={setSelectedAthleteId} athletes={athletes} isAthleteDropdownOpen={isAthleteDropdownOpen} setIsAthleteDropdownOpen={setIsAthleteDropdownOpen}
        setShowAddAthleteModal={setShowAddAthleteModal} setShowProfileModal={setShowProfileModal} isMobileView={isMobileView} setIsMobileView={setIsMobileView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
        showLibrary={showLibrary} setShowLibrary={setShowLibrary} handleToast={handleToast} setSaveWeekTemplateModal={setSaveWeekTemplateModal}
      />

      <div className={`flex flex-col md:flex-row transition-all duration-300 w-full h-[calc(100vh-64px)] overflow-hidden relative print:h-auto print:overflow-visible ${isMobileView ? 'max-w-[420px] mx-auto border-x border-slate-200 dark:border-slate-700 shadow-2xl' : ''}`}>
        
        <Sidebar 
          isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} 
          onCopyWeek={handleCopyWeek} onPasteWeek={handlePasteWeek} 
          onUndo={handleUndo} onRedo={handleRedo}
          canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
          onClearWeek={() => setDeleteConfirmation({isOpen: true, type: 'week'})} 
          onPrint={() => window.print()} 
        />

        <div className={`flex-1 overflow-x-auto overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 print:bg-white print:overflow-visible w-full pb-24 md:pb-0 relative transition-all duration-300 ${showLibrary ? 'md:mr-80' : ''}`}>
          
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

          {isLoading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-50 transition-opacity duration-300 print:hidden">
                <div className="flex flex-col items-center gap-4">
                   <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                   <p className="text-slate-600 dark:text-slate-300 font-bold text-lg animate-pulse">جاري تحميل التمارين...</p>
                </div>
             </div>
          )}

          <div className={`flex h-full p-2 md:p-4 gap-2 print:grid print:grid-cols-2 print:gap-x-12 print:gap-y-6 print:p-4 ${isMobileView ? 'flex-col w-full' : 'flex-row w-full'}`}>
            {DAYS_OF_WEEK.map((day, index) => {
              const fullDateStr = weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              
              // الترتيب اليدوي: يتم قراءة التمارين مباشرة كما هي في المصفوفة
              const dayDrills = schedule[day] || [];

              return (
              <div key={day} className={`flex flex-col ${isMobileView ? 'w-full mb-6 border-b border-slate-200 dark:border-slate-700 pb-6' : 'flex-1 min-w-0'} print:break-inside-avoid print:mb-0`}>
                
                <div className="mb-4 flex flex-col group border-b border-slate-200 dark:border-slate-700 pb-3 px-1 md:px-2 print:border-slate-400">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] md:text-xs font-semibold tracking-wider text-slate-400 uppercase print:text-slate-600">{day}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400/80 print:text-slate-500">{fullDateStr}</span>
                  </div>
                  <div className="flex items-start gap-1 md:gap-2 justify-between">
                    <div className="flex items-start gap-1 md:gap-2 flex-1">
                      <div className="w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 relative print:border-slate-500 print:text-black">
                        {weekDates[index]}
                      </div>
                      <input 
                         type="text" value={dayTitles[day] || ''} onChange={(e) => handleDayTitleChange(day, e.target.value)}
                         placeholder="Workout" className="text-xs md:text-[14px] font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none placeholder-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded px-1 -ml-1 transition-colors w-full focus:ring-2 focus:ring-orange-500/50 print:placeholder-transparent print:text-black"
                         readOnly={isPreviewMode}
                      />
                    </div>
                    {!isPreviewMode && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                         <button onClick={() => handleCopyDay(day)} className="p-1 text-slate-400 hover:text-blue-500" title="نسخ تمارين اليوم"><Copy className="w-3 h-3 md:w-4 md:h-4" /></button>
                         {clipboard && ( <button onClick={() => handlePasteIntoDay(day)} className="p-1 text-slate-400 hover:text-green-500" title="لصق"><ClipboardPaste className="w-3 h-3 md:w-4 md:h-4" /></button> )}
                         <button onClick={() => setSaveTemplateModal({isOpen: true, day, name: dayTitles[day] || ''})} className="p-1 text-slate-400 hover:text-orange-500" title="حفظ هذا اليوم كقالب"><BookmarkPlus className="w-3 h-3 md:w-4 md:h-4" /></button>
                         <button onClick={() => setDeleteConfirmation({isOpen: true, type: 'day', targetDay: day})} className="p-1 text-slate-300 hover:text-red-500"><Trash className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 px-1 md:px-2 pb-20 ${draggedItem && draggedItem.sourceDay !== day ? 'bg-slate-100/50 dark:bg-slate-800/30 border-dashed border border-slate-200 dark:border-slate-700 rounded-xl' : ''} print:pb-0`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day)}>
                  {dayDrills.map((drill, drillIndex) => (
                    <TimelineCard 
                      key={drill.id} drill={drill} day={day} index={drillIndex}
                      isLast={drillIndex === dayDrills.length - 1} isPreviewMode={isPreviewMode}
                      onEdit={handleEditExerciseBtn} onDelete={handleDeleteExercise} onCopy={handleCopyExercise}
                      onMoveUp={() => moveDrillUp(day, drillIndex)} onMoveDown={() => moveDrillDown(day, drillIndex)}
                      onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                    />
                  ))}
                  
                  {!isPreviewMode && (
                    <div className="flex items-center gap-2 mt-2 group cursor-pointer print:hidden" onClick={() => handleAddExerciseBtn(day)}>
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors ml-[1px]">
                         <Plus className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Add Exercise</span>
                    </div>
                  )}

                  {schedule[day].length > 0 && !isPreviewMode && (
                    <div className="mt-4 p-1 md:p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center text-[9px] sm:text-xs font-medium print:hidden">
                      <div className="flex flex-col items-center text-slate-500" title="عدد التمارين">
                        <span className="text-slate-400 text-[8px] md:text-[9px] uppercase">Drills</span>
                        <span>{calculateDayVolume(schedule[day]).totalExercises}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-center text-blue-500" title="متوسط الشدة المئوية">
                        <span className="text-blue-400/70 text-[8px] md:text-[9px] uppercase">Avg Int</span>
                        <span>{calculateDayVolume(schedule[day]).avgIntensity}%</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-center text-orange-500" title="مؤشر الحمل التدريبي التقريبي">
                        <span className="text-orange-400/70 text-[8px] md:text-[9px] uppercase">Load</span>
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
          onDeleteDrill={handleDeleteLibraryDrill}
          onEditDrill={handleEditLibraryDrill}
          onDeleteTemplate={handleDeleteLibraryTemplate}
          onEditTemplate={handleEditTemplate}
        />

      </div>
    </div>
  );
}