import React, { useState, useEffect, useMemo } from 'react';
import { Check, AlertTriangle, BookmarkPlus, Plus, Sparkles, Trash, Trash2, Percent, UserPlus, X, Calendar, Calendar as CalendarIcon, Loader2, Copy, ClipboardPaste, Undo2, Redo2, Save, Edit2, BarChart3, Activity, Play, ChevronLeft, ChevronRight, ChevronDown, User, Smartphone, Monitor, Moon, Sun, Library, Search, Printer, FileText, Layout } from 'lucide-react';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import TimelineCard from './TimelineCard.jsx';
import ExerciseLibrary from './ExerciseLibrary.jsx';
import AthleteProfileModal from './AthleteProfileModal.jsx';
import PeriodizationPlanner from './PeriodizationPlanner.jsx';
import { supabase } from '../../supabaseClient.js';
import { generateWeeklyPDF } from './pdfGenerator.js';

const EXERCISE_CATEGORIES = { mobility: 'Mobility', core: 'Core', isometric: 'Isometric', power: 'Power', strength: 'Strength', speed: 'Speed', endurance: 'Endurance', physical: 'Physical' };
const PHASE_COLORS = [
  { bg: 'bg-blue-500/15', border: 'border-blue-400', text: 'text-blue-600 dark:text-blue-400', hex: '#3b82f6', label: 'blue' },
  { bg: 'bg-violet-500/15', border: 'border-violet-400', text: 'text-violet-600 dark:text-violet-400', hex: '#8b5cf6', label: 'violet' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10b981', label: 'emerald' },
  { bg: 'bg-amber-500/15', border: 'border-amber-400', text: 'text-amber-600 dark:text-amber-400', hex: '#f59e0b', label: 'amber' },
  { bg: 'bg-rose-500/15', border: 'border-rose-400', text: 'text-rose-600 dark:text-rose-400', hex: '#f43f5e', label: 'rose' },
  { bg: 'bg-cyan-500/15', border: 'border-cyan-400', text: 'text-cyan-600 dark:text-cyan-400', hex: '#06b6d4', label: 'cyan' },
];
const EXERCISE_TYPE_DOTS = {
  power: { color: 'bg-orange-500', label: 'Power' },
  strength: { color: 'bg-blue-500', label: 'Strength' },
  core: { color: 'bg-emerald-500', label: 'Core' },
  speed: { color: 'bg-yellow-500', label: 'Speed' },
  mobility: { color: 'bg-purple-400', label: 'Mobility' },
  isometric: { color: 'bg-cyan-500', label: 'Isometric' },
  endurance: { color: 'bg-pink-500', label: 'Endurance' },
  physical: { color: 'bg-slate-400', label: 'Physical' },
};
const SUBCATEGORIES = {
  core: {
    rotation: 'Rotation',
    anti_rotation: 'Anti-Rotation',
    extension: 'Extension',
    flexion: 'Flexion',
    anti_extension: 'Anti-Extension',
    anti_flexion: 'Anti-Flexion',
    lateral_flexion: 'Lateral Flexion',
    anti_lateral_flexion: 'Anti-Lateral Flexion'
  },
  strength: {
    upper_body: 'Upper Body',
    double_leg: 'Double Leg (Lower)',
    single_leg: 'Single Leg (Lower)'
  }
};
const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getSupersetProps = (drills, index) => {
  const drill = drills[index];
  if (!drill || !drill.superset) {
    return {
      isSuperset: false,
      isSupersetStart: false,
      isSupersetMiddle: false,
      isSupersetEnd: false,
      supersetLabel: '',
      supersetGroup: ''
    };
  }

  const group = drill.superset; // "A", "B", "C", "D"
  const prevDrill = drills[index - 1];
  const isPrevSame = prevDrill && prevDrill.superset === group;
  const nextDrill = drills[index + 1];
  const isNextSame = nextDrill && nextDrill.superset === group;

  let startIndex = index;
  while (startIndex > 0 && drills[startIndex - 1].superset === group) {
    startIndex--;
  }
  
  const position = index - startIndex + 1;
  const label = `${group}${position}`;
  const hasAdjacentSame = isPrevSame || isNextSame;

  return {
    isSuperset: hasAdjacentSame,
    isSupersetStart: hasAdjacentSame && !isPrevSame,
    isSupersetMiddle: hasAdjacentSame && isPrevSame && isNextSame,
    isSupersetEnd: hasAdjacentSame && isPrevSame && !isNextSame,
    supersetLabel: label,
    supersetGroup: group
  };
};

const getBezierPath = (points) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return path;
};

const distributeWeeksToPhases = (numWeeks) => {
  if (numWeeks <= 4) {
    return [
      Math.max(0, numWeeks >= 1 ? 1 : 0),
      Math.max(0, numWeeks >= 2 ? 1 : 0),
      Math.max(0, numWeeks >= 3 ? 1 : 0),
      Math.max(0, numWeeks >= 4 ? 1 : 0)
    ];
  }
  let base = Math.round(numWeeks * 0.40);
  let strength = Math.round(numWeeks * 0.27);
  let power = Math.round(numWeeks * 0.20);
  let peak = numWeeks - (base + strength + power);
  
  if (base <= 0) base = 1;
  if (strength <= 0) strength = 1;
  if (power <= 0) power = 1;
  if (peak <= 0) peak = 1;
  
  let currentSum = base + strength + power + peak;
  while (currentSum !== numWeeks) {
    if (currentSum < numWeeks) {
      base++;
      currentSum++;
    } else {
      if (base > 1) base--;
      else if (strength > 1) strength--;
      else if (power > 1) power--;
      else if (peak > 1) peak--;
      currentSum--;
    }
  }
  return [base, strength, power, peak];
};

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
  const [showPeriodizationPlanner, setShowPeriodizationPlanner] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, targetDay: null });
  const [saveTemplateModal, setSaveTemplateModal] = useState({ isOpen: false, day: null, name: '' });
  const [saveWeekTemplateModal, setSaveWeekTemplateModal] = useState({ isOpen: false, name: '' });
  const [showStatsModal, setShowStatsModal] = useState(false);

  const [draggedItem, setDraggedItem] = useState(null);
  const [createProgramModal, setCreateProgramModal] = useState({ isOpen: false, name: '', tags: '', weeksChain: [''] });
  const [blockConfirmModal, setBlockConfirmModal] = useState({ isOpen: false, program: null });
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [activeBlockPhaseIndex, setActiveBlockPhaseIndex] = useState(0);
  const [activeBlockWeekIndex, setActiveBlockWeekIndex] = useState(0);
  const [blockData, setBlockData] = useState(null);
  const [deployBlockModal, setDeployBlockModal] = useState({ isOpen: false, blockId: null, athleteId: '', startDate: '' });

  const [addExerciseModal, setAddExerciseModal] = useState({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' });
  const [dayDrillModal, setDayDrillModal] = useState({ isOpen: false, day: null, drill: null, isNew: false });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [printMode, setPrintMode] = useState('landscape');
  const [printStudioModal, setPrintStudioModal] = useState({ isOpen: false, orientation: 'landscape', theme: 'crimson' });

  const [bulkSaveModal, setBulkSaveModal] = useState({ isOpen: false, startDate: '', endDate: '', programName: '', tags: '', saveType: 'meso', deficitProtocol: 'FDP', level: 'Beginner' });
  const [createMacroModal, setCreateMacroModal] = useState({ isOpen: false, name: '', tags: '', blocksChain: [{ blockId: '', blockName: '', weeksCount: 0 }] });
  const [macroConfirmModal, setMacroConfirmModal] = useState({ isOpen: false, macro: null, startDate: '' });
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [activeMobileDay, setActiveMobileDay] = useState(() => {
    const todayName = JS_DAYS[new Date().getDay()];
    return DAYS_OF_WEEK.includes(todayName) ? todayName : 'Saturday';
  });
  const [fourWeekData, setFourWeekData] = useState([]);
  const [deployments, setDeployments] = useState([]);

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('agilitylap_offline_queue') || '[]');
    if (queue.length === 0) {
      setSyncStatus('synced');
      return;
    }
    setSyncStatus('syncing');
    let hasError = false;
    for (const item of queue) {
      try {
        const { error } = await supabase.from('agilitylap_workouts').upsert({
          athlete_id: item.athlete_id,
          workout_date: item.workout_date,
          workout_title: item.workout_title,
          drills: item.drills
        }, { onConflict: 'athlete_id,workout_date' });
        if (error) hasError = true;
      } catch (err) {
        hasError = true;
      }
    }
    if (!hasError) {
      localStorage.setItem('agilitylap_offline_queue', '[]');
      setSyncStatus('synced');
      handleToast('Offline changes synced successfully!');
    } else {
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const handleOffline = () => { setIsOnline(false); setSyncStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncOfflineQueue();
    else setSyncStatus('offline');
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleExportPDF = () => {
    setPrintStudioModal({
      isOpen: true,
      orientation: 'landscape',
      theme: 'crimson'
    });
  };

  const handlePrintStudioSubmit = async () => {
    setPrintStudioModal(prev => ({ ...prev, isOpen: false }));
    setIsLoading(true);
    try {
      await generateWeeklyPDF({
        schedule,
        dayTitles,
        weekDatesFull,
        selectedAthlete: athletes.find(a => a.id === selectedAthleteId),
        weeklyStats,
        calculateDayVolume,
        orientation: printStudioModal.orientation,
        theme: printStudioModal.theme
      });
      handleToast('تم تحميل ملف الـ PDF بنجاح! / PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      handleToast('حدث خطأ أثناء تحميل الملف / Error generating PDF');
    } finally {
      setIsLoading(false);
    }
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

        // Sort by forcepeak_athlete_order from localStorage
        const savedOrder = JSON.parse(localStorage.getItem('forcepeak_athlete_order') || '[]');
        const sortedData = [...formattedData].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.id);
          const indexB = savedOrder.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0; // maintain database order
        });

        setAthletes(sortedData); 
        const savedId = localStorage.getItem('lastSelectedAthlete');
        if (savedId && sortedData.some(a => a.id === savedId)) setSelectedAthleteId(savedId); 
        else setSelectedAthleteId(sortedData[0].id);
      }
    }; fetchAthletes();
  }, []);

  const handleMoveAthlete = (athleteId, direction) => {
    const index = athletes.findIndex(a => a.id === athleteId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= athletes.length) return;
    
    const updated = [...athletes];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    setAthletes(updated);
    const newOrderIds = updated.map(a => a.id);
    localStorage.setItem('forcepeak_athlete_order', JSON.stringify(newOrderIds));
  };

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

  const fetchDeployments = async (athleteId) => {
    if (!athleteId) { setDeployments([]); return; }
    const { data, error } = await supabase
      .from('periodization_deployments')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('start_date', { ascending: true });
    if (!error && data) setDeployments(data);
    else setDeployments([]);
  };
  useEffect(() => { fetchDeployments(selectedAthleteId); }, [selectedAthleteId]);


  // Effect to load the selected Block Template details and initialize its phases/weeks
  useEffect(() => {
    const fetchSelectedBlock = async () => {
      if (!selectedBlockId) {
        setIsEditingBlock(false);
        setBlockData(null);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', selectedBlockId)
          .single();
        if (!error && data) {
          let details = data.weeks?.[0] || {};
          if (data.type === 'macro_block') {
            if (!details.phases) {
              details.phases = [
                { name: 'بناء الأساس / Base Building', durationWeeks: 12, weeks: [] },
                { name: 'القوة القصوى / Max Strength', durationWeeks: 8, weeks: [] },
                { name: 'الـ POWER السريع / Rapid Power', durationWeeks: 6, weeks: [] },
                { name: 'التجهيز للقفز (Peak) / Peak & Jump Prep', durationWeeks: 4, weeks: [] }
              ];
              details.phases.forEach(phase => {
                if (!phase.weeks || phase.weeks.length === 0) {
                  phase.weeks = Array.from({ length: phase.durationWeeks }, (_, idx) => ({
                    weekIndex: idx,
                    type: 'None',
                    title: '',
                    drills: (() => {
                      const d = {}; DAYS_OF_WEEK.forEach(day => d[day] = []); return d;
                    })()
                  }));
                }
              });
            }
            setBlockData(details);
            setIsEditingBlock(true);
            setActiveBlockPhaseIndex(0);
            setActiveBlockWeekIndex(0);

            // Directly initialize weekly schedule for the first week
            const phase = details.phases?.[0];
            const week = phase?.weeks?.[0];
            const newSchedule = {};
            const newTitles = {};
            DAYS_OF_WEEK.forEach(day => {
              newSchedule[day] = (week?.drills?.[day] || []).map(d => ({ ...d }));
              newTitles[day] = week?.title || '';
            });
            setSchedule(newSchedule);
            setDayTitles(newTitles);
            setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)) }]);
            setHistoryIndex(0);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSelectedBlock();
  }, [selectedBlockId]);

  // Effect to load template drills when switching weeks or phases inside the template block
  useEffect(() => {
    if (!isEditingBlock || !blockData) return;
    setIsLoading(true);
    const phase = blockData.phases?.[activeBlockPhaseIndex];
    const week = phase?.weeks?.[activeBlockWeekIndex];
    const newSchedule = {};
    const newTitles = {};
    DAYS_OF_WEEK.forEach(day => {
      newSchedule[day] = (week?.drills?.[day] || []).map(d => ({ ...d }));
      newTitles[day] = week?.title || '';
    });
    setSchedule(newSchedule);
    setDayTitles(newTitles);
    setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)) }]);
    setHistoryIndex(0);
    setIsLoading(false);
  }, [activeBlockPhaseIndex, activeBlockWeekIndex]);

  // Standard Athlete Live plan week fetcher (only executes if NOT in template block editing mode)
  useEffect(() => {
    if (isEditingBlock) return;
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
  }, [selectedAthleteId, weekStartDateStr, isEditingBlock]);

  useEffect(() => {
    if (isEditingBlock) return;
    if (!showMonthCalendar) {
      setMonthWorkouts({});
      return;
    }
    const fetchMonthData = async () => {
      if (!selectedAthleteId) return;
      setMonthWorkouts({});
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const { data, error } = await supabase
        .from('agilitylap_workouts')
        .select('workout_date, workout_title, drills')
        .eq('athlete_id', selectedAthleteId)
        .gte('workout_date', getDbDateStr(startOfMonth))
        .lte('workout_date', getDbDateStr(endOfMonth));
      
      const mWorkouts = {};
      if (data && !error) {
        data.forEach(record => { 
          const hasDrills = Array.isArray(record.drills) && record.drills.length > 0;
          const types = hasDrills 
            ? [...new Set(record.drills.map(d => (d.type || 'physical').toLowerCase()))]
            : [];
          mWorkouts[record.workout_date] = { 
            title: record.workout_title, 
            hasDrills: hasDrills,
            types: types
          }; 
        });
      }
      setMonthWorkouts(mWorkouts);
    };
    fetchMonthData();
  }, [selectedAthleteId, currentDate.getMonth(), currentDate.getFullYear(), showMonthCalendar, isEditingBlock]);

  const autoSaveDay = async (day, drillsToSave, titleToSave) => {
    const finalTitle = titleToSave !== undefined ? titleToSave : (dayTitles[day] || '');
    const finalDrills = drillsToSave !== undefined ? drillsToSave : (schedule[day] || []);

    if (isEditingBlock) {
      if (!selectedBlockId || !blockData) return;
      const updatedBlockData = { ...blockData };
      if (!updatedBlockData.phases) return;
      const phase = updatedBlockData.phases[activeBlockPhaseIndex];
      if (!phase || !phase.weeks) return;
      const week = phase.weeks[activeBlockWeekIndex];
      if (!week) return;

      week.drills = {
        ...(week.drills || {}),
        [day]: finalDrills.map(d => ({ ...d }))
      };
      week.title = finalTitle;

      setBlockData(updatedBlockData);

      try {
        setSyncStatus('syncing');
        const payload = { weeks: [updatedBlockData] };
        const { error } = await supabase
          .from('agilitylap_programs')
          .update(payload)
          .eq('id', selectedBlockId);
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err) {
        console.error(err);
        setSyncStatus('offline');
        handleToast('حدث خطأ أثناء حفظ القالب تلقائياً');
      }
      return;
    }

    if (!selectedAthleteId) return;
    const dateStr = getDbDateStr(weekDatesFull[DAYS_OF_WEEK.indexOf(day)]);
    const payload = { 
      athlete_id: selectedAthleteId, 
      workout_date: dateStr, 
      workout_title: finalTitle, 
      drills: finalDrills 
    };

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const queue = JSON.parse(localStorage.getItem('agilitylap_offline_queue') || '[]');
      const filteredQueue = queue.filter(item => !(item.athlete_id === selectedAthleteId && item.workout_date === dateStr));
      filteredQueue.push(payload);
      localStorage.setItem('agilitylap_offline_queue', JSON.stringify(filteredQueue));
      setSyncStatus('offline');
      handleToast('Saved offline locally!');
      return;
    }

    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('agilitylap_workouts').upsert(payload, { onConflict: 'athlete_id,workout_date' });
      if (error) throw error;
      setSyncStatus('synced');
    } catch (err) {
      const queue = JSON.parse(localStorage.getItem('agilitylap_offline_queue') || '[]');
      const filteredQueue = queue.filter(item => !(item.athlete_id === selectedAthleteId && item.workout_date === dateStr));
      filteredQueue.push(payload);
      localStorage.setItem('agilitylap_offline_queue', JSON.stringify(filteredQueue));
      setSyncStatus('offline');
      handleToast('Network failure, saved offline');
    }
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

  useEffect(() => {
    const fetchFourWeekData = async () => {
      if (!selectedAthleteId) return;
      const startActiveWeek = new Date(currentWeekStart);
      const endOf4Weeks = new Date(currentWeekStart);
      endOf4Weeks.setDate(endOf4Weeks.getDate() + 27); // 4 weeks total
      
      const { data, error } = await supabase
        .from('agilitylap_workouts')
        .select('workout_date, drills')
        .eq('athlete_id', selectedAthleteId)
        .gte('workout_date', getDbDateStr(startActiveWeek))
        .lte('workout_date', getDbDateStr(endOf4Weeks));
        
      if (!error && data) {
        const w1Start = new Date(currentWeekStart);
        const w2Start = new Date(currentWeekStart); w2Start.setDate(w2Start.getDate() + 7);
        const w3Start = new Date(currentWeekStart); w3Start.setDate(w3Start.getDate() + 14);
        const w4Start = new Date(currentWeekStart); w4Start.setDate(w4Start.getDate() + 21);
        const w4End = new Date(currentWeekStart); w4End.setDate(w4End.getDate() + 28);
        
        let w1Load = 0, w2Load = 0, w3Load = 0, w4Load = 0;
        
        data.forEach(record => {
          const parts = (record.workout_date || '').split('-');
          const rDate = parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date(record.workout_date);
          const drills = record.drills || [];
          const stats = calculateDayVolume(drills);
          const load = stats.totalVolumeScore;
          
          if (rDate >= w1Start && rDate < w2Start) {
            w1Load += load;
          } else if (rDate >= w2Start && rDate < w3Start) {
            w2Load += load;
          } else if (rDate >= w3Start && rDate < w4Start) {
            w3Load += load;
          } else if (rDate >= w4Start && rDate < w4End) {
            w4Load += load;
          }
        });
        
        const formatDateLabel = (date) => {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        setFourWeekData([
          { label: formatDateLabel(w1Start), load: Math.round(w1Load) },
          { label: formatDateLabel(w2Start), load: Math.round(w2Load) },
          { label: formatDateLabel(w3Start), load: Math.round(w3Load) },
          { label: formatDateLabel(w4Start), load: Math.round(w4Load) }
        ]);
      }
    };
    
    fetchFourWeekData();
  }, [selectedAthleteId, weekStartDateStr]);

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

  const handleApplyProgramBlock = (program) => {
    if (!selectedAthleteId || !program.weeks || program.weeks.length === 0) return;
    setBlockConfirmModal({ isOpen: true, program });
  };

  const executeApplyProgramBlock = async () => {
    const { program } = blockConfirmModal;
    if (!program) return;
    setBlockConfirmModal({ isOpen: false, program: null });
    setIsLoading(true);
    
    for (let i = 0; i < program.weeks.length; i++) {
      const futureWeekStart = new Date(currentWeekStart);
      futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
      const weekTemplateObject = program.weeks[i].drills || {};
      const targetBlockTitle = program.weeks[i].title || 'Block Workout';
      
      for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
        const dayDate = new Date(futureWeekStart);
        dayDate.setDate(dayDate.getDate() + j);
        
        let clonedDrills = [];
        if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
          clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ ...drill, id: `block-${Date.now()}-${i}-${j}-${idx}` }));
        } else if (Array.isArray(weekTemplateObject)) {
          clonedDrills = weekTemplateObject.map((drill, idx) => ({ ...drill, id: `block-${Date.now()}-${i}-${j}-${idx}` }));
        }
        
        await supabase.from('agilitylap_workouts').upsert({ 
          athlete_id: selectedAthleteId, 
          workout_date: getDbDateStr(dayDate), 
          workout_title: targetBlockTitle, 
          drills: clonedDrills 
        }, { onConflict: 'athlete_id,workout_date' });
      }
    }
    
    const { data } = await supabase.from('agilitylap_workouts').select('*').eq('athlete_id', selectedAthleteId).gte('workout_date', weekStartDateStr).lte('workout_date', getDbDateStr(weekDatesFull[6]));
    const newSchedule = {}; const newTitles = {}; DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; });
    if (data) { data.forEach(record => { const dayName = JS_DAYS[new Date(record.workout_date).getDay()]; if (dayName) { newSchedule[dayName] = record.drills || []; newTitles[dayName] = record.workout_title || ''; } }); }
    setSchedule(newSchedule); setDayTitles(newTitles); setIsLoading(false); 

    // Save deployment record for calendar visualization
    const deployStartDate = getDbDateStr(new Date(currentWeekStart));
    const deployEndDate = (() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + (program.weeks.length * 7) - 1); return getDbDateStr(d); })();
    const colorIndex = deployments.length % PHASE_COLORS.length;
    await supabase.from('periodization_deployments').insert([{
      athlete_id: selectedAthleteId,
      program_id: program.id,
      program_name: program.program_name,
      program_type: 'meso',
      start_date: deployStartDate,
      end_date: deployEndDate,
      color: PHASE_COLORS[colorIndex].hex
    }]);
    fetchDeployments(selectedAthleteId);

    handleToast(`Meso-Block "${program.program_name}" deployed successfully!`);
  };

  const handleSaveMacroCycle = async () => {
    if (!createMacroModal.name.trim()) {
      handleToast('Please write a Macro-Cycle name!');
      return;
    }
    const filteredChain = createMacroModal.blocksChain.filter(b => b.blockId);
    if (filteredChain.length === 0) {
      handleToast('Please select at least one Meso-Cycle block!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        program_name: createMacroModal.name,
        weeks: [
          {
            isMacro: true,
            blocksChain: filteredChain,
            tags: createMacroModal.tags
          }
        ]
      };

      const { error } = await supabase.from('agilitylap_programs').insert([payload]);
      if (!error) {
        setCreateMacroModal({ isOpen: false, name: '', tags: '', blocksChain: [{ blockId: '', blockName: '', weeksCount: 0 }] });
        await fetchLibraryData();
        handleToast(`Macro-Cycle "${payload.program_name}" saved!`);
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('Error saving Macro-Cycle.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeApplyMacroCycle = async () => {
    const { macro, startDate } = macroConfirmModal;
    if (!macro || !startDate) return;
    setMacroConfirmModal({ isOpen: false, macro: null, startDate: '' });
    setIsLoading(true);

    try {
      const startBaseDate = new Date(startDate);
      let currentWeekOffset = 0;
      const blocksChain = macro.weeks?.[0]?.blocksChain || [];

      for (let blockIndex = 0; blockIndex < blocksChain.length; blockIndex++) {
        const blockItem = blocksChain[blockIndex];
        const { data: progDetails, error: fetchErr } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', blockItem.blockId)
          .single();

        if (fetchErr || !progDetails) {
          console.error('Error fetching block details:', fetchErr);
          continue;
        }

        const program = progDetails;
        const totalWeeksInBlock = program.weeks?.length || 0;

        for (let i = 0; i < totalWeeksInBlock; i++) {
          const futureWeekStart = new Date(startBaseDate);
          futureWeekStart.setDate(futureWeekStart.getDate() + ((currentWeekOffset + i) * 7));
          const weekTemplateObject = program.weeks[i].drills || {};
          const targetBlockTitle = program.weeks[i].title || 'Block Workout';

          for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
            const dayDate = new Date(futureWeekStart);
            dayDate.setDate(dayDate.getDate() + j);

            let clonedDrills = [];
            if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
              clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                ...drill, 
                id: `macro-${Date.now()}-${blockIndex}-${i}-${j}-${idx}-${Math.random()}` 
              }));
            } else if (Array.isArray(weekTemplateObject)) {
              clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                ...drill, 
                id: `macro-${Date.now()}-${blockIndex}-${i}-${j}-${idx}-${Math.random()}` 
              }));
            }

            await supabase.from('agilitylap_workouts').upsert({ 
              athlete_id: selectedAthleteId, 
              workout_date: getDbDateStr(dayDate), 
              workout_title: targetBlockTitle, 
              drills: clonedDrills 
            }, { onConflict: 'athlete_id,workout_date' });
          }
        }

        currentWeekOffset += totalWeeksInBlock;
      }

      const { data: refreshedWorkouts } = await supabase
        .from('agilitylap_workouts')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('workout_date', weekStartDateStr)
        .lte('workout_date', getDbDateStr(weekDatesFull[6]));
      
      const newSchedule = {}; 
      const newTitles = {}; 
      DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; });
      
      if (refreshedWorkouts) { 
        refreshedWorkouts.forEach(record => { 
          const dayName = JS_DAYS[new Date(record.workout_date).getDay()]; 
          if (dayName) { 
            newSchedule[dayName] = record.drills || []; 
            newTitles[dayName] = record.workout_title || ''; 
          } 
        }); 
      }
      
      setSchedule(newSchedule); 
      setDayTitles(newTitles); 
      setIsLoading(false); 

      // Save deployment records for each Meso block within the Macro
      let weekOffset = 0;
      for (let bi = 0; bi < blocksChain.length; bi++) {
        const blockItem = blocksChain[bi];
        const blockWeeks = blockItem.weeksCount || 4;
        const blockStart = new Date(startBaseDate);
        blockStart.setDate(blockStart.getDate() + (weekOffset * 7));
        const blockEnd = new Date(blockStart);
        blockEnd.setDate(blockEnd.getDate() + (blockWeeks * 7) - 1);
        const colorIndex = bi % PHASE_COLORS.length;
        await supabase.from('periodization_deployments').insert([{
          athlete_id: selectedAthleteId,
          program_id: macro.id,
          program_name: blockItem.blockName || macro.program_name,
          program_type: 'macro',
          start_date: getDbDateStr(blockStart),
          end_date: getDbDateStr(blockEnd),
          color: PHASE_COLORS[colorIndex].hex
        }]);
        weekOffset += blockWeeks;
      }
      fetchDeployments(selectedAthleteId);

      handleToast(`Macro-Cycle "${macro.program_name}" deployed across ${currentWeekOffset} weeks!`);

    } catch (err) {
      setIsLoading(false);
      console.error(err);
      handleToast('Error deploying Macro-Cycle.');
    }
  };

  const handleDeleteProgramBlock = async (id) => { const { error } = await supabase.from('agilitylap_programs').delete().eq('id', id); if (!error) { setPrograms(prev => prev.filter(p => p.id !== id)); handleToast('Program cleared'); } };
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

  const handleAddExerciseBtn = (day) => { setDayDrillModal({ isOpen: true, day: day, drill: { id: `w-${Date.now()}`, type: 'strength', subcategory: '', title: '', details: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', superset: '' }, isNew: true }); };
  const handleEditExerciseBtn = (day, drill) => { setDayDrillModal({ isOpen: true, day: day, drill: { ...drill, subcategory: drill.subcategory || '', bwRatio: drill.bwRatio || '', unit: drill.unit || 'reps', distance: drill.distance || '', superset: drill.superset || '' }, isNew: false }); };

  const getCalculatedIntensityInModal = (modalDrill) => {
    if (!selectedAthlete || !modalDrill || !modalDrill.bwRatio) return null;
    const bwVal = parseFloat(modalDrill.bwRatio);
    if (isNaN(bwVal) || bwVal <= 0 || !selectedAthlete.weight) return null;
    
    const title = (modalDrill.title || '').toLowerCase();
    let maxWeight = null;
    if (title.includes('clean')) maxWeight = selectedAthlete.clean;
    else if (title.includes('bench')) maxWeight = selectedAthlete.bench;
    else if (title.includes('deadlift')) maxWeight = selectedAthlete.deadlift;
    else if (title.includes('half squat')) maxWeight = selectedAthlete.halfSquat;
    else if (title.includes('quarter squat')) maxWeight = selectedAthlete.quarterSquat;
    else if (title.includes('squat')) maxWeight = selectedAthlete.fullSquat;

    if (maxWeight > 0) {
      const calculatedWeight = bwVal * selectedAthlete.weight;
      return Math.round((calculatedWeight / maxWeight) * 100);
    }
    return null;
  };

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
  const handleSaveWeekTemplate = async () => {
    if (!saveWeekTemplateModal.name.trim()) return;

    const weekDrills = {};
    DAYS_OF_WEEK.forEach(day => {
      weekDrills[day] = (schedule[day] || []).map(drill => ({ ...drill }));
    });

    const hasExercises = Object.values(weekDrills).some(drills => drills.length > 0);
    if (!hasExercises) {
      handleToast('Cannot save an empty week!');
      return;
    }

    const newTemplate = {
      template_name: saveWeekTemplateModal.name,
      template_type: 'week',
      drills: weekDrills
    };

    const { data, error } = await supabase.from('agilitylap_templates').insert([newTemplate]).select();
    if (!error && data) {
      const formatted = {
        id: data[0].id,
        title: data[0].template_name,
        type: data[0].template_type,
        drills: data[0].drills
      };
      setLibrary(prev => ({ ...prev, templates: [formatted, ...prev.templates] }));
      setSaveWeekTemplateModal({ isOpen: false, name: '' });
      handleToast('Saved Week Template');
    } else {
      handleToast('Error saving week template');
    }
  };

  const handleApplyWeekTemplate = async (template) => {
    if (!selectedAthleteId) return;
    setIsLoading(true);
    const newSchedule = {};
    const newTitles = {};

    DAYS_OF_WEEK.forEach(day => {
      let dayDrills = [];
      if (template.drills && !Array.isArray(template.drills)) {
        // Structured week mapping: { Saturday: [...], Sunday: [...] }
        dayDrills = (template.drills[day] || []).map((drill, idx) => ({ 
          ...drill, 
          id: `tpl-${Date.now()}-${day}-${idx}` 
        }));
      } else if (Array.isArray(template.drills)) {
        // Legacy flat array fallback: put all drills on Saturday, or distribute if they contain metadata (fallback)
        dayDrills = template.drills.map((drill, idx) => ({ 
          ...drill, 
          id: `tpl-${Date.now()}-${day}-${idx}` 
        }));
      }
      newSchedule[day] = dayDrills;
      newTitles[day] = template.title || '';
    });

    setSchedule(newSchedule);
    setDayTitles(newTitles);
    pushToHistory(newSchedule, newTitles);

    // Save each day to database
    for (let day of DAYS_OF_WEEK) {
      await autoSaveDay(day, newSchedule[day], newTitles[day]);
    }

    setIsLoading(false);
    handleToast(`Week routine "${template.title}" applied!`);
  };

  const handleSaveRangeAsBlock = async () => {
    if (!selectedAthleteId) return;

    // Destructure modal properties correctly to prevent ReferenceError.
    const { programName = '', startDate = '', endDate = '', tags = '', saveType = 'meso', deficitProtocol = 'FDP', level = 'Beginner' } = bulkSaveModal;

    if (!programName.trim()) { 
      handleToast(saveType === 'macro_block' ? 'Please enter Macrocycle name!' : 'Please enter Meso-Block name!'); 
      return; 
    }
    if (!startDate || !endDate) { handleToast('Please select start and end dates!'); return; }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) { handleToast('End date must be after start date!'); return; }

    setIsLoading(true);
    setBulkSaveModal({ isOpen: false, startDate: '', endDate: '', programName: '', tags: '', saveType: 'meso', deficitProtocol: 'FDP', level: 'Beginner' });

    try {
      // Query workouts for selected athlete in range
      const { data: workouts, error } = await supabase
        .from('agilitylap_workouts')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('workout_date', getDbDateStr(start))
        .lte('workout_date', getDbDateStr(end));

      if (error) throw error;

      if (!workouts || workouts.length === 0) {
        setIsLoading(false);
        handleToast('No workouts found in this range!');
        return;
      }

      // Group into weeks starting from startDate
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const numWeeks = Math.ceil(diffDays / 7);

      const compiledWeeks = [];

      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() + (i * 7));

        const weekDrills = {};
        DAYS_OF_WEEK.forEach(day => {
          weekDrills[day] = [];
        });

        for (let j = 0; j < 7; j++) {
          const dayDate = new Date(weekStart);
          dayDate.setDate(dayDate.getDate() + j);

          if (dayDate > end) continue; // Out of range

          const dateStr = getDbDateStr(dayDate);
          const dayName = JS_DAYS[dayDate.getDay()]; // Sunday, Monday, etc.

          if (DAYS_OF_WEEK.includes(dayName)) {
            const record = workouts.find(w => w.workout_date === dateStr);
            if (record && record.drills && record.drills.length > 0) {
              weekDrills[dayName] = record.drills.map(d => ({ ...d }));
            }
          }
        }

        // Include week to preserve structure
        compiledWeeks.push({
          title: `${programName} - Week ${i + 1}`,
          drills: weekDrills,
          blockTags: tags || ''
        });
      }

      // Route dynamically based on saveType:
      if (saveType === 'macro_block') {
        const [baseWeeks, strengthWeeks, powerWeeks, peakWeeks] = distributeWeeksToPhases(numWeeks);

        const baseSlice = compiledWeeks.slice(0, baseWeeks);
        const strengthSlice = compiledWeeks.slice(baseWeeks, baseWeeks + strengthWeeks);
        const powerSlice = compiledWeeks.slice(baseWeeks + strengthWeeks, baseWeeks + strengthWeeks + powerWeeks);
        const peakSlice = compiledWeeks.slice(baseWeeks + strengthWeeks + powerWeeks);

        const phases = [
          {
            name: 'بناء الأساس / Base Building',
            durationWeeks: baseWeeks,
            weeks: baseSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'القوة القصوى / Max Strength',
            durationWeeks: strengthWeeks,
            weeks: strengthSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'الـ POWER السريع / Rapid Power',
            durationWeeks: powerWeeks,
            weeks: powerSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'التجهيز للقفز (Peak) / Peak & Jump Prep',
            durationWeeks: peakWeeks,
            weeks: peakSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          }
        ];

        const payload = {
          program_name: programName,
          type: 'macro_block',
          weeks: [
            {
              isMacroBlock: true,
              deficitProtocol: deficitProtocol,
              level: level,
              phases: phases
            }
          ]
        };

        const { error: insertError } = await supabase.from('agilitylap_programs').insert([payload]);
        if (insertError) throw insertError;

        await fetchLibraryData(); // Cleanly sync programs list in UI
        setIsLoading(false);
        handleToast(`Macrocycle "${programName}" (${numWeeks} weeks) saved successfully!`);

      } else {
        // Meso-Block / standard saving logic
        if (numWeeks < 3) {
          // Micro-Cycles (1 or 2 weeks): Save each week separately as a week template inside agilitylap_templates
          const templatesToInsert = compiledWeeks.map((w, idx) => ({
            template_name: numWeeks === 1 ? programName : `${programName} - W${idx + 1}`,
            template_type: 'week',
            drills: w.drills
          }));

          const { error: insertError } = await supabase
            .from('agilitylap_templates')
            .insert(templatesToInsert);

          if (insertError) throw insertError;

          await fetchLibraryData(); // Cleanly sync library templates list in UI
          setIsLoading(false);
          handleToast(`Saved ${templatesToInsert.length} week(s) as Micro-Cycle Template(s)!`);

        } else {
          // Meso-Cycles (3+ weeks): Save as a standard Meso-Block program in agilitylap_programs
          const payload = {
            program_name: programName,
            type: 'meso',
            weeks: compiledWeeks
          };

          const { error: insertError } = await supabase.from('agilitylap_programs').insert([payload]);
          if (insertError) throw insertError;

          await fetchLibraryData(); // Cleanly sync programs list in UI
          setIsLoading(false);
          handleToast(`Meso-Cycle "${programName}" (${numWeeks} weeks) saved successfully!`);
        }
      }

    } catch (err) {
      setIsLoading(false);
      console.error(err);
      handleToast('Error saving range as block.');
    }
  };

  const handleOpenDeployBlockModal = () => {
    if (!selectedBlockId) return;
    setDeployBlockModal({
      isOpen: true,
      blockId: selectedBlockId,
      athleteId: selectedAthleteId || '',
      startDate: ''
    });
  };

  const executeDeployBlock = async () => {
    const { blockId, athleteId, startDate } = deployBlockModal;
    if (!blockId || !athleteId || !startDate) {
      handleToast('الرجاء اختيار اللاعب وتاريخ البداية!');
      return;
    }

    setIsLoading(true);
    setDeployBlockModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' });

    try {
      const { data: program, error: prgErr } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('id', blockId)
        .single();
      
      if (prgErr || !program) throw new Error('Could not fetch block template details');

      const details = program.weeks?.[0] || {};
      const phases = details.phases || [];
      if (phases.length === 0) {
        throw new Error('القالب لا يحتوي على أي فترات أو أسابيع!');
      }

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

      handleToast(`تم تطبيق القالب "${program.program_name}" بنجاح على اللاعب لمدة ${totalWeeksDeployed} أسبوعاً!`);
      
      if (selectedAthleteId === athleteId) {
        setCurrentDate(new Date(start));
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تطبيق القالب الدوري.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDayTemplate = async (template, targetDay) => {
    if (!selectedAthleteId) return;
    setIsLoading(true);

    const dayDrills = (template.drills || []).map((drill, idx) => ({
      ...drill,
      id: `tpl-day-${Date.now()}-${targetDay}-${idx}-${Math.random()}`
    }));

    const newSchedule = {
      ...schedule,
      [targetDay]: dayDrills
    };

    const newTitles = {
      ...dayTitles,
      [targetDay]: template.title || ''
    };

    setSchedule(newSchedule);
    setDayTitles(newTitles);
    pushToHistory(newSchedule, newTitles);

    await autoSaveDay(targetDay, dayDrills, template.title || '');

    setIsLoading(false);
    handleToast(`Day template applied to ${targetDay}!`);
  };

  const handleAddAthlete = async () => { if(newAthleteData.name.trim()) { const newAthlete = { name: newAthleteData.name, birth_year: newAthleteData.birthYear ? parseInt(newAthleteData.birthYear) : null, weight: newAthleteData.weight ? parseFloat(newAthleteData.weight) : null }; const { data } = await supabase.from('agilitylap_athletes').insert([newAthlete]).select(); if (data && data.length > 0) { const addedAthlete = { ...data[0], birthYear: data[0].birth_year, bodyFat: data[0].body_fat, verticalJump: data[0].vertical_jump, halfSquat: data[0].half_squat, quarterSquat: data[0].quarter_squat }; const updatedAthletes = [addedAthlete, ...athletes]; setAthletes(updatedAthletes); const newOrderIds = updatedAthletes.map(a => a.id); localStorage.setItem('forcepeak_athlete_order', JSON.stringify(newOrderIds)); setSelectedAthleteId(addedAthlete.id); setNewAthleteData({ name: '', birthYear: '', weight: '' }); setShowAddAthleteModal(false); } } };
  const handleSaveProfile = async (updatedProfile) => { const { error } = await supabase.from('agilitylap_athletes').update({ name: updatedProfile.name, birth_year: updatedProfile.birthYear ? parseInt(updatedProfile.birthYear) : null, weight: updatedProfile.weight ? parseFloat(updatedProfile.weight) : null, height: updatedProfile.height ? parseFloat(updatedProfile.height) : null, body_fat: updatedProfile.bodyFat ? parseFloat(updatedProfile.bodyFat) : null, vertical_jump: updatedProfile.verticalJump ? parseFloat(updatedProfile.verticalJump) : null, standing_long_jump: updatedProfile.standingLongJump ? parseFloat(updatedProfile.standingLongJump) : null, squat_jump: updatedProfile.squatJump ? parseFloat(updatedProfile.squatJump) : null, clean: updatedProfile.clean ? parseFloat(updatedProfile.clean) : null, half_squat: updatedProfile.halfSquat ? parseFloat(updatedProfile.halfSquat) : null, quarter_squat: updatedProfile.quarterSquat ? parseFloat(updatedProfile.quarterSquat) : null, full_squat: updatedProfile.fullSquat ? parseFloat(updatedProfile.fullSquat) : null, bench: updatedProfile.bench ? parseFloat(updatedProfile.bench) : null, deadlift: updatedProfile.deadlift ? parseFloat(updatedProfile.deadlift) : null, }).eq('id', updatedProfile.id); if (!error) { setAthletes(prev => prev.map(a => a.id === updatedProfile.id ? updatedProfile : a)); setShowProfileModal(false); handleToast('Profile updated'); } };

  const handleDeleteAthlete = async (athleteId) => {
    if (!athleteId) return;
    const { error } = await supabase.from('agilitylap_athletes').delete().eq('id', athleteId);
    if (!error) {
      const remainingAthletes = athletes.filter(a => a.id !== athleteId);
      setAthletes(remainingAthletes);
      if (remainingAthletes.length > 0) {
        setSelectedAthleteId(remainingAthletes[0].id);
        localStorage.setItem('lastSelectedAthlete', remainingAthletes[0].id);
      } else {
        setSelectedAthleteId(null);
        localStorage.removeItem('lastSelectedAthlete');
      }
      setShowProfileModal(false);
      handleToast('Athlete profile deleted successfully!');
    } else {
      handleToast('Error deleting athlete profile.');
    }
  };
  const handleDeleteLibraryDrill = async (id) => { const { error } = await supabase.from('library_drills').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, drills: prev.drills.filter(d => d.id !== id) })); } };
  const handleEditLibraryDrill = (drill) => { setAddExerciseModal({ isOpen: true, id: drill.id, title: drill.title || '', details: drill.details || '', type: drill.type || 'strength', subcategory: drill.subcategory || '', percentage: drill.percentage || '', bwRatio: drill.bwRatio || '', sets: drill.sets || '', reps: drill.reps || '', rest: drill.rest || '', unit: drill.unit || 'reps', distance: drill.distance || '' }); };
  const handleDeleteLibraryTemplate = async (id) => { const { error } = await supabase.from('agilitylap_templates').delete().eq('id', id); if (!error) { setLibrary(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) })); } };
  const handleEditTemplate = (tpl) => { handleToast('Drag to timeline to alter.'); };
  
  const handleSaveLibraryExercise = async () => { 
    if(!addExerciseModal.title.trim()) return; 
    const drillData = { 
      title: addExerciseModal.title, 
      details: addExerciseModal.details, 
      type: addExerciseModal.type, 
      subcategory: addExerciseModal.subcategory || null,
      percentage: addExerciseModal.percentage ? parseFloat(addExerciseModal.percentage) : null, 
      bwRatio: addExerciseModal.bwRatio ? parseFloat(addExerciseModal.bwRatio) : null,
      sets: addExerciseModal.sets, 
      reps: addExerciseModal.reps, 
      rest: addExerciseModal.rest, 
      unit: addExerciseModal.unit,
      distance: addExerciseModal.distance ? parseFloat(addExerciseModal.distance) : null
    }; 
    if (addExerciseModal.id) {
      const { data, error } = await supabase.from('library_drills').update(drillData).eq('id', addExerciseModal.id).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: prev.drills.map(d => d.id === addExerciseModal.id ? data[0] : d) })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' }); handleToast('Exercise updated'); }
    } else {
      const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' }); handleToast('Exercise added'); }
    }
  };

  const renderLargeCalendarDays = () => {
    const days = [];
    const startDayObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDay = startDayObj.getDay(); // Align with standard Sunday-first layout
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-28"></div>);
    }
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const todayStr = getDbDateStr(new Date());
    const selectedStr = getDbDateStr(currentDate);

    // Helper: find which deployment a date belongs to
    const getDeploymentForDate = (dateStr) => {
      return deployments.find(d => dateStr >= d.start_date && dateStr <= d.end_date);
    };

    // Helper: get week number within a deployment
    const getWeekInDeployment = (dateStr, deployment) => {
      if (!deployment) return null;
      const start = new Date(deployment.start_date + 'T00:00:00');
      const current = new Date(dateStr + 'T00:00:00');
      const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;
      const totalWeeks = Math.ceil((new Date(deployment.end_date + 'T00:00:00') - start) / (1000 * 60 * 60 * 24) / 7);
      return { week: weekNum, total: totalWeeks };
    };

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dateStr = getDbDateStr(dateObj);
      const dayData = monthWorkouts[dateStr];
      const hasWorkoutSaved = dayData && dayData.hasDrills;
      const isActive = hasWorkoutSaved;
      const isToday = todayStr === dateStr;
      const isSelected = selectedStr === dateStr;
      const deployment = getDeploymentForDate(dateStr);
      const weekInfo = getWeekInDeployment(dateStr, deployment);
      const exerciseTypes = (dayData && dayData.types) || [];
      
      // Determine phase color styling
      const phaseColor = deployment ? PHASE_COLORS.find(pc => pc.hex === deployment.color) || PHASE_COLORS[0] : null;
      
      days.push(
        <button 
          key={i} 
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(i);
            setCurrentDate(newDate);
            const dayOfWeekName = JS_DAYS[newDate.getDay()];
            if (DAYS_OF_WEEK.includes(dayOfWeekName)) {
              setActiveMobileDay(dayOfWeekName);
            }
            setShowMonthCalendar(false);
          }} 
          className={`relative flex flex-col items-center justify-center transition-all active:scale-95 group
            h-12 sm:h-28 w-full rounded-2xl sm:p-2.5 sm:flex sm:flex-col sm:items-start sm:justify-start sm:border
            ${isSelected 
              ? 'bg-orange-500 text-white sm:bg-orange-500/10 sm:text-slate-800 sm:dark:text-white sm:border-orange-500 sm:border-2' 
              : deployment && !isActive
                ? `${phaseColor.bg} sm:${phaseColor.border} sm:border`
                : isActive 
                  ? deployment 
                    ? `${phaseColor.bg} sm:${phaseColor.border} sm:border-2`
                    : 'bg-emerald-500/10 dark:bg-emerald-500/5 text-[#00c58d] sm:bg-emerald-500/[0.02] sm:border-[#00c58d] sm:border-2'
                  : 'bg-transparent text-slate-800 dark:text-slate-200 sm:border-slate-100 sm:dark:border-slate-800 sm:bg-white sm:dark:bg-slate-900/50 sm:hover:bg-slate-50'
            }
          `}
        >
          {/* Phase left accent bar for desktop */}
          {deployment && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full hidden sm:block" style={{ backgroundColor: deployment.color }}></span>
          )}

          {/* Week badge within deployment (top right, desktop only) */}
          {weekInfo && !isSelected && (
            <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-wider hidden sm:block opacity-60" style={{ color: deployment.color }}>
              W{weekInfo.week}/{weekInfo.total}
            </span>
          )}

          {/* Top right green active dot (visible on desktop, only when no deployment) */}
          {isActive && !isSelected && !deployment && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c58d] absolute top-2 right-2 hidden sm:block"></span>
          )}

          {/* Number Circle Badge */}
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all
            ${isSelected
              ? 'bg-white text-orange-500 sm:bg-orange-500 sm:text-white'
              : isToday
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-350 dark:border-orange-800'
                : isActive
                  ? deployment
                    ? 'bg-white/80 dark:bg-slate-800/80'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-350 sm:group-hover:bg-slate-100'
            }
          `} style={isActive && deployment && !isSelected ? { color: deployment.color } : {}}>
            {i}
          </span>
          
          {/* Exercise type dots (desktop only, replaces single green dot) */}
          {isActive && exerciseTypes.length > 0 && !isSelected && (
            <div className="hidden sm:flex items-center gap-0.5 mt-1 flex-wrap">
              {exerciseTypes.slice(0, 4).map((type, ti) => {
                const dotInfo = EXERCISE_TYPE_DOTS[type] || EXERCISE_TYPE_DOTS.physical;
                return <span key={ti} className={`w-1.5 h-1.5 rounded-full ${dotInfo.color}`} title={dotInfo.label}></span>;
              })}
              {exerciseTypes.length > 4 && (
                <span className="text-[7px] font-bold text-slate-400">+{exerciseTypes.length - 4}</span>
              )}
            </div>
          )}

          {/* Bottom active dot indicator on mobile */}
          {isActive && !isSelected && (
            <span className="w-1.5 h-1.5 rounded-full mt-1 sm:hidden" style={{ backgroundColor: deployment ? deployment.color : '#00c58d' }}></span>
          )}

          {/* Bottom Plan Status Text Label (hidden on mobile) */}
          <span className={`text-[8px] font-black uppercase tracking-wider sm:text-left text-center w-full mt-auto truncate leading-none hidden sm:block 
            ${isSelected 
              ? 'text-orange-600 dark:text-orange-400' 
              : deployment
                ? '' 
                : isActive 
                  ? 'text-[#00c58d]' 
                  : 'text-slate-400 dark:text-slate-650'
            }
          `} style={deployment && !isSelected ? { color: deployment.color } : {}}>
            {isSelected ? 'Selected' : deployment ? deployment.program_name.substring(0, 12) : isActive ? 'Active Plan' : 'Rest/Off'}
          </span>
        </button>
      );
    }
    return days;
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F4F5F7] text-slate-800'} print:bg-white print:text-black pb-16 md:pb-0 ${printMode === 'landscape' ? 'print-mode-landscape' : 'print-mode-portrait'}`}>
      
      {toastMessage && ( <div className="fixed bottom-20 md:bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[200] animate-[bounce_0.3s_ease-out] print:hidden"><Check className="w-5 h-5 text-green-400" /><span className="font-medium text-sm">{toastMessage}</span></div> )}
      {showProfileModal && selectedAthlete && ( <AthleteProfileModal athlete={selectedAthlete} onClose={() => setShowProfileModal(false)} onSave={handleSaveProfile} onDelete={handleDeleteAthlete} /> )}
      {showPeriodizationPlanner && (
        <PeriodizationPlanner
          athlete={selectedAthlete}
          onClose={() => setShowPeriodizationPlanner(false)}
          handleToast={handleToast}
          programs={programs}
          refreshDeploymentsCallback={async () => {
            await fetchDeployments(selectedAthleteId);
            await fetchLibraryData();
          }}
          selectedBlockId={selectedBlockId}
          setSelectedBlockId={setSelectedBlockId}
          isEditingBlock={isEditingBlock}
          setIsEditingBlock={setIsEditingBlock}
          activeBlockPhaseIndex={activeBlockPhaseIndex}
          setActiveBlockPhaseIndex={setActiveBlockPhaseIndex}
          activeBlockWeekIndex={activeBlockWeekIndex}
          setActiveBlockWeekIndex={setActiveBlockWeekIndex}
          blockData={blockData}
          setBlockData={setBlockData}
          athletes={athletes}
        />
      )}

      {showMonthCalendar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden" onClick={() => setShowMonthCalendar(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            {/* Header: Title & Subtitle */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                  <CalendarIcon className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Peak Force</h3>
                  <p className="text-[10px] sm:text-xs font-black uppercase text-slate-450 mt-0.5 tracking-wider">
                    PEAK FORCE LAB
                  </p>
                </div>
              </div>
              <button onClick={() => setShowMonthCalendar(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date navigation bar & Go to Today button */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-3.5 rounded-2xl mb-6">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800/80 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white px-3 sm:px-4 uppercase tracking-wider select-none">
                  {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => { setCurrentDate(new Date()); }} 
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/25 transition-all font-black text-xs uppercase tracking-wider"
              >
                Go to Today
              </button>
            </div>

            {/* Periodization Roadmap Bar */}
            {deployments.length > 0 && (
              <div className="mb-5 p-4 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Periodization Roadmap</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {deployments.map((dep, di) => {
                    const startD = new Date(dep.start_date + 'T00:00:00');
                    const endD = new Date(dep.end_date + 'T00:00:00');
                    const weeks = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24) / 7);
                    const isCurrentMonth = startD.getMonth() === currentDate.getMonth() && startD.getFullYear() === currentDate.getFullYear()
                      || endD.getMonth() === currentDate.getMonth() && endD.getFullYear() === currentDate.getFullYear();
                    return (
                      <div 
                        key={dep.id || di} 
                        className={`flex-1 min-w-[80px] p-2.5 rounded-xl border-2 transition-all cursor-default ${isCurrentMonth ? 'opacity-100 shadow-sm' : 'opacity-50'}`}
                        style={{ 
                          borderColor: dep.color, 
                          backgroundColor: dep.color + '15'
                        }}
                      >
                        <div className="text-[10px] font-black truncate" style={{ color: dep.color }}>
                          {dep.program_name}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                          {weeks}W · {startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-wider mt-1 opacity-60" style={{ color: dep.color }}>
                          {dep.program_type}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid weekdays headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-4 text-center mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <span className="sm:hidden">{d[0]}</span>
                  <span className="hidden sm:inline">{d}</span>
                </div>
              ))}
            </div>

            {/* Calendar days grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-4">{renderLargeCalendarDays()}</div>
          </div>
        </div>
      )}
      
      {deleteConfirmation.isOpen && ( <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden"> <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"> <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div> <h3 className="text-lg font-bold mb-2">Are you sure?</h3> <p className="text-slate-500 text-sm mb-6">{deleteConfirmation.type === 'week' ? "Erase all structural days?" : "Wipe out this day's records?"}</p> <div className="flex gap-3"> <button onClick={() => setDeleteConfirmation({isOpen: false})} className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl font-medium text-sm">Cancel</button> <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 font-medium text-sm">Delete</button> </div> </div> </div> )}
      
      {saveTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> Save Day Template</h3> <input type="text" value={saveTemplateModal.name} onChange={(e) => setSaveTemplateModal({...saveTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 mb-6 outline-none focus:ring-2 focus:ring-orange-500" autoFocus /> <div className="flex justify-end gap-2"> <button onClick={() => setSaveTemplateModal({isOpen: false, day: null, name: ''})} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold">Cancel</button> <button onClick={handleSaveTemplate} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Save</button> </div> </div> </div> )}
      {saveWeekTemplateModal.isOpen && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-orange-500" /> Save Week Block</h3> <input type="text" value={saveWeekTemplateModal.name} onChange={(e) => setSaveWeekTemplateModal({...saveWeekTemplateModal, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 mb-6 outline-none focus:ring-2 focus:ring-orange-500" autoFocus /> <div className="flex justify-end gap-2"> <button onClick={() => setSaveWeekTemplateModal({isOpen: false, name: ''})} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold">Cancel</button> <button onClick={handleSaveWeekTemplate} className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Save</button> </div> </div> </div> )}

      {bulkSaveModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 text-right">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-500" />
              {bulkSaveModal.saveType === 'macro_block' ? 'حفظ كدورة كبرى / Save as Macrocycle' : 'حفظ ككتلة متوسطة / Save as Meso-Block'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">الاسم / Name</label>
                <input 
                  type="text" 
                  value={bulkSaveModal.programName || ''} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, programName: e.target.value})} 
                  placeholder={bulkSaveModal.saveType === 'macro_block' ? "e.g. 30-Week Deficit Season" : "e.g. 4-Week Hypertrophy Block"} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold" 
                  autoFocus 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">نوع الحفظ / Save As</label>
                <select 
                  value={bulkSaveModal.saveType || 'meso'} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, saveType: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold"
                >
                  <option value="meso">كتلة متوسطة / Meso-Block</option>
                  <option value="macro_block">دورة كبرى / Macrocycle</option>
                </select>
              </div>

              {bulkSaveModal.saveType === 'macro_block' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">بروتوكول العجز / Deficit Protocol</label>
                    <select 
                      value={bulkSaveModal.deficitProtocol || 'FDP'} 
                      onChange={(e) => setBulkSaveModal({...bulkSaveModal, deficitProtocol: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold"
                    >
                      <option value="FDP">FDP - عجز القوة (Force Deficit)</option>
                      <option value="EDP">EDP - عجز الدورة المطاطية (Elastic/SSC)</option>
                      <option value="RSD">RSD - عجز الصلابة الارتدادية (Reactive/Stiffness)</option>
                      <option value="HVRP">HVRP - عجز السرعة ومعدل القوة (High-Velocity RFD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">المستوى الرياضي / Level</label>
                    <select 
                      value={bulkSaveModal.level || 'Beginner'} 
                      onChange={(e) => setBulkSaveModal({...bulkSaveModal, level: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold"
                    >
                      <option value="Beginner">مبتدئ / Beginner</option>
                      <option value="Intermediate">متوسط / Intermediate</option>
                      <option value="Advanced">متقدم / Advanced</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">تاريخ البداية / Start Date</label>
                <input 
                  type="date" 
                  value={bulkSaveModal.startDate} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, startDate: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">تاريخ النهاية / End Date</label>
                <input 
                  type="date" 
                  value={bulkSaveModal.endDate} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, endDate: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">الوسوم (اختياري) / Tags</label>
                <input 
                  type="text" 
                  value={bulkSaveModal.tags || ''} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, tags: e.target.value})} 
                  placeholder="e.g. Strength, Power" 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 text-right font-bold" 
                />
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <button onClick={handleSaveRangeAsBlock} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">حفظ القالب / Save</button>
              <button onClick={() => setBulkSaveModal({ isOpen: false, startDate: '', endDate: '', programName: '', tags: '', saveType: 'meso', deficitProtocol: 'FDP', level: 'Beginner' })} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl font-bold text-sm">إلغاء / Cancel</button>
            </div>
          </div>
        </div>
      )}

      {printStudioModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700/50 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">PDF استوديو الطباعة والـ</h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1 block">Printing & PDF Lab</span>
                </div>
              </div>
              <button 
                onClick={() => setPrintStudioModal(prev => ({ ...prev, isOpen: false }))} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-right">
              {/* 1. Layout Orientation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. LAYOUT ORIENTATION / اتجاه الصفحة</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Landscape Card */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 ${
                      printStudioModal.orientation === 'landscape'
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:bg-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <Layout className={`w-6 h-6 ${printStudioModal.orientation === 'landscape' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      {printStudioModal.orientation === 'landscape' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${printStudioModal.orientation === 'landscape' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>Landscape (1 Page)</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">بالعرض - ورقة واحدة كامل الأسبوع</p>
                    </div>
                  </button>

                  {/* Portrait Card */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, orientation: 'portrait' }))}
                    className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 ${
                      printStudioModal.orientation === 'portrait'
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:bg-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <FileText className={`w-6 h-6 ${printStudioModal.orientation === 'portrait' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      {printStudioModal.orientation === 'portrait' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${printStudioModal.orientation === 'portrait' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>Portrait (Vertical)</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">بالطول - قائمة عمودية</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Visual Print Theme */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">2. VISUAL PRINT THEME / المظهر الفني للطباعة</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Crimson Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'crimson' }))}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'crimson'
                        ? 'border-rose-500 dark:border-rose-400 bg-rose-50/30 dark:bg-rose-950/10 ring-2 ring-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-rose-600 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'crimson' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>Classic Crimson</h5>
                        <p className="text-[9px] text-slate-400 font-medium">الأحمر الكلاسيكي للمدرب</p>
                      </div>
                    </div>
                    {printStudioModal.theme === 'crimson' && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                    )}
                  </button>

                  {/* Navy Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'navy' }))}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'navy'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/10 ring-2 ring-blue-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-blue-600 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'navy' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>Professional Navy</h5>
                        <p className="text-[9px] text-slate-400 font-medium">الكحلي الاحترافي</p>
                      </div>
                    </div>
                    {printStudioModal.theme === 'navy' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                    )}
                  </button>

                  {/* Green Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'green' }))}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'green'
                        ? 'border-green-600 dark:border-green-500 bg-green-50/30 dark:bg-green-950/10 ring-2 ring-green-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-green-700 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'green' ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>Athletic Green</h5>
                        <p className="text-[9px] text-slate-400 font-medium">الأخضر الرياضي الحركي</p>
                      </div>
                    </div>
                    {printStudioModal.theme === 'green' && (
                      <span className="w-2 h-2 rounded-full bg-green-700 dark:bg-green-400"></span>
                    )}
                  </button>

                  {/* Minimal Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'minimal' }))}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'minimal'
                        ? 'border-slate-600 dark:border-slate-500 bg-slate-50/30 dark:bg-slate-700/20 ring-2 ring-slate-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-400 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'minimal' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Minimal Ink Saver</h5>
                        <p className="text-[9px] text-slate-400 font-medium">موفر الحبر (أبيض وأسود)</p>
                      </div>
                    </div>
                    {printStudioModal.theme === 'minimal' && (
                      <span className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400"></span>
                    )}
                  </button>

                  {/* Dark Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'dark' }))}
                    className={`col-span-2 p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'dark'
                        ? 'border-orange-500 bg-slate-900 ring-2 ring-orange-500/10 text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                      </span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'dark' ? 'text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>Elite Dark (Digital PDF)</h5>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">الداكن الرياضي الاحترافي (مثالي للملفات الرقمية)</p>
                      </div>
                    </div>
                    {printStudioModal.theme === 'dark' && (
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
              <button 
                onClick={() => setPrintStudioModal(prev => ({ ...prev, isOpen: false }))} 
                className="px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all flex-1 text-center"
              >
                إلغاء / Cancel
              </button>
              <button 
                onClick={handlePrintStudioSubmit} 
                className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center gap-2 flex-1"
              >
                <Printer className="w-4 h-4" />
                طباعة البرنامج / Print Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {createProgramModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Create Multi-Week Program Block</h3>
            <div className="space-y-4">
              <input type="text" value={createProgramModal.name} onChange={(e) => setCreateProgramModal({...createProgramModal, name: e.target.value})} placeholder="Program Block Name" className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              <input type="text" value={createProgramModal.tags || ''} onChange={(e) => setCreateProgramModal({...createProgramModal, tags: e.target.value})} placeholder="Custom Tags (#ReturnToPlay)" className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {library.templates.filter(t => t.type === 'week').length === 0 ? (
                  <div className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30 leading-relaxed">
                    ⚠️ No week templates saved yet!
                    <span className="block mt-1 font-normal text-slate-500 dark:text-slate-400">Please save a week using the "Save Week" button in the main header first to create training blocks.</span>
                  </div>
                ) : (
                  createProgramModal.weeksChain.map((selectedTplId, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-16">Week {idx + 1}:</span>
                      <select value={selectedTplId} onChange={(e) => { const updated = [...createProgramModal.weeksChain]; updated[idx] = e.target.value; setCreateProgramModal({...createProgramModal, weeksChain: updated}); }} className="flex-1 text-sm bg-slate-50 border p-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">-- Choose Week --</option>
                        {library.templates.filter(t => t.type === 'week').map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setCreateProgramModal({...createProgramModal, weeksChain: [...createProgramModal.weeksChain, '']})} className="text-xs font-bold text-orange-500">+ Add Week</button>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCreateProgramModal({ isOpen: false, name: '', tags: '', weeksChain: [''] })} className="px-4 py-2 text-sm font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveProgramBlock} className="px-5 py-2 text-sm font-bold bg-orange-500 text-white rounded-xl shadow-md">Save Block</button>
            </div>
          </div>
        </div>
      )}      {blockConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Confirm Meso-Block Application</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Apply Meso-Block <span className="font-bold text-slate-800 dark:text-white">"{blockConfirmModal.program?.program_name}"</span> containing <span className="font-bold text-slate-800 dark:text-white">{blockConfirmModal.program?.weeks?.length || 0} weeks</span> to the selected athlete.
              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">⚠️ Warning: This will overwrite any currently planned workouts in those weeks. This action cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBlockConfirmModal({ isOpen: false, program: null })} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-xl font-bold text-sm transition-all">
                Cancel
              </button>
              <button onClick={executeApplyProgramBlock} className="flex-1 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all">
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Seasonal Macro-Cycle Modal */}
      {createMacroModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Create Seasonal Macro-Cycle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Macro-Cycle Name</label>
                <input 
                  type="text" 
                  value={createMacroModal.name} 
                  onChange={(e) => setCreateMacroModal({...createMacroModal, name: e.target.value})} 
                  placeholder="e.g. Annual Championship Prep" 
                  className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tags (Optional)</label>
                <input 
                  type="text" 
                  value={createMacroModal.tags || ''} 
                  onChange={(e) => setCreateMacroModal({...createMacroModal, tags: e.target.value})} 
                  placeholder="e.g. Power, OlympicPrep" 
                  className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Sequence of Meso-Cycles</label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {programs.filter(p => !p.weeks?.[0]?.isMacro).length === 0 ? (
                    <div className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30 leading-relaxed">
                      ⚠️ No Meso-Cycles (Blocks) saved yet!
                      <span className="block mt-1 font-normal text-slate-500 dark:text-slate-400">Please create and save a Meso-Cycle first to chain them into a Macro-Cycle plan.</span>
                    </div>
                  ) : (
                    createMacroModal.blocksChain.map((chainItem, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-16">Phase {idx + 1}:</span>
                        <select 
                          value={chainItem.blockId} 
                          onChange={(e) => {
                            const updated = [...createMacroModal.blocksChain];
                            const selectedBlock = programs.find(p => p.id === parseInt(e.target.value) || p.id === e.target.value);
                            updated[idx] = { 
                              blockId: e.target.value, 
                              blockName: selectedBlock?.program_name || '', 
                              weeksCount: selectedBlock?.weeks?.length || 0 
                            };
                            setCreateMacroModal({...createMacroModal, blocksChain: updated});
                          }} 
                          className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border p-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:border-slate-700"
                        >
                          <option value="">-- Choose Meso-Cycle --</option>
                          {programs.filter(p => !p.weeks?.[0]?.isMacro).map(p => (
                            <option key={p.id} value={p.id}>{p.program_name} ({p.weeks?.length || 0} Weeks)</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            const updated = createMacroModal.blocksChain.filter((_, i) => i !== idx);
                            setCreateMacroModal({...createMacroModal, blocksChain: updated.length > 0 ? updated : [{ blockId: '', blockName: '', weeksCount: 0 }]});
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 shrink-0"
                          title="Remove Phase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {programs.filter(p => !p.weeks?.[0]?.isMacro).length > 0 && (
                  <button 
                    onClick={() => setCreateMacroModal({...createMacroModal, blocksChain: [...createMacroModal.blocksChain, { blockId: '', blockName: '', weeksCount: 0 }]})} 
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-650 mt-1"
                  >
                    + Add Training Phase
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setCreateMacroModal({ isOpen: false, name: '', tags: '', blocksChain: [{ blockId: '', blockName: '', weeksCount: 0 }] })} 
                className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-750 dark:text-slate-350 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMacroCycle} 
                className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
              >
                Save Macro-Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Macro-Cycle Deployment Modal */}
      {macroConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Confirm Macro-Cycle Application</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              You are about to deploy Macro-Cycle <span className="font-bold text-slate-800 dark:text-white">"{macroConfirmModal.macro?.program_name}"</span> containing <span className="font-bold text-slate-800 dark:text-white">{macroConfirmModal.macro?.weeks?.[0]?.blocksChain?.length || 0} Meso-cycles</span> ({macroConfirmModal.macro?.weeks?.[0]?.blocksChain?.reduce((acc, c) => acc + (c.weeksCount || 0), 0) || 0} total weeks) to the selected athlete.
              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">⚠️ Warning: This will sequentially overwrite workouts in the calendar. This action cannot be undone.</span>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Select Start Date</label>
                <input 
                  type="date" 
                  value={macroConfirmModal.startDate} 
                  onChange={(e) => setMacroConfirmModal({...macroConfirmModal, startDate: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMacroConfirmModal({ isOpen: false, macro: null, startDate: '' })} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-xl font-bold text-sm transition-all">
                Cancel
              </button>
              <button onClick={executeApplyMacroCycle} className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
                Confirm & Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {addExerciseModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-orange-500" /> {addExerciseModal.id ? 'Edit Exercise' : 'Create Exercise'}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                  <select value={addExerciseModal.type} onChange={(e) => setAddExerciseModal({...addExerciseModal, type: e.target.value, subcategory: ''})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                </div>
                {SUBCATEGORIES[addExerciseModal.type] && (
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Subcategory</label>
                    <select value={addExerciseModal.subcategory || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, subcategory: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">None / General</option>
                      {Object.entries(SUBCATEGORIES[addExerciseModal.type]).map(([subKey, subLabel]) => (
                        <option key={subKey} value={subKey}>{subLabel}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Superset Link</label>
                  <select value={addExerciseModal.superset || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, superset: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">None</option>
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="C">Group C</option>
                    <option value="D">Group D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">Intensity (% 1RM)</label>
                    {getCalculatedIntensityInModal(addExerciseModal) && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded-md">
                        Auto: {getCalculatedIntensityInModal(addExerciseModal)}%
                      </span>
                    )}
                  </div>
                  <div className="relative w-full">
                    <input type="number" value={addExerciseModal.percentage || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, percentage: e.target.value})} className="w-full text-sm py-2 pl-7 pr-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="0" />
                    <Percent className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">BW Ratio</label>
                    {selectedAthlete && selectedAthlete.weight && addExerciseModal.bwRatio && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded-md">
                        {Math.round(parseFloat(addExerciseModal.bwRatio) * selectedAthlete.weight)} kg
                      </span>
                    )}
                  </div>
                  <input type="number" step="0.1" value={addExerciseModal.bwRatio || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, bwRatio: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 1.0" />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sets</label>
                  <input type="text" value={addExerciseModal.sets} onChange={(e) => setAddExerciseModal({...addExerciseModal, sets: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">{addExerciseModal.unit === 'meters' ? 'Distance (m)' : 'Volume'}</label>
                  <input type="text" value={addExerciseModal.unit === 'meters' ? (addExerciseModal.distance || '') : addExerciseModal.reps} onChange={(e) => setAddExerciseModal({...addExerciseModal, [addExerciseModal.unit === 'meters' ? 'distance' : 'reps']: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                  <select value={addExerciseModal.unit || 'reps'} onChange={(e) => setAddExerciseModal({...addExerciseModal, unit: e.target.value})} className="w-full text-sm px-2 py-2 border rounded-xl outline-none">
                    <option value="reps">Reps</option>
                    <option value="sec">Sec</option>
                    <option value="min">Min</option>
                    <option value="jumps">Jumps</option>
                    <option value="meters">Meters</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Rest</label>
                  <input type="text" value={addExerciseModal.rest} onChange={(e) => setAddExerciseModal({...addExerciseModal, rest: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Exercise Name</label>
                <input type="text" value={addExerciseModal.title} onChange={(e) => setAddExerciseModal({...addExerciseModal, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                <textarea value={addExerciseModal.details} onChange={(e) => setAddExerciseModal({...addExerciseModal, details: e.target.value})} className="w-full px-4 py-2 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddExerciseModal({isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: ''})} className="px-5 py-2 bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleSaveLibraryExercise} className="px-8 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

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
                  <select value={dayDrillModal.drill.type} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, type: e.target.value, subcategory: ''}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                </div>
                {SUBCATEGORIES[dayDrillModal.drill.type] && (
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Subcategory</label>
                    <select value={dayDrillModal.drill.subcategory || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, subcategory: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">None / General</option>
                      {Object.entries(SUBCATEGORIES[dayDrillModal.drill.type]).map(([subKey, subLabel]) => (
                        <option key={subKey} value={subKey}>{subLabel}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Superset Link</label>
                  <select value={dayDrillModal.drill.superset || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, superset: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="C">Group C</option>
                    <option value="D">Group D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">Intensity (% 1RM)</label>
                    {getCalculatedIntensityInModal(dayDrillModal.drill) && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded-md">
                        Auto: {getCalculatedIntensityInModal(dayDrillModal.drill)}%
                      </span>
                    )}
                  </div>
                  <div className="relative w-full">
                    <input type="number" value={dayDrillModal.drill.percentage || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, percentage: e.target.value}})} className="w-full text-sm py-2 pl-7 pr-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    <Percent className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">BW Ratio</label>
                    {selectedAthlete && selectedAthlete.weight && dayDrillModal.drill.bwRatio && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded-md">
                        {Math.round(parseFloat(dayDrillModal.drill.bwRatio) * selectedAthlete.weight)} kg
                      </span>
                    )}
                  </div>
                  <input type="number" step="0.1" value={dayDrillModal.drill.bwRatio || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, bwRatio: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 1.0" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">Sets</label><input type="text" value={dayDrillModal.drill.sets || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, sets: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">{dayDrillModal.drill.unit === 'meters' ? 'Distance (m)' : 'Volume'}</label><input type="text" value={dayDrillModal.drill.unit === 'meters' ? (dayDrillModal.drill.distance || '') : (dayDrillModal.drill.reps || '')} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, [dayDrillModal.drill.unit === 'meters' ? 'distance' : 'reps']: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
                <div className="w-24"><label className="block text-xs font-bold text-slate-500 mb-1">Unit</label><select value={dayDrillModal.drill.unit || 'reps'} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, unit: e.target.value}})} className="w-full text-sm px-2 py-2 border rounded-xl outline-none"><option value="reps">Reps</option><option value="sec">Sec</option><option value="min">Min</option><option value="jumps">Jumps</option><option value="meters">Meters</option></select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">Rest</label><input type="text" value={dayDrillModal.drill.rest || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, rest: e.target.value}})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
              </div>

              {/* VBT parameters (Velocity Based Training) */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">Target Velocity (m/s)</label>
                  <input type="text" placeholder="e.g. 0.75" value={dayDrillModal.drill.targetVelocity || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, targetVelocity: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">Velocity Loss Limit (%)</label>
                  <input type="text" placeholder="e.g. 20%" value={dayDrillModal.drill.velocityLoss || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, velocityLoss: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-orange-500" /> Workload Analytics</h3>
              <button onClick={() => setShowStatsModal(false)} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 dark:text-white"/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${weeklyStats.loadColor}`}>
                  <p className="text-xs font-bold uppercase opacity-70 mb-1">Total Weekly Load</p>
                  <p className="text-3xl font-black">{weeklyStats.load} <span className="text-sm font-medium opacity-80">AU</span></p>
                  <p className="text-sm font-bold mt-1 opacity-90">{weeklyStats.loadLabel}</p>
                </div>
                <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400">
                  <p className="text-xs font-bold uppercase opacity-70 mb-1">Average Intensity</p>
                  <p className="text-3xl font-black">{weeklyStats.intensity}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700/50 rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Jumps</p>
                  <p className="text-xl font-black text-orange-500">{weeklyStats.totalJumps}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700/50 rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">CNS Split</p>
                  <p className="text-xl font-black text-yellow-500">{weeklyStats.cnsPercentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700/50 rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Structural</p>
                  <p className="text-xl font-black text-blue-500">{weeklyStats.structuralPercentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700/50 rounded-xl text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Run</p>
                  <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{weeklyStats.totalMeters}m</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
                  <span>CNS / Power Fatigue</span>
                  <span>Structural Muscle Strain</span>
                </div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-900 rounded-full flex overflow-hidden shadow-inner">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${weeklyStats.cnsPercentage}%` }} />
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${weeklyStats.structuralPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{weeklyStats.cnsPercentage}% CNS (Orange)</span>
                  <span>{weeklyStats.structuralPercentage}% Struct (Blue)</span>
                </div>
              </div>

              {/* 📊 Premium 4-Week Workload Trend Bezier Area Curve Chart */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-700/50 rounded-3xl">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">4-Week Workload Trend</h4>
                {fourWeekData && fourWeekData.length > 0 ? (
                  <div className="w-full overflow-hidden">
                    {(() => {
                      const chartData = (fourWeekData || []).map((d, idx) => {
                        if (idx === 0) return { ...d, load: weeklyStats.load };
                        return d;
                      });
                      const points = chartData.map((data, idx) => {
                        const x = 50 + idx * 130;
                        const maxVal = Math.max(...chartData.map(d => d.load), 1000);
                        const y = 95 - (data.load / maxVal) * 65;
                        return { x, y, label: data.label, load: data.load };
                      });
                      const bezierPath = getBezierPath(points);
                      return (
                        <svg viewBox="0 0 500 130" className="w-full overflow-visible">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid lines */}
                          <line x1="40" y1="30" x2="460" y2="30" className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4 4" />
                          <line x1="40" y1="65" x2="460" y2="65" className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4 4" />
                          <line x1="40" y1="100" x2="460" y2="100" className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4 4" />

                          {/* Area under curve */}
                          <path
                            d={`${bezierPath} L ${points[points.length - 1].x} 110 L ${points[0].x} 110 Z`}
                            fill="url(#chartGradient)"
                          />

                          {/* Curve path */}
                          <path
                            d={bezierPath}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />

                          {/* Node Dots & Labels */}
                          {points.map((pt, idx) => (
                            <g key={idx} className="group/node cursor-pointer">
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="5"
                                className="fill-white stroke-orange-500 stroke-[3px] transition-all group-hover/node:r-7"
                              />
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="10"
                                className="fill-transparent hover:fill-orange-500/10"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 12}
                                textAnchor="middle"
                                className="text-[10px] font-black fill-slate-700 dark:fill-slate-200 font-sans"
                              >
                                {pt.load}
                              </text>
                              <text
                                x={pt.x}
                                y="125"
                                textAnchor="middle"
                                className={`text-[9px] font-black uppercase tracking-wider ${idx === 0 ? 'fill-orange-500' : 'fill-slate-400 dark:fill-slate-500'}`}
                              >
                                {pt.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-slate-400 font-bold text-sm">
                    No workload trend data available.
                  </div>
                )}
              </div>

              {/* Daily Load breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Daily Load Breakdown</h4>
                <div className="flex items-end justify-between gap-2 h-36 border-b dark:border-slate-700 pb-2">
                    {weeklyStats.dailyData.map((data, i) => {
                      const maxLoad = Math.max(...weeklyStats.dailyData.map(d => d.load), 1000); 
                      const heightPercent = data.load > 0 ? (data.load / maxLoad) * 100 : 0;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end">
                          <div className="text-[9px] font-bold text-slate-400 mb-1">{data.load}</div>
                          <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-900 rounded-t-md relative flex items-end justify-center h-full">
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
        </div>
      )}

      {showAddAthleteModal && ( <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"> <div className="bg-white rounded-3xl w-full max-w-md p-6"> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-500" /> Add Athlete</h3> <div className="space-y-3 mb-6"> <div><label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label><input type="text" value={newAthleteData.name} onChange={(e) => setNewAthleteData({...newAthleteData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" autoFocus /></div><div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Birth Year</label><input type="number" value={newAthleteData.birthYear} onChange={(e) => setNewAthleteData({...newAthleteData, birthYear: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div><div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label><input type="number" value={newAthleteData.weight} onChange={(e) => setNewAthleteData({...newAthleteData, weight: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div></div> </div> <div className="flex justify-end gap-3"><button onClick={() => setShowAddAthleteModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-medium">Cancel</button><button onClick={handleAddAthlete} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium">Add</button></div> </div> </div> )}

      {deployBlockModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500 animate-pulse" /> تطبيق ونشر قالب الكتلة الدوري على لاعب
            </h3>
            <div className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اختر اللاعب المستهدف:</label>
                <select
                  value={deployBlockModal.athleteId}
                  onChange={(e) => setDeployBlockModal({ ...deployBlockModal, athleteId: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                >
                  <option value="">-- اختر لاعب --</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاريخ بداية التطبيق (السبت):</label>
                <input
                  type="date"
                  value={deployBlockModal.startDate}
                  onChange={(e) => setDeployBlockModal({ ...deployBlockModal, startDate: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ⚠️ ملحوظة: سيتم نسخ كامل أسابيع الفترات التدريبية الأربعة تلقائياً بدءاً من هذا التاريخ بشكل متعاقب.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={executeDeployBlock}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                تأكيد النشر والتطبيق
              </button>
              <button
                onClick={() => setDeployBlockModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <Header 
        currentDate={currentDate} setCurrentDate={setCurrentDate} currentWeekStart={currentWeekStart} setShowMonthCalendar={setShowMonthCalendar}
        selectedAthlete={selectedAthlete} setSelectedAthleteId={setSelectedAthleteId} athletes={athletes} isAthleteDropdownOpen={isAthleteDropdownOpen} setIsAthleteDropdownOpen={setIsAthleteDropdownOpen}
        setShowAddAthleteModal={setShowAddAthleteModal} setShowProfileModal={setShowProfileModal} isMobileView={isMobileView} setIsMobileView={setIsMobileView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
        showLibrary={showLibrary} setShowLibrary={setShowLibrary} handleToast={handleToast} setSaveWeekTemplateModal={setSaveWeekTemplateModal} weeklyStats={weeklyStats}
        isOnline={isOnline} syncStatus={syncStatus} onDelete={handleDeleteAthlete}
        onMoveAthlete={handleMoveAthlete}
        setShowPeriodizationPlanner={setShowPeriodizationPlanner}
        selectedBlockId={selectedBlockId}
        setSelectedBlockId={setSelectedBlockId}
        blockTemplates={programs.filter(p => p.type === 'macro_block')}
        isEditingBlock={isEditingBlock}
        activeBlockPhaseIndex={activeBlockPhaseIndex}
        activeBlockWeekIndex={activeBlockWeekIndex}
        blockData={blockData}
        setActiveBlockWeekIndex={setActiveBlockWeekIndex}
        setActiveBlockPhaseIndex={setActiveBlockPhaseIndex}
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
          onExportPDF={handleExportPDF}
          onBulkSave={() => setBulkSaveModal({ isOpen: true, startDate: '', endDate: '', programName: '', tags: '', saveType: 'meso', deficitProtocol: 'FDP', level: 'Beginner' })}
          isEditingBlock={isEditingBlock}
          onDeployBlock={handleOpenDeployBlockModal}
        />        <div className={`flex-1 overflow-x-auto overflow-y-auto pb-24 md:pb-0 relative scroll-smooth w-full transition-all duration-300 ${showLibrary ? 'md:mr-80' : ''}`}>
          
          {/* Premium Printed Report Header */}
          <div className="hidden print:flex flex-col border-b-2 border-slate-900 pb-4 mb-6 pt-4 px-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">TRAINING PERFORMANCE REPORT</h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Peak Force Lab Performance Athlete Passport | Meso-Block Blueprint</p>
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

          {/* Desktop/Print Grid Layout */}
          <div className={`${isMobileView ? 'hidden' : 'hidden md:grid print:grid'} p-2 md:p-4 gap-2 md:gap-4 print-grid-container grid-cols-7 w-[1100px] xl:w-full min-w-full`}>
            {DAYS_OF_WEEK.map((day, index) => {
              const fullDateStr = isEditingBlock ? "يوم تدريبي / Template Day" : weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const dayDrills = schedule[day] || [];
              const dayStats = calculateDayVolume(dayDrills);
              const dayCnsPct = (dayStats.cnsLoad + dayStats.structuralLoad) > 0 ? Math.round((dayStats.cnsLoad / (dayStats.cnsLoad + dayStats.structuralLoad)) * 100) : 0;

              return (
              <div key={day} className="flex flex-col w-full print:break-inside-avoid print:mb-0">
                
                <div className="mb-4 flex flex-col group border-b border-slate-200 dark:border-slate-800 pb-3 px-1 md:px-2 day-header select-none">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[9.5px] md:text-[10.5px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">{day}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400/80 dark:text-slate-600">{fullDateStr}</span>
                  </div>
                  <div className="flex items-start gap-1 md:gap-2 justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-6.5 h-6.5 md:w-7 md:h-7 shrink-0 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                        {isEditingBlock ? `D${index + 1}` : weekDates[index]}
                      </div>
                      <input type="text" value={dayTitles[day] || ''} onChange={(e) => handleDayTitleChange(day, e.target.value)} placeholder="Add Workout Focus" className="text-[11px] md:text-[13px] font-black text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none w-full placeholder:text-slate-400" readOnly={isPreviewMode}/>
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
                  {dayDrills.map((drill, drillIndex) => {
                    const sProps = getSupersetProps(dayDrills, drillIndex);
                    return (
                      <TimelineCard 
                        key={drill.id} 
                        drill={drill} 
                        day={day} 
                        index={drillIndex} 
                        isLast={drillIndex === dayDrills.length - 1} 
                        isPreviewMode={isPreviewMode} 
                        athlete={selectedAthlete} 
                        onEdit={handleEditExerciseBtn} 
                        onDelete={handleDeleteExercise} 
                        onCopy={handleCopyExercise} 
                        onMoveUp={() => moveDrillUp(day, drillIndex)} 
                        onMoveDown={() => moveDrillDown(day, drillIndex)} 
                        onDragStart={handleDragStartWrapper} 
                        onDragOver={handleDragOver} 
                        onDrop={handleDrop}
                        isSuperset={sProps.isSuperset}
                        isSupersetStart={sProps.isSupersetStart}
                        isSupersetMiddle={sProps.isSupersetMiddle}
                        isSupersetEnd={sProps.isSupersetEnd}
                        supersetLabel={sProps.supersetLabel}
                        supersetGroup={sProps.supersetGroup}
                      />
                    );
                  })}
                  
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

          {/* Premium Mobile-Native Smart Tabs Interface */}
          <div className={`${isMobileView ? 'block' : 'block md:hidden'} print:hidden p-4 space-y-4`}>
            {/* Day Selector Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x snap-mandatory">
              {DAYS_OF_WEEK.map((day, index) => {
                const isActive = activeMobileDay === day;
                const dateStr = isEditingBlock ? `D${index + 1}` : weekDates[index];
                const hasExercises = (schedule[day] || []).length > 0;
                
                return (
                  <button
                    key={day}
                    onClick={() => setActiveMobileDay(day)}
                    className={`snap-start shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50'}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                      {day.substring(0, 3)}
                    </span>
                    <span className="text-xl font-black mt-1">
                      {dateStr}
                    </span>
                    {hasExercises && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isActive ? 'bg-white' : 'bg-orange-500'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Day Timeline Content */}
            {(() => {
              const day = activeMobileDay;
              const index = DAYS_OF_WEEK.indexOf(day);
              const fullDateStr = isEditingBlock ? "يوم تدريبي / Template Day" : weekDatesFull[index]?.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) || '';
              const dayDrills = schedule[day] || [];
              const dayStats = calculateDayVolume(dayDrills);
              const dayCnsPct = (dayStats.cnsLoad + dayStats.structuralLoad) > 0 ? Math.round((dayStats.cnsLoad / (dayStats.cnsLoad + dayStats.structuralLoad)) * 100) : 0;

              return (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-md space-y-5 animate-fadeIn">
                  
                  {/* Header of Active Day */}
                  <div className="flex flex-col pb-3 border-b border-slate-100 dark:border-slate-700/80">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-black uppercase text-orange-500 tracking-widest">{day}</span>
                      <span className="text-xs text-slate-400">{fullDateStr}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base font-black text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-900 shadow-inner">
                          {isEditingBlock ? `D${index + 1}` : weekDates[index]}
                        </div>
                        <input 
                          type="text" 
                          value={dayTitles[day] || ''} 
                          onChange={(e) => handleDayTitleChange(day, e.target.value)} 
                          placeholder="Add Focus" 
                          className="text-base font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none w-full placeholder:text-slate-400" 
                          readOnly={isPreviewMode}
                        />
                      </div>
                      {!isPreviewMode && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopyDay(day)} className="p-2 text-slate-400 hover:text-blue-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Copy Day"><Copy className="w-4 h-4" /></button>
                          {clipboard && (
                            <button onClick={() => handlePasteIntoDay(day)} className="p-2 text-slate-400 hover:text-green-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Paste Day"><ClipboardPaste className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => setSaveTemplateModal({isOpen: true, day, name: dayTitles[day] || ''})} className="p-2 text-slate-400 hover:text-orange-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Save as Template"><BookmarkPlus className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirmation({isOpen: true, type: 'day', targetDay: day})} className="p-2 text-slate-350 hover:text-red-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Clear Day"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drills List */}
                  <div className="space-y-3 min-h-[150px]">
                    {dayDrills.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                        <Activity className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="text-sm font-medium">No workouts scheduled today</p>
                        <p className="text-xs mt-1 text-slate-400/80">Add exercises to get started</p>
                      </div>
                    ) : (
                      dayDrills.map((drill, drillIndex) => {
                        const sProps = getSupersetProps(dayDrills, drillIndex);
                        return (
                          <TimelineCard 
                            key={drill.id} 
                            drill={drill} 
                            day={day} 
                            index={drillIndex} 
                            isLast={drillIndex === dayDrills.length - 1} 
                            isPreviewMode={isPreviewMode} 
                            athlete={selectedAthlete} 
                            onEdit={handleEditExerciseBtn} 
                            onDelete={handleDeleteExercise} 
                            onCopy={handleCopyExercise} 
                            onMoveUp={() => moveDrillUp(day, drillIndex)} 
                            onMoveDown={() => moveDrillDown(day, drillIndex)} 
                            onDragStart={handleDragStartWrapper} 
                            onDragOver={handleDragOver} 
                            onDrop={handleDrop}
                            isSuperset={sProps.isSuperset}
                            isSupersetStart={sProps.isSupersetStart}
                            isSupersetMiddle={sProps.isSupersetMiddle}
                            isSupersetEnd={sProps.isSupersetEnd}
                            supersetLabel={sProps.supersetLabel}
                            supersetGroup={sProps.supersetGroup}
                          />
                        );
                      })
                    )}

                    {!isPreviewMode && (
                      <button 
                        onClick={() => handleAddExerciseBtn(day)}
                        className="flex items-center justify-center gap-2.5 w-full py-4 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl transition-all duration-300 font-bold text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Exercise</span>
                      </button>
                    )}
                  </div>

                  {/* Active Day Stats Summary Card */}
                  {dayDrills.length > 0 && !isPreviewMode && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-2xl space-y-3">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Day Load Summary</h5>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/30 flex flex-col items-center">
                          <span className="text-[9px] uppercase font-black text-slate-400">Drills</span>
                          <span className="text-base font-black text-slate-800 dark:text-white mt-0.5">{dayStats.totalExercises}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/30 flex flex-col items-center">
                          <span className="text-[9px] uppercase font-black text-blue-400">Intensity</span>
                          <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{dayStats.avgIntensity}%</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/30 flex flex-col items-center">
                          <span className="text-[9px] uppercase font-black text-orange-400">Load</span>
                          <span className="text-base font-black text-orange-600 dark:text-orange-500 mt-0.5">{dayStats.totalVolumeScore}</span>
                        </div>
                        {dayStats.jumpsVolume > 0 && (
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/30 flex flex-col items-center">
                            <span className="text-[9px] uppercase font-black text-amber-400">Jumps</span>
                            <span className="text-base font-black text-amber-600 dark:text-amber-500 mt-0.5">{dayStats.jumpsVolume}</span>
                          </div>
                        )}
                        {dayStats.totalMeters > 0 && (
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/30 flex flex-col items-center">
                            <span className="text-[9px] uppercase font-black text-indigo-400">Run</span>
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{dayStats.totalMeters}m</span>
                          </div>
                        )}
                      </div>

                      {dayStats.cnsLoad + dayStats.structuralLoad > 0 && (
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${dayCnsPct}%` }} />
                            <div className="h-full bg-blue-500" style={{ width: `${100 - dayCnsPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            <span>{dayCnsPct}% CNS (Neurological)</span>
                            <span>{100 - dayCnsPct}% Structural (Muscular)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Premium Printed Report Footer */}
          <div className="hidden print:block fixed bottom-0 left-0 right-0 border-t border-slate-300 pt-3 pb-2 bg-white text-center text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
            <div className="flex justify-between items-center px-4">
              <span>Page <span className="print-page-number"></span> | Generated by Peak Force Lab</span>
              {selectedAthlete && (
                <span>Athlete: {selectedAthlete.name} | CNS: {weeklyStats.cnsPercentage}% | Structural: {weeklyStats.structuralPercentage}%</span>
              )}
              <span>CONFIDENTIAL - TRAINING PERFORMANCE REPORT</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
           <div className="pointer-events-auto h-full absolute right-0" onDragOver={handleDragOver} onDrop={handleLibraryDropzone}>
             <ExerciseLibrary 
               showLibrary={showLibrary} 
               setShowLibrary={setShowLibrary} 
               library={library} 
               handleLibraryDragStart={handleLibraryDragStart} 
               setAddExerciseModal={setAddExerciseModal} 
               setSaveWeekTemplateModal={setSaveWeekTemplateModal} 
               onDeleteDrill={handleDeleteLibraryDrill} 
               onEditDrill={handleEditLibraryDrill} 
               onDeleteTemplate={handleDeleteLibraryTemplate} 
               onEditTemplate={handleEditTemplate} 
               onOpenCreateProgram={() => setCreateProgramModal({...createProgramModal, isOpen: true})} 
               programs={programs} 
               onDeleteProgram={handleDeleteProgramBlock} 
               onApplyProgram={handleApplyProgramBlock} 
               onApplyWeekTemplate={handleApplyWeekTemplate} 
               onApplyDayTemplate={handleApplyDayTemplate} 
               onOpenCreateMacro={() => setCreateMacroModal({...createMacroModal, isOpen: true, name: '', tags: '', blocksChain: [{ blockId: '', blockName: '', weeksCount: 0 }]})}
               onApplyMacro={(macro) => setMacroConfirmModal({ isOpen: true, macro, startDate: getDbDateStr(new Date()) })}
               onDeleteMacro={handleDeleteProgramBlock}
             />
           </div>
        </div>

      </div>
    </div>
  );
}