import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, X, Dumbbell, Zap, Shield, Activity } from 'lucide-react';

// تعريف الألوان والأيقونات لكل نوع تمرين بأمان تام
const CATEGORY_STYLES = {
  mobility: { color: 'bg-orange-500', icon: <Activity className="w-3.5 h-3.5" />, label: 'Mobility' },
  core: { color: 'bg-purple-500', icon: <Shield className="w-3.5 h-3.5" />, label: 'Core' },
  power: { color: 'bg-yellow-500', icon: <Zap className="w-3.5 h-3.5" />, label: 'Power' },
  strength: { color: 'bg-blue-500', icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Strength' },
  physical: { color: 'bg-slate-500', icon: <Dumbbell className="w-3.5 h-3.5" />, label: 'Physical' }
};

export default function ExerciseLibrary({ 
  showLibrary, setShowLibrary, library, 
  handleLibraryDragStart, setAddExerciseModal,
  onDeleteTemplate, onEditTemplate,
  onDeleteDrill, onEditDrill
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('drills');

  // حماية برمجية للتأكد من وجود البيانات وعدم حدوث أي Crash
  const safeDrills = library?.drills || [];
  const safeTemplates = library?.templates || [];

  const filteredDrills = safeDrills.filter(d => 
    d.title && d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = safeTemplates.filter(t => 
    t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // دالة ذكية لاختيار التصميم المناسب حتى لو النوع مكتوب بحروف كابيتال أو مش موجود
  const getStyle = (type) => {
    const safeType = type ? type.toLowerCase() : 'physical';
    return CATEGORY_STYLES[safeType] || CATEGORY_STYLES.physical;
  };

  return (
    <aside className={`fixed right-0 top-16 h-[calc(100vh-64px)] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-all duration-300 z-30 flex flex-col shadow-2xl ${showLibrary ? 'w-80' : 'w-0 opacity-0 pointer-events-none'}`}>
      
      {/* Search & Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Exercise Library</h3>
          <button onClick={() => setShowLibrary(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button onClick={() => setActiveTab('drills')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'drills' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Drills</button>
          <button onClick={() => setActiveTab('templates')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'templates' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Templates</button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'drills' ? (
          filteredDrills.map(drill => {
            const style = getStyle(drill.type);
            return (
              <div 
                key={drill.id} draggable onDragStart={(e) => handleLibraryDragStart(e, drill)}
                className="group p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-orange-200 dark:hover:border-orange-900 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${style.color}`}>
                    {style.icon} {style.label}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditDrill && onEditDrill(drill)} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={() => onDeleteDrill && onDeleteDrill(drill.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{drill.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{drill.details}</p>
              </div>
            );
          })
        ) : (
          filteredTemplates.map(tpl => (
            <div 
              key={tpl.id} draggable onDragStart={(e) => handleLibraryDragStart(e, tpl, true)}
              className="group p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl hover:border-orange-300 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400">{tpl.title}</h4>
                  <p className="text-[10px] text-orange-600/70">{tpl.drills?.length} exercises</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEditTemplate && onEditTemplate(tpl)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-blue-500 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => onDeleteTemplate && onDeleteTemplate(tpl.id)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button 
          onClick={() => setAddExerciseModal({ isOpen: true, title: '', details: '', type: 'strength', percentage: '' })}
          className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Drill
        </button>
      </div>
    </aside>
  );
}