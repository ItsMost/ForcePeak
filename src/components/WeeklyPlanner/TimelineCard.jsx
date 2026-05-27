import React, { useState } from 'react';
import { GripVertical, Edit2, Trash2, Dumbbell, Zap, Shield, Target, Copy, ArrowUp, ArrowDown, Timer, Activity, ClipboardList } from 'lucide-react';

const CATEGORY_STYLES = {
  mobility: { label: 'MOBILITY', color: 'text-rose-500 border-rose-500', bg: 'border-l-4 border-l-rose-500', icon: <Activity className="w-3.5 h-3.5" /> },
  core: { label: 'CORE', color: 'text-purple-500 border-purple-500', bg: 'border-l-4 border-l-purple-500', icon: <Shield className="w-3.5 h-3.5" /> },
  isometric: { label: 'ISOMETRIC', color: 'text-amber-500 border-amber-500', bg: 'border-l-4 border-l-amber-500', icon: <Target className="w-3.5 h-3.5" /> },
  power: { label: 'PLYOS', color: 'text-orange-500 border-orange-500', bg: 'border-l-4 border-l-orange-500', icon: <Zap className="w-3.5 h-3.5" /> },
  strength: { label: 'STRENGTH', color: 'text-blue-500 border-blue-500', bg: 'border-l-4 border-l-blue-500', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  physical: { label: 'PHYSICAL', color: 'text-slate-500 border-slate-500', bg: 'border-l-4 border-l-slate-500', icon: <Dumbbell className="w-3.5 h-3.5" /> }
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
  // Superset properties
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
  let supersetClasses = '';
  if (isSuperset) {
    supersetClasses = `border-l-2 border-r-2 px-3 pt-2 shadow-inner transition-colors duration-200 ${sStyle.border} ${sStyle.bg} `;
    if (isSupersetStart) {
      supersetClasses += 'border-t-2 rounded-t-2xl mt-2 pt-3.5 ';
    }
    if (isSupersetEnd) {
      supersetClasses += 'border-b-2 rounded-b-2xl mb-2 pb-3.5 ';
    }
  } else {
    supersetClasses = 'pb-3.5';
  }

  const dotColor = isSuperset ? sStyle.line : (safeType === 'mobility' ? 'bg-rose-500' : safeType === 'core' ? 'bg-purple-500' : safeType === 'isometric' ? 'bg-amber-500' : safeType === 'power' ? 'bg-orange-500' : safeType === 'strength' ? 'bg-blue-500' : 'bg-slate-500');

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
        <div className={`absolute top-5 bottom-0 left-[7px] sm:left-[9px] w-px ${isSuperset && !isSupersetEnd ? `w-[3px] ${sStyle.line}` : 'bg-slate-200 dark:bg-slate-700'} print:bg-slate-300`}></div>
      )}

      {/* Circle dot node */}
      <div className="relative z-10 flex pt-1.5 justify-center shrink-0">
        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${dotColor}`}></div>
      </div>

      {/* Exercise Card Layout Redesigned */}
      <div className="flex-1 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow relative min-w-0">
        
        {/* Row 1: Category & Intensity % */}
        <div className="flex items-center justify-between mb-1 select-none">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
            <span className={style.color}>{style.icon}</span>
            <span className={style.color}>{style.label}</span>
          </div>
          {drill.percentage && (
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/20">
              {drill.percentage}% 1RM
            </span>
          )}
        </div>

        {/* Row 2: Exercise Title */}
        <h4 className="text-[13px] md:text-[14px] font-black text-slate-800 dark:text-slate-100 leading-tight mb-1.5 font-sans">
          {drill.title || "Unnamed Exercise"}
        </h4>

        {/* Row 3: Volume & Timers */}
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap leading-none">
          {/* Sets x Reps volume details */}
          {(drill.sets || (isMeters ? drill.distance : drill.reps)) && (
            <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">
              {drill.sets || '-'}{isMeters ? 'x' : 'x'}{(isMeters ? drill.distance : drill.reps) || '-'}{formatUnit(drill.unit)}
            </span>
          )}

          {/* Superset Link Pill */}
          {isSuperset && (
            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded tracking-wider shadow-sm shrink-0 flex items-center gap-0.5 ${sStyle.badge}`}>
              <Zap className="w-2.5 h-2.5" /> SUPER SET
            </span>
          )}

          {/* Rest Timer */}
          {drill.rest && (
            <span className="text-blue-500 dark:text-blue-400 font-extrabold flex items-center gap-0.5">
              <Timer className="w-3.5 h-3.5" /> {drill.rest}
            </span>
          )}

          {/* Toggle Notes Button */}
          {drill.details && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotes(!showNotes); }} 
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wider flex items-center gap-0.5 transition-colors ${showNotes ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60'}`}
            >
              <ClipboardList className="w-2.5 h-2.5" />
              <span>{showNotes ? 'Hide Cues' : 'Notes'}</span>
            </button>
          )}
        </div>

        {/* Row 4: 1RM Weight Multiplier Outline Pill */}
        {calculatedWeight && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/20 shadow-sm leading-none">
              <Dumbbell className="w-3 h-3 text-blue-500 shrink-0" />
              <span>{safeType.charAt(0).toUpperCase() + safeType.slice(1)}: {calculatedWeight}kg</span>
            </span>
          </div>
        )}

        {/* Row 5: Collapsible Notes Drawer */}
        {drill.details && showNotes && (
          <p className="text-[11px] md:text-[12px] font-medium text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-150 dark:border-slate-800/80 leading-tight mt-2.5 whitespace-pre-line animate-fadeIn">
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