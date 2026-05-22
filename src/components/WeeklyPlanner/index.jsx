import React, { useState, useEffect, useMemo } from 'react';
import { Check, AlertTriangle, BookmarkPlus, Plus, Sparkles, Trash, Trash2, Percent, UserPlus, X, Calendar as CalendarIcon, Loader2, Copy, ClipboardPaste, Undo2, Redo2, Save, Edit2, BarChart3, Activity, ChevronLeft, ChevronRight, ChevronDown, User, Smartphone, Monitor, Moon, Sun, Library, Search } from 'lucide-react';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import TimelineCard from './TimelineCard.jsx';
import ExerciseLibrary from './ExerciseLibrary.jsx';
import AthleteProfileModal from './AthleteProfileModal.jsx';
import { supabase } from '../../supabaseClient.js';

const EXERCISE_CATEGORIES = { mobility: 'Mobility', core: 'Core', isometric: 'Isometric', power: 'Power', strength: 'Strength', physical: 'Physical' };
const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WeeklyPlanner() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(() => localStorage.getItem('lastSelectedAthlete') || null);
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0] || null;
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newAthleteData, setNewAthleteData] = useState({ name: '', birthYear: '', weight: '' });
  const [isAthleteDropdownOpen, setIsAthleteDropdownOpen] = useState(false);
  const [athleteSearch, setAthleteSearch] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [schedule, setSchedule] = useState(() => {
    const init = {}; DAYS_OF_WEEK.forEach(d => init[d] = []); return init;
  });
  
  const [dayTitles, setDayTitles] = useState({});
  const [library, setLibrary] = useState({ drills: [], templates: [] }); 
  const [programs, setPrograms] = useState([]); 
  const [monthWorkouts, setMonthWorkouts] = useState({});

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
  const [showStatsModal, setShowStatsModal] = useState(false);

  const [draggedItem, setDraggedItem] = useState(null);
  const [createProgramModal, setCreateProgramModal] = useState({ isOpen: false, name: '', tags: '', weeksChain: [''] });

  const [addExerciseModal, setAddExerciseModal] = useState({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' });
  const [dayDrillModal, setDayDrillModal] = useState({ isOpen: false, day: null, drill: null, isNew: false });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [printMode, setPrintMode] = useState('landscape');

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const getDbDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const getStartOfWeek = (date) => { const d = new Date(date); const dayOffset = (d.getDay() + 1) % 7; d.setDate(d.getDate() - dayOffset); return d; };
  
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
    setHistory(newHistory); setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    const fetchAthletes = async () => {
      const { data } = await supabase.from('agilitylap_athletes').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const formattedData = data.map(a => ({ 
          ...a, birthYear: a.birth_year, bodyFat: a.body_fat, verticalJump: a.vertical_jump, 
          standingLongJump: a.standing_long_jump, squatJump: a.squat_jump, halfSquat: a.half_squat, quarterSquat: a.quarter_squat, fullSquat: a.full_squat, deadlift: a.deadlift 
        }));
        setAthletes(formattedData); 
        const savedId = localStorage.getItem('lastSelectedAthlete');
        if (savedId && formattedData.some(a => a.id === savedId)) setSelectedAthleteId(savedId); 
        else setSelectedAthleteId(formattedData[0].id);
      }
    }; fetchAthletes();
  }, []);

  useEffect(() => { if (selectedAthleteId) localStorage.setItem('lastSelectedAthlete', selectedAthleteId); }, [selectedAthleteId]);

  const fetchLibraryData = async () => {
    const { data: drillsData } = await supabase.from('library_drills').select('*').order('created_at', { ascending: false });
    const { data: templatesData } = await supabase.from('agilitylap_templates').select('*').order('created_at', { ascending: false });
    const formattedTemplates = (templatesData || []).map(t => ({ id: t.id, title: t.template_name, type: t.template_type, drills: t.drills }));
    setLibrary({ drills: drillsData || [], templates: formattedTemplates });

    const { data: progData } = await supabase.from('agilitylap_programs').select('*').order('created_at', { ascending: false });
    setPrograms(progData || []);
  };
  useEffect(() => { fetchLibraryData(); }, []);

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
          const recordDate = new Date(record.workout_date); const dayName = JS_DAYS[recordDate.getDay()];
          if (dayName && DAYS_OF_WEEK.includes(dayName)) { newSchedule[dayName] = record.drills || []; newTitles[dayName] = record.workout_title || ''; }
        });
      }
      setSchedule(newSchedule); setDayTitles(newTitles);
      setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)) }]);
      setHistoryIndex(0); setIsLoading(false);
    }; fetchWeekData();
  }, [selectedAthleteId, weekStartDateStr]);

  useEffect(() => {
    const fetchMonthData = async () => {
      if (!selectedAthleteId) return;
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const { data } = await supabase.from('agilitylap_workouts').select('workout_date, workout_title, drills').eq('athlete_id', selectedAthleteId).gte('workout_date', getDbDateStr(startOfMonth)).lte('workout_date', getDbDateStr(endOfMonth));
      if (data) {
        const mWorkouts = {};
        data.forEach(record => { mWorkouts[record.workout_date] = { title: record.workout_title, hasDrills: record.drills && record.drills.length > 0 }; });
        setMonthWorkouts(mWorkouts);
      }
    }; if (showMonthCalendar) fetchMonthData();
  }, [selectedAthleteId, currentDate.getMonth(), currentDate.getFullYear(), showMonthCalendar]);

  const autoSaveDay = async (day, drillsToSave, titleToSave) => {
    if (!selectedAthleteId) return;
    const dateStr = getDbDateStr(weekDatesFull[DAYS_OF_WEEK.indexOf(day)]);
    const finalTitle = titleToSave !== undefined ? titleToSave : (dayTitles[day] || '');
    const finalDrills = drillsToSave !== undefined ? drillsToSave : (schedule[day] || []);
    await supabase.from('agilitylap_workouts').upsert({ athlete_id: selectedAthleteId, workout_date: dateStr, workout_title: finalTitle, drills: finalDrills }, { onConflict: 'athlete_id,workout_date' });
  };

  const handleUndo = () => { if (historyIndex > 0) { const newIndex = historyIndex - 1; const prevState = history[newIndex]; setSchedule(prevState.schedule); setDayTitles(prevState.titles); setHistoryIndex(newIndex); DAYS_OF_WEEK.forEach(day => autoSaveDay(day, prevState.schedule[day], prevState.titles[day])); handleToast('Undo successful'); } };
  const handleRedo = () => { if (historyIndex < history.length - 1) { const newIndex = historyIndex + 1; const nextState = history[newIndex]; setSchedule(nextState.schedule); setDayTitles(nextState.titles); setHistoryIndex(newIndex); DAYS_OF_WEEK.forEach(day => autoSaveDay(day, nextState.schedule[day], nextState.titles[day])); handleToast('Redo successful'); } };
  const handleCopyExercise = (drill) => { setClipboard({ type: 'exercise', data: drill }); handleToast('Exercise copied'); };
  const handleCopyDay = (day) => { if (schedule[day].length === 0) { handleToast('No exercises to copy'); return; } setClipboard({ type: 'day', data: schedule[day] }); handleToast(`${day} workouts copied`); };
  const handleCopyWeek = () => { setClipboard({ type: 'week', data: { schedule, dayTitles } }); handleToast('Full week copied'); };
  
  const handlePasteIntoDay = (targetDay) => {
    if (!clipboard) { handleToast('Clipboard is empty'); return; }
    let newDrills = [];
    if (clipboard.type === 'exercise') newDrills = [{ ...clipboard.data, id: `w-${Date.now()}-${Math.random()}` }]; 
    else if (clipboard.type === 'day') newDrills = clipboard.data.map((d, i) => ({ ...d, id: `w-${Date.now()}-${i}` })); 
    else { handleToast('Use side menu interface to paste a whole week block'); return; }
    const updatedDrills = [...(schedule[targetDay] || []), ...newDrills];
    const newSchedule = { ...schedule, [targetDay]: updatedDrills };
    setSchedule(newSchedule); pushToHistory(newSchedule, dayTitles); autoSaveDay(targetDay, updatedDrills, dayTitles[targetDay]); handleToast('Pasted successfully');
  };

  const handlePasteWeek = () => {
    if (!clipboard || clipboard.type !== 'week') { handleToast('Copy a full week structure first'); return; }
    const newSchedule = {}; const newTitles = { ...clipboard.data.dayTitles };
    DAYS_OF_WEEK.forEach(day => { newSchedule[day] = (clipboard.data.schedule[day] || []).map((d, i) => ({ ...d, id: `w-${Date.now()}-${day}-${i}` })); });
    setSchedule(newSchedule); setDayTitles(newTitles); pushToHistory(newSchedule, newTitles);
    DAYS_OF_WEEK.forEach(day => autoSaveDay(day, newSchedule[day], newTitles[day])); handleToast('Full week pasted');
  };

  const calculateDayVolume = (dayDrills) => { 
    let totalExercises = dayDrills.length; let totalVolumeScore = 0; let validIntensityCount = 0; let sumIntensity = 0; 
    let jumpsVolume = 0; let cnsLoad = 0; let structuralLoad = 0;
    let totalMeters = 0;
    
    dayDrills.forEach(drill => { 
      const type = (drill.type || '').toLowerCase();
      const unit = (drill.unit || '').toLowerCase();
      const intensity = parseInt(drill.percentage) || 0; 

      if (unit === 'meters') {
        let s = parseInt(String(drill.sets).replace(/\D/g,'')) || 0;
        let d = parseInt(String(drill.distance).replace(/\D/g,'')) || 0;
        if (s > 0 && d === 0) d = 10;
        let sprintsVolume = s * d;
        totalMeters += sprintsVolume;

        let drillLoad = sprintsVolume * (intensity > 0 ? intensity / 100 : 1);
        if ((drill.title || '').toLowerCase().includes('recovery') || sprintsVolume === 0) {
          drillLoad = 0;
        }

        if (intensity > 0) { validIntensityCount++; sumIntensity += intensity; } 

        if (type === 'power') {
          drillLoad = drillLoad * 2.5;
          cnsLoad += drillLoad;
        } else if (type === 'strength' || type === 'physical') {
          drillLoad = drillLoad * 0.8;
          structuralLoad += drillLoad;
        }
        totalVolumeScore += drillLoad;
      } else {
        let s = parseInt(String(drill.sets).replace(/\D/g,'')) || 0;
        let r = parseInt(String(drill.reps).replace(/\D/g,'')) || 0;
        if (s > 0 && r === 0) r = 1; if (r > 0 && s === 0) s = 1;
        let repsMultiplier = s * r;

        if (type === 'power' && unit === 'jumps') jumpsVolume += repsMultiplier;

        if (type === 'power' || type === 'strength') {
          let categoryMultiplier = type === 'power' ? 2.0 : 1.5; 
          if (intensity > 0) { validIntensityCount++; sumIntensity += intensity; } 
          let drillLoad = repsMultiplier * categoryMultiplier * (intensity > 0 ? (intensity/100) : 1) * 10; 
          if ((drill.title || '').toLowerCase().includes('recovery') || repsMultiplier === 0) drillLoad = 0;

          if (type === 'power') cnsLoad += drillLoad;
          if (type === 'strength') structuralLoad += drillLoad;
          totalVolumeScore += drillLoad; 
        }
      }
    }); 
    const avgIntensity = validIntensityCount > 0 ? Math.round(sumIntensity / validIntensityCount) : 0; 
    return { totalExercises, totalVolumeScore: Math.round(totalVolumeScore), avgIntensity, jumpsVolume, cnsLoad: Math.round(cnsLoad), structuralLoad: Math.round(structuralLoad), totalMeters }; 
  };

  const weeklyStats = useMemo(() => {
    let totalLoad = 0; let sumIntensities = 0; let countIntDays = 0; 
    let totalJumps = 0; let totalCnsLoad = 0; let totalStructuralLoad = 0;
    let totalMeters = 0;
    const dailyData = [];

    DAYS_OF_WEEK.forEach(day => {
      const stats = calculateDayVolume(schedule[day] || []); 
      totalLoad += stats.totalVolumeScore; totalJumps += stats.jumpsVolume; totalCnsLoad += stats.cnsLoad; totalStructuralLoad += stats.structuralLoad;
      totalMeters += stats.totalMeters;
      if (stats.avgIntensity > 0) { sumIntensities += stats.avgIntensity; countIntDays++; }
      dailyData.push({ day, load: stats.totalVolumeScore, intensity: stats.avgIntensity, meters: stats.totalMeters });
    });
    
    const avgIntensity = countIntDays > 0 ? Math.round(sumIntensities / countIntDays) : 0;
    let loadLabel = 'Low (Deload)'; let loadColor = 'text-green-600 bg-green-50 border-green-200';
    if (totalLoad >= 9000) { loadLabel = 'Very High (Overreaching)'; loadColor = 'text-red-600 bg-red-50 border-red-200'; } 
    else if (totalLoad >= 5000) { loadLabel = 'High (High)'; loadColor = 'text-orange-600 bg-orange-50 border-orange-200'; } 
    else if (totalLoad >= 2500) { loadLabel = 'Medium (Base)'; loadColor = 'text-yellow-600 bg-yellow-50 border-yellow-200'; }

    const combinedLoad = totalCnsLoad + totalStructuralLoad;
    const cnsPercentage = combinedLoad > 0 ? Math.round((totalCnsLoad / combinedLoad) * 100) : 0;
    const structuralPercentage = combinedLoad > 0 ? Math.round((totalStructuralLoad / combinedLoad) * 100) : 0;

    return { load: totalLoad, intensity: avgIntensity, loadLabel, loadColor, dailyData, totalJumps, cnsPercentage, structuralPercentage, totalMeters };
  }, [schedule]);

  const handleSaveProgramBlock = async () => {
    if (!createProgramModal.name.trim()) return;
    const compiledWeeks = createProgramModal.weeksChain.map(tplId => {
      const found = library.templates.find(t => t.id === parseInt(tplId) || t.id === tplId);
      return found ? { title: found.title, drills: found.drills } : null;
    }).filter(Boolean);
    if (compiledWeeks.length === 0) return;
    const payload = { program_name: createProgramModal.name, weeks: compiledWeeks.map(w => ({ ...w, blockTags: createProgramModal.tags })) };
    const { error } = await supabase.from('agilitylap_programs').insert([payload]);
    if (!error) { setCreateProgramModal({ isOpen: false, name: '', tags: '', weeksChain: [''] }); fetchLibraryData(); handleToast('Multi-week block saved!'); }
  };

  const handleApplyProgramBlock = async (program) => {
    if (!selectedAthleteId || !program.weeks || program.weeks.length === 0) return;
    setIsLoading(true);
    for (let i = 0; i < program.weeks.length; i++) {
      const futureWeekStart = new Date(currentWeekStart); futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
      const weekTemplateObject = program.weeks[i].drills || {}; const targetBlockTitle = program.weeks[i].title || 'Block Workout';
      for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
        const dayDate = new Date(futureWeekStart); dayDate.setDate(dayDate.getDate() + j);
        const clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ ...drill, id: `block-${Date.now()}-${i}-${j}-${idx}` }));
        await supabase.from('agilitylap_workouts').upsert({ athlete_id: selectedAthleteId, workout_date: getDbDateStr(dayDate), workout_title: targetBlockTitle, drills: clonedDrills }, { onConflict: 'athlete_id,workout_date' });
      }
    }
    const { data } = await supabase.from('agilitylap_workouts').select('*').eq('athlete_id', selectedAthleteId).gte('workout_date', weekStartDateStr).lte('workout_date', getDbDateStr(weekDatesFull[6]));
    const newSchedule = {}; const newTitles = {}; DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; });
    if (data) { data.forEach(record => { const dayName = JS_DAYS[new Date(record.workout_date).getDay()]; if (dayName) { newSchedule[dayName] = record.drills || []; newTitles[dayName] = record.workout_title || ''; } }); }
    setSchedule(newSchedule); setDayTitles(newTitles); setIsLoading(false); handleToast('Block deployed successfully!');
  };

  const handleDeleteProgramBlock = async (id) => { const { error } = await supabase.from('agilitylap_programs').delete().eq('id', id); if (!error) { setPrograms(prev => prev.filter(p => p.id !== id)); handleToast('Program block cleared'); } };
  const handleLibraryDragStart = (e, item, isTemplate = false) => { setDraggedItem({ source: 'library', item, isTemplate }); e.dataTransfer.effectAllowed = 'copy'; };
  const handleDragStartWrapper = (e, day, drill, index) => { setDraggedItem({ source: 'timeline', day, drill, index }); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetDay, targetIndex = null) => {
    e.preventDefault(); e.stopPropagation(); if (!draggedItem) return;
    setSchedule(prev => {
      const newSchedule = { ...prev }; 
      if (draggedItem.source === 'timeline') {
        const { day: sourceDay, drill, index: sourceIndex } = draggedItem;
        if (sourceDay === targetDay) {
          if (sourceIndex === targetIndex) return prev;
          const updatedDrills = Array.from(newSchedule[sourceDay]); updatedDrills.splice(sourceIndex, 1);
          let finalTargetIndex = targetIndex !== null ? targetIndex : updatedDrills.length;
          if (targetIndex !== null && sourceIndex < targetIndex) { finalTargetIndex -= 1; }
          updatedDrills.splice(finalTargetIndex, 0, drill); newSchedule[sourceDay] = updatedDrills;
          pushToHistory(newSchedule, dayTitles); autoSaveDay(sourceDay, updatedDrills, dayTitles[sourceDay]);
        } else {
          const sourceDrills = Array.from(newSchedule[sourceDay]); sourceDrills.splice(sourceIndex, 1); newSchedule[sourceDay] = sourceDrills;
          const targetDrills = Array.from(newSchedule[targetDay]);
          if (targetIndex !== null) targetDrills.splice(targetIndex, 0, drill); else targetDrills.push(drill);
          newSchedule[targetDay] = targetDrills;
          pushToHistory(newSchedule, dayTitles); autoSaveDay(sourceDay, sourceDrills, dayTitles[sourceDay]); autoSaveDay(targetDay, targetDrills, dayTitles[targetDay]);
        }
      } else if (draggedItem.source === 'library') {
        const { item, isTemplate } = draggedItem; newSchedule[targetDay] = [...newSchedule[targetDay]];
        if (isTemplate) { 
          const newDrills = item.drills.map((d, i) => ({ ...d, id: `lib-tpl-${Date.now()}-${i}` })); 
          if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, ...newDrills); else newSchedule[targetDay].push(...newDrills); 
        } else { 
          const newDrill = { ...item, id: `lib-drill-${Date.now()}` }; 
          if (targetIndex !== null) newSchedule[targetDay].splice(targetIndex, 0, newDrill); else newSchedule[targetDay].push(newDrill); 
        }
        pushToHistory(newSchedule, dayTitles); autoSaveDay(targetDay, newSchedule[targetDay], dayTitles[targetDay]);
      } 
      return newSchedule;
    }); setDraggedItem(null);
  };

  const handleLibraryDropzone = async (e) => {
    e.preventDefault(); if (!draggedItem || draggedItem.source !== 'timeline') return;
    const { drill } = draggedItem;
    const drillData = { 
      title: drill.title, 
      details: drill.details || '', 
      type: drill.type || 'strength', 
      percentage: drill.percentage ? parseFloat(drill.percentage) : null, 
      sets: drill.sets || '', 
      reps: drill.reps || '', 
      rest: drill.rest || '', 
      unit: drill.unit || 'reps',
      distance: drill.distance ? parseFloat(drill.distance) : null
    };
    const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
    if (!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); handleToast('Exercise saved to library sidebar!'); }
    setDraggedItem(null);
  };

  const moveDrillUp = (day, index) => { if (index === 0) return; setSchedule(prev => { const newSchedule = { ...prev }; const drills = [...newSchedule[day]]; [drills[index - 1], drills[index]] = [drills[index], drills[index - 1]]; newSchedule[day] = drills; pushToHistory(newSchedule, dayTitles); autoSaveDay(day, drills, dayTitles[day]); return newSchedule; }); };
  const moveDrillDown = (day, index) => { if (index === schedule[day].length - 1) return; setSchedule(prev => { const newSchedule = { ...prev }; const drills = [...newSchedule[day]]; [drills[index + 1], drills[index]] = [drills[index], drills[index + 1]]; newSchedule[day] = drills; pushToHistory(newSchedule, dayTitles); autoSaveDay(day, drills, dayTitles[day]); return newSchedule; }); };

  const handleAddExerciseBtn = (day) => { setDayDrillModal({ isOpen: true, day: day, drill: { id: `w-${Date.now()}`, type: 'strength', title: '', details: '', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' }, isNew: true }); };
  const handleEditExerciseBtn = (day, drill) => { setDayDrillModal({ isOpen: true, day: day, drill: { ...drill, unit: drill.unit || 'reps', distance: drill.distance || '' }, isNew: false }); };

  const handleSaveDayDrillModal = () => {
    const { day, drill, isNew } = dayDrillModal;
    if (!drill.title || !drill.title.trim()) { handleToast('Please write an exercise title first!'); return; }
    let updatedDrills; if (isNew) { updatedDrills = [...(schedule[day] || []), drill]; } else { updatedDrills = schedule[day].map(w => w.id === drill.id ? drill : w); }
    const newSchedule = { ...schedule, [day]: updatedDrills };
    setSchedule(newSchedule); pushToHistory(newSchedule, dayTitles); autoSaveDay(day, updatedDrills, dayTitles[day]);
    setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false });
  };

  const handleDeleteExercise = (day, id) => { const updatedDrills = schedule[day].filter(w => w.id !== id); const newSchedule = { ...schedule, [day]: updatedDrills }; setSchedule(newSchedule); pushToHistory(newSchedule, dayTitles); autoSaveDay(day, updatedDrills, dayTitles[day]); };
  const handleDayTitleChange = (day, newTitle) => { const newTitles = { ...dayTitles, [day]: newTitle }; setDayTitles(newTitles); pushToHistory(schedule, newTitles); autoSaveDay(day, schedule[day], newTitle); };
  const confirmDelete = () => { if (deleteConfirmation.type === 'week') { const emptySchedule = DAYS_OF_WEEK.reduce((acc, day) => ({...acc, [day]: []}), {}); setSchedule(emptySchedule); setDayTitles({}); pushToHistory(emptySchedule, {}); DAYS_OF_WEEK.forEach(day => autoSaveDay(day, [], '')); handleToast('Week cleared successfully'); } else if (deleteConfirmation.type === 'day' && deleteConfirmation.targetDay) { const tDay = deleteConfirmation.targetDay; const newSchedule = { ...schedule, [tDay]: [] }; const newTitles = { ...dayTitles, [tDay]: '' }; setSchedule(newSchedule); setDayTitles(newTitles); pushToHistory(newSchedule, newTitles); autoSaveDay(tDay, [], ''); handleToast(`${tDay} cleared`); } setDeleteConfirmation({ isOpen: false, type: null, targetDay: null }); };
  const handleSaveTemplate = async () => { if(!saveTemplateModal.name.trim()) return; const drillsToSave = schedule[saveTemplateModal.day].map(d => ({...d})); const newTemplate = { template_name: saveTemplateModal.name, template_type: 'day', drills: drillsToSave }; const { data, error } = await supabase.from('agilitylap_templates').insert([newTemplate]).select(); if(!error && data) { const formatted = { id: data[0].id, title: data[0].template_name, type: data[0].template_type, drills: data[0].drills }; setLibrary(prev => ({ ...prev, templates: [formatted, ...prev.templates] })); setSaveTemplateModal({ isOpen: false, day: null, name: '' }); handleToast(`Saved Template`); } };
  const handleSaveWeekTemplate = async () => { if(!saveWeekTemplateModal.name.trim()) return; const allDrills = []; DAYS_OF_WEEK.forEach(day => { schedule[day].forEach(drill => allDrills.push({...drill})); }); if(allDrills.length === 0) return; const newTemplate = { template_name: saveWeekTemplateModal.name, template_type: 'week', drills: allDrills }; const { data, error } = await supabase.from('agilitylap_templates').insert([newTemplate]).select(); if(!error && data) { const formatted = { id: data[0].id, title: data[0].template_name, type: data[0].template_type, drills: data[0].drills }; setLibrary(prev => ({ ...prev, templates: [formatted, ...prev.templates] })); setSaveWeekTemplateModal({ isOpen: false, name: '' }); handleToast(`Saved Week Template`); } };
  const handleAddAthlete = async () => { if(newAthleteData.name.trim()) { const newAthlete = { name: newAthleteData.name, birth_year: newAthleteData.birthYear ? parseInt(newAthleteData.birthYear) : null, weight: newAthleteData.weight ? parseFloat(newAthleteData.weight) : null }; const { data } = await supabase.from('agilitylap_athletes').insert([newAthlete]).select(); if (data && data.length > 0) { const addedAthlete = { ...data[0], birthYear: data[0].birth_year, bodyFat: data[0].body_fat, verticalJump: data[0].vertical_jump, halfSquat: data[0].half_squat, quarterSquat: data[0].quarter_squat }; setAthletes([addedAthlete, ...athletes]); setSelectedAthleteId(addedAthlete.id); setNewAthleteData({ name: '', birthYear: '', weight: '' }); setShowAddAthleteModal(false); } } };
  const handleSaveProfile = async (updatedProfile) => { const { error } = await supabase.from('agilitylap_athletes').update({ name: updatedProfile.name, birth_year: updatedProfile.birthYear ? parseInt(updatedProfile.birthYear) : null, weight: updatedProfile.weight ? parseFloat(updatedProfile.weight) : null, height: updatedProfile.height ? parseFloat(updatedProfile.height) : null, body_fat: updatedProfile.bodyFat ? parseFloat(updatedProfile.bodyFat) : null, vertical_jump: updatedProfile.verticalJump ? parseFloat(updatedProfile.verticalJump) : null, standing_long_jump: updatedProfile.standingLongJump ? parseFloat(updatedProfile.standingLongJump) : null, squat_jump: updatedProfile.squatJump ? parseFloat(updatedProfile.squatJump) : null, clean: updatedProfile.clean ? parseFloat(updatedProfile.clean) : null, half_squat: updatedProfile.halfSquat ? parseFloat(updatedProfile.halfSquat) : null, quarter_squat: updatedProfile.quarterSquat ? parseFloat(updatedProfile.quarterSquat) : null, full_squat: updatedProfile.fullSquat ? parseFloat(updatedProfile.fullSquat) : null, bench: updatedProfile.bench ? parseFloat(updatedProfile.bench) : null, deadlift: updatedProfile.deadlift ? parseFloat(updatedProfile.deadlift) : null, }).eq('id', updatedProfile.id); if (!error) { setAthletes(prev => prev.map(a => a.id === updatedProfile.id ? updatedProfile : a)); setShowProfileModal(false); handleToast('Profile updated'); } };
  const handleDeleteLibraryDrill = async (id) => { const { error } = await supabase.from('library_drills').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, drills: prev.drills.filter(d => d.id !== id) })); } };
  const handleEditLibraryDrill = (drill) => { setAddExerciseModal({ isOpen: true, id: drill.id, title: drill.title || '', details: drill.details || '', type: drill.type || 'strength', percentage: drill.percentage || '', sets: drill.sets || '', reps: drill.reps || '', rest: drill.rest || '', unit: drill.unit || 'reps', distance: drill.distance || '' }); };
  const handleDeleteLibraryTemplate = async (id) => { const { error } = await supabase.from('agilitylap_templates').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) })); } };
  const handleEditTemplate = (tpl) => { handleToast('Drag to timeline to alter.'); };
  
  const handleSaveLibraryExercise = async () => { 
    if(!addExerciseModal.title.trim()) return; 
    const drillData = { 
      title: addExerciseModal.title, 
      details: addExerciseModal.details, 
      type: addExerciseModal.type, 
      percentage: addExerciseModal.percentage ? parseFloat(addExerciseModal.percentage) : null, 
      sets: addExerciseModal.sets, 
      reps: addExerciseModal.reps, 
      rest: addExerciseModal.rest, 
      unit: addExerciseModal.unit,
      distance: addExerciseModal.distance ? parseFloat(addExerciseModal.distance) : null
    }; 
    if (addExerciseModal.id) {
      const { data, error } = await supabase.from('library_drills').update(drillData).eq('id', addExerciseModal.id).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: prev.drills.map(d => d.id === addExerciseModal.id ? data[0] : d) })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' }); handleToast('Exercise updated'); }
    } else {
      const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' }); handleToast('Exercise added'); }
    }
  };

  const renderLargeCalendarDays = () => {
    const days = []; const startDayObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const startDay = (startDayObj.getDay() + 1) % 7; 
    for(let i=0; i<startDay; i++) days.push(<div key={`empty-${i}`} className="p-1 sm:p-4 border border-transparent"></div>); 
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i); const dateStr = getDbDateStr(dateObj);
      const isSelectedWeek = weekDatesFull.some(d => getDbDateStr(d) === dateStr);
      const dayData = monthWorkouts[dateStr]; const hasWorkoutSaved = dayData && dayData.hasDrills;
      let displayTitle = ""; if (isSelectedWeek) { const dayName = JS_DAYS[dateObj.getDay()]; displayTitle = dayTitles[dayName] || (hasWorkoutSaved ? "Workout" : ""); } else if (hasWorkoutSaved) { displayTitle = dayData.title || "Workout"; }
      days.push(
        <button key={i} onClick={() => { const newDate = new Date(currentDate); newDate.setDate(i); setCurrentDate(newDate); setShowMonthCalendar(false); }} className={`h-20 sm:h-28 w-full rounded-xl p-1 sm:p-3 flex flex-col items-center sm:items-start justify-start border overflow-hidden ${isSelectedWeek ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' : hasWorkoutSaved ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
          <span className={`text-[10px] sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isSelectedWeek ? 'bg-orange-500 text-white' : hasWorkoutSaved ? 'bg-blue-500 text-white' : 'text-slate-700'}`}>{i}</span>
          {(displayTitle) && ( <span className={`text-[8px] sm:text-xs font-medium text-center sm:text-left line-clamp-2 w-full ${isSelectedWeek ? 'text-orange-700' : 'text-blue-700'}`}>{displayTitle}</span> )}
        </button>
      );
    } return days;
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F4F5F7] text-slate-800'} print:bg-white print:text-black pb-16 md:pb-0 ${printMode === 'landscape' ? 'print-mode-landscape' : 'print-mode-portrait'}`}>
      
      {toastMessage && ( <div className="fixed bottom-20 md:bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[200] animate-[bounce_0.3s_ease-out] print:hidden"><Check className="w-5 h-5 text-green-400" /><span className="font-medium text-sm">{toastMessage}</span></div> )}
      {showProfileModal && selectedAthlete && ( <AthleteProfileModal athlete={selectedAthlete} onClose={() => setShowProfileModal(false)} onSave={handleSaveProfile} /> )}

      {showMonthCalendar && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 print:hidden" onClick={() => setShowMonthCalendar(false)}> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-4"> <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-orange-500" />{monthYearString}</h3> <button onClick={() => setShowMonthCalendar(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button> </div> <div className="grid grid-cols-7 gap-1 sm:gap-4 text-center mb-2"> {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => ( <div key={d} className="text-[9px] sm:text-sm font-bold text-slate-400 uppercase">{d}</div> ))} </div> <div className="grid grid-cols-7 gap-1 sm:gap-4">{renderLargeCalendarDays()}</div> </div> </div> )}
      
      {deleteConfirmation.isOpen && ( <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"> <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div> <h3 className="text-lg font-bold mb-2">Are you sure?</h3> <p className="text-slate-500 text-sm mb-6">{deleteConfirmation.type === 'week' ? "Erase all structural days?" : "Wipe out this day's records?"}</p> <div className="flex gap-3"> <button onClick={() => setDeleteConfirmation({isOpen: false})} className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl font-medium text-sm">Cancel</button> <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 font-medium text-sm">Delete</button> </div> </div> </div> )}
      
      {saveTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> Save Day Template</h3> <input type="text" value={saveTemplateModal.name} onChange={(e) => setSaveTemplateModal({...saveTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 mb-6 outline-none focus:ring-2 focus:ring-orange-500" autoFocus /> <div className="flex justify-end gap-2"> <button onClick={() => setSaveTemplateModal({isOpen: false, day: null, name: ''})} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold">Cancel</button> <button onClick={handleSaveTemplate} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Save</button> </div> </div> </div> )}
      {saveWeekTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> Save Week Block</h3> <input type="text" value={saveWeekTemplateModal.name} onChange={(e) => setSaveWeekTemplateModal({...saveWeekTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 mb-6 outline-none focus:ring-2 focus:ring-orange-500" autoFocus /> <div className="flex justify-end gap-2"> <button onClick={() => setSaveWeekTemplateModal({isOpen: false, name: ''})} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold">Cancel</button> <button onClick={handleSaveWeekTemplate} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Save</button> </div> </div> </div> )}

      {createProgramModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Create Multi-Week Program Block</h3>
            <div className="space-y-4">
              <input type="text" value={createProgramModal.name} onChange={(e) => setCreateProgramModal({...createProgramModal, name: e.target.value})} placeholder="Program Block Name" className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              <input type="text" value={createProgramModal.tags || ''} onChange={(e) => setCreateProgramModal({...createProgramModal, tags: e.target.value})} placeholder="Custom Tags (#ReturnToPlay)" className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {createProgramModal.weeksChain.map((selectedTplId, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-16">Week {idx + 1}:</span>
                    <select value={selectedTplId} onChange={(e) => { const updated = [...createProgramModal.weeksChain]; updated[idx] = e.target.value; setCreateProgramModal({...createProgramModal, weeksChain: updated}); }} className="flex-1 text-sm bg-slate-50 border p-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">-- Choose Week --</option>
                      {library.templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={() => setCreateProgramModal({...createProgramModal, weeksChain: [...createProgramModal.weeksChain, '']})} className="text-xs font-bold text-orange-500">+ Add Week</button>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCreateProgramModal({ isOpen: false, name: '', tags: '', weeksChain: [''] })} className="px-4 py-2 text-sm font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveProgramBlock} className="px-5 py-2 text-sm font-bold bg-orange-500 text-white rounded-xl shadow-md">Save Block</button>
            </div>
          </div>
        </div>
      )}

      {addExerciseModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6"> <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-6 h-6 text-orange-500" /> {addExerciseModal.id ? 'Edit Exercise' : 'Create Exercise'}</h3> <div className="space-y-4"> <div className="flex gap-3"> <div className="flex-1"> <label className="block text-xs font-bold text-slate-500 mb-1">Category</label> <select value={addExerciseModal.type} onChange={(e) => setAddExerciseModal({...addExerciseModal, type: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"> {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))} </select> </div> <div className="w-28"> <label className="block text-xs font-bold text-slate-500 mb-1">Intensity %</label> <div className="relative w-full"> <input type="number" value={addExerciseModal.percentage} onChange={(e) => setAddExerciseModal({...addExerciseModal, percentage: e.target.value})} className="w-full text-sm py-2 pl-8 pr-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="0" /> <Percent className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" /> </div> </div> </div> <div className="flex gap-2"> <div className="flex-1"> <label className="block text-xs font-bold text-slate-500 mb-1">Sets</label> <input type="text" value={addExerciseModal.sets} onChange={(e) => setAddExerciseModal({...addExerciseModal, sets: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /> </div> <div className="flex-1"> <label className="block text-xs font-bold text-slate-500 mb-1">{addExerciseModal.unit === 'meters' ? 'Distance (m)' : 'Volume'}</label> <input type="text" value={addExerciseModal.unit === 'meters' ? (addExerciseModal.distance || '') : addExerciseModal.reps} onChange={(e) => setAddExerciseModal({...addExerciseModal, [addExerciseModal.unit === 'meters' ? 'distance' : 'reps']: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /> </div> <div className="w-24"> <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label> <select value={addExerciseModal.unit || 'reps'} onChange={(e) => setAddExerciseModal({...addExerciseModal, unit: e.target.value})} className="w-full text-sm px-2 py-2 border rounded-xl outline-none"> <option value="reps">Reps</option> <option value="sec">Sec</option> <option value="min">Min</option> <option value="jumps">Jumps</option> <option value="meters">Meters</option> </select> </div> <div className="flex-1"> <label className="block text-xs font-bold text-slate-500 mb-1">Rest</label> <input type="text" value={addExerciseModal.rest} onChange={(e) => setAddExerciseModal({...addExerciseModal, rest: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Exercise Name</label> <input type="text" value={addExerciseModal.title} onChange={(e) => setAddExerciseModal({...addExerciseModal, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" autoFocus/> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label> <textarea value={addExerciseModal.details} onChange={(e) => setAddExerciseModal({...addExerciseModal, details: e.target.value})} className="w-full px-4 py-2 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-orange-500" /> </div> </div> <div className="flex justify-end gap-3 mt-6"> <button onClick={() => setAddExerciseModal({isOpen: false, id: null, title: '', details: '', type: 'strength', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: ''})} className="px-5 py-2 bg-slate-100 rounded-xl font-bold text-sm">Cancel</button> <button onClick={handleSaveLibraryExercise} className="px-8 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm">Save</button> </div> </div> </div> )}

      {dayDrillModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">{dayDrillModal.isNew ? <Plus className="w-5 h-5 text-green-500" /> : <Edit2 className="w-5 h-5 text-blue-500" />} {dayDrillModal.isNew ? 'Add Exercise' : 'Edit Metrics'}</h3>
              <button onClick={() => setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false })} className="p-1 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                  <select value={dayDrillModal.drill.type} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, type: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Intensity %</label>
                  <div className="relative w-full">
                    <input type="number" value={dayDrillModal.drill.percentage || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, percentage: e.target.value}})} className="w-full text-sm py-2 pl-7 pr-2 border rounded-xl outline-none" placeholder="0" />
                    <Percent className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">Sets</label><input type="text" value={dayDrillModal.drill.sets || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, sets: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">{dayDrillModal.drill.unit === 'meters' ? 'Distance (m)' : 'Volume'}</label><input type="text" value={dayDrillModal.drill.unit === 'meters' ? (dayDrillModal.drill.distance || '') : (dayDrillModal.drill.reps || '')} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, [dayDrillModal.drill.unit === 'meters' ? 'distance' : 'reps']: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
                <div className="w-24"><label className="block text-xs font-bold text-slate-500 mb-1">Unit</label><select value={dayDrillModal.drill.unit || 'reps'} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, unit: e.target.value}})} className="w-full text-sm px-2 py-2 border rounded-xl outline-none"><option value="reps">Reps</option><option value="sec">Sec</option><option value="min">Min</option><option value="jumps">Jumps</option><option value="meters">Meters</option></select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">Rest</label><input type="text" value={dayDrillModal.drill.rest || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, rest: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Exercise Name</label><input type="text" value={dayDrillModal.drill.title} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, title: e.target.value}})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" autoFocus /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Notes</label><textarea value={dayDrillModal.drill.details} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, details: e.target.value}})} className="w-full px-4 py-2 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="pt-4 mt-4 border-t flex justify-between items-center">
               {!dayDrillModal.isNew ? ( <button onClick={() => { handleDeleteExercise(dayDrillModal.day, dayDrillModal.drill.id); setDayDrillModal({isOpen: false, day: null, drill: null, isNew: false}); }} className="px-4 py-2 text-red-500 font-bold text-sm flex gap-2"><Trash2 className="w-4 h-4"/> Delete</button> ) : <div></div>}
              <div className="flex gap-2">
                <button onClick={() => setDayDrillModal({ isOpen: false, day: null, drill: null, isNew: false })} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={handleSaveDayDrillModal} className={`px-6 py-2 ${dayDrillModal.isNew ? 'bg-green-500' : 'bg-blue-500'} text-white rounded-xl font-bold text-sm flex gap-2`}><Save className="w-4 h-4"/> {dayDrillModal.isNew ? 'Add' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowStatsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-orange-500" /> Workload Analytics</h3>
              <button onClick={() => setShowStatsModal(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${weeklyStats.loadColor}`}>
                  <p className="text-xs font-bold uppercase opacity-70 mb-1">Total Weekly Load</p>
                  <p className="text-3xl font-black">{weeklyStats.load} <span className="text-sm font-medium opacity-80">AU</span></p>
                  <p className="text-sm font-bold mt-1 opacity-90">{weeklyStats.loadLabel}</p>
                </div>
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                  <p className="text-xs font-bold uppercase opacity-70 mb-1">Average Intensity</p>
                  <p className="text-3xl font-black">{weeklyStats.intensity}%</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Jumps</p>
                  <p className="text-xl font-black text-orange-500">{weeklyStats.totalJumps}</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">CNS Split</p>
                  <p className="text-xl font-black text-yellow-500">{weeklyStats.cnsPercentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Structural</p>
                  <p className="text-xl font-black text-blue-500">{weeklyStats.structuralPercentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Run</p>
                  <p className="text-lg sm:text-xl font-black text-indigo-600">{weeklyStats.totalMeters}m</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
                  <span>CNS / Power Fatigue</span>
                  <span>Structural Muscle Strain</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${weeklyStats.cnsPercentage}%` }} />
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${weeklyStats.structuralPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{weeklyStats.cnsPercentage}% CNS (Orange)</span>
                  <span>{weeklyStats.structuralPercentage}% Struct (Blue)</span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 h-36 border-b pb-2">
                  {weeklyStats.dailyData.map((data, i) => {
                    const maxLoad = Math.max(...weeklyStats.dailyData.map(d => d.load), 1000); 
                    const heightPercent = data.load > 0 ? (data.load / maxLoad) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">{data.load}</div>
                        <div className="w-full max-w-[40px] bg-slate-100 rounded-t-md relative flex items-end justify-center h-full">
                          <div className="w-full bg-orange-500 rounded-t-md transition-all duration-700" style={{ height: `${heightPercent}%`, minHeight: data.load > 0 ? '4px' : '0' }}></div>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 mt-2 uppercase">{data.day.substring(0, 3)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAthleteModal && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white rounded-3xl w-full max-w-md p-6"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-500" /> Add Athlete</h3> <div className="space-y-3 mb-6"> <div><label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label><input type="text" value={newAthleteData.name} onChange={(e) => setNewAthleteData({...newAthleteData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" autoFocus /></div><div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Birth Year</label><input type="number" value={newAthleteData.birthYear} onChange={(e) => setNewAthleteData({...newAthleteData, birthYear: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div><div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label><input type="number" value={newAthleteData.weight} onChange={(e) => setNewAthleteData({...newAthleteData, weight: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div></div> </div> <div className="flex justify-end gap-3"><button onClick={() => setShowAddAthleteModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-medium">Cancel</button><button onClick={handleAddAthlete} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium">Add</button></div> </div> </div> )}

      <Header 
        currentDate={currentDate} setCurrentDate={setCurrentDate} currentWeekStart={currentWeekStart} setShowMonthCalendar={setShowMonthCalendar}
        selectedAthlete={selectedAthlete} setSelectedAthleteId={setSelectedAthleteId} athletes={athletes} isAthleteDropdownOpen={isAthleteDropdownOpen} setIsAthleteDropdownOpen={setIsAthleteDropdownOpen}
        setShowAddAthleteModal={setShowAddAthleteModal} setShowProfileModal={setShowProfileModal} isMobileView={isMobileView} setIsMobileView={setIsMobileView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
        showLibrary={showLibrary} setShowLibrary={setShowLibrary} handleToast={handleToast} setSaveWeekTemplateModal={setSaveWeekTemplateModal} weeklyStats={weeklyStats}
      />

      {/* ⚠️ Layout Control Panel */}
      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden relative print:h-auto print:overflow-visible bg-[#F4F5F7] dark:bg-slate-900">
        
        <Sidebar 
          isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} 
          onCopyWeek={handleCopyWeek} onPasteWeek={handlePasteWeek} 
          onUndo={handleUndo} onRedo={handleRedo}
          canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
          onShowStats={() => setShowStatsModal(true)}
          onClearWeek={() => setDeleteConfirmation({isOpen: true, type: 'week'})} 
          onPrint={handlePrint} 
        />        <div className={`flex-1 overflow-x-auto overflow-y-auto pb-24 md:pb-0 relative scroll-smooth w-full transition-all duration-300 ${showLibrary ? 'md:mr-80' : ''}`}>
          
          {/* Premium Printed Report Header */}
          <div className="hidden print:flex flex-col border-b-2 border-slate-900 pb-4 mb-6 pt-4 px-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">TRAINING PERFORMANCE REPORT</h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">ForcePeak Lab Performance Athlete Passport | Meso-Block Blueprint</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date Range</span>
                <span className="text-sm font-bold text-slate-800">
                  {currentWeekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            
            {selectedAthlete && (
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Athlete Name</span>
                  <span className="text-xs font-bold text-slate-800">{selectedAthlete.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Birth Year / Weight</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedAthlete.birthYear || 'N/A'} / {selectedAthlete.weight ? `${selectedAthlete.weight} kg` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CNS Split</span>
                  <span className="text-xs font-bold text-slate-800">{weeklyStats.cnsPercentage}% CNS Load</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Structural Split</span>
                  <span className="text-xs font-bold text-slate-800">{weeklyStats.structuralPercentage}% Structural Load</span>
                </div>
              </div>
            )}
          </div>

          <div className={`p-2 md:p-4 gap-2 md:gap-4 print-grid-container ${isMobileView ? 'flex flex-col w-full' : 'grid grid-cols-7 w-[1100px] xl:w-full min-w-full'}`}>
            {DAYS_OF_WEEK.map((day, index) => {
              const fullDateStr = weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const dayDrills = schedule[day] || [];
              const dayStats = calculateDayVolume(dayDrills);
              const dayCnsPct = (dayStats.cnsLoad + dayStats.structuralLoad) > 0 ? Math.round((dayStats.cnsLoad / (dayStats.cnsLoad + dayStats.structuralLoad)) * 100) : 0;

              return (
              <div key={day} className={`flex flex-col ${isMobileView ? 'w-full mb-6 border-b border-slate-200 dark:border-slate-700 pb-6' : 'w-full'} print:break-inside-avoid print:mb-0`}>
                
                <div className="mb-4 flex flex-col group border-b border-slate-200 dark:border-slate-700 pb-3 px-1 md:px-2 day-header">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] md:text-xs font-semibold tracking-wider text-slate-400 uppercase">{day}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400/80">{fullDateStr}</span>
                  </div>
                  <div className="flex items-start gap-1 md:gap-2 justify-between">
                    <div className="flex items-start gap-1 md:gap-2 flex-1">
                      <div className="w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
                        {weekDates[index]}
                      </div>
                      <input type="text" value={dayTitles[day] || ''} onChange={(e) => handleDayTitleChange(day, e.target.value)} placeholder="Add Workout Focus" className="text-xs md:text-[14px] font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none w-full" readOnly={isPreviewMode}/>
                    </div>
                    {!isPreviewMode && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                         <button onClick={() => handleCopyDay(day)} className="p-1 text-slate-400 hover:text-blue-500"><Copy className="w-3 h-3 md:w-4 md:h-4" /></button>
                         {clipboard && ( <button onClick={() => handlePasteIntoDay(day)} className="p-1 text-slate-400 hover:text-green-500"><ClipboardPaste className="w-3 h-3 md:w-4 md:h-4" /></button> )}
                         <button onClick={() => setSaveTemplateModal({isOpen: true, day, name: dayTitles[day] || ''})} className="p-1 text-slate-400 hover:text-orange-500"><BookmarkPlus className="w-3 h-3 md:w-4 md:h-4" /></button>
                         <button onClick={() => setDeleteConfirmation({isOpen: true, type: 'day', targetDay: day})} className="p-1 text-slate-300 hover:text-red-500"><Trash className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 px-1 md:px-2 pb-6 ${draggedItem && draggedItem.source !== 'library' && draggedItem.day !== day ? 'bg-slate-100/50 dark:bg-slate-800/30 border-dashed border border-slate-200 rounded-xl' : ''}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day)}>
                  {dayDrills.map((drill, drillIndex) => (
                    <TimelineCard key={drill.id} drill={drill} day={day} index={drillIndex} isLast={drillIndex === dayDrills.length - 1} isPreviewMode={isPreviewMode} athlete={selectedAthlete} onEdit={handleEditExerciseBtn} onDelete={handleDeleteExercise} onCopy={handleCopyExercise} onMoveUp={() => moveDrillUp(day, drillIndex)} onMoveDown={() => moveDrillDown(day, drillIndex)} onDragStart={handleDragStartWrapper} onDragOver={handleDragOver} onDrop={handleDrop} />
                  ))}
                  
                  {!isPreviewMode && (
                    <div className="flex items-center gap-2 mt-2 group cursor-pointer print:hidden" onClick={() => handleAddExerciseBtn(day)}>
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                         <Plus className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-[11px] md:text-[13px] font-medium text-slate-500 group-hover:text-green-600">Add Exercise</span>
                    </div>
                  )}

                  {schedule[day].length > 0 && !isPreviewMode && (
                    <div className="mt-4 p-2 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-2 daily-summary">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold flex-wrap gap-y-1">
                        <div className="flex flex-col items-center text-slate-400"><span className="text-[8px] uppercase">Drills</span><span>{dayStats.totalExercises}</span></div>
                        <div className="w-px h-5 bg-slate-200"></div>
                        <div className="flex flex-col items-center text-blue-500"><span className="text-blue-400 text-[8px] uppercase">Intensity</span><span>{dayStats.avgIntensity}%</span></div>
                        <div className="w-px h-5 bg-slate-200"></div>
                        <div className="flex flex-col items-center text-orange-500"><span className="text-orange-400 text-[8px] uppercase">Load</span><span>{dayStats.totalVolumeScore}</span></div>
                        {dayStats.jumpsVolume > 0 && (
                          <>
                            <div className="w-px h-5 bg-slate-200"></div>
                            <div className="flex flex-col items-center text-amber-500"><span className="text-amber-400 text-[8px] uppercase">Jumps</span><span>{dayStats.jumpsVolume}</span></div>
                          </>
                        )}
                        {dayStats.totalMeters > 0 && (
                          <>
                            <div className="w-px h-5 bg-slate-200"></div>
                            <div className="flex flex-col items-center text-indigo-600"><span className="text-indigo-400 text-[8px] uppercase">Run</span><span>{dayStats.totalMeters}m</span></div>
                          </>
                        )}
                      </div>
                      {dayStats.cnsLoad + dayStats.structuralLoad > 0 && (
                        <div className="w-full h-1 bg-slate-100 rounded-full flex overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${dayCnsPct}%` }} />
                          <div className="h-full bg-blue-500" style={{ width: `${100 - dayCnsPct}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>

          {/* Premium Printed Report Footer */}
          <div className="hidden print:block fixed bottom-0 left-0 right-0 border-t border-slate-300 pt-3 pb-2 bg-white text-center text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
            <div className="flex justify-between items-center px-4">
              <span>Page <span className="print-page-number"></span> | Generated by ForcePeak Lab</span>
              {selectedAthlete && (
                <span>Athlete: {selectedAthlete.name} | CNS: {weeklyStats.cnsPercentage}% | Structural: {weeklyStats.structuralPercentage}%</span>
              )}
              <span>CONFIDENTIAL - TRAINING PERFORMANCE REPORT</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
           <div className="pointer-events-auto h-full absolute right-0" onDragOver={handleDragOver} onDrop={handleLibraryDropzone}>
             <ExerciseLibrary showLibrary={showLibrary} setShowLibrary={setShowLibrary} library={library} handleLibraryDragStart={handleLibraryDragStart} setAddExerciseModal={setAddExerciseModal} setSaveWeekTemplateModal={setSaveWeekTemplateModal} onDeleteDrill={handleDeleteLibraryDrill} onEditDrill={handleEditLibraryDrill} onDeleteTemplate={handleDeleteLibraryTemplate} onEditTemplate={handleEditTemplate} onOpenCreateProgram={() => setCreateProgramModal({...createProgramModal, isOpen: true})} programs={programs} onDeleteProgram={handleDeleteProgramBlock} onApplyProgram={handleApplyProgramBlock} />
           </div>
        </div>

      </div>
    </div>
  );
}