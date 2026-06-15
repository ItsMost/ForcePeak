import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Layers, Bookmark, CalendarDays, Calendar, Tag, Sparkles } from 'lucide-react';

const SUBCATEGORIES = {
  core: {
    all: 'All Core',
    rotation: 'Rotation',
    anti_rotation: 'Anti-Rotation',
    extension: 'Extension',
    flexion: 'Flexion',
    anti_extension: 'Anti-Extension',
    anti_flexion: 'Anti-Flexion',
    lateral_flexion: 'Lat Flexion',
    anti_lateral_flexion: 'Anti-Lat Flex'
  },
  strength: {
    all: 'All Strength',
    upper_body: 'Upper Body',
    double_leg: 'Double Leg',
    single_leg: 'Single Leg'
  }
};

export default function ExerciseLibrary({ 
  showLibrary, setShowLibrary, library, handleLibraryDragStart, 
  setAddExerciseModal, onDeleteDrill, onEditDrill, onDeleteTemplate,
  onOpenCreateProgram, programs = [], onDeleteProgram, onApplyProgram,
  onApplyWeekTemplate,
  onApplyDayTemplate,
  onOpenCreateMacro,
  onApplyMacro,
  onDeleteMacro
}) {
  const [activeTab, setActiveTab] = useState('exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  // Filter Drills by Search, Category Tab, and Subcategory Tab
  const filteredDrills = (library.drills || []).filter(drill => {
    const matchesSearch = (drill.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || (drill.type || '').toLowerCase() === activeCategory.toLowerCase();
    
    let matchesSubcategory = true;
    if (SUBCATEGORIES[activeCategory] && activeSubcategory !== 'all') {
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

  return (
    <div className={`fixed top-16 right-0 w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-[calc(100vh-64px)] z-30 shadow-2xl transition-transform duration-300 flex flex-col ${showLibrary ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Tabs Navigation Switcher */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2 gap-1 shrink-0 overflow-x-auto scrollbar-none">
        <button onClick={() => { setActiveTab('exercises'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'exercises' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Layers className="w-3 h-3 shrink-0" /> Exercises
        </button>
        <button onClick={() => { setActiveTab('days'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'days' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Sparkles className="w-3 h-3 shrink-0" /> Days
        </button>
        <button onClick={() => { setActiveTab('templates'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'templates' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Bookmark className="w-3 h-3 shrink-0" /> Weekly
        </button>
        <button onClick={() => { setActiveTab('programs'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'programs' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <CalendarDays className="w-3 h-3 shrink-0" /> Meso
        </button>
        <button onClick={() => { setActiveTab('macro'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-black rounded-lg transition-all shrink-0 ${activeTab === 'macro' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Calendar className="w-3 h-3 shrink-0" /> Macro
        </button>
      </div>

      {/* Control Input Headers */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-700 space-y-2 shrink-0 bg-slate-50/20 dark:bg-slate-900/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder={`Search ${activeTab === 'templates' ? 'Weekly Templates' : activeTab === 'programs' ? 'Meso-Cycles' : activeTab === 'macro' ? 'Macro-Cycles' : activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white font-medium" />
        </div>

        {activeTab === 'exercises' && (
          <div className="space-y-2">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
              {['all', 'strength', 'power', 'speed', 'endurance', 'isometric', 'core', 'mobility'].map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setActiveSubcategory('all'); }} className={`px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider transition-colors ${activeCategory === cat ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {SUBCATEGORIES[activeCategory] && (
              <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none text-[9px] font-black border-t border-slate-100 dark:border-slate-800/80 pt-2">
                {Object.entries(SUBCATEGORIES[activeCategory]).map(([subKey, subLabel]) => (
                  <button key={subKey} onClick={() => setActiveSubcategory(subKey)} className={`px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-wider transition-all shadow-sm ${activeSubcategory === subKey ? 'bg-orange-500 text-white' : 'bg-white border border-slate-250 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50'}`}>
                    {subLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Container Lists View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        
        {/* Tab 1: Exercises Module Archive */}
        {activeTab === 'exercises' && (
          <>
            <button onClick={() => setAddExerciseModal({ isOpen: true, id: null, title: '', details: '', type: 'strength', subcategory: '', percentage: '', bwRatio: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' })} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all mb-3">
              <Plus className="w-4 h-4" /> Add Global Exercise
            </button>
            
            {filteredDrills.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No exercises archived yet</p>
            ) : (
              filteredDrills.map(drill => (
                <div key={drill.id} draggable onDragStart={(e) => handleLibraryDragStart(e, drill, false)} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-orange-500/40 transition-all cursor-grab active:cursor-grabbing group flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{drill.type}</span>
                      {drill.subcategory && (
                        <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded">
                          {SUBCATEGORIES[drill.type]?.[drill.subcategory] || drill.subcategory.replace('_', ' ')}
                        </span>
                      )}
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{drill.title}</h5>
                    </div>
                    {drill.details && <p className="text-[10px] text-slate-400 mt-1 truncate">{drill.details}</p>}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditDrill(drill)} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => onDeleteDrill(drill.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
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
                  className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-orange-500/40 transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded shrink-0">Day</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate" title={tpl.title}>{tpl.title}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteTemplate(tpl.id)} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100/60 dark:border-slate-800/60 pb-1.5">
                    <span>⚡ {drillCount} Exercises</span>
                    <span className="text-[9px] text-slate-355 dark:text-slate-500">Drag or tap to apply</span>
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
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-white dark:bg-slate-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
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
              <div key={tpl.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 group flex justify-between items-center transition-all hover:border-blue-500/30">
                <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase bg-blue-500 text-white rounded shrink-0">Weekly</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate" title={tpl.title}>{tpl.title}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onApplyWeekTemplate && (
                    <button onClick={() => onApplyWeekTemplate(tpl)} className="px-2 py-1 text-[10px] font-black bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors uppercase">Apply</button>
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
            <button onClick={onOpenCreateProgram} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all mb-3">
              <Plus className="w-4 h-4" /> Create Meso-Cycle
            </button>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3.5 mb-4 text-slate-700 dark:text-slate-200 text-xs shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Meso-Cycles Guide</span>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                <span className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
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
                  <div key={prog.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 group flex flex-col gap-2 transition-all hover:border-orange-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prog.program_name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{prog.weeks?.length || 0} Weeks Meso-Block</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onApplyProgram(prog)} className="px-2 py-1 text-[10px] font-black bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors uppercase">Apply</button>
                        <button onClick={() => onDeleteProgram(prog.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Rendering descriptive tag labels dynamically */}
                    {tagBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        {tagBadges.map((badge, bIdx) => (
                          <span key={bIdx} className="text-[9px] font-black px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-md border border-orange-100/60 dark:border-orange-900/30">
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
            <button onClick={onOpenCreateMacro} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all mb-3">
              <Plus className="w-4 h-4" /> Create Macro-Cycle
            </button>

            <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 dark:from-indigo-500/20 dark:to-blue-500/10 border border-indigo-200/50 dark:border-indigo-800/30 rounded-xl p-3.5 mb-4 text-slate-700 dark:text-slate-200 text-xs shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Macro-Cycles Guide</span>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                <span className="block font-bold text-indigo-700 dark:text-indigo-400 mb-1">
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
                  <div key={macro.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 group flex flex-col gap-2 transition-all hover:border-indigo-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{macro.program_name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{macro.blocksChain?.length || 0} Meso-Cycles ({totalWeeks} Weeks)</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onApplyMacro(macro)} className="px-2 py-1 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors uppercase">Apply</button>
                        <button onClick={() => onDeleteMacro(macro.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Rendering descriptive tag labels dynamically */}
                    {tagBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        {tagBadges.map((badge, bIdx) => (
                          <span key={bIdx} className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100/60 dark:border-indigo-900/30">
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
  );
}