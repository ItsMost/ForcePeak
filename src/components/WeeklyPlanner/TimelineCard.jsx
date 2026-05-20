import React from 'react';
import { GripVertical, Edit2, Trash2, Dumbbell, Zap, Shield, Activity, Target, Copy, ArrowUp, ArrowDown, Timer } from 'lucide-react';

const CATEGORY_STYLES = {
  mobility: { color: 'text-red-500 border-red-200', icon: <Activity className="w-4 h-4" /> },
  core: { color: 'text-purple-500 border-purple-200', icon: <Shield className="w-4 h-4" /> },
  isometric: { color: 'text-orange-500 border-orange-200', icon: <Target className="w-4 h-4" /> },
  power: { color: 'text-yellow-500 border-yellow-300', icon: <Zap className="w-4 h-4" /> },
  strength: { color: 'text-slate-600 border-slate-300', icon: <Dumbbell className="w-4 h-4" /> },
  physical: { color: 'text-blue-500 border-blue-200', icon: <Dumbbell className="w-4 h-4" /> }
};

export default function TimelineCard({ 
  drill, day, index, isLast, isPreviewMode, athlete, 
  onEdit, onDelete, onCopy, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDrop 
}) {
  const safeType = drill.type ? drill.type.toLowerCase() : 'physical';
  const style = CATEGORY_STYLES[safeType] || CATEGORY_STYLES.physical;

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

  // Format unit text safely for Reps / Sec / Min / Jumps
  const formatUnit = (unit) => {
    if (!unit) return 'Reps';
    if (unit.toLowerCase() === 'reps') return 'Reps';
    if (unit.toLowerCase() === 'sec') return 'Sec';
    if (unit.toLowerCase() === 'min') return 'Min';
    if (unit.toLowerCase() === 'jumps') return 'Jumps';
    return unit.charAt(0).toUpperCase() + unit.slice(1);
  };

  return (
    <div 
      className="relative flex gap-2 sm:gap-3 group pb-3 cursor-grab active:cursor-grabbing"
      draggable={!isPreviewMode}
      onDragStart={(e) => onDragStart && onDragStart(e, day, drill, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, day, index)}
    >
      {/* Vertical timeline line filament link thread */}
      {!isLast && (
        <div className="absolute top-8 bottom-0 left-[15px] w-px bg-slate-200 dark:bg-slate-700 print:bg-slate-300"></div>
      )}

      {/* Category Icon Display Status indicator */}
      <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 print:border-slate-400 ${style.color}`}>
        {style.icon}
      </div>

      {/* Exercise core detailed metadata descriptor block */}
      <div className="flex-1 pt-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <h4 className="text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {drill.title || "Unnamed Exercise"}
          </h4>
          
          {calculatedWeight && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded shrink-0 border border-blue-200 dark:border-blue-800">
              {calculatedWeight} KG
            </span>
          )}

          {drill.percentage && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded shrink-0">
              {drill.percentage}%
            </span>
          )}
        </div>

        {/* Prescription Volume Parameters Display Row Block */}
        {(drill.sets || drill.reps || drill.rest) && (
          <div className="flex items-center gap-1 mt-1 mb-1 flex-wrap">
            {(drill.sets || drill.reps) && (
              <>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-[11px] tracking-widest">
                  {drill.sets || '-'} Sets
                </span>
                <span className="text-slate-400 text-[10px] font-bold">x</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-[11px] tracking-widest">
                  {drill.reps || '-'} {formatUnit(drill.unit)}
                </span>
              </>
            )}
            
            {drill.rest && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-bold text-[11px] tracking-widest flex items-center gap-1 mr-1">
                <Timer className="w-3 h-3" /> {drill.rest}
              </span>
            )}
          </div>
        )}
        
        {/* Engineering specific coaching notes box line container */}
        {drill.details && (
          <p className="text-[11px] md:text-[12px] font-medium text-slate-500 dark:text-slate-400 whitespace-pre-line leading-tight mt-1">
            {drill.details}
          </p>
        )}

        {/* Quick layout overlay control actions view state menu wrapper */}
        {!isPreviewMode && (
          <div className="flex items-center justify-start flex-wrap gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
            <button onClick={onMoveUp} className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 dark:bg-slate-800 rounded" title="Move Up">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={onMoveDown} className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 dark:bg-slate-800 rounded" title="Move Down">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onClick={() => onCopy && onCopy(drill)} className="p-1 text-slate-400 hover:text-green-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded" title="Copy Card Parameters">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(day, drill)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded" title="Edit Parameters Modal">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(day, drill.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded" title="Delete Workflow Item">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
            <div className="p-1 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded" title="Drag card block layout directly to sidebar or to rearrange days">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}