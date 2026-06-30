import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Calendar, Plus, Trash2, Edit2, Check, HelpCircle, 
  Sparkles, Dumbbell, Play, AlertTriangle, Save
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
    title: "Max Force Deficit Protocol (FDP)",
    englishTitle: "Max Force Deficit Protocol",
    focus: "Build a solid foundation of absolute strength, muscular endurance, and recruitment of fast-twitch motor units.",
    metrics: [
      { label: "Contraction Type", value: "Eccentric Control -> Concentric Acceleration" },
      { label: "Velocity Target", value: "0.30 - 0.50 m/s" },
      { label: "Velocity Loss Limit", value: "10% - 15% (Strength/Hypertrophy)" },
      { label: "Contact Time", value: "Not critical (> 250ms)" },
      { label: "Load Target", value: "80% - 90% 1RM" }
    ],
    tips: [
      "Focus on heavy compound movements (Squats, Bench Press, Deadlift).",
      "Maintain adequate rest time (3-5 minutes) between sets to ensure full neural recovery.",
      "Use VBT to adjust daily load: if velocity is above 0.50 m/s, increase weight."
    ]
  },
  EDP: {
    title: "Elastic SSC Deficit Protocol (EDP)",
    englishTitle: "Elastic SSC Deficit Protocol",
    focus: "Develop the ability of muscles and tendons to store and release elastic energy (slow stretch-shortening cycle).",
    metrics: [
      { label: "Contraction Type", value: "Slow SSC (Stretch-Shortening Cycle)" },
      { label: "Velocity Target", value: "0.75 - 1.00 m/s" },
      { label: "Velocity Loss Limit", value: "< 10% (Avoid fatigue, maintain power)" },
      { label: "Contact Time", value: "Moderate (250ms - 400ms)" },
      { label: "Load Target", value: "30% - 60% 1RM (Loaded Jumps)" }
    ],
    tips: [
      "Loaded Squat Jumps and Countermovement Jumps (CMJ).",
      "Avoid muscle failure; the target is maximal explosive reactive power production.",
      "Focus on the speed of transition between descent and ascent (Amortization Phase)."
    ]
  },
  RSD: {
    title: "Reactive Stiffness Deficit Protocol (RSD)",
    englishTitle: "Reactive & Stiffness Deficit",
    focus: "Increase ankle and tendon stiffness to reduce ground contact time and increase force transmission rate.",
    metrics: [
      { label: "Contraction Type", value: "Fast SSC (Rapid Stretch-Shortening)" },
      { label: "Velocity Target", value: "Not applicable (depends on jump height and time)" },
      { label: "Velocity Loss Limit", value: "Avoid drop in height or increase in contact time" },
      { label: "Contact Time", value: "Very fast (< 200ms - 250ms)" },
      { label: "RSI Target", value: "> 2.50 (Reactive Strength Index)" }
    ],
    tips: [
      "Fast plyometrics (Depth Jumps, Hurdle Hops, Pogo Jumps).",
      "Ground should be stiff and contacts performed as if on a very hot surface.",
      "Stop immediately if contact time exceeds 250ms."
    ]
  },
  HVRP: {
    title: "High-Velocity RFD Deficit Protocol (HVRP)",
    englishTitle: "High-Velocity RFD Deficit",
    focus: "Develop maximal neural speed and rapid rate of force development (RFD) with light loads.",
    metrics: [
      { label: "Contraction Type", value: "Ballistic / High-Velocity Acceleration" },
      { label: "Velocity Target", value: "1.10 - 1.30 m/s" },
      { label: "Velocity Loss Limit", value: "< 5% - 8% (Focus on maximum speed)" },
      { label: "Contact Time", value: "Very fast" },
      { label: "Load Target", value: "0% - 30% 1RM (Light/Banded)" }
    ],
    tips: [
      "Light dumbbell push presses, medicine ball throws, and band-resisted exercises.",
      "Execute with maximal intent of movement velocity.",
      "Full recovery rest periods to ensure every repetition is performed at maximum speed."
    ]
  }
};

const getDbDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PREDEFINED_PHASES = [
  { value: 'General Prep', label: 'General Prep / إعداد عام' },
  { value: 'Specific Prep', label: 'Specific Prep / خاص' },
  { value: 'Competition', label: 'Competition / منافسات' },
  { value: 'Deload', label: 'Deload' },
  { value: 'Tapering', label: 'Tapering' },
  { value: 'Unload', label: 'Unload' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Rest', label: 'Rest' },
  { value: 'Championship', label: 'Championship / بطولة' },
  { value: 'None', label: 'None (Custom Name)' }
];

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
  const [seasonPlans, setSeasonPlans] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [stagedDeployments, setStagedDeployments] = useState([]);
  const [weekTags, setWeekTags] = useState({});
  const [seasonStartDate, setSeasonStartDate] = useState(() => getDbDateStr(new Date()));
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState(() => getDbDateStr(new Date()));
  const [showRenameSeasonModal, setShowRenameSeasonModal] = useState(false);
  const [renameSeasonName, setRenameSeasonName] = useState('');
  const [showDeploySeasonModal, setShowDeploySeasonModal] = useState(false);
  const [deploySeasonAthleteId, setDeploySeasonAthleteId] = useState('');
  const [deploySeasonStartDate, setDeploySeasonStartDate] = useState(() => getDbDateStr(new Date()));

  // Click-and-Drag selection states
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionStartWeek, setSelectionStartWeek] = useState(null);
  const [selectionEndWeek, setSelectionEndWeek] = useState(null);
  const [newSegmentData, setNewSegmentData] = useState({ isOpen: false, startWeek: null, endWeek: null, name: '', color: '#8B5CF6', selectedType: 'General Prep' });

  const fetchSeasonPlans = async () => {
    try {
      const { data } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('type', 'season_plan')
        .order('created_at', { ascending: false });
      setSeasonPlans(data || []);
      if (data && data.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSeasonPlans();
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) {
      setSelectedSeason(null);
      setStagedDeployments([]);
      setWeekTags({});
      setSeasonStartDate(getDbDateStr(new Date()));
      return;
    }
    const active = seasonPlans.find(s => s.id === selectedSeasonId);
    if (!active) return;
    setSelectedSeason(active);
    const details = active.weeks?.[0] || {};
    setStagedDeployments(details.deployments || []);
    setWeekTags(details.week_tags || {});
    setSeasonStartDate(details.start_date || getDbDateStr(new Date()));
  }, [selectedSeasonId, seasonPlans]);

  const handleCreateSeasonPlan = async () => {
    if (!newSeasonName.trim()) {
      handleToast('Please enter plan name!');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        program_name: newSeasonName,
        type: 'season_plan',
        weeks: [
          {
            isSeasonPlan: true,
            start_date: newSeasonStartDate,
            deployments: [],
            week_tags: {}
          }
        ]
      };
      const { data, error } = await supabase
        .from('agilitylap_programs')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        handleToast('Season plan created successfully!');
        setShowNewSeasonModal(false);
        setNewSeasonName('');
        await fetchSeasonPlans();
        setSelectedSeasonId(data[0].id);
      } else {
        handleToast('Error creating season plan');
      }
    } catch (err) {
      console.error(err);
      handleToast('Error creating season plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameSeasonPlan = async () => {
    if (!renameSeasonName.trim() || !selectedSeasonId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ program_name: renameSeasonName })
        .eq('id', selectedSeasonId);

      if (!error) {
        handleToast('Plan renamed successfully!');
        setShowRenameSeasonModal(false);
        await fetchSeasonPlans();
      } else {
        handleToast('Error renaming plan');
      }
    } catch (err) {
      console.error(err);
      handleToast('Error renaming plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSeasonPlan = async () => {
    if (!selectedSeasonId || !confirm('Are you sure you want to delete the current season plan?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .delete()
        .eq('id', selectedSeasonId);

      if (!error) {
        handleToast('Season plan deleted!');
        setSelectedSeasonId(null);
        await fetchSeasonPlans();
      } else {
        handleToast('Error deleting plan');
      }
    } catch (err) {
      console.error(err);
      handleToast('Error deleting plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSeasonPlan = async () => {
    if (!selectedSeasonId) return;
    setIsLoading(true);
    try {
      const payloadWeeks = [
        {
          isSeasonPlan: true,
          start_date: seasonStartDate,
          deployments: stagedDeployments,
          week_tags: weekTags
        }
      ];

      const { error } = await supabase
        .from('agilitylap_programs')
        .update({ weeks: payloadWeeks })
        .eq('id', selectedSeasonId);

      if (!error) {
        handleToast('Season plan saved successfully!');
        await fetchSeasonPlans();
      } else {
        handleToast('Error saving plan');
      }
    } catch (err) {
      console.error(err);
      handleToast('Error saving season plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploySeasonPlanToAthlete = async () => {
    if (!selectedSeasonId || !deploySeasonAthleteId) {
      handleToast('Please select an athlete first!');
      return;
    }
    setIsLoading(true);
    try {
      const baseStart = new Date(deploySeasonStartDate);
      
      for (const dep of stagedDeployments) {
        if (!dep.program_id) {
          // Custom phase segment (no underlying program template)
          const blockStartOffsetDays = (dep.start_week - 1) * 7;
          const blockStartDate = new Date(baseStart);
          blockStartDate.setDate(blockStartDate.getDate() + blockStartOffsetDays);

          for (let i = 0; i < dep.weeks_count; i++) {
            const futureWeekStart = new Date(blockStartDate);
            futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));

            for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
              const dayDate = new Date(futureWeekStart);
              dayDate.setDate(dayDate.getDate() + j);

              await supabase.from('agilitylap_workouts').upsert({
                athlete_id: deploySeasonAthleteId,
                workout_date: getDbDateStr(dayDate),
                workout_title: dep.program_name,
                drills: []
              }, { onConflict: 'athlete_id,workout_date' });
            }
          }

          const deployEndDate = new Date(blockStartDate);
          deployEndDate.setDate(deployEndDate.getDate() + (dep.weeks_count * 7) - 1);

          await supabase.from('periodization_deployments').insert([{
            athlete_id: deploySeasonAthleteId,
            program_id: null,
            program_name: dep.program_name,
            start_date: getDbDateStr(blockStartDate),
            end_date: getDbDateStr(deployEndDate),
            color: dep.color || '#8B5CF6'
          }]);

          continue;
        }

        const { data: program } = await supabase
          .from('agilitylap_programs')
          .select('*')
          .eq('id', dep.program_id)
          .single();

        if (!program || !program.weeks) continue;

        const blockStartOffsetDays = (dep.start_week - 1) * 7;
        const blockStartDate = new Date(baseStart);
        blockStartDate.setDate(blockStartDate.getDate() + blockStartOffsetDays);

        for (let i = 0; i < program.weeks.length; i++) {
          const futureWeekStart = new Date(blockStartDate);
          futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
          const weekTemplateObject = program.weeks[i].drills || {};
          const targetBlockTitle = program.weeks[i].title || 'Block Workout';

          for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
            const dayDate = new Date(futureWeekStart);
            dayDate.setDate(dayDate.getDate() + j);

            let clonedDrills = [];
            if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
              clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                ...drill, 
                id: `deployed-season-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
              }));
            } else if (Array.isArray(weekTemplateObject)) {
              clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                ...drill, 
                id: `deployed-season-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
              }));
            }

            await supabase.from('agilitylap_workouts').upsert({
              athlete_id: deploySeasonAthleteId,
              workout_date: getDbDateStr(dayDate),
              workout_title: targetBlockTitle,
              drills: clonedDrills
            }, { onConflict: 'athlete_id,workout_date' });
          }
        }

        const deployEndDate = new Date(blockStartDate);
        deployEndDate.setDate(deployEndDate.getDate() + (program.weeks.length * 7) - 1);

        await supabase.from('periodization_deployments').insert([{
          athlete_id: deploySeasonAthleteId,
          program_id: dep.program_id,
          program_name: dep.program_name,
          start_date: getDbDateStr(blockStartDate),
          end_date: getDbDateStr(deployEndDate),
          color: dep.color
        }]);
      }

      handleToast('Season plan deployed successfully to athlete!');
      setShowDeploySeasonModal(false);
      if (refreshDeploymentsCallback) refreshDeploymentsCallback(deploySeasonAthleteId);
    } catch (err) {
      console.error(err);
      handleToast('Error deploying season plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeasonWeeks = (startStr) => {
    const list = [];
    const base = new Date(startStr);
    for (let w = 0; w < 52; w++) {
      const wkStart = new Date(base);
      wkStart.setDate(wkStart.getDate() + (w * 7));
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 6);
      
      const rangeLabel = `${wkStart.getDate()} ${wkStart.toLocaleDateString('en-US', { month: 'short' })} - ${wkEnd.getDate()} ${wkEnd.toLocaleDateString('en-US', { month: 'short' })}`;
      list.push({
        index: w + 1,
        dateStr: getDbDateStr(wkStart),
        rangeLabel
      });
    }
    return list;
  };

  const handleDropWeekOnSeason = (e, weekNum) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    try {
      const payload = JSON.parse(dataStr);
      if (payload.isExisting) {
        setStagedDeployments(prev => prev.map(dep => {
          if (dep.id === payload.deploymentId) {
            return {
              ...dep,
              start_week: weekNum
            };
          }
          return dep;
        }));
        handleToast('Training block moved successfully');
      } else {
        const { programId, programName, weeksCount } = payload;
        const newDeploy = {
          id: `season-staged-${Date.now()}`,
          program_id: programId,
          program_name: programName,
          start_week: weekNum,
          weeks_count: weeksCount,
          color: PHASE_COLORS[stagedDeployments.length % PHASE_COLORS.length].hex
        };
        setStagedDeployments(prev => [...prev, newDeploy]);
        handleToast('Training block added successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropOnGrid = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const weekNum = Math.max(1, Math.min(52, Math.floor(x / 140) + 1));
    handleDropWeekOnSeason(e, weekNum);
  };

  const handleMouseDownWeek = (weekIndex) => {
    setIsDraggingSelection(true);
    setSelectionStartWeek(weekIndex);
    setSelectionEndWeek(weekIndex);
  };

  const handleMouseEnterWeek = (weekIndex) => {
    if (isDraggingSelection) {
      setSelectionEndWeek(weekIndex);
    }
  };

  const handleMouseUpTimeline = () => {
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      const start = Math.min(selectionStartWeek, selectionEndWeek);
      const end = Math.max(selectionStartWeek, selectionEndWeek);
      
      setNewSegmentData({
        isOpen: true,
        startWeek: start,
        endWeek: end,
        selectedType: 'General Prep',
        name: 'General Prep',
        color: '#8B5CF6'
      });
    }
  };

  const renderSeasonPlanner = () => {
    const weeksList = getSeasonWeeks(seasonStartDate);
    const mesoBlocks = programs ? programs.filter(p => p.type !== 'macro_block' && p.type !== 'season_plan') : [];

    // Calculate vertical tracks for Gantt bars
    const sortedDeploys = [...stagedDeployments].sort((a, b) => a.start_week - b.start_week);
    const allocatedDeployments = [];
    sortedDeploys.forEach(dep => {
      let track = 0;
      while (true) {
        const overlaps = allocatedDeployments.some(ad => 
          ad.track === track && 
          !(dep.start_week >= ad.start_week + ad.weeks_count || 
            dep.start_week + dep.weeks_count <= ad.start_week)
        );
        if (!overlaps) break;
        track++;
      }
      allocatedDeployments.push({ ...dep, track });
    });
    const maxTracks = allocatedDeployments.length > 0 ? Math.max(...allocatedDeployments.map(d => d.track)) + 1 : 1;

    return (
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
        {/* Sidebar: Draggable Meso-Blocks */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Available Blocks to Drag</h4>
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
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 rounded-2xl cursor-grab active:cursor-grabbing hover:border-orange-500 dark:hover:border-orange-500/50 transition-all select-none group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-500 shrink-0">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-205 truncate group-hover:text-orange-500 transition-colors">
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
                <span className="text-[10px] text-slate-400">No Meso-Blocks available.</span>
              </div>
            )}
          </div>
        </div>

        {/* Annual Timeline Gantt Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="space-y-6">
            
            {/* Planner Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-800/85 p-4 border border-slate-200/50 dark:border-slate-800 rounded-[20px] shadow-sm">
              <div className="flex items-center gap-2" dir="ltr">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500">Viewing:</span>
                <select
                  value={selectedSeasonId || ''}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="text-xs font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-755 p-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 dark:text-white"
                >
                  {seasonPlans.length === 0 ? (
                    <option value="">-- No Season Plans --</option>
                  ) : (
                    seasonPlans.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.program_name}</option>
                    ))
                  )}
                </select>
                <button onClick={() => { setNewSeasonName(''); setShowNewSeasonModal(true); }} className="p-2 bg-slate-50 hover:bg-orange-50 hover:text-orange-500 dark:bg-slate-900 dark:hover:bg-orange-950/20 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl transition-all" title="New Season Plan"><Plus className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setRenameSeasonName(selectedSeason?.program_name || ''); setShowRenameSeasonModal(true); }} className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl transition-all" title="Rename Plan" disabled={!selectedSeasonId}><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={handleDeleteSeasonPlan} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 dark:bg-slate-900 dark:hover:bg-red-950/20 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl transition-all" title="Delete Plan" disabled={!selectedSeasonId}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>

              {selectedSeasonId && (
                <div className="flex gap-2">
                  <button onClick={handleSaveSeasonPlan} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save Changes</button>
                  <button onClick={() => { setDeploySeasonAthleteId(''); setShowDeploySeasonModal(true); }} className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Deploy to Athlete</button>
                </div>
              )}
            </div>

            {selectedSeasonId ? (
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
                {/* Horizontal Gantt scrollable board */}
                <div className="overflow-x-auto relative min-h-[580px] p-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800" dir="ltr">
                  <div 
                    className="relative" 
                    style={{ width: `${52 * 140}px` }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnGrid}
                  >
                    
                    {/* Vertical Grid dividers behind */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: 52 }).map((_, idx) => (
                        <div key={idx} className="w-[140px] border-l border-slate-100 dark:border-slate-800 h-full shrink-0" />
                      ))}
                    </div>

                    {/* Row 1: Week headers */}
                    <div 
                      className="flex border-b border-slate-200 dark:border-slate-700 pb-2 relative z-10"
                      onMouseUp={handleMouseUpTimeline}
                    >
                      {weeksList.map((wk, idx) => {
                        const isSelected = isDraggingSelection && 
                          selectionStartWeek !== null && selectionEndWeek !== null &&
                          wk.index >= Math.min(selectionStartWeek, selectionEndWeek) && 
                          wk.index <= Math.max(selectionStartWeek, selectionEndWeek);

                        return (
                          <div
                            key={idx}
                            onMouseDown={() => handleMouseDownWeek(wk.index)}
                            onMouseEnter={() => handleMouseEnterWeek(wk.index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropWeekOnSeason(e, wk.index)}
                            className={`w-[140px] px-2 flex flex-col items-center justify-center text-center select-none shrink-0 cursor-ew-resize transition-all ${
                              isSelected ? 'bg-orange-500/20 dark:bg-orange-500/30 border-t-2 border-b-2 border-orange-500' : ''
                            }`}
                          >
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-255 bg-slate-100 dark:bg-slate-800'
                            }`}>W{wk.index}</span>
                            <span className="text-[8px] text-slate-400 font-bold mt-1 tracking-tight">{wk.rangeLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Row 2: Microcycle / Game tag input row */}
                    <div className="flex border-b border-slate-150 dark:border-slate-855 py-2 relative z-10 bg-slate-50/50 dark:bg-slate-950/20">
                      {weeksList.map((wk, idx) => (
                        <div key={idx} className="w-[140px] px-1.5 flex items-center justify-center shrink-0">
                          <input
                            type="text"
                            placeholder="Game/Note..."
                            value={weekTags[wk.index] || ''}
                            onChange={(e) => {
                              const updated = { ...weekTags, [wk.index]: e.target.value };
                              setWeekTags(updated);
                            }}
                            className="w-full text-center text-[9px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Row 3: Horizontal Gantt Track */}
                    <div className="relative mt-4" style={{ height: `${maxTracks * 55}px` }}>
                      {allocatedDeployments.map((dep) => {
                        const startIdx = dep.start_week - 1;
                        const left = startIdx * 140;
                        const width = dep.weeks_count * 140;
                        const top = dep.track * 52;
                        
                        return (
                          <div
                            key={dep.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                isExisting: true,
                                deploymentId: dep.id,
                                weeksCount: dep.weeks_count
                              }));
                            }}
                            className="absolute px-3 py-2 rounded-xl border text-[9.5px] font-black uppercase tracking-wider shadow-sm flex items-center justify-between gap-2 text-white transition-all select-none group/pill animate-fadeIn cursor-pointer"
                            style={{
                              left: `${left + 4}px`,
                              width: `${width - 8}px`,
                              top: `${top}px`,
                              height: '42px',
                              backgroundColor: dep.color,
                              borderColor: dep.color,
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                          >
                            <span className="truncate pr-1 select-none font-bold" title={dep.program_name}>{dep.program_name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStagedDeployments(prev => prev.filter(d => d.id !== dep.id));
                              }}
                              className="p-1 hover:bg-white/20 rounded-md transition-all shrink-0 select-none opacity-0 group-hover/pill:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800/40 p-12 rounded-[24px] text-center border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                <span className="text-xs text-slate-400 dark:text-slate-500">Please create a new season plan to start.</span>
                <button
                  onClick={() => { setNewSeasonName(''); setShowNewSeasonModal(true); }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create New Season Plan
                </button>
              </div>
            )}

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
      handleToast('Error loading block templates.');
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
      handleToast('Please enter template name!');
      return;
    }
    setIsLoading(true);
    try {
      const defaultPhases = [
        { name: 'Base Building', durationWeeks: 12, weeks: [] },
        { name: 'Max Strength', durationWeeks: 8, weeks: [] },
        { name: 'Rapid Power', durationWeeks: 6, weeks: [] },
        { name: 'Peak & Jump Prep', durationWeeks: 4, weeks: [] }
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
        handleToast(`Template "${newBlockName}" created successfully!`);
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
      handleToast('Error creating template.');
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
        handleToast('Name changed successfully!');
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
      handleToast('Error editing name.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deleting block template
  const handleDeleteBlockClick = async (blockId, name) => {
    if (!window.confirm(`Are you sure you want to delete block template "${name}" permanently?`)) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .delete()
        .eq('id', blockId);
      if (!error) {
        handleToast('Template deleted successfully!');
        if (selectedBlockId === blockId) {
          setSelectedBlockId(null);
        }
        await fetchBlockTemplates();
        await refreshDeploymentsCallback();
      }
    } catch (err) {
      console.error(err);
      handleToast('Error deleting template.');
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
        handleToast('Phase duration updated successfully!');
      }
    } catch (err) {
      console.error(err);
      handleToast('Error updating phase duration.');
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
      handleToast('Error updating week type.');
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
      handleToast('Error updating week title.');
    }
  };

  // Apply template block to player schedule from Periodization Planner
  const handleDeployBlockSubmit = async () => {
    const { blockId, athleteId, startDate } = showDeployModal;
    if (!blockId || !athleteId || !startDate) {
      handleToast('Please fill all fields!');
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

      handleToast(`Template "${program.program_name}" applied successfully!`);
      onClose(); // close planner modal
    } catch (err) {
      console.error(err);
      handleToast('Error applying block template.');
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-1 print:hidden" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-[98vw] h-[98vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
        
        {/* Main Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                Training Block Designer & Programs — Master Block Designer
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
                Build and edit periodization plans as standalone programs and deploy them to any athlete in one click.
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
            Block Designer
          </button>
          <button
            onClick={() => setActiveTab('season_planner')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'season_planner' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Season Planner
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
                <h4 className="text-base font-black text-slate-800 dark:text-white">No Block Template Selected</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  Select a template from the sidebar directory to edit, or click "Create New Block Template" to build a new program.
                </p>
                <button
                  onClick={() => setShowCreateBlockModal(true)}
                  className="mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create New Block Template
                </button>
              </div>
            ) : (
              /* Template selected content */
              <div className="space-y-6">
                
                {/* Selected block details header */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-800 dark:text-white">{blockData.program_name || 'Block Template'}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                        {blockData.level || 'Beginner'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                        {blockData.deficitProtocol || 'FDP'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      General periodized macrocycle divided into 4 consecutive phases (Base &rarr; Strength &rarr; Power &rarr; Peak)
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeployModal({ isOpen: true, blockId: selectedBlockId, athleteId: athlete?.id || '', startDate: '' })}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4 text-white" /> Deploy Template to Athlete
                    </button>
                    {activeMesoPhaseIdx !== null && (
                      <button
                        onClick={() => setActiveMesoPhaseIdx(null)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs"
                      >
                        Back to Phase List
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
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Macrocycle Phases</h5>
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
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phase {pIdx + 1}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${themeColor.text} ${themeColor.bg}`}>
                                      {weeksCount} Weeks
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
                                          title={`Week ${wIdx + 1}: ${w.type}`}
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
                                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">Duration:</span>
                                    <select
                                      value={weeksCount}
                                      onChange={(e) => handleUpdatePhaseDuration(pIdx, Number(e.target.value))}
                                      className="text-[11px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-700 dark:text-white outline-none"
                                    >
                                      {[4, 6, 8, 12, 16, 24].map(w => (
                                        <option key={w} value={w}>{w} Weeks</option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => setActiveMesoPhaseIdx(pIdx)}
                                    className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                                  >
                                    View & Tag Weeks 🔍
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
                                  Weeks of Phase: {phase?.name}
                                </h5>
                                <button
                                  onClick={() => setActiveMesoPhaseIdx(null)}
                                  className="text-[11px] font-bold text-orange-500 hover:underline"
                                >
                                  &larr; Back to Phases View
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
                                        <span className="text-xs font-black text-slate-800 dark:text-white">Week {wIdx + 1}</span>
                                        
                                        {/* Micro focus selector pills */}
                                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                          {[
                                            { key: 'None', label: 'None', activeColor: 'bg-slate-500 text-white font-black' },
                                            { key: 'Load', label: 'Load', activeColor: 'bg-amber-500 text-white font-black shadow-sm shadow-amber-500/20' },
                                            { key: 'Deload', label: 'Deload', activeColor: 'bg-emerald-500 text-white font-black shadow-sm shadow-emerald-500/20' },
                                            { key: 'Test', label: 'Test', activeColor: 'bg-blue-500 text-white font-black shadow-sm shadow-blue-500/20' }
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
                                        placeholder="e.g. High Load Week, Deload Week..."
                                        value={week.title || ''}
                                        onChange={(e) => handleUpdateWeekTitle(activeMesoPhaseIdx, wIdx, e.target.value)}
                                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 dark:text-white font-bold"
                                      />

                                      <button
                                        onClick={() => handleEditWeekWorkouts(activeMesoPhaseIdx, wIdx)}
                                        className="w-full py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-black text-[11px] shadow-sm flex items-center justify-center gap-1.5"
                                      >
                                        <Dumbbell className="w-3.5 h-3.5" /> Edit Week Workouts on Weekly Grid
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
                            <span className="text-[10px] font-extrabold text-violet-500 block">💡 Sports Science Tips:</span>
                            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                              {guide.tips.map((tip, tIdx) => (
                                <li key={tIdx} className="text-left list-none relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-violet-500">
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
                <span className="text-xs font-black text-slate-450 uppercase tracking-wider">Meso Block Templates</span>
                <button
                  onClick={() => setShowCreateBlockModal(true)}
                  className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center"
                  title="Create New Template"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List scroll container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {blockTemplates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-455">No templates saved yet</div>
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
                        <div className="truncate flex-1 pl-2 text-left">
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
                            title="Rename Template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlockClick(template.id, template.program_name);
                            }}
                            className="p-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-500 rounded-lg transition-all"
                            title="Delete Template"
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> Create New Block Template
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Template Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Max Force Deficit Block"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Deficit Protocol:</label>
                  <select
                    value={newBlockDeficit}
                    onChange={(e) => setNewBlockDeficit(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="FDP">FDP (Max Force Deficit)</option>
                    <option value="EDP">EDP (Elastic SSC Deficit)</option>
                    <option value="RSD">RSD (Stiffness Deficit)</option>
                    <option value="HVRP">HVRP (High-Velocity RFD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Level:</label>
                  <select
                    value={newBlockLevel}
                    onChange={(e) => setNewBlockLevel(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCreateBlock}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Confirm Create
              </button>
              <button
                onClick={() => setShowCreateBlockModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: Rename Block Modal */}
      {showRenameModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-orange-500" /> Rename Template
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">New Name:</label>
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
                Save
              </button>
              <button
                onClick={() => setShowRenameModal({ isOpen: false, blockId: null, currentName: '', newName: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 3: Deploy Template Modal */}
      {showDeployModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500 animate-pulse" /> Deploy Template to Athlete
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Select Athlete:</label>
                <select
                  value={showDeployModal.athleteId}
                  onChange={(e) => setShowDeployModal({ ...showDeployModal, athleteId: e.target.value })}
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
                Deploy Block
              </button>
              <button
                onClick={() => setShowDeployModal({ isOpen: false, blockId: null, athleteId: '', startDate: '' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 4: Create Season Plan Modal */}
      {showNewSeasonModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> Create New Season Plan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Plan Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Football Season Plan"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Season Start Date:</label>
                <input
                  type="date"
                  value={newSeasonStartDate}
                  onChange={(e) => setNewSeasonStartDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCreateSeasonPlan}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Confirm Create
              </button>
              <button
                onClick={() => setShowNewSeasonModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 5: Rename Season Plan Modal */}
      {showRenameSeasonModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-orange-500" /> Rename Season Plan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">New Name:</label>
                <input
                  type="text"
                  value={renameSeasonName}
                  onChange={(e) => setRenameSeasonName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleRenameSeasonPlan}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Save Name
              </button>
              <button
                onClick={() => setShowRenameSeasonModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 6: Deploy Season Plan Modal */}
      {showDeploySeasonModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-500 animate-pulse" /> Deploy Season Plan to Athlete
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Select Athlete:</label>
                <select
                  value={deploySeasonAthleteId}
                  onChange={(e) => setDeploySeasonAthleteId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                >
                  <option value="">-- Select Athlete --</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date (W1 Deployment):</label>
                <input
                  type="date"
                  value={deploySeasonStartDate}
                  onChange={(e) => setDeploySeasonStartDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleDeploySeasonPlanToAthlete}
                className="px-6 py-2.5 bg-violet-650 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Deploy Season Plan
              </button>
              <button
                onClick={() => setShowDeploySeasonModal(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 7: Create Custom Phase Segment Modal */}
      {newSegmentData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-left border border-slate-200 dark:border-slate-700 font-sans">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> Create Custom Phase
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create a custom phase from <span className="font-bold text-slate-700 dark:text-slate-200">Week {newSegmentData.startWeek}</span> to <span className="font-bold text-slate-700 dark:text-slate-200">Week {newSegmentData.endWeek}</span> ({newSegmentData.endWeek - newSegmentData.startWeek + 1} weeks).
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phase Type:</label>
                <select
                  value={newSegmentData.selectedType || 'General Prep'}
                  onChange={(e) => {
                    const type = e.target.value;
                    const nameVal = type === 'None' ? '' : type;
                    setNewSegmentData({ ...newSegmentData, selectedType: type, name: nameVal });
                  }}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                >
                  {PREDEFINED_PHASES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phase Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Strength Phase, Conditioning..."
                  value={newSegmentData.name}
                  onChange={(e) => setNewSegmentData({ ...newSegmentData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={newSegmentData.selectedType !== 'None'}
                  autoFocus={newSegmentData.selectedType === 'None'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Theme Color:</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { hex: '#8B5CF6', name: 'violet' },
                    { hex: '#3B82F6', name: 'blue' },
                    { hex: '#10B981', name: 'emerald' },
                    { hex: '#F59E0B', name: 'amber' },
                    { hex: '#EF4444', name: 'rose' },
                    { hex: '#EC4899', name: 'pink' }
                  ].map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewSegmentData({ ...newSegmentData, color: c.hex })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${newSegmentData.color === c.hex ? 'border-slate-800 dark:border-white scale-110 shadow-sm' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  if (!newSegmentData.name.trim()) return;
                  const newDep = {
                    id: `custom-segment-${Date.now()}-${Math.random()}`,
                    program_id: null,
                    program_name: newSegmentData.name,
                    weeks_count: newSegmentData.endWeek - newSegmentData.startWeek + 1,
                    start_week: newSegmentData.startWeek,
                    color: newSegmentData.color
                  };
                  setStagedDeployments(prev => [...prev, newDep]);
                  setNewSegmentData({ isOpen: false, startWeek: null, endWeek: null, name: '', color: '#8B5CF6' });
                  handleToast('Custom phase created successfully');
                }}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setNewSegmentData({ isOpen: false, startWeek: null, endWeek: null, name: '', color: '#8B5CF6' })}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
