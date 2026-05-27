import React, { useState } from 'react';
import { GripVertical, Edit2, Trash2, Dumbbell, Zap, Shield, Target, Copy, ArrowUp, ArrowDown, Timer, Activity, ClipboardList } from 'lucide-react';

const CATEGORY_STYLES = {
  mobility: { label: 'MOBILITY', color: 'text-rose-500 border-rose-500', bg: 'border-rose-100 bg-rose-50/50 dark:bg-rose-950/20', icon: <Activity className="w-3.5 h-3.5" /> },
  core: { label: 'CORE', color: 'text-purple-500 border-purple-500', bg: 'border-purple-100 bg-purple-50/50 dark:bg-purple-950/20', icon: <Shield className="w-3.5 h-3.5" /> },
  isometric: { label: 'ISOMETRIC', color: 'text-amber-500 border-amber-500', bg: 'border-amber-100 bg-amber-50/50 dark:bg-amber-950/20', icon: <Target className="w-3.5 h-3.5" /> },
  power: { label: 'PLYOS', color: 'text-orange-500 border-orange-500', bg: 'border-orange-100 bg-orange-50/50 dark:bg-orange-950/20', icon: <Zap className="w-3.5 h-3.5" /> },
  strength: { label: 'STRENGTH', color: 'text-blue-500 border-blue-500', bg: 'border-blue-100 bg-blue-50/50 dark:bg-blue-950/20', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  speed: { label: 'SPEED', color: 'text-emerald-500 border-emerald-500', bg: 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20', icon: <Zap className="w-3.5 h-3.5" /> },
  endurance: { label: 'ENDURANCE', color: 'text-teal-500 border-teal-500', bg: 'border-teal-100 bg-teal-50/50 dark:bg-teal-950/20', icon: <Activity className="w-3.5 h-3.5" /> },
  physical: { label: 'PHYSICAL', color: 'text-slate-500 border-slate-500', bg: 'border-slate-100 bg-slate-50/50 dark:bg-slate-950/20', icon: <Dumbbell className="w-3.5 h-3.5" /> }
};

const SUPERSET_STYLES = {
  A: { 
    border: 'border-orange-200 dark:border-orange-500/20', 
    bg: 'bg-orange-500/[0.04] dark:bg-orange-500/[0.03]', 
    badge: 'bg-orange-500 text-white', 
    text: 'text-orange-600 dark:text-orange-400', 
    line: 'bg-orange-500' 
  },
  B: { 
    border: 'border-purple-200 dark:border-purple-500/20', 
    bg: 'bg-purple-500/[0.04] dark:bg-purple-500/[0.03]', 
    badge: 'bg-purple-500 text-white', 
    text: 'text-purple-600 dark:text-purple-400', 
    line: 'bg-purple-500' 
  },
  C: { 
    border: 'border-teal-200 dark:border-teal-500/20', 
    bg: 'bg-teal-500/[0.04] dark:bg-teal-500/[0.03]', 
    badge: 'bg-teal-500 text-white', 
    text: 'text-teal-600 dark:text-teal-400', 
    line: 'bg-teal-500' 
  },
  D: { 
    border: 'border-pink-200 dark:border-pink-500/20', 
    bg: 'bg-pink-500/[0.04] dark:bg-pink-500/[0.03]', 
    badge: 'bg-pink-500 text-white', 
    text: 'text-pink-600 dark:text-pink-400', 
    line: 'bg-pink-500' 
  }
};

export default function TimelineCard({ 
  drill, day, index, isLast, isPreviewMode, athlete, 
  onEdit, onDelete, onCopy, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDrop,
  isSuperset = false,
  isSupersetStart = false,
  isSupersetMiddle = false,
  isSupersetEnd = false,
  supersetLabel = '',
  supersetGroup = ''
}) {
  const [showNotes, setShowNotes] = useState(false);

  const safeType = drill.type ? drill.type.toLowerCase() : 'physical';
  const style = CATEGORY_STYLES[safeType] || CATEGORY_STYLES.physical;

  const currentGroup = supersetGroup ? supersetGroup.toUpperCase() : '';
  const sStyle = SUPERSET_STYLES[currentGroup] || SUPERSET_STYLES.A;

  // Automated 1RM Weight Multiplier Calculation from Athlete Profile
  let calculatedWeight = null;
  if (athlete && drill.percentage) {
    const title = (drill.title || '').toLowerCase();
    const percent = parseFloat(drill.percentage);
    let maxWeight = null;
 
    if (title.includes('clean')) maxWeight = athlete.clean;
    else if (title.includes('bench')) maxWeight = athlete.bench;
    else if (title.includes('deadlift')) maxWeight = athlete.deadlift;
    else if (title.includes('half squat')) maxWeight = athlete.halfSquat;
    else if (title.includes('quarter squat')) maxWeight = athlete.quarterSquat;
    else if (title.includes('squat')) maxWeight = athlete.fullSquat;

    if (maxWeight > 0 && percent > 0) {
      calculatedWeight = Math.round((maxWeight * percent) / 100);
    }
  }

  // Format unit text safely for Reps / Sec / Min / Jumps / Meters
  const formatUnit = (unit) => {
    if (!unit) return 'Reps';
    if (unit.toLowerCase() === 'reps') return '';
    if (unit.toLowerCase() === 'sec') return 'Sec';
    if (unit.toLowerCase() === 'min') return 'Min';
    if (unit.toLowerCase() === 'jumps') return 'Jumps';
    if (unit.toLowerCase() === 'meters') return 'm';
    return unit;
  };

  const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';

  // Build the superset visual packaging class list
  // No boxed cards for supersets anymore! Every exercise is a standard timeline row.
  const supersetClasses = 'pb-3.5';

  return (
    <div 
      className={`relative flex gap-2.5 sm:gap-3.5 group cursor-grab active:cursor-grabbing timeline-card print-accent-${safeType} ${supersetClasses}`}
      draggable={!isPreviewMode}
      onDragStart={(e) => onDragStart && onDragStart(e, day, drill, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, day, index)}
    >
      {/* Vertical timeline line filament link thread */}
      {!isLast && (
        <div className={`absolute top-8 bottom-0 left-[15px] sm:left-[17px] w-px ${isSuperset && !isSupersetEnd ? `w-[3px] ${sStyle.line}` : 'bg-slate-200 dark:bg-slate-700'} print:bg-slate-300`}></div>
      )}

      {/* Sleek Superset Connecting Down-Arrow on the filament line */}
      {isSuperset && !isSupersetEnd && (
        <div className={`absolute bottom-[-7px] left-[9px] sm:left-[11px] z-20 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border shadow-sm ${sStyle.border}`}>
          <ArrowDown className={`w-2.5 h-2.5 ${sStyle.text}`} />
        </div>
      )}

      {/* Category Icon Display Status indicator */}
      <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 print:border-slate-400 shadow-sm ${style.color}`}>
        {style.icon}
      </div>

      {/* Exercise core detailed metadata descriptor block */}
      <div className="flex-1 pt-0.5 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          
          {/* Superset Pill Indicator */}
          {isSuperset && (
            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded tracking-wider shadow-sm shrink-0 flex items-center gap-0.5 ${sStyle.badge}`}>
              <Zap className="w-2.5 h-2.5 text-white" /> {supersetLabel}
            </span>
          )}

          <h4 className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {drill.title || "Unnamed Exercise"}
          </h4>
          
          {calculatedWeight && (
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/20 shrink-0">
              {calculatedWeight} KG
            </span>
          )}

          {drill.percentage && (
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-orange-50/80 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-md border border-orange-100 dark:border-orange-900/20 shrink-0">
              {drill.percentage}% 1RM
            </span>
          )}
        </div>

        {/* Prescription Volume Parameters Display Row Block */}
        {(drill.sets || (isMeters ? drill.distance : drill.reps) || drill.rest || drill.details) && (
          <div className="flex items-center gap-1.5 mt-1.5 mb-1.5 flex-wrap">
            {(drill.sets || (isMeters ? drill.distance : drill.reps)) && (
              <>
                <span className="px-2 py-0.5 bg-slate-150/70 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-md font-black text-[9.5px] tracking-wider uppercase">
                  {drill.sets || '-'} Sets
                </span>
                <span className="text-slate-400 text-[9px] font-black">x</span>
                <span className="px-2 py-0.5 bg-slate-150/70 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-md font-black text-[9.5px] tracking-wider uppercase">
                  {(isMeters ? drill.distance : drill.reps) || '-'} {formatUnit(drill.unit)}
                </span>
              </>
            )}
            
            {drill.rest && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-md font-black text-[9.5px] tracking-wider uppercase flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" /> {drill.rest}
              </span>
            )}

            {drill.details && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotes(!showNotes); }} 
                className={`px-2 py-0.5 rounded-md text-[9.5px] font-black tracking-wider uppercase flex items-center gap-1 transition-colors ${showNotes ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' : 'bg-slate-150/70 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-350'}`}
              >
                <ClipboardList className="w-3 h-3" />
                <span>{showNotes ? 'Hide Cues' : 'Notes'}</span>
              </button>
            )}
          </div>
        )}
        
        {/* Collapsible Notes Drawer */}
        {drill.details && showNotes && (
          <p className="text-[11px] md:text-[12px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 leading-tight mt-2 whitespace-pre-line animate-fadeIn">
            {drill.details}
          </p>
        )}

        {/* Quick layout overlay control actions view state menu wrapper */}
        {!isPreviewMode && (
          <div className="flex items-center justify-start flex-wrap gap-1 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
            <button onClick={onMoveUp} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded shadow-sm" title="Move Up">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={onMoveDown} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded shadow-sm" title="Move Down">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
            <button onClick={() => onCopy && onCopy(drill)} className="p-1 text-slate-500 hover:text-green-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded shadow-sm" title="Copy Card Parameters">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(day, drill)} className="p-1 text-slate-500 hover:text-blue-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded shadow-sm" title="Edit Parameters Modal">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(day, drill.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded shadow-sm" title="Delete Workflow Item">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
            <div className="p-1 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded cursor-grab active:cursor-grabbing shadow-sm" title="Drag card block layout directly to rearrange days">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}