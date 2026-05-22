import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Layers, Bookmark, CalendarDays, Tag } from 'lucide-react';

export default function ExerciseLibrary({ 
  showLibrary, setShowLibrary, library, handleLibraryDragStart, 
  setAddExerciseModal, onDeleteDrill, onEditDrill, onDeleteTemplate,
  onOpenCreateProgram, programs = [], onDeleteProgram, onApplyProgram
}) {
  const [activeTab, setActiveTab] = useState('exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter Drills by Search and Category Tab
  const filteredDrills = (library.drills || []).filter(drill => {
    const matchesSearch = (drill.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || (drill.type || '').toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Filter Week Templates by Search
  const filteredTemplates = (library.templates || []).filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Multi-Week Blocks by Name or Tags
  const filteredPrograms = (programs || []).filter(prog => {
    const matchesName = (prog.program_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const firstWeekTags = (prog.weeks?.[0]?.blockTags || '').toLowerCase();
    const matchesTags = firstWeekTags.includes(searchQuery.toLowerCase());
    return matchesName || matchesTags;
  });

  return (
    <div className={`fixed top-16 right-0 w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-[calc(100vh-64px)] z-30 shadow-2xl transition-transform duration-300 flex flex-col ${showLibrary ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Tabs Navigation Switcher */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2 gap-1">
        <button onClick={() => { setActiveTab('exercises'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'exercises' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Layers className="w-3.5 h-3.5" /> Exercises
        </button>
        <button onClick={() => { setActiveTab('templates'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'templates' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Bookmark className="w-3.5 h-3.5" /> Weeks
        </button>
        <button onClick={() => { setActiveTab('programs'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'programs' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <CalendarDays className="w-3.5 h-3.5" /> Blocks
        </button>
      </div>

      {/* Control Input Headers */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white font-medium" />
        </div>

        {activeTab === 'exercises' && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
            {['all', 'strength', 'power', 'isometric', 'core', 'mobility'].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider transition-colors ${activeCategory === cat ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Container Lists View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        
        {/* Tab 1: Exercises Module Archive */}
        {activeTab === 'exercises' && (
          <>
            <button onClick={() => setAddExerciseModal({ isOpen: true, id: null, title: '', details: '', type: 'strength', percentage: '', sets: '', reps: '', rest: '', unit: 'reps', distance: '' })} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all mb-3">
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

        {/* Tab 2: Single Week Blueprint Routines */}
        {activeTab === 'templates' && (
          filteredTemplates.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">No week routines saved yet</p>
          ) : (
            filteredTemplates.map(tpl => (
              <div key={tpl.id} draggable onDragStart={(e) => handleLibraryDragStart(e, tpl, true)} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-orange-500/40 cursor-grab active:cursor-grabbing group flex justify-between items-center transition-all">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">{tpl.title}</span>
                </div>
                <button onClick={() => onDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))
          )
        )}

        {/* Tab 3: Multi-Week Structural Meso Blocks */}
        {activeTab === 'programs' && (
          <>
            <button onClick={onOpenCreateProgram} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-orange-500 hover:border-orange-500/50 text-xs font-bold transition-all mb-3">
              <Plus className="w-4 h-4" /> Create Multi-Week Block
            </button>
            
            {filteredPrograms.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No custom macro blocks stored</p>
            ) : (
              filteredPrograms.map(prog => {
                const tagsString = prog.weeks?.[0]?.blockTags || '';
                const tagBadges = tagsString.split(',').map(t => t.trim()).filter(Boolean);

                return (
                  <div key={prog.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 group flex flex-col gap-2 transition-all hover:border-orange-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prog.program_name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{prog.weeks?.length || 0} Linked Weeks Block</p>
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

      </div>
    </div>
  );
}