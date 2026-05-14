import React, { useState } from 'react';
import { ChevronDown, GripVertical, Edit2, Save, Trash } from 'lucide-react';
import { DRILL_TYPES } from '../../data/constants';

export default function TimelineCard({
  drill,
  day,
  index,
  isLast,
  isPreviewMode,
  onUpdate,
  onDelete,
  onDragStart,
  onDrop,
  onDragOver,
}) {
  const [isEditing, setIsEditing] = useState(drill.isNew || false);
  const [editData, setEditData] = useState({
    title: drill.title || '',
    details: drill.details || '',
    type: drill.type || 'physical',
    percentage: drill.percentage || '',
  });

  const typeStyle = DRILL_TYPES[drill.type] || DRILL_TYPES.physical;
  const Icon = typeStyle.icon;

  const handleSave = () => {
    onUpdate(day, drill.id, { ...drill, ...editData, isNew: false });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 mb-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col gap-2 relative z-20 ml-8 print:hidden">
        <div className="flex gap-2">
          <select
            value={editData.type}
            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
            className="flex-1 text-sm p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-orange-500"
          >
            {Object.entries(DRILL_TYPES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          {/* إصلاح خانة النسبة المئوية باستخدام shrink-0 لمنع انضغاطها */}
          <div className="relative w-20 shrink-0">
            <input
              type="number"
              value={editData.percentage}
              onChange={(e) =>
                setEditData({ ...editData, percentage: e.target.value })
              }
              className="w-full text-sm p-1.5 pl-6 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-orange-500"
              placeholder="0"
            />
            <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">
              %
            </span>
          </div>
        </div>
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="w-full font-bold text-sm p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-orange-500"
          placeholder="Exercise Title"
          autoFocus
        />
        <textarea
          value={editData.details}
          onChange={(e) =>
            setEditData({ ...editData, details: e.target.value })
          }
          className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 resize-none h-16 outline-none focus:border-orange-500"
          placeholder="Details (Sets, Reps, etc.)"
        />
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => onDelete(day, drill.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg flex items-center gap-1 font-medium text-xs px-3 transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={!isPreviewMode}
      onDragStart={(e) => {
        if (isPreviewMode) return;
        onDragStart(e, day, drill, index);
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, day, index)}
      className="relative flex items-start gap-2 pb-3 group break-inside-avoid print:pb-2"
    >
      <div className="relative flex flex-col items-center min-w-[24px]">
        {!isLast && (
          <div className="absolute top-6 bottom-[-12px] left-1/2 -translate-x-1/2 w-[2px] bg-slate-200 dark:bg-slate-700 print:bg-slate-300"></div>
        )}
        <div
          className={`w-6 h-6 rounded-full border-2 ${typeStyle.border} bg-white dark:bg-slate-900 flex items-center justify-center z-10 shadow-sm relative print:border-2 print:shadow-none`}
        >
          <Icon
            className={`w-3.5 h-3.5 ${typeStyle.color} print:text-slate-800`}
          />
          {!isLast && (
            <div className="absolute -bottom-[5px] text-slate-300 dark:text-slate-600 print:hidden">
              <ChevronDown className="w-2 h-2" />
            </div>
          )}
        </div>
      </div>

      <div
        className={`flex-1 text-left ${
          !isPreviewMode
            ? 'cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800/50'
            : ''
        } p-1 -mt-1 rounded-lg transition-colors relative print:p-0`}
      >
        <div className="flex items-start gap-1">
          {!isPreviewMode && (
            <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 print:hidden">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight print:text-black">
                {drill.title}
              </h4>
              {drill.percentage && (
                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap print:bg-transparent print:border print:border-slate-300 print:text-slate-600">
                  {drill.percentage}%
                </span>
              )}
            </div>
            {drill.details && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap leading-snug print:text-slate-600">
                {drill.details}
              </p>
            )}
          </div>
        </div>
        {!isPreviewMode && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-orange-500 rounded flex opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-slate-100 dark:border-slate-700 print:hidden"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
