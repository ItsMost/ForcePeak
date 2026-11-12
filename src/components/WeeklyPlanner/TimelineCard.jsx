import React, { useState } from 'react';
import { GripVertical, Edit2, Trash2, Dumbbell, Zap, Shield, Target, Copy, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Timer, Activity, ClipboardList, Video } from 'lucide-react';
import { getUnifiedCategory } from '../../data/constants.js';
import { CATEGORY_STYLES as CATEGORY_COLORS, SUPERSET_STYLES } from '../../data/categoryColors.js';

// Category & superset colors live in src/data/categoryColors.js (defined once).
const CATEGORY_ICONS = { dumbbell: Dumbbell, zap: Zap, target: Target, shield: Shield, activity: Activity };
const CATEGORY_STYLES = Object.fromEntries(
  Object.entries(CATEGORY_COLORS).map(([key, v]) => {
    const Icon = CATEGORY_ICONS[v.icon] || Dumbbell;
    return [key, { ...v, icon: <Icon className="w-3.5 h-3.5" /> }];
  })
);

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
  const unifiedKey = getUnifiedCategory(drill);
  const style = CATEGORY_STYLES[safeType] || CATEGORY_STYLES[unifiedKey] || CATEGORY_STYLES.physical;

  const currentGroup = supersetGroup ? supersetGroup.toUpperCase() : '';
  const sStyle = SUPERSET_STYLES[currentGroup] || SUPERSET_STYLES.A;

  // Automated 1RM Weight and Bodyweight (BW) Multiplier Calculation
  let calculatedWeight = null;
  let calculatedBwWeight = null;
  let calculatedIntensityFromBw = null;
  let calculatedIntensityFromDirectWeight = null;

  const title = (drill.title || '').toLowerCase();
  let maxWeight = null;

  if (athlete) {
    if (title.includes('power clean')) maxWeight = athlete.powerClean || athlete.clean;
    else if (title.includes('hang clean')) maxWeight = athlete.hangClean;
    else if (title.includes('clean')) maxWeight = athlete.powerClean || athlete.clean;
    else if (title.includes('bench')) maxWeight = athlete.bench;
    else if (title.includes('deadlift')) maxWeight = athlete.deadlift;
    else if (title.includes('front squat')) maxWeight = athlete.frontSquat;
    else if (title.includes('squat')) maxWeight = athlete.fullSquat;
  }

  // Direct Target Weight (explicit KG / LB prescribed by coach)
  const hasDirectWeight = drill.weight !== undefined && drill.weight !== null && drill.weight !== '' && !isNaN(parseFloat(drill.weight));
  const directWeight = hasDirectWeight ? parseFloat(drill.weight) : null;
  const weightUnit = (drill.weightUnit || 'kg').toLowerCase();

  if (hasDirectWeight && maxWeight > 0) {
    const weightInKg = weightUnit === 'lb' ? directWeight * 0.45359237 : directWeight;
    calculatedIntensityFromDirectWeight = Math.round((weightInKg / maxWeight) * 100);
  }

  // 1. Calculate from percentage (% 1RM)
  if (athlete && drill.percentage && maxWeight > 0) {
    const percent = parseFloat(drill.percentage);
    if (percent > 0) {
      calculatedWeight = Math.round((maxWeight * percent) / 100);
    }
  }

  // 2. Calculate from BW Ratio (Bodyweight Multiplier)
  if (athlete && athlete.weight > 0 && drill.bwRatio) {
    const bwVal = parseFloat(drill.bwRatio);
    if (bwVal > 0) {
      calculatedBwWeight = Math.round(bwVal * athlete.weight);
      if (maxWeight > 0) {
        calculatedIntensityFromBw = Math.round((calculatedBwWeight / maxWeight) * 100);
      }
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
      <div className="flex-1 min-w-0 bg-white/95 dark:bg-slate-900/95 md:bg-transparent md:dark:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none border border-slate-200/70 dark:border-slate-800 md:border-0 shadow-xs md:shadow-none transition-all">
        {/* Top Meta Line: Category & Superset + Video Link */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSuperset && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider shadow-xs shrink-0 flex items-center gap-0.5 ${sStyle.badge}`}>
                <Zap className="w-2.5 h-2.5 text-white" /> {supersetLabel}
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-wider ${style.color}`}>
              {style.label}
            </span>
          </div>

          {drill.video_url && (
            <a 
              href={drill.video_url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="text-orange-500 hover:text-orange-600 p-0.5 rounded transition-transform active:scale-90"
              title="Watch Video"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Title & Intensity Row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-[13.5px] md:text-[14px] font-bold text-slate-850 dark:text-slate-100 leading-snug">
            {drill.title || "Unnamed Exercise"}
          </h4>

          {/* Calculated / Prescribed Weight Capsule */}
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            {hasDirectWeight ? (
              <span className="px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
                {drill.weight} {weightUnit.toUpperCase()}
              </span>
            ) : calculatedWeight ? (
              <span className="px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
                {calculatedWeight} KG
              </span>
            ) : null}

            {drill.percentage ? (
              <span className="px-2 py-0.5 text-[10px] font-black bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-lg border border-orange-200/50 dark:border-orange-800/40 shadow-xs">
                {drill.percentage}% 1RM
              </span>
            ) : calculatedIntensityFromDirectWeight ? (
              <span className="px-2 py-0.5 text-[10px] font-black bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-lg border border-orange-200/50 dark:border-orange-800/40 shadow-xs">
                ~{calculatedIntensityFromDirectWeight}% 1RM
              </span>
            ) : null}

            {drill.bwRatio && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
                {drill.bwRatio}x BW {calculatedBwWeight ? `(${calculatedBwWeight} KG)` : ''}
              </span>
            )}
            {!drill.percentage && !calculatedIntensityFromDirectWeight && calculatedIntensityFromBw && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-lg border border-orange-200/50 dark:border-orange-800/40 shadow-xs">
                {calculatedIntensityFromBw}%
              </span>
            )}
          </div>
        </div>

        {/* Prescription Volume Parameters Display Row Block */}
        {(drill.sets || (isMeters ? drill.distance : drill.reps) || drill.rest || drill.details || (drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity) || (drill.peakVelocity || drill.peak_velocity || drill.rpe) || drill.velocityLoss || drill.tempo || drill.focus) && (
          <div className="flex items-center gap-1.5 mt-1 mb-1.5 flex-wrap">
            {(drill.sets || (isMeters ? drill.distance : drill.reps)) && (
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-black text-[10px] tracking-wider uppercase border border-slate-200/60 dark:border-slate-700/60">
                  {drill.sets || '-'} Sets
                </span>
                <span className="text-slate-400 text-[10px] font-black">x</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-black text-[10px] tracking-wider uppercase border border-slate-200/60 dark:border-slate-700/60">
                  {(isMeters ? drill.distance : drill.reps) || '-'} {formatUnit(drill.unit)}
                </span>
              </div>
            )}
            
            {drill.rest && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md font-black text-[10px] tracking-wider uppercase flex items-center gap-1 border border-blue-200/50 dark:border-blue-800/40">
                <Timer className="w-3 h-3" /> {drill.rest}
              </span>
            )}

            {(drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity) && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md font-black text-[10px] tracking-wider uppercase flex items-center gap-1 border border-blue-200/50 dark:border-blue-800/40">
                <Zap className="w-3 h-3 text-blue-500" /> MV: {drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity} m/s
              </span>
            )}

            {(drill.peakVelocity || drill.peak_velocity || drill.rpe) && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md font-black text-[10px] tracking-wider uppercase flex items-center gap-1 border border-blue-200/50 dark:border-blue-800/40">
                <Zap className="w-3 h-3 text-blue-500" /> PV: {drill.peakVelocity || drill.peak_velocity || drill.rpe} m/s
              </span>
            )}

            {drill.velocityLoss && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md font-black text-[10px] tracking-wider uppercase border border-blue-200/50 dark:border-blue-800/40">
                V Loss: {drill.velocityLoss}
              </span>
            )}

            {drill.tempo && (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-md font-black text-[10px] tracking-wider uppercase border border-amber-200/50 dark:border-amber-800/40">
                T: {drill.tempo}
              </span>
            )}

            {drill.focus && (
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-md font-black text-[10px] tracking-wider uppercase border border-red-200/50 dark:border-red-800/40">
                {drill.focus}
              </span>
            )}

            {drill.details && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotes(!showNotes); }} 
                className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase flex items-center gap-1 transition-colors border ${showNotes ? 'bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700/60 text-slate-600 dark:text-slate-350'}`}
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

        {/* Mobile Action Controls Bar (Clean bottom bar on mobile so titles have 100% full width and plenty of room!) */}
        {!isPreviewMode && (
          <div className="flex md:hidden items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 px-2 py-1 rounded-xl">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-90"
                title="Move Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-90"
                title="Move Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onCopy && onCopy(drill); }} 
                className="p-1.5 text-slate-400 hover:text-green-500 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl active:scale-90"
                title="Copy Exercise"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(day, drill); }} 
                className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 rounded-xl active:scale-90 flex items-center gap-1"
                title="Edit Exercise"
              >
                <Edit2 className="w-3 h-3" />
                <span>تعديل</span>
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(day, drill.id); }} 
                className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl active:scale-90"
                title="Delete Exercise"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop Hover Action Floating Pill */}
        {!isPreviewMode && (
          <div className="hidden md:flex absolute top-1.5 right-1.5 z-20 items-center gap-0.5 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700/80 px-1.5 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden select-none">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 active:scale-90 active:text-orange-500 transition-all" 
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 active:scale-90 active:text-orange-500 transition-all" 
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onCopy && onCopy(drill); }} 
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-green-500 active:scale-90 transition-all" 
              title="Copy Exercise"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(day, drill); }} 
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 active:scale-90 transition-all" 
              title="Edit Exercise"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(day, drill.id); }} 
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 active:scale-90 transition-all" 
              title="Delete Exercise"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}