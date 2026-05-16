import React from 'react';
import { GripVertical, Edit2, Trash2, Dumbbell, Zap, Shield, Activity, Target, Copy, ArrowUp, ArrowDown } from 'lucide-react';

const CATEGORY_STYLES = {
  mobility: { color: 'text-red-500 border-red-200', icon: <Activity className="w-4 h-4" /> },
  core: { color: 'text-purple-500 border-purple-200', icon: <Shield className="w-4 h-4" /> },
  isometric: { color: 'text-orange-500 border-orange-200', icon: <Target className="w-4 h-4" /> },
  power: { color: 'text-yellow-500 border-yellow-300', icon: <Zap className="w-4 h-4" /> },
  strength: { color: 'text-slate-600 border-slate-300', icon: <Dumbbell className="w-4 h-4" /> },
  physical: { color: 'text-blue-500 border-blue-200', icon: <Dumbbell className="w-4 h-4" /> }
};

export default function TimelineCard({ 
  drill, day, index, isLast, isPreviewMode, 
  onEdit, onDelete, onCopy, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDrop 
}) {
  const safeType = drill.type ? drill.type.toLowerCase() : 'physical';
  const style = CATEGORY_STYLES[safeType] || CATEGORY_STYLES.physical;

  return (
    <div 
      className="relative flex gap-3 group pb-4"
      draggable={!isPreviewMode}
      onDragStart={(e) => onDragStart && onDragStart(e, day, drill, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, day, index)}
    >
      {/* الخط الزمني */}
      {!isLast && (
        <div className="absolute top-8 bottom-0 left-[15px] w-px bg-slate-200 dark:bg-slate-700 print:bg-slate-300"></div>
      )}

      {/* الأيقونة */}
      <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 print:border-slate-400 ${style.color}`}>
        {style.icon}
      </div>

      {/* تفاصيل التمرين */}
      <div className="flex-1 pt-1">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm md:text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {drill.title || "تمرين بدون اسم"}
              </h4>
              {drill.percentage && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded">
                  {drill.percentage}%
                </span>
              )}
            </div>
            <p className="text-[11px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {drill.details}
            </p>
          </div>

          {/* أزرار التحكم - تم إضافة أسهم فوق وتحت */}
          {!isPreviewMode && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onMoveUp} className="p-1 text-slate-400 hover:text-slate-700 transition-colors" title="تحريك لأعلى">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={onMoveDown} className="p-1 text-slate-400 hover:text-slate-700 transition-colors" title="تحريك لأسفل">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onCopy && onCopy(drill)} className="p-1 text-slate-400 hover:text-green-500 transition-colors" title="نسخ التمرين">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onEdit(day, drill)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="تعديل">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(day, drill.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="مسح">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="p-1 text-slate-400 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}