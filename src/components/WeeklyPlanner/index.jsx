import React, { useState, useEffect, useMemo } from 'react';
import { Check, AlertTriangle, BookmarkPlus, Plus, Sparkles, Trash, Trash2, Percent, UserPlus, X, Calendar, Calendar as CalendarIcon, Loader2, Copy, ClipboardPaste, Undo2, Redo2, Save, Edit2, BarChart3, Activity, Play, ChevronLeft, ChevronRight, ChevronDown, User, Smartphone, Monitor, Moon, Sun, Library, Search, Printer, FileText, Layout, Layers } from 'lucide-react';

import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import TimelineCard from './TimelineCard.jsx';
import ExerciseLibrary from './ExerciseLibrary.jsx';
import AthleteProfileModal from './AthleteProfileModal.jsx';
import PeriodizationPlanner from './PeriodizationPlanner.jsx';
import { supabase } from '../../supabaseClient.js';
import { generateWeeklyPDF } from './pdfGenerator.js';
import { generateWeeklyHTMLPrint } from './htmlPrinter.js';
import { generateWelcomePackHTML } from './welcomePackPrinter.js';

const EXERCISE_CATEGORIES = { mobility: 'Mobility', core: 'Core', isometric: 'Isometric', power: 'Power', plyometric: 'Plyometric', strength: 'Strength', speed: 'Speed', endurance: 'Endurance', physical: 'Physical' };
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
  plyometric: { color: 'bg-indigo-500', label: 'Plyometric' },
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
    anti_extension: 'Anti-Extension',
    anti_rotation: 'Anti-Rotation',
    anti_lateral_flexion: 'Anti-Lateral Flexion',
    anti_flexion: 'Anti-Flexion',
    dynamic_rotational: 'Dynamic / Rotational',
    // Fallbacks
    rotation: 'Dynamic / Rotational',
    extension: 'Anti-Extension',
    flexion: 'Anti-Flexion',
    lateral_flexion: 'Anti-Lateral Flexion'
  },
  strength: {
    upper_body: 'Upper Body',
    double_leg: 'Bilateral (Double Leg)',
    single_leg: 'Unilateral (Single Leg)'
  },
  plyometric: {
    upper_body: 'Upper Body',
    double_leg: 'Bilateral (Double Leg)',
    single_leg: 'Unilateral (Single Leg)'
  },
  power: {
    double_leg: 'Bilateral (Double Leg)',
    single_leg: 'Unilateral (Single Leg)'
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
  const [currentView, setCurrentView] = useState('planner');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [selectedDashboardGroup, setSelectedDashboardGroup] = useState('All');
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [allDeployments, setAllDeployments] = useState([]);
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
  const [completedDays, setCompletedDays] = useState({});
  const [library, setLibrary] = useState({ drills: [], templates: [] }); 
  const [programs, setPrograms] = useState([]); 
  const [monthWorkouts, setMonthWorkouts] = useState({});
  const [fourWeekWorkouts, setFourWeekWorkouts] = useState([]);

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

  const [selectedMesoId, setSelectedMesoId] = useState(null);
  const [isEditingMeso, setIsEditingMeso] = useState(false);
  const [activeMesoWeekIndex, setActiveMesoWeekIndex] = useState(0);
  const [mesoData, setMesoData] = useState(null);

  const [selectedMacroId, setSelectedMacroId] = useState(null);
  const [isEditingMacro, setIsEditingMacro] = useState(false);
  const [activeMacroWeekIndex, setActiveMacroWeekIndex] = useState(0);
  const [macroData, setMacroData] = useState(null);
  const [macroWeeks, setMacroWeeks] = useState([]);
  const [loadedMesoCycles, setLoadedMesoCycles] = useState({});

  const isTemplateEditing = isEditingBlock || isEditingMeso || isEditingMacro;
  const [deployBlockModal, setDeployBlockModal] = useState({ isOpen: false, blockId: null, athleteId: '', startDate: '' });

  const [addExerciseModal, setAddExerciseModal] = useState({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', video_url: '', tempo: '', focus: '' });
  const [dayDrillModal, setDayDrillModal] = useState({ isOpen: false, day: null, drill: null, isNew: false });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [printMode, setPrintMode] = useState('landscape');
  const [printStudioModal, setPrintStudioModal] = useState({ isOpen: false, orientation: 'landscape', theme: 'crimson' });
  const [welcomePackModal, setWelcomePackModal] = useState({ isOpen: false, langMode: 'mix' });

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
          drills: item.drills,
          is_completed: item.is_completed || false
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
      handleToast('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      handleToast('Error generating PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintStudioHTML = () => {
    setPrintStudioModal(prev => ({ ...prev, isOpen: false }));
    try {
      generateWeeklyHTMLPrint({
        schedule,
        dayTitles,
        weekDatesFull,
        selectedAthlete: athletes.find(a => a.id === selectedAthleteId),
        calculateDayVolume,
        orientation: printStudioModal.orientation,
        theme: printStudioModal.theme
      });
      handleToast('Opened browser print preview!');
    } catch (error) {
      console.error('Error generating HTML Print:', error);
      handleToast('Error starting print page');
    }
  };

  const handlePrintWelcomePack = (lang = 'mix') => {
    setWelcomePackModal({ isOpen: false, langMode: 'mix' });
    try {
      generateWelcomePackHTML({
        schedule,
        dayTitles,
        weekDatesFull,
        selectedAthlete: athletes.find(a => a.id === selectedAthleteId),
        calculateDayVolume,
        langMode: lang,
        supabase,
        onToast: handleToast
      });
      handleToast('Generating PEAK FORCE Welcome Pack...');
    } catch (error) {
      console.error('Error generating Welcome Pack:', error);
      handleToast('Error: ' + error.message);
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

  const pushToHistory = (newSchedule, newTitles, newCompleted) => {
    const newState = { 
      schedule: JSON.parse(JSON.stringify(newSchedule)), 
      titles: JSON.parse(JSON.stringify(newTitles)),
      completed: JSON.parse(JSON.stringify(newCompleted !== undefined ? newCompleted : completedDays))
    };
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

  const getAthleteActiveWeekAndPhase = (athleteId) => {
    const deploys = allDeployments.filter(d => d.athlete_id === athleteId);
    if (deploys.length === 0) return { weekLabel: 'No Active Block', phaseLabel: 'Off-Season' };

    const now = new Date();
    const activeDeploy = [...deploys].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
    if (!activeDeploy) return { weekLabel: 'No Active Block', phaseLabel: 'Off-Season' };

    const start = new Date(activeDeploy.start_date);
    const end = new Date(activeDeploy.end_date);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    let currentWeekByDate = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
    if (currentWeekByDate < 1) currentWeekByDate = 1;
    if (currentWeekByDate > totalWeeks) currentWeekByDate = totalWeeks;

    let lastCompletedWeek = 0;
    const athleteWorkouts = allWorkouts.filter(w => w.athlete_id === athleteId);

    for (let w = 1; w <= totalWeeks; w++) {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekWorkouts = athleteWorkouts.filter(wk => {
        const wkDate = new Date(wk.workout_date);
        return wkDate >= weekStart && wkDate <= weekEnd;
      });

      const workoutsWithDrills = weekWorkouts.filter(wk => wk.drills && wk.drills.length > 0);
      const isCompleted = workoutsWithDrills.length > 0 && workoutsWithDrills.every(wk => wk.is_completed);

      if (isCompleted) {
        lastCompletedWeek = w;
      } else {
        break;
      }
    }

    let activeWeek = Math.max(currentWeekByDate, lastCompletedWeek + 1);
    if (activeWeek > totalWeeks) activeWeek = totalWeeks;

    const weekLabel = lastCompletedWeek >= activeWeek - 1 && lastCompletedWeek > 0
      ? `Week ${lastCompletedWeek} Done, now in Week ${activeWeek}`
      : `Week ${activeWeek} of ${totalWeeks}`;

    return {
      weekLabel,
      phaseLabel: activeDeploy.deficit_protocol ? `${activeDeploy.program_name} (${activeDeploy.deficit_protocol})` : activeDeploy.program_name,
      activeWeek,
      totalWeeks
    };
  };

  const handleQuickAssignGroup = async (athleteId, groupName) => {
    const { error } = await supabase
      .from('agilitylap_athletes')
      .update({ group_name: groupName ? groupName.trim() : null })
      .eq('id', athleteId);
    if (!error) {
      setAthletes(prev => prev.map(a => a.id === athleteId ? { ...a, groupName: groupName || '' } : a));
      handleToast(groupName ? `Athlete added to group: ${groupName}` : 'Athlete removed from group');
    } else {
      handleToast('Error updating athlete group');
    }
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
                { name: 'Base Building', durationWeeks: 12, weeks: [] },
                { name: 'Max Strength', durationWeeks: 8, weeks: [] },
                { name: 'Rapid Power', durationWeeks: 6, weeks: [] },
                { name: 'Peak & Jump Prep', durationWeeks: 4, weeks: [] }
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
    const newCompleted = {};
    DAYS_OF_WEEK.forEach(day => {
      newSchedule[day] = (week?.drills?.[day] || []).map(d => ({ ...d }));
      newTitles[day] = week?.title || '';
      newCompleted[day] = false;
    });
    setSchedule(newSchedule);
    setDayTitles(newTitles);
    setCompletedDays(newCompleted);
    setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)), completed: JSON.parse(JSON.stringify(newCompleted)) }]);
    setHistoryIndex(0);
    setIsLoading(false);
  }, [activeBlockPhaseIndex, activeBlockWeekIndex]);

  // Effect to load Meso-Cycle details when selectedMesoId changes
  useEffect(() => {
    const fetchSelectedMeso = async () => {
      if (!selectedMesoId) {
        setIsEditingMeso(false);
        setMesoData(null);
        return;
      }
      setIsLoading(true);
      setIsEditingBlock(false);
      setSelectedBlockId(null);
      setIsEditingMacro(false);
      setSelectedMacroId(null);
      try {
        const { data, error } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', selectedMesoId)
          .single();
        if (!error && data) {
          setMesoData(data);
          setIsEditingMeso(true);
          setActiveMesoWeekIndex(0);

          const week = data.weeks?.[0];
          const newSchedule = {};
          const newTitles = {};
          const newCompleted = {};
          DAYS_OF_WEEK.forEach(day => {
            newSchedule[day] = (week?.drills?.[day] || []).map(d => ({ ...d }));
            newTitles[day] = week?.title || '';
            newCompleted[day] = false;
          });
          setSchedule(newSchedule);
          setDayTitles(newTitles);
          setCompletedDays(newCompleted);
          setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)), completed: JSON.parse(JSON.stringify(newCompleted)) }]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSelectedMeso();
  }, [selectedMesoId]);

  // Effect to load Meso drills when switching Meso weeks
  useEffect(() => {
    if (!isEditingMeso || !mesoData) return;
    setIsLoading(true);
    const week = mesoData.weeks?.[activeMesoWeekIndex];
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
  }, [activeMesoWeekIndex, mesoData]);

  // Effect to load Macro-Cycle details and resolve weeks when selectedMacroId changes
  useEffect(() => {
    const fetchSelectedMacro = async () => {
      if (!selectedMacroId) {
        setIsEditingMacro(false);
        setMacroData(null);
        setMacroWeeks([]);
        return;
      }
      setIsLoading(true);
      setIsEditingBlock(false);
      setSelectedBlockId(null);
      setIsEditingMeso(false);
      setSelectedMesoId(null);

      try {
        const { data, error } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', selectedMacroId)
          .single();
        if (!error && data) {
          setMacroData(data);
          setIsEditingMacro(true);
          setActiveMacroWeekIndex(0);

          const blocksChain = data.weeks?.[0]?.blocksChain || [];
          const resolvedWeeks = [];
          const mesoCache = {};

          for (let blockIndex = 0; blockIndex < blocksChain.length; blockIndex++) {
            const blockItem = blocksChain[blockIndex];
            const { data: progDetails, error: fetchErr } = await supabase
              .from('agilitylap_programs')
              .select('*')
              .eq('id', blockItem.blockId)
              .single();

            if (!fetchErr && progDetails) {
              mesoCache[blockItem.blockId] = progDetails;
              const totalWeeksInBlock = progDetails.weeks?.length || 0;
              for (let i = 0; i < totalWeeksInBlock; i++) {
                resolvedWeeks.push({
                  mesoId: blockItem.blockId,
                  mesoName: blockItem.blockName,
                  mesoWeekIndex: i,
                  title: progDetails.weeks[i].title || '',
                  drills: progDetails.weeks[i].drills || {}
                });
              }
            }
          }

          setLoadedMesoCycles(mesoCache);
          setMacroWeeks(resolvedWeeks);

          if (resolvedWeeks.length > 0) {
            const week = resolvedWeeks[0];
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
          } else {
            handleToast('Macro-Cycle has no Meso-cycles or they could not be loaded.');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSelectedMacro();
  }, [selectedMacroId]);

  // Effect to load Macro week drills when activeMacroWeekIndex changes
  useEffect(() => {
    if (!isEditingMacro || macroWeeks.length === 0) return;
    setIsLoading(true);
    const week = macroWeeks[activeMacroWeekIndex];
    if (week) {
      const newSchedule = {};
      const newTitles = {};
      const newCompleted = {};
      DAYS_OF_WEEK.forEach(day => {
        newSchedule[day] = (week?.drills?.[day] || []).map(d => ({ ...d }));
        newTitles[day] = week?.title || '';
        newCompleted[day] = false;
      });
      setSchedule(newSchedule);
      setDayTitles(newTitles);
      setCompletedDays(newCompleted);
      setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)), completed: JSON.parse(JSON.stringify(newCompleted)) }]);
      setHistoryIndex(0);
    }
    setIsLoading(false);
  }, [activeMacroWeekIndex, macroWeeks]);

  // Standard Athlete Live plan week fetcher (only executes if NOT in template block editing mode)
  useEffect(() => {
    if (isEditingBlock || isEditingMeso || isEditingMacro) return;
    const fetchWeekData = async () => {
      if (!selectedAthleteId) return;
      setIsLoading(true);
      const endStr = getDbDateStr(weekDatesFull[6]);
      const { data } = await supabase.from('agilitylap_workouts').select('*').eq('athlete_id', selectedAthleteId).gte('workout_date', weekStartDateStr).lte('workout_date', endStr);

      const newSchedule = {}; const newTitles = {}; const newCompleted = {};
      DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; newCompleted[day] = false; });

      if (data) {
        data.forEach(record => {
          const recordDate = new Date(record.workout_date); const dayName = JS_DAYS[recordDate.getDay()];
          if (dayName && DAYS_OF_WEEK.includes(dayName)) { 
            newSchedule[dayName] = record.drills || []; 
            newTitles[dayName] = record.workout_title || ''; 
            newCompleted[dayName] = record.is_completed || false;
          }
        });
      }
      setSchedule(newSchedule); setDayTitles(newTitles); setCompletedDays(newCompleted);
      setHistory([{ schedule: JSON.parse(JSON.stringify(newSchedule)), titles: JSON.parse(JSON.stringify(newTitles)), completed: JSON.parse(JSON.stringify(newCompleted)) }]);
      setHistoryIndex(0); setIsLoading(false);
    }; fetchWeekData();
  }, [selectedAthleteId, weekStartDateStr, isEditingBlock, isEditingMeso, isEditingMacro]);

  useEffect(() => {
    if (isEditingBlock || isEditingMeso || isEditingMacro) return;
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
  }, [selectedAthleteId, currentDate.getMonth(), currentDate.getFullYear(), showMonthCalendar, isEditingBlock, isEditingMeso, isEditingMacro]);

  // Fetch 4-week data when in 4-week view
  useEffect(() => {
    if (isEditingBlock || isEditingMeso || isEditingMacro) return;
    if (currentView !== 'four_week') return;
    
    const fetchFourWeekData = async () => {
      if (!selectedAthleteId) return;
      setIsLoading(true);
      const start = new Date(weekStartDateStr);
      const end = new Date(start);
      end.setDate(end.getDate() + 27); // 4 weeks total
      
      const { data, error } = await supabase
        .from('agilitylap_workouts')
        .select('*')
        .eq('athlete_id', selectedAthleteId)
        .gte('workout_date', weekStartDateStr)
        .lte('workout_date', getDbDateStr(end))
        .order('workout_date', { ascending: true });
        
      if (!error && data) {
        setFourWeekWorkouts(data);
      }
      setIsLoading(false);
    };
    fetchFourWeekData();
  }, [selectedAthleteId, weekStartDateStr, currentView, isEditingBlock, isEditingMeso, isEditingMacro]);

  const autoSaveDay = async (day, drillsToSave, titleToSave, isCompletedToSave) => {
    const finalTitle = titleToSave !== undefined ? titleToSave : (dayTitles[day] || '');
    const finalDrills = drillsToSave !== undefined ? drillsToSave : (schedule[day] || []);
    const finalCompleted = isCompletedToSave !== undefined ? isCompletedToSave : (completedDays[day] || false);

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
        handleToast('Error auto-saving block template');
      }
      return;
    }

    if (isEditingMeso) {
      if (!selectedMesoId || !mesoData) return;
      const updatedMesoData = { ...mesoData };
      if (!updatedMesoData.weeks) updatedMesoData.weeks = [];
      if (!updatedMesoData.weeks[activeMesoWeekIndex]) {
        updatedMesoData.weeks[activeMesoWeekIndex] = {
          weekIndex: activeMesoWeekIndex,
          title: '',
          drills: {}
        };
      }
      const week = updatedMesoData.weeks[activeMesoWeekIndex];
      week.drills = {
        ...(week.drills || {}),
        [day]: finalDrills.map(d => ({ ...d }))
      };
      week.title = finalTitle;
      setMesoData(updatedMesoData);

      try {
        setSyncStatus('syncing');
        const { error } = await supabase
          .from('agilitylap_programs')
          .update({ weeks: updatedMesoData.weeks })
          .eq('id', selectedMesoId);
        if (error) throw error;
        setSyncStatus('synced');
      } catch (err) {
        console.error(err);
        setSyncStatus('offline');
        handleToast('Error saving Meso template');
      }
      return;
    }

    if (isEditingMacro) {
      const weekInfo = macroWeeks[activeMacroWeekIndex];
      if (!weekInfo || !weekInfo.mesoId) return;

      try {
        setSyncStatus('syncing');
        const cachedMeso = loadedMesoCycles[weekInfo.mesoId];
        if (!cachedMeso) throw new Error('Meso-cycle not found in cache');

        const updatedWeeks = [...(cachedMeso.weeks || [])];
        const wIdx = weekInfo.mesoWeekIndex;
        if (!updatedWeeks[wIdx]) {
          updatedWeeks[wIdx] = { weekIndex: wIdx, title: '', drills: {} };
        }
        updatedWeeks[wIdx].drills = {
          ...(updatedWeeks[wIdx].drills || {}),
          [day]: finalDrills.map(d => ({ ...d }))
        };
        updatedWeeks[wIdx].title = finalTitle;

        const { error: saveErr } = await supabase
          .from('agilitylap_programs')
          .update({ weeks: updatedWeeks })
          .eq('id', weekInfo.mesoId);
        if (saveErr) throw saveErr;

        setLoadedMesoCycles(prev => ({
          ...prev,
          [weekInfo.mesoId]: {
            ...prev[weekInfo.mesoId],
            weeks: updatedWeeks
          }
        }));

        const updatedMacroWeeks = [...macroWeeks];
        updatedMacroWeeks[activeMacroWeekIndex] = {
          ...updatedMacroWeeks[activeMacroWeekIndex],
          title: finalTitle,
          drills: {
            ...(updatedMacroWeeks[activeMacroWeekIndex].drills || {}),
            [day]: finalDrills.map(d => ({ ...d }))
          }
        };
        setMacroWeeks(updatedMacroWeeks);
        setSyncStatus('synced');
      } catch (err) {
        console.error(err);
        setSyncStatus('offline');
        handleToast('Error saving macro template component');
      }
      return;
    }

    if (!selectedAthleteId) return;
    const dateStr = getDbDateStr(weekDatesFull[DAYS_OF_WEEK.indexOf(day)]);
    const payload = { 
      athlete_id: selectedAthleteId, 
      workout_date: dateStr, 
      workout_title: finalTitle, 
      drills: finalDrills,
      is_completed: finalCompleted
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

  const handleUndo = () => { 
    if (historyIndex > 0) { 
      const newIndex = historyIndex - 1; 
      const prevState = history[newIndex]; 
      setSchedule(prevState.schedule); 
      setDayTitles(prevState.titles); 
      setCompletedDays(prevState.completed || {});
      setHistoryIndex(newIndex); 
      DAYS_OF_WEEK.forEach(day => autoSaveDay(day, prevState.schedule[day], prevState.titles[day], prevState.completed?.[day] || false)); 
      handleToast('Undo successful'); 
    } 
  };
  const handleRedo = () => { 
    if (historyIndex < history.length - 1) { 
      const newIndex = historyIndex + 1; 
      const nextState = history[newIndex]; 
      setSchedule(nextState.schedule); 
      setDayTitles(nextState.titles); 
      setCompletedDays(nextState.completed || {});
      setHistoryIndex(newIndex); 
      DAYS_OF_WEEK.forEach(day => autoSaveDay(day, nextState.schedule[day], nextState.titles[day], nextState.completed?.[day] || false)); 
      handleToast('Redo successful'); 
    } 
  };
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

  // Dynamic auto-resizing hook for day workout focus textareas to prevent title truncation
  useEffect(() => {
    const elements = document.querySelectorAll('textarea[data-autoresize]');
    elements.forEach(el => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  }, [dayTitles, activeMobileDay, schedule]);

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
    const newSchedule = {}; const newTitles = {}; const newCompleted = {}; DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; newCompleted[day] = false; });
    if (data) { 
      data.forEach(record => { 
        const dayName = JS_DAYS[new Date(record.workout_date).getDay()]; 
        if (dayName) { 
          newSchedule[dayName] = record.drills || []; 
          newTitles[dayName] = record.workout_title || ''; 
          newCompleted[dayName] = record.is_completed || false;
        } 
      }); 
    }
    setSchedule(newSchedule); setDayTitles(newTitles); setCompletedDays(newCompleted); pushToHistory(newSchedule, newTitles, newCompleted); setIsLoading(false); 


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
    fetchWorkoutsAndDeployments();

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
      const newCompleted = {};
      DAYS_OF_WEEK.forEach((day) => { newSchedule[day] = []; newTitles[day] = ''; newCompleted[day] = false; });
      
      if (refreshedWorkouts) { 
        refreshedWorkouts.forEach(record => { 
          const dayName = JS_DAYS[new Date(record.workout_date).getDay()]; 
          if (dayName) { 
            newSchedule[dayName] = record.drills || []; 
            newTitles[dayName] = record.workout_title || ''; 
            newCompleted[dayName] = record.is_completed || false;
          } 
        }); 
      }
      
      setSchedule(newSchedule); 
      setDayTitles(newTitles); 
      setCompletedDays(newCompleted);
      pushToHistory(newSchedule, newTitles, newCompleted);
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
  const handleRenameProgramBlock = async (id, newName) => {
    if (!newName || !newName.trim()) return;
    const { error } = await supabase.from('agilitylap_programs').update({ program_name: newName.trim() }).eq('id', id);
    if (!error) {
      setPrograms(prev => prev.map(p => p.id === id ? { ...p, program_name: newName.trim() } : p));
      if (mesoData && mesoData.id === id) {
        setMesoData(prev => ({ ...prev, program_name: newName.trim() }));
      }
      if (macroData && macroData.id === id) {
        setMacroData(prev => ({ ...prev, program_name: newName.trim() }));
      }
      handleToast('Name updated successfully');
    } else {
      console.error(error);
      handleToast('Error updating name');
    }
  };
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
      distance: drill.distance ? parseFloat(drill.distance) : null,
      tempo: drill.tempo || '',
      focus: drill.focus || '',
      subcategory: drill.subcategory || '',
      bwRatio: drill.bwRatio ? parseFloat(drill.bwRatio) : null,
      video_url: drill.video_url || ''
    };
    const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
    if (!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); handleToast('Exercise saved to library sidebar!'); }
    setDraggedItem(null);
  };

  const handleApplyLibraryExercise = (drill, dayName) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dayName] = [...(newSchedule[dayName] || [])];
      const newDrill = { 
        ...drill, 
        id: `lib-drill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subcategory: drill.subcategory || '',
        video_url: drill.video_url || ''
      };
      newSchedule[dayName].push(newDrill);
      pushToHistory(newSchedule, dayTitles);
      autoSaveDay(dayName, newSchedule[dayName], dayTitles[dayName]);
      return newSchedule;
    });
    handleToast(`Added ${drill.title} to ${dayName}`);
  };

  const moveDrillUp = (day, index) => { if (index === 0) return; setSchedule(prev => { const newSchedule = { ...prev }; const drills = [...newSchedule[day]]; [drills[index - 1], drills[index]] = [drills[index], drills[index - 1]]; newSchedule[day] = drills; pushToHistory(newSchedule, dayTitles); autoSaveDay(day, drills, dayTitles[day]); return newSchedule; }); };
  const moveDrillDown = (day, index) => { if (index === schedule[day].length - 1) return; setSchedule(prev => { const newSchedule = { ...prev }; const drills = [...newSchedule[day]]; [drills[index + 1], drills[index]] = [drills[index], drills[index + 1]]; newSchedule[day] = drills; pushToHistory(newSchedule, dayTitles); autoSaveDay(day, drills, dayTitles[day]); return newSchedule; }); };

  const handleAddExerciseBtn = (day) => { setDayDrillModal({ isOpen: true, day: day, drill: { id: `w-${Date.now()}`, type: 'strength', subcategory: '', title: '', details: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', superset: '', video_url: '' }, isNew: true }); };
  const handleEditExerciseBtn = (day, drill) => { setDayDrillModal({ isOpen: true, day: day, drill: { ...drill, subcategory: drill.subcategory || '', bwRatio: drill.bwRatio || '', unit: drill.unit || 'reps', distance: drill.distance || '', superset: drill.superset || '', video_url: drill.video_url || '' }, isNew: false }); };

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
  
  const handleToggleDayCompleted = async (day) => {
    if (isTemplateEditing) return;
    const currentVal = completedDays[day] || false;
    const newVal = !currentVal;
    const newCompleted = { ...completedDays, [day]: newVal };
    setCompletedDays(newCompleted);
    pushToHistory(schedule, dayTitles, newCompleted);
    await autoSaveDay(day, schedule[day], dayTitles[day], newVal);
    handleToast(newVal ? `${day} marked as completed!` : `${day} completion cleared.`);
  };

  const confirmDelete = () => { 
    if (deleteConfirmation.type === 'week') { 
      const emptySchedule = DAYS_OF_WEEK.reduce((acc, day) => ({...acc, [day]: []}), {}); 
      const emptyCompleted = DAYS_OF_WEEK.reduce((acc, day) => ({...acc, [day]: false}), {});
      setSchedule(emptySchedule); 
      setDayTitles({}); 
      setCompletedDays(emptyCompleted);
      pushToHistory(emptySchedule, {}, emptyCompleted); 
      DAYS_OF_WEEK.forEach(day => autoSaveDay(day, [], '', false)); 
      handleToast('Week cleared successfully'); 
    } else if (deleteConfirmation.type === 'day' && deleteConfirmation.targetDay) { 
      const tDay = deleteConfirmation.targetDay; 
      const newSchedule = { ...schedule, [tDay]: [] }; 
      const newTitles = { ...dayTitles, [tDay]: '' }; 
      const newCompleted = { ...completedDays, [tDay]: false };
      setSchedule(newSchedule); 
      setDayTitles(newTitles); 
      setCompletedDays(newCompleted);
      pushToHistory(newSchedule, newTitles, newCompleted); 
      autoSaveDay(tDay, [], '', false); 
      handleToast(`${tDay} cleared`); 
    } 
    setDeleteConfirmation({ isOpen: false, type: null, targetDay: null }); 
  };
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
    const newCompleted = {};

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
      newCompleted[day] = false;
    });

    setSchedule(newSchedule);
    setDayTitles(newTitles);
    setCompletedDays(newCompleted);
    pushToHistory(newSchedule, newTitles, newCompleted);

    // Save each day to database
    for (let day of DAYS_OF_WEEK) {
      await autoSaveDay(day, newSchedule[day], newTitles[day], false);
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
            name: 'Base Building',
            durationWeeks: baseWeeks,
            weeks: baseSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'Max Strength',
            durationWeeks: strengthWeeks,
            weeks: strengthSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'Rapid Power',
            durationWeeks: powerWeeks,
            weeks: powerSlice.map((w, idx) => ({
              weekIndex: idx,
              type: 'None',
              title: w.title || '',
              drills: w.drills || {}
            }))
          },
          {
            name: 'Peak & Jump Prep',
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
      handleToast('Please select athlete and start date!');
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
        throw new Error('The block template does not contain any phases or weeks!');
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

      handleToast(`Template "${program.program_name}" deployed successfully to athlete for ${totalWeeksDeployed} weeks!`);
      
      if (selectedAthleteId === athleteId) {
        setCurrentDate(new Date(start));
      }
    } catch (err) {
      console.error(err);
      handleToast('Error deploying template.');
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
  const handleEditLibraryDrill = (drill) => { setAddExerciseModal({ isOpen: true, id: drill.id, title: drill.title || '', details: drill.details || '', type: drill.type || 'strength', subcategory: drill.subcategory || '', percentage: drill.percentage || '', bwRatio: drill.bwRatio || '', sets: drill.sets || '', reps: drill.reps || '', rest: drill.rest || '', unit: drill.unit || 'reps', distance: drill.distance || '', video_url: drill.video_url || '', tempo: drill.tempo || '', focus: drill.focus || '' }); };
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
      distance: addExerciseModal.distance ? parseFloat(addExerciseModal.distance) : null,
      video_url: addExerciseModal.video_url || '',
      tempo: addExerciseModal.tempo || '',
      focus: addExerciseModal.focus || ''
    }; 
    if (addExerciseModal.id) {
      const { data, error } = await supabase.from('library_drills').update(drillData).eq('id', addExerciseModal.id).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: prev.drills.map(d => d.id === addExerciseModal.id ? data[0] : d) })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', video_url: '', tempo: '', focus: '' }); handleToast('Exercise updated'); }
    } else {
      const { data, error } = await supabase.from('library_drills').insert([drillData]).select();
      if(!error && data) { setLibrary(prev => ({ ...prev, drills: [data[0], ...prev.drills] })); setAddExerciseModal({ isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', video_url: '', tempo: '', focus: '' }); handleToast('Exercise added'); }
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

  const renderFourWeekView = () => {
    const weeks = [];
    const base = new Date(currentWeekStart);
    for (let w = 0; w < 4; w++) {
      const wkStart = new Date(base);
      wkStart.setDate(wkStart.getDate() + (w * 7));
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 6);
      
      const rangeLabel = `${wkStart.getDate()} ${wkStart.toLocaleDateString('en-US', { month: 'short' })} - ${wkEnd.getDate()} ${wkEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      
      const days = DAYS_OF_WEEK.map((dayName, dIdx) => {
        const dayDate = new Date(wkStart);
        dayDate.setDate(dayDate.getDate() + dIdx);
        const dateStr = getDbDateStr(dayDate);
        const fullDateStr = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const workoutRecord = fourWeekWorkouts.find(wRecord => wRecord.workout_date === dateStr);
        return { dayName, dateStr, fullDateStr, workoutRecord };
      });

      weeks.push({ index: w + 1, rangeLabel, days });
    }

    return (
      <div className="p-4 md:p-6 space-y-8 w-full" dir="ltr">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-800/85 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white">4-Week Meso-Block Athlete Program Sheet</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">4-Week Program Sheet for Athlete: {selectedAthlete?.name}</p>
          </div>
          <button 
            onClick={() => setCurrentView('planner')} 
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            Back to Weekly
          </button>
        </div>

        {/* Weeks */}
        {weeks.map((wk) => (
          <div key={wk.index} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {/* Week Header */}
            <div className="border-b border-slate-100 dark:border-slate-700/60 px-5 py-3 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-sm font-black text-orange-500">Week {wk.index}</span>
              <span className="text-xs font-bold text-slate-400 tracking-tight">{wk.rangeLabel}</span>
            </div>

            {/* Days Grid — same as weekly planner */}
            <div className="grid grid-cols-7 p-4 gap-4">
              {wk.days.map((day) => {
                const drills = day.workoutRecord?.drills || [];
                const title = day.workoutRecord?.workout_title || '';
                const isCompleted = day.workoutRecord?.is_completed || false;
                const dayStats = calculateDayVolume(drills);
                
                return (
                  <div key={day.dayName} className="flex flex-col w-full">
                    {/* Day Header */}
                    <div className={`mb-3 flex flex-col border-b pb-2 px-1.5 select-none ${isCompleted ? 'bg-green-500/10 border-green-200 dark:border-green-900/30 rounded-xl pt-2' : 'border-slate-200 dark:border-slate-800'}`}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">{day.dayName}</span>
                        <span className="text-[9px] font-bold text-slate-400/80 dark:text-slate-600">{day.fullDateStr}</span>
                      </div>
                      {title && (
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 leading-tight" title={title}>{title}</span>
                      )}
                    </div>

                    {/* Exercises — full height, no max-h limit */}
                    <div className="flex-1 px-1 pb-4 space-y-1.5">
                      {drills.length > 0 ? (
                        drills.map((drill, drillIdx) => {
                          const typeColor = {
                            'strength': 'text-orange-500', 'power': 'text-red-500', 'physical': 'text-blue-500',
                            'core': 'text-violet-500', 'mobility': 'text-green-500', 'isometric': 'text-amber-500',
                            'plyometric': 'text-pink-500', 'conditioning': 'text-cyan-500'
                          }[(drill.type || 'physical').toLowerCase()] || 'text-blue-500';

                          return (
                            <div key={drill.id || drillIdx} className="relative pb-1.5">
                              {/* Timeline connector */}
                              {drillIdx < drills.length - 1 && (
                                <div className="absolute left-[7px] top-[18px] bottom-[-4px] w-px bg-slate-200 dark:bg-slate-700"></div>
                              )}
                              <div className="flex items-start gap-2">
                                {/* Timeline dot */}
                                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 ${typeColor.replace('text-', 'border-')} bg-white dark:bg-slate-900`}></div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`text-[8px] font-black uppercase tracking-wider block ${typeColor}`}>{(drill.type || 'physical').toUpperCase()}</span>
                                  <span className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 block leading-tight break-words">{drill.title || 'Unnamed Exercise'}</span>
                                  <div className="flex items-center gap-1.5 flex-wrap text-[8.5px] font-bold text-slate-500 mt-1">
                                    <span>{drill.sets} SETS</span>
                                    <span className="text-slate-300">×</span>
                                    <span>{drill.reps} {drill.unit === 'sec' || drill.unit === 'SEC' ? 'SEC' : 'REPS'}</span>
                                    {drill.load && (
                                      <>
                                        <span className="text-slate-300">⏱</span>
                                        <span className="text-orange-500">{drill.load}</span>
                                      </>
                                    )}
                                    {drill.rest && (
                                      <>
                                        <span className="text-slate-300">⏱</span>
                                        <span>{drill.rest}</span>
                                      </>
                                    )}
                                    {drill.tempo && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-amber-650 dark:text-amber-450">T: {drill.tempo}</span>
                                      </>
                                    )}
                                    {drill.focus && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-rose-600 dark:text-rose-400">{drill.focus}</span>
                                      </>
                                    )}
                                  </div>
                                  {drill.intensity && (
                                    <span className="text-[8px] font-black text-red-500 mt-0.5 block">{drill.intensity}% 1RM</span>
                                  )}
                                  {drill.details && (
                                    <p className="text-[8px] text-slate-400 italic mt-0.5 leading-snug">📋 {drill.details}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center py-6 text-slate-300 dark:text-slate-700">
                          <span className="text-[9px] font-bold">—</span>
                        </div>
                      )}
                    </div>

                    {/* Day stats summary */}
                    {drills.length > 0 && (
                      <div className="mt-auto p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/30 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold flex-wrap gap-y-0.5">
                          <div className="flex flex-col items-center text-slate-400"><span className="text-[7px] uppercase">Drills</span><span>{dayStats.totalExercises}</span></div>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <div className="flex flex-col items-center text-blue-500"><span className="text-[7px] uppercase text-blue-400">Int</span><span>{dayStats.avgIntensity}%</span></div>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <div className="flex flex-col items-center text-orange-500"><span className="text-[7px] uppercase text-orange-400">Load</span><span>{dayStats.totalVolumeScore}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };


  const renderDashboard = () => {
    const uniqueGroups = ['All', ...new Set(athletes.map(a => a.groupName).filter(Boolean))];
    const filteredDashboardAthletes = athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(dashboardSearch.toLowerCase());
      const matchesGroup = selectedDashboardGroup === 'All' || athlete.groupName === selectedDashboardGroup;
      return matchesSearch && matchesGroup;
    });

    return (
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[#F4F5F7] dark:bg-slate-900 font-sans" dir="rtl">
        {/* Left Side: Athletes Grid & Filters */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Greeting / Summary Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                Welcome Captain! 👋
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                Central dashboard for managing athletes and training programs
              </p>
            </div>
            <button
              onClick={() => setShowAddAthleteModal(true)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black shadow-md shadow-orange-500/10 flex items-center gap-2 self-start sm:self-auto transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add New Athlete
            </button>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Athletes</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{athletes.length}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Groups</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{uniqueGroups.length - 1}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850/80 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Meso Blocks</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{programs.length}</span>
            </div>
          </div>

          {/* Search & Groups Filter Bar */}
          <div className="bg-white dark:bg-slate-855 p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
              />
            </div>

            {/* Groups Horizontal Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none justify-start md:justify-end">
              {uniqueGroups.map(grp => (
                <button
                  key={grp}
                  onClick={() => setSelectedDashboardGroup(grp)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all shrink-0 select-none ${selectedDashboardGroup === grp ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800'}`}
                >
                  {grp === 'All' ? 'All Athletes' : grp}
                </button>
              ))}
            </div>
          </div>

          {/* Athletes List */}
          <div className="flex flex-col gap-3">
            {filteredDashboardAthletes.length > 0 ? (
              filteredDashboardAthletes.map(athlete => {
                const { weekLabel, phaseLabel } = getAthleteActiveWeekAndPhase(athlete.id);
                return (
                  <div
                    key={athlete.id}
                    onClick={() => {
                      setSelectedAthleteId(athlete.id);
                      setCurrentView('planner');
                    }}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-800/80 p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:border-orange-200 dark:hover:border-orange-500/20 group/card"
                  >
                    {/* Athlete Details (Left) */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/10 shrink-0">
                        {athlete.name ? athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover/card:text-orange-500 transition-colors truncate">
                          {athlete.name}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {athlete.birthYear && (
                            <span className="text-[10px] text-slate-400 font-bold">Born: {athlete.birthYear}</span>
                          )}
                          {athlete.weight && (
                            <span className="text-[10px] text-slate-400 font-bold">• Weight: {athlete.weight} kg</span>
                          )}
                          {athlete.groupName && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-wider">
                              {athlete.groupName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Routine Info (Center) */}
                    <div className="flex flex-col gap-1 min-w-0 md:max-w-xs w-full md:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Block:</span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-350 truncate">{phaseLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timeline Position:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/20 shadow-sm shrink-0">
                          {weekLabel}
                        </span>
                      </div>
                    </div>

                    {/* Quick Group & Block actions (Right) */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Group Switcher Select Dropdown */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Group:</span>
                        <select
                          value={athlete.groupName || ''}
                          onChange={(e) => handleQuickAssignGroup(athlete.id, e.target.value)}
                          className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 dark:text-white w-28 font-sans"
                        >
                          <option value="">No Group</option>
                          <option value="Rehab">Rehab</option>
                          <option value="Sprinters">Sprinters</option>
                          <option value="Group A">Group A</option>
                          <option value="Group B">Group B</option>
                          {athlete.groupName && !['Rehab', 'Sprinters', 'Group A', 'Group B'].includes(athlete.groupName) && (
                            <option value={athlete.groupName}>{athlete.groupName}</option>
                          )}
                        </select>
                      </div>

                      {/* Quick Deploy Block button */}
                      <button
                        onClick={() => {
                          setDeployBlockModal({
                            isOpen: true,
                            blockId: programs[0]?.id || '',
                            athleteId: athlete.id,
                            startDate: getDbDateStr(new Date())
                          });
                        }}
                        className="px-3.5 py-2.5 bg-slate-50 hover:bg-orange-50 dark:bg-slate-900 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-750 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" /> Deploy Block
                      </button>

                      {/* Edit profile */}
                      <button
                        onClick={() => {
                          setSelectedAthleteId(athlete.id);
                          setShowProfileModal(true);
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-750 rounded-xl transition-all shadow-sm"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-800/40 p-8 rounded-3xl text-center border border-dashed border-slate-250 dark:border-slate-800">
                <span className="text-xs text-slate-400 dark:text-slate-500">No athletes found matching search criteria.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Meso-Blocks directory sidebar */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Meso Blocks & Templates
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
              Meso-Blocks & Programs Directory
            </p>
          </div>

          {/* Sidebar Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setCreateProgramModal({ isOpen: true, name: '', tags: '', weeksChain: [''] })}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Meso Block
            </button>
            <button
              onClick={() => setShowPeriodizationPlanner(true)}
              className="w-full py-2.5 bg-violet-650 hover:bg-violet-700 text-white rounded-xl text-xs font-black shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 transition-all"
            >
              <Calendar className="w-4 h-4" /> Annual Season Planner
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-900"></div>

          {/* Meso programs list */}
          <div className="flex flex-col gap-3 flex-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Saved Programs List ({programs.length})</span>
            <div className="flex flex-col gap-2.5">
              {programs.length > 0 ? (
                programs.map(prog => (
                  <div
                    key={prog.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2.5 hover:border-slate-350 dark:hover:border-slate-700 transition-all"
                  >
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-white">{prog.program_name}</h5>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-855 text-slate-600 dark:text-slate-400 text-[8.5px] font-bold">
                          {prog.weeks ? prog.weeks.length : 0} Weeks
                        </span>
                        {prog.weeks?.[0]?.blockTags && (
                          <span className="text-[8.5px] text-orange-500 font-bold">{prog.weeks[0].blockTags}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDeployBlockModal({
                            isOpen: true,
                            blockId: prog.id,
                            athleteId: selectedAthleteId || '',
                            startDate: getDbDateStr(new Date())
                          });
                        }}
                        className="flex-1 py-1.5 bg-white dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 hover:text-orange-500 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Deploy
                      </button>
                      <button
                        onClick={() => handleDeleteProgramBlock(prog.id)}
                        className="p-1.5 bg-white dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                        title="Delete Program"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <span className="text-[10px] text-slate-400">No saved programs found.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-screen max-w-full overflow-x-hidden font-sans selection:bg-orange-500/30 transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F4F5F7] text-slate-800'} print:bg-white print:text-black pb-16 md:pb-0 ${printMode === 'landscape' ? 'print-mode-landscape' : 'print-mode-portrait'}`}>
      
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 text-left">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-500" />
              {bulkSaveModal.saveType === 'macro_block' ? 'Save as Macrocycle' : 'Save as Meso-Block'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">Name</label>
                <input 
                  type="text" 
                  value={bulkSaveModal.programName || ''} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, programName: e.target.value})} 
                  placeholder={bulkSaveModal.saveType === 'macro_block' ? "e.g. 30-Week Deficit Season" : "e.g. 4-Week Hypertrophy Block"} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                  autoFocus 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">Save As</label>
                <select 
                  value={bulkSaveModal.saveType || 'meso'} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, saveType: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  <option value="meso">Meso-Block</option>
                  <option value="macro_block">Macrocycle</option>
                </select>
              </div>

              {bulkSaveModal.saveType === 'macro_block' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">Deficit Protocol</label>
                    <select 
                      value={bulkSaveModal.deficitProtocol || 'FDP'} 
                      onChange={(e) => setBulkSaveModal({...bulkSaveModal, deficitProtocol: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    >
                      <option value="FDP">FDP - Max Force Deficit</option>
                      <option value="EDP">EDP - Elastic SSC Deficit</option>
                      <option value="RSD">RSD - Reactive Stiffness Deficit</option>
                      <option value="HVRP">HVRP - High-Velocity RFD Deficit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-555 dark:text-slate-400 mb-1">Athlete Level</label>
                    <select
                      value={bulkSaveModal.level || 'Beginner'} 
                      onChange={(e) => setBulkSaveModal({...bulkSaveModal, level: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={bulkSaveModal.startDate} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, startDate: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={bulkSaveModal.endDate} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, endDate: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">Tags (Optional)</label>
                <input 
                  type="text" 
                  value={bulkSaveModal.tags || ''} 
                  onChange={(e) => setBulkSaveModal({...bulkSaveModal, tags: e.target.value})} 
                  placeholder="e.g. Strength, Power" 
                  className="w-full px-4 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                />
              </div>
            </div>
            <div className="flex gap-3 flex-row">
              <button onClick={handleSaveRangeAsBlock} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">Save</button>
              <button onClick={() => setBulkSaveModal({ isOpen: false, startDate: '', endDate: '', programName: '', tags: '', saveType: 'meso', deficitProtocol: 'FDP', level: 'Beginner' })} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {printStudioModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700/50 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">Printing & PDF Export Lab</h3>
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
            <div className="p-6 space-y-6 text-left">
              {/* 1. Layout Orientation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. LAYOUT ORIENTATION</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Landscape Card */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
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
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Horizontal - Single full-week sheet</p>
                    </div>
                  </button>

                  {/* Portrait Card */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, orientation: 'portrait' }))}
                    className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
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
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Vertical - Stacked day list</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Visual Print Theme */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">2. VISUAL PRINT THEME</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Crimson Theme */}
                  <button
                    type="button"
                    onClick={() => setPrintStudioModal(prev => ({ ...prev, theme: 'crimson' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'crimson'
                        ? 'border-rose-500 dark:border-rose-400 bg-rose-50/30 dark:bg-rose-950/10 ring-2 ring-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-rose-600 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'crimson' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-350'}`}>Classic Crimson</h5>
                        <p className="text-[9px] text-slate-400 font-medium">Classic coach red theme</p>
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
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'navy'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/10 ring-2 ring-blue-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-blue-600 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'navy' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>Professional Navy</h5>
                        <p className="text-[9px] text-slate-400 font-medium">Professional dark blue</p>
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
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'green'
                        ? 'border-green-600 dark:border-green-500 bg-green-50/30 dark:bg-green-950/10 ring-2 ring-green-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-green-700 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'green' ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>Athletic Green</h5>
                        <p className="text-[9px] text-slate-400 font-medium">Kinetic athletic green</p>
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
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      printStudioModal.theme === 'minimal'
                        ? 'border-slate-600 dark:border-slate-500 bg-slate-50/30 dark:bg-slate-700/20 ring-2 ring-slate-600/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-400 block shrink-0"></span>
                      <div>
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'minimal' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Minimal Ink Saver</h5>
                        <p className="text-[9px] text-slate-400 font-medium">Printer-friendly (B&W)</p>
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
                    className={`col-span-2 p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
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
                        <h5 className={`text-xs font-bold ${printStudioModal.theme === 'dark' ? 'text-orange-400' : 'text-slate-700 dark:text-slate-350'}`}>Elite Dark (Digital PDF)</h5>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Elite sports dark (ideal for digital sharing)</p>
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
            <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button 
                onClick={() => setPrintStudioModal(prev => ({ ...prev, isOpen: false }))} 
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all text-center"
              >
                Cancel
              </button>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 flex-1 justify-end">
                <button 
                  onClick={handlePrintStudioHTML} 
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print via Browser (Best for Arabic/Links)
                </button>
                <button 
                  onClick={handlePrintStudioSubmit} 
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {welcomePackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all text-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  PEAK FORCE Welcome Pack
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Generate a premium 5-page athletic blueprint</p>
              </div>
              <button 
                onClick={() => setWelcomePackModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Choose Language Mode</label>
              
              <div className="space-y-3">
                {/* Mixed Option */}
                <button
                  type="button"
                  onClick={() => setWelcomePackModal(prev => ({ ...prev, langMode: 'mix' }))}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    welcomePackModal.langMode === 'mix'
                      ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0 animate-pulse"></span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Mixed Language / ميكس (Recommended)</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">English cover & headlines, Arabic body content for the athlete.</p>
                    </div>
                  </div>
                  {welcomePackModal.langMode === 'mix' && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                  )}
                </button>

                {/* All Arabic Option */}
                <button
                  type="button"
                  onClick={() => setWelcomePackModal(prev => ({ ...prev, langMode: 'arabic' }))}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    welcomePackModal.langMode === 'arabic'
                      ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0"></span>
                    <div>
                      <h4 className="text-sm font-bold text-white">All Arabic / عربي بالكامل</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">Cover, headlines, and entire booklet content in Arabic.</p>
                    </div>
                  </div>
                  {welcomePackModal.langMode === 'arabic' && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                  )}
                </button>

                {/* All English Option */}
                <button
                  type="button"
                  onClick={() => setWelcomePackModal(prev => ({ ...prev, langMode: 'english' }))}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    welcomePackModal.langMode === 'english'
                      ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0"></span>
                    <div>
                      <h4 className="text-sm font-bold text-white">All English / إنجليزي بالكامل</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">Cover, headlines, and entire booklet content in English.</p>
                    </div>
                  </div>
                  {welcomePackModal.langMode === 'english' && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/30 flex justify-between items-center gap-3">
              <button 
                onClick={() => setWelcomePackModal(prev => ({ ...prev, isOpen: false }))} 
                className="px-5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all text-center flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => handlePrintWelcomePack(welcomePackModal.langMode)} 
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-650 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center gap-2 flex-1"
              >
                <Sparkles className="w-4 h-4" />
                Generate
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
                <input type="text" value={addExerciseModal.title} onChange={(e) => setAddExerciseModal({...addExerciseModal, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Video URL</label>
                <input 
                  type="text" 
                  value={addExerciseModal.video_url || ''} 
                  onChange={(e) => setAddExerciseModal({...addExerciseModal, video_url: e.target.value})} 
                  placeholder="Paste video link here (e.g. YouTube, Vimeo)" 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white font-medium mb-3" 
                />
              </div>
              
              {/* Tempo & Contraction Focus */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tempo</label>
                  <input type="text" placeholder="e.g. 3-0-1" value={addExerciseModal.tempo || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, tempo: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Contraction Focus</label>
                  <select value={addExerciseModal.focus || ''} onChange={(e) => setAddExerciseModal({...addExerciseModal, focus: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">None / Standard</option>
                    <option value="Isometric">Isometric</option>
                    <option value="Eccentric">Eccentric</option>
                    <option value="Concentric">Concentric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                <textarea value={addExerciseModal.details} onChange={(e) => setAddExerciseModal({...addExerciseModal, details: e.target.value})} className="w-full px-4 py-2 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddExerciseModal({isOpen: false, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '', video_url: '', tempo: '', focus: ''})} className="px-5 py-2 bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
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

              {/* Tempo & Contraction Focus */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tempo</label>
                  <input type="text" placeholder="e.g. 3-0-1" value={dayDrillModal.drill.tempo || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, tempo: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Contraction Focus</label>
                  <select value={dayDrillModal.drill.focus || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, focus: e.target.value}})} className="w-full text-sm px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">None / Standard</option>
                    <option value="Isometric">Isometric</option>
                    <option value="Eccentric">Eccentric</option>
                    <option value="Concentric">Concentric</option>
                  </select>
                </div>
              </div>

              <div><label className="block text-xs font-bold text-slate-500 mb-1">Exercise Name</label><input type="text" value={dayDrillModal.drill.title} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, title: e.target.value}})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" autoFocus /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Video URL</label><input type="text" placeholder="e.g. https://youtube.com/..." value={dayDrillModal.drill.video_url || ''} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, video_url: e.target.value}})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Notes</label><textarea value={dayDrillModal.drill.details} onChange={(e) => setDayDrillModal({...dayDrillModal, drill: {...dayDrillModal.drill, details: e.target.value}})} className="w-full px-4 py-2 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500 animate-pulse" /> Deploy Block Template to Athlete
            </h3>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Select Athlete:</label>
                <select
                  value={deployBlockModal.athleteId}
                  onChange={(e) => setDeployBlockModal({ ...deployBlockModal, athleteId: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                >
                  <option value="">-- Select Athlete --</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date (Saturday):</label>
                <input
                  type="date"
                  value={deployBlockModal.startDate}
                  onChange={(e) => setDeployBlockModal({ ...deployBlockModal, startDate: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ⚠️ Note: All phases and weeks will be deployed consecutively starting from this date.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={executeDeployBlock}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                Confirm Deploy
              </button>
              <button
                onClick={() => setDeployBlockModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
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
        isEditingMeso={isEditingMeso}
        activeMesoWeekIndex={activeMesoWeekIndex}
        setActiveMesoWeekIndex={setActiveMesoWeekIndex}
        mesoData={mesoData}
        isEditingMacro={isEditingMacro}
        activeMacroWeekIndex={activeMacroWeekIndex}
        setActiveMacroWeekIndex={setActiveMacroWeekIndex}
        macroData={macroData}
        macroWeeks={macroWeeks}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onExitMeso={() => {
          setSelectedMesoId(null);
          fetchLibraryData();
        }}
        onExitMacro={() => {
          setSelectedMacroId(null);
          fetchLibraryData();
        }}
      />

      {/* ⚠️ Layout Control Panel */}
      {currentView === 'dashboard' ? (
        renderDashboard()
      ) : (
        <div className="flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden relative print:h-auto print:overflow-visible bg-[#F4F5F7] dark:bg-slate-900">
        
        <Sidebar 
          isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} 
          onCopyWeek={handleCopyWeek} onPasteWeek={handlePasteWeek} 
          onUndo={handleUndo} onRedo={handleRedo}
          canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
          onShowStats={() => setShowStatsModal(true)}
          onClearWeek={() => setDeleteConfirmation({isOpen: true, type: 'week'})} 
          onExportPDF={handleExportPDF}
          onBulkSave={() => setBulkSaveModal({ isOpen: true, startDate: '', endDate: '', programName: '', tags: '', saveType: 'mix', deficitProtocol: 'FDP', level: 'Beginner' })}
          isEditingBlock={isEditingBlock}
          onDeployBlock={handleOpenDeployBlockModal}
          isFourWeekView={currentView === 'four_week'}
          onToggleFourWeekView={() => setCurrentView(currentView === 'four_week' ? 'planner' : 'four_week')}
          onOpenWelcomePack={() => setWelcomePackModal({ isOpen: true, langMode: 'mix' })}
        />        <div className={`flex-1 overflow-x-auto overflow-y-auto pb-24 md:pb-0 relative scroll-smooth w-full transition-all duration-300 ${showLibrary ? 'md:mr-80' : ''}`}>
          
          {currentView === 'four_week' ? (
            renderFourWeekView()
          ) : (
            <>
          
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
              const fullDateStr = isTemplateEditing ? "Training Day" : weekDatesFull[index].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const dayDrills = schedule[day] || [];
              const dayStats = calculateDayVolume(dayDrills);
              const dayCnsPct = (dayStats.cnsLoad + dayStats.structuralLoad) > 0 ? Math.round((dayStats.cnsLoad / (dayStats.cnsLoad + dayStats.structuralLoad)) * 100) : 0;

              return (
              <div key={day} className="flex flex-col w-full print:break-inside-avoid print:mb-0">
                
                <div className={`mb-4 flex flex-col group border-b pb-3 px-1.5 md:px-2 day-header select-none transition-all duration-300 ${
                  completedDays[day] 
                    ? 'bg-green-500/10 dark:bg-green-500/5 border-green-200 dark:border-green-900/30 rounded-xl pt-2' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex items-center gap-1.5">
                      {!isTemplateEditing && (
                        <button
                          onClick={() => handleToggleDayCompleted(day)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            completedDays[day]
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-green-500 bg-white dark:bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      )}
                      <span className="text-[9.5px] md:text-[10.5px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">{day}</span>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400/80 dark:text-slate-600">{fullDateStr}</span>
                  </div>
                  <div className="flex items-start gap-1 md:gap-2 justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="w-6.5 h-6.5 md:w-7 md:h-7 shrink-0 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs md:text-sm font-black text-slate-800 dark:text-slate-205 bg-white dark:bg-slate-900 shadow-sm">
                        {isTemplateEditing ? `D${index + 1}` : weekDates[index]}
                      </div>
                      <textarea
                        data-autoresize
                        value={dayTitles[day] || ''}
                        onChange={(e) => handleDayTitleChange(day, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                          }
                        }}
                        placeholder="Add Workout Focus"
                        rows={1}
                        className="text-[11px] md:text-[13px] font-black text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none w-full placeholder:text-slate-400 resize-none overflow-hidden leading-tight py-0.5"
                        readOnly={isPreviewMode}
                      />
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
          <div className={`${isMobileView ? 'block' : 'block md:hidden'} print:hidden p-4 space-y-4 ${showLibrary ? 'pb-[52vh]' : 'pb-16'}`}>
            {/* Day Selector Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x snap-mandatory">
              {DAYS_OF_WEEK.map((day, index) => {
                const isActive = activeMobileDay === day;
                const dateStr = isTemplateEditing ? `D${index + 1}` : weekDates[index];
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
                    {completedDays[day] && !isTemplateEditing ? (
                      <Check className={`w-3.5 h-3.5 mt-1.5 ${isActive ? 'text-white' : 'text-green-500'}`} />
                    ) : hasExercises ? (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isActive ? 'bg-white' : 'bg-orange-500'}`}></span>
                    ) : (
                      <span className="w-1.5 h-1.5 mt-1.5 opacity-0"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Day Timeline Content */}
            {(() => {
              const day = activeMobileDay;
              const index = DAYS_OF_WEEK.indexOf(day);
              const fullDateStr = isTemplateEditing ? "Training Day" : weekDatesFull[index]?.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) || '';
              const dayDrills = schedule[day] || [];
              const dayStats = calculateDayVolume(dayDrills);
              const dayCnsPct = (dayStats.cnsLoad + dayStats.structuralLoad) > 0 ? Math.round((dayStats.cnsLoad / (dayStats.cnsLoad + dayStats.structuralLoad)) * 100) : 0;

              return (
                <div className={`rounded-3xl p-5 border shadow-md space-y-5 animate-fadeIn transition-all duration-300 ${
                  completedDays[day]
                    ? 'bg-green-500/[0.04] dark:bg-green-500/[0.02] border-green-500/30 dark:border-green-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/80'
                }`}>
                  
                  {/* Header of Active Day */}
                  <div className="flex flex-col pb-3 border-b border-slate-100 dark:border-slate-700/80">
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-2">
                        {!isTemplateEditing && (
                          <button
                            onClick={() => handleToggleDayCompleted(day)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              completedDays[day]
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-slate-350 dark:border-slate-600 hover:border-green-500 bg-white dark:bg-slate-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}
                        <span className="text-xs font-black uppercase text-orange-500 tracking-widest">{day}</span>
                      </div>
                      <span className="text-xs text-slate-400">{fullDateStr}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base font-black text-slate-700 dark:text-slate-250 bg-slate-50 dark:bg-slate-900 shadow-inner">
                          {isTemplateEditing ? `D${index + 1}` : weekDates[index]}
                        </div>
                        <textarea 
                          data-autoresize
                          value={dayTitles[day] || ''} 
                          onChange={(e) => handleDayTitleChange(day, e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                            }
                          }}
                          placeholder="Add Focus" 
                          rows={1}
                          className="text-base font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none w-full placeholder:text-slate-400 resize-none overflow-hidden leading-tight py-0.5" 
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
          </>
          )}
        </div>

        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
           <div className={`h-full absolute right-0 transition-all duration-300 ${showLibrary ? 'w-full md:w-80 pointer-events-auto' : 'w-0 md:w-0 pointer-events-none'}`} onDragOver={handleDragOver} onDrop={handleLibraryDropzone}>
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
               onRenameProgram={handleRenameProgramBlock}
               onEditProgram={(prog) => {
                 setSelectedMesoId(prog.id);
                 handleToast(`Editing Meso-Cycle: ${prog.program_name}`);
               }}
               onEditMacro={(macro) => {
                 setSelectedMacroId(macro.id);
                 handleToast(`Editing Macro-Cycle: ${macro.program_name}`);
               }}
               onApplyExercise={handleApplyLibraryExercise}
             />
           </div>
        </div>

        </div>
      )}

    </div>
  );
}