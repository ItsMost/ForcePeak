import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Layers, Bookmark, CalendarDays, Calendar, Tag, Sparkles, Edit3, X, BookOpen, Activity, Zap, Shield, Target, Dumbbell } from 'lucide-react';
import { ELITE_EXERCISE_CATEGORIES, SUBCATEGORIES, getUnifiedCategory } from '../../data/constants.js';

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'max_strength_lower', label: 'Strength Lower' },
  { key: 'max_strength_upper', label: 'Strength Upper' },
  { key: 'rofd_ballistics', label: 'RFD & Power' },
  { key: 'elasticity_plyo', label: 'Elastic Plyos' },
  { key: 'isometric_tendon', label: 'Isometrics' },
  { key: 'sprint_speed', label: 'Sprint & Speed' },
  { key: 'trunk_rotation', label: 'Trunk & Core' },
  { key: 'prehab_mobility', label: 'Prehab & Mobility' }
];

export default function ExerciseLibrary({ 
  showLibrary, setShowLibrary, library, handleLibraryDragStart, 
  setAddExerciseModal, onDeleteDrill, onEditDrill, onDeleteTemplate,
  onOpenCreateProgram, programs = [], onDeleteProgram, onApplyProgram,
  onApplyWeekTemplate,
  onApplyDayTemplate,
  onOpenCreateMacro,
  onApplyMacro,
  onDeleteMacro,
  onEditProgram,
  onEditMacro,
  onRenameProgram,
  onApplyExercise
}) {
  const [activeTab, setActiveTab] = useState('exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [tempProgramName, setTempProgramName] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  // Filter Drills by Search Query, Category Tab, and Subcategory Tab
  const filteredDrills = (library.drills || []).filter(drill => {
    const title = (drill.title || drill.name || '').toLowerCase();
    const details = (drill.details || '').toLowerCase();
    const muscle = (drill.primaryMuscle || '').toLowerCase();
    const tags = Array.isArray(drill.tags) ? drill.tags.join(' ').toLowerCase() : String(drill.tags || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || title.includes(q) || details.includes(q) || muscle.includes(q) || tags.includes(q);

    const unifiedCat = getUnifiedCategory(drill);
    const rawType = (drill.type || '').toLowerCase();

    const matchesCategory = activeCategory === 'all' || 
      unifiedCat === activeCategory || 
      rawType === activeCategory;
    
    let matchesSubcategory = true;
    if (activeSubcategory !== 'all') {
      matchesSubcategory = (drill.subcategory || '').toLowerCase() === activeSubcategory.toLowerCase();
    }
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Filter Day Templates strictly (type === 'day')
  const filteredDayTemplates = (library.templates || []).filter(t => 
    t.type === 'day' && (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Micro-Cycles (Week Templates strictly, type === 'week')
  const filteredWeekTemplates = (library.templates || []).filter(t => 
    t.type === 'week' && (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Meso-Cycles (Blocks where type !== 'macro')
  const filteredMesoPrograms = (programs || []).filter(prog => {
    if (prog.type === 'macro' || prog.type === 'macro_block') return false;
    const matchesName = (prog.program_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const firstWeekTags = (prog.weeks?.[0]?.blockTags || '').toLowerCase();
    const matchesTags = firstWeekTags.includes(searchQuery.toLowerCase());
    return matchesName || matchesTags;
  });

  // Filter Macro-Cycles (Programs where type === 'macro')
  const filteredMacroPrograms = (programs || []).filter(prog => {
    if (prog.type !== 'macro') return false;
    const matchesName = (prog.program_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const tagsStr = (prog.tags || '').toLowerCase();
    const matchesTags = tagsStr.includes(searchQuery.toLowerCase());
    return matchesName || matchesTags;
  });

  // Helper to render subtle pastel badge for tags
  const renderTagBadge = (tag, idx) => {
    const tLower = tag.toLowerCase();
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
    if (tLower.includes('high cns') || tLower.includes('max')) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
    } else if (tLower.includes('low cns') || tLower.includes('prehab') || tLower.includes('recovery')) {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
    } else if (tLower.includes('reactive') || tLower.includes('plyo') || tLower.includes('fast ssc')) {
      colorClass = 'bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40';
    } else if (tLower.includes('eccentric') || tLower.includes('tempo') || tLower.includes('iso')) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    }

    return (
      <span key={idx} className={`text-[10px] px-1.5 py-0.2 font-bold uppercase rounded border ${colorClass}`}>
        {tag}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay with subtle blur */}
      {showLibrary && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setShowLibrary(false)}
        />
      )}

      {/* Main Drawer Container - Clean Light Theme */}
      <div className={`fixed inset-0 top-0 bottom-0 left-0 right-0 z-[999] h-screen w-screen bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col shadow-2xl rounded-none border-none
        ${showLibrary ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}
        md:top-16 md:bottom-auto md:left-auto md:right-0 md:w-96 md:h-[calc(100vh-64px)] md:border-l md:border-slate-200/80 md:dark:border-slate-800 md:rounded-none md:shadow-xl md:opacity-100 md:pointer-events-auto
        ${showLibrary ? 'md:translate-y-0 md:translate-x-0' : 'md:translate-y-0 md:translate-x-full'}
      `}>
        
        {/* Mobile Header Bar - Refined Light Design */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b border-slate-200/80 dark:border-slate-800 shrink-0 select-none shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Exercise Library</h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">PEAK FORCE Athletic Database</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLibrary(false)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-200 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Desktop Header Bar */}
        <div className="hidden md:flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Exercise Library</span>
          </div>
          <button 
            onClick={() => setShowLibrary(false)} 
            className="text-xs font-bold text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Library"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      
        {/* Tabs Navigation Switcher */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-2 gap-1 shrink-0 overflow-x-auto scrollbar-none">
          <button onClick={() => { setActiveTab('exercises'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'exercises' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
            <Layers className="w-3 h-3 shrink-0" /> Exercises
          </button>
          <button onClick={() => { setActiveTab('days'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
            <Sparkles className="w-3 h-3 shrink-0" /> Days
          </button>
          <button onClick={() => { setActiveTab('templates'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'templates' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
            <Bookmark className="w-3 h-3 shrink-0" /> Weekly
          </button>
          <button onClick={() => { setActiveTab('programs'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'programs' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
            <CalendarDays className="w-3 h-3 shrink-0" /> Meso
          </button>
          <button onClick={() => { setActiveTab('macro'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'macro' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
            <Calendar className="w-3 h-3 shrink-0" /> Macro
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'templates' ? 'Weekly Templates' : activeTab === 'programs' ? 'Meso-Cycles' : activeTab === 'macro' ? 'Macro-Cycles' : 'exercises by title, muscle, or tag (e.g. High CNS)...'}`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-medium shadow-2xs placeholder:text-slate-400" 
            />
          </div>

          {activeTab === 'exercises' && (
            <div className="space-y-2">
              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
                {CATEGORY_TABS.map(cat => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <button 
                      key={cat.key} 
                      onClick={() => { setActiveCategory(cat.key); setActiveSubcategory('all'); }} 
                      className={`px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-wider font-bold transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-xs border border-blue-600' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Subcategory Filter Chips */}
              {SUBCATEGORIES[activeCategory] && (
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold border-t border-slate-200/60 dark:border-slate-800 pt-2">
                  {Object.entries(SUBCATEGORIES[activeCategory]).map(([subKey, subLabel]) => {
                    const isSubActive = activeSubcategory === subKey;
                    return (
                      <button 
                        key={subKey} 
                        onClick={() => setActiveSubcategory(subKey)} 
                        className={`px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider transition-all ${
                          isSubActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shadow-2xs font-black' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {subLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Container Lists View */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30 dark:bg-slate-900/20">
          
          {/* Tab 1: Exercises Module Archive */}
          {activeTab === 'exercises' && (
            <>
              <button 
                onClick={() => setAddExerciseModal({ 
                  isOpen: true, 
                  id: null, 
                  title: '', 
                  details: '', 
                  type: 'max_strength_lower', 
                  category: 'max_strength_lower',
                  subcategory: '', 
                  percentage: '', 
                  bwRatio: '', 
                  weight: '', 
                  weightUnit: 'kg', 
                  sets: '', 
                  reps: '', 
                  rest: '', 
                  unit: 'reps', 
                  distance: '', 
                  video_url: '', 
                  tempo: '', 
                  focus: '', 
                  meanVelocity: '', 
                  peakVelocity: '', 
                  velocityLoss: '' 
                })} 
                className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500/60 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-bold transition-all mb-3 bg-white dark:bg-slate-850 hover:bg-blue-50/20"
              >
                <Plus className="w-4 h-4" /> Add Global Exercise
              </button>
              
              {filteredDrills.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs font-bold text-slate-400">No exercises found for this category</p>
                  <p className="text-[10px] text-slate-400/80 mt-1">Try switching to &quot;All&quot; or clear your search</p>
                </div>
              ) : (
                filteredDrills.map(drill => {
                  const unifiedCat = getUnifiedCategory(drill);
                  const displayCatName = ELITE_EXERCISE_CATEGORIES[unifiedCat] || drill.type;
                  const tagsList = Array.isArray(drill.tags) 
                    ? drill.tags 
                    : (drill.tags ? String(drill.tags).split(',').map(t => t.trim()) : []);

                  return (
                    <div 
                      key={drill.id} 
                      draggable 
                      onDragStart={(e) => handleLibraryDragStart(e, drill, false)} 
                      className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group flex justify-between items-start gap-2 flex-wrap"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Category Badge */}
                          <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200/70 dark:border-slate-700">
                            {displayCatName.replace('Max Strength ', '').replace('Rate of Force Development & ', '').replace('Elasticity & ', '').replace('Mechanics & ', '')}
                          </span>
                          
                          {/* Subcategory Badge */}
                          {drill.subcategory && (
                            <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/60 dark:border-blue-800/40">
                              {SUBCATEGORIES[unifiedCat]?.[drill.subcategory] || SUBCATEGORIES[drill.type]?.[drill.subcategory] || drill.subcategory.replace(/_/g, ' ')}
                            </span>
                          )}

                          {/* Exercise Title */}
                          <h5 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">
                            {drill.title || drill.name}
                          </h5>
                          
                          {/* Target Weight Badge */}
                          {(drill.weight !== undefined && drill.weight !== null && drill.weight !== '') && (
                            <span className="text-[10px] px-1.5 py-0.2 font-black uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/50 dark:border-blue-800/40">
                              {drill.weight} {drill.weightUnit || drill.weight_unit || 'kg'}
                            </span>
                          )}

                          {/* Intensity Percentage */}
                          {drill.percentage && (
                            <span className="text-[10px] px-1.5 py-0.2 font-bold uppercase bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded border border-orange-200/50 dark:border-orange-800/40">
                              {drill.percentage}% 1RM
                            </span>
                          )}

                          {/* Velocity VBT Metrics */}
                          {(drill.meanVelocity || drill.velocity_target_m_s || drill.mean_velocity) && (
                            <span className="text-[10px] px-1.5 py-0.2 font-black uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/50 dark:border-blue-800/40">
                              MV: {drill.meanVelocity || drill.velocity_target_m_s || drill.mean_velocity} m/s
                            </span>
                          )}
                          {(drill.peakVelocity || drill.peak_velocity || drill.rpe) && (
                            <span className="text-[10px] px-1.5 py-0.2 font-black uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/50 dark:border-blue-800/40">
                              PV: {drill.peakVelocity || drill.peak_velocity || drill.rpe} m/s
                            </span>
                          )}
                        </div>

                        {/* Muscle & Tags Row */}
                        {(drill.primaryMuscle || tagsList.length > 0) && (
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {drill.primaryMuscle && (
                              <span className="text-[10px] px-1.5 py-0.2 font-medium bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                🎯 {drill.primaryMuscle}
                              </span>
                            )}
                            {tagsList.map((tag, tIdx) => renderTagBadge(tag, tIdx))}
                          </div>
                        )}

                        {drill.details && <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 truncate">{drill.details}</p>}
                        
                        {/* Quick-Add Day Badges */}
                        <div className="flex flex-wrap gap-1 mt-2 items-center">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Add:</span>
                          {[
                            { key: 'Saturday', label: 'Sat' },
                            { key: 'Sunday', label: 'Sun' },
                            { key: 'Monday', label: 'Mon' },
                            { key: 'Tuesday', label: 'Tue' },
                            { key: 'Wednesday', label: 'Wed' },
                            { key: 'Thursday', label: 'Thu' },
                            { key: 'Friday', label: 'Fri' }
                          ].map(dayObj => (
                            <button 
                              key={dayObj.key}
                              onClick={(e) => { e.stopPropagation(); onApplyExercise && onApplyExercise(drill, dayObj.key); }}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                            >
                              {dayObj.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEditDrill(drill); }} className="p-1 text-slate-400 hover:text-blue-500" title="Edit Drill"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteDrill(drill.id); }} className="p-1 text-slate-400 hover:text-red-500" title="Delete Drill"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Tab 2: Single Day Blueprint Templates */}
          {activeTab === 'days' && (
            filteredDayTemplates.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No saved day templates found</p>
            ) : (
              filteredDayTemplates.map(tpl => {
                const drillCount = tpl.drills?.length || 0;
                return (
                  <div 
                    key={tpl.id} 
                    draggable={true} 
                    onDragStart={(e) => handleLibraryDragStart(e, tpl, true)} 
                    className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/60 dark:border-blue-800/40 shrink-0">Day</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate" title={tpl.title}>{tpl.title}</span>
                      </div>
                      <button 
                        onClick={() => onDeleteTemplate(tpl.id)} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>⚡ {drillCount} Exercises</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Drag or tap to apply</span>
                    </div>

                    {/* Quick-Apply Day Badges */}
                    <div className="flex flex-wrap gap-1 mt-1 justify-start">
                      {[
                        { key: 'Saturday', label: 'Sat' },
                        { key: 'Sunday', label: 'Sun' },
                        { key: 'Monday', label: 'Mon' },
                        { key: 'Tuesday', label: 'Tue' },
                        { key: 'Wednesday', label: 'Wed' },
                        { key: 'Thursday', label: 'Thu' },
                        { key: 'Friday', label: 'Fri' }
                      ].map(dayObj => (
                        <button 
                          key={dayObj.key}
                          onClick={() => onApplyDayTemplate && onApplyDayTemplate(tpl, dayObj.key)}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                          title={`Apply to ${dayObj.key}`}
                        >
                          {dayObj.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* Tab 3: Micro-Cycles (Week Blueprints) */}
          {activeTab === 'templates' && (
            filteredWeekTemplates.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No Weekly Templates saved yet</p>
            ) : (
              filteredWeekTemplates.map(tpl => (
                <div key={tpl.id} className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 group flex justify-between items-center transition-all hover:border-blue-500/40 shadow-xs hover:shadow-md">
                  <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-blue-600 text-white rounded shrink-0 shadow-2xs">Weekly</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate" title={tpl.title}>{tpl.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onApplyWeekTemplate && (
                      <button onClick={() => onApplyWeekTemplate(tpl)} className="px-2 py-1 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors uppercase">Apply</button>
                    )}
                    <button onClick={() => onDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            )
          )}

          {/* Tab 4: Meso-Cycles (Multi-Week Blocks) */}
          {activeTab === 'programs' && (
            <>
              <button onClick={onOpenCreateProgram} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500/60 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-bold transition-all mb-3 bg-white dark:bg-slate-850 hover:bg-blue-50/20">
                <Plus className="w-4 h-4" /> Create Meso-Cycle
              </button>

              <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-3.5 mb-4 text-slate-700 dark:text-slate-200 text-xs shadow-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Meso-Cycles Guide</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                  <span className="block font-bold text-blue-800 dark:text-blue-300 mb-1">
                    💡 What are Meso-Cycles?
                  </span>
                  Meso-Cycles are multi-week training phases (e.g. 4 weeks) combining multiple Micro-Cycles (weekly routines) to build a structured progressive program for the athlete.
                </div>
              </div>
              
              {filteredMesoPrograms.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No Meso-Cycles saved yet</p>
              ) : (
                filteredMesoPrograms.map(prog => {
                  const tagsString = prog.weeks?.[0]?.blockTags || '';
                  const tagBadges = tagsString.split(',').map(t => t.trim()).filter(Boolean);

                  return (
                    <div key={prog.id} className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 group flex flex-col gap-2 transition-all hover:border-blue-500/40 shadow-xs hover:shadow-md">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {editingProgramId === prog.id ? (
                            <input 
                              type="text" 
                              value={tempProgramName} 
                              onChange={(e) => setTempProgramName(e.target.value)} 
                              onBlur={() => {
                                if (tempProgramName.trim() && tempProgramName !== prog.program_name) {
                                  onRenameProgram(prog.id, tempProgramName);
                                }
                                setEditingProgramId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (tempProgramName.trim() && tempProgramName !== prog.program_name) {
                                    onRenameProgram(prog.id, tempProgramName);
                                  }
                                  setEditingProgramId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingProgramId(null);
                                }
                              }}
                              className="text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500/30"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 group/title">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prog.program_name}</h5>
                              <button 
                                onClick={() => {
                                  setEditingProgramId(prog.id);
                                  setTempProgramName(prog.program_name);
                                }} 
                                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-slate-400 hover:text-blue-500 transition-opacity"
                                title="Rename"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{prog.weeks?.length || 0} Weeks Meso-Block</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => onApplyProgram(prog)} className="px-2 py-1 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors uppercase">Apply</button>
                          <button onClick={() => onEditProgram && onEditProgram(prog)} className="px-2 py-1 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg shadow-2xs transition-colors uppercase border border-slate-200 dark:border-slate-700">Edit</button>
                          <button onClick={() => onDeleteProgram(prog.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Descriptive tag labels */}
                      {tagBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          {tagBadges.map((badge, bIdx) => (
                            <span key={bIdx} className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/60 dark:border-blue-800/40">
                              #{badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Tab 5: Macro-Cycles (Annual/Season Plans) */}
          {activeTab === 'macro' && (
            <>
              <button onClick={onOpenCreateMacro} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500/60 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-bold transition-all mb-3 bg-white dark:bg-slate-850 hover:bg-blue-50/20">
                <Plus className="w-4 h-4" /> Create Macro-Cycle
              </button>

              <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl p-3.5 mb-4 text-slate-700 dark:text-slate-200 text-xs shadow-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Macro-Cycles Guide</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                  <span className="block font-bold text-blue-800 dark:text-blue-300 mb-1">
                    💡 What are Macro-Cycles?
                  </span>
                  Macro-Cycles are long-term annual or seasonal plans (e.g. 12 weeks) consisting of multiple Meso-Cycles chained together in sequence. Applying a Macro-Cycle automatically maps out your seasonal block sequentially.
                </div>
              </div>
              
              {filteredMacroPrograms.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No Macro-Cycles saved yet</p>
              ) : (
                filteredMacroPrograms.map(macro => {
                  const totalWeeks = macro.blocksChain?.reduce((acc, curr) => acc + (curr.weeksCount || 0), 0) || 0;
                  const tagBadges = (macro.tags || '').split(',').map(t => t.trim()).filter(Boolean);

                  return (
                    <div key={macro.id} className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/90 dark:border-slate-750 group flex flex-col gap-2 transition-all hover:border-blue-500/40 shadow-xs hover:shadow-md">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {editingProgramId === macro.id ? (
                            <input 
                              type="text" 
                              value={tempProgramName} 
                              onChange={(e) => setTempProgramName(e.target.value)} 
                              onBlur={() => {
                                if (tempProgramName.trim() && tempProgramName !== macro.program_name) {
                                  onRenameProgram(macro.id, tempProgramName);
                                }
                                setEditingProgramId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (tempProgramName.trim() && tempProgramName !== macro.program_name) {
                                    onRenameProgram(macro.id, tempProgramName);
                                  }
                                  setEditingProgramId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingProgramId(null);
                                }
                              }}
                              className="text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500/30"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 group/title">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{macro.program_name}</h5>
                              <button 
                                onClick={() => {
                                  setEditingProgramId(macro.id);
                                  setTempProgramName(macro.program_name);
                                }} 
                                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-slate-400 hover:text-blue-500 transition-opacity"
                                title="Rename"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{macro.blocksChain?.length || 0} Meso-Cycles ({totalWeeks} Weeks)</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => onApplyMacro(macro)} className="px-2 py-1 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors uppercase">Apply</button>
                          <button onClick={() => onEditMacro && onEditMacro(macro)} className="px-2 py-1 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg shadow-2xs transition-colors uppercase border border-slate-200 dark:border-slate-700">Edit</button>
                          <button onClick={() => onDeleteMacro(macro.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Descriptive tag labels */}
                      {tagBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          {tagBadges.map((badge, bIdx) => (
                            <span key={bIdx} className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/60 dark:border-blue-800/40">
                              #{badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
