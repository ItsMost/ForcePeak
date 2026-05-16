import React, { useState } from 'react';
import { GripVertical, Edit2, Trash2, X, Save, Percent, Dumbbell, Zap, Shield, Activity, Target, Copy } from 'lucide-react';

const EXERCISE_CATEGORIES = {
  mobility: 'Mobility (حركية)',
  core: 'Core (جذع)',
  isometric: 'Isometric (ثبات)',
  power: 'Power (قدرة)',
  strength: 'Strength (قوة)',
  physical: 'Physical (بدني عام)'
};

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
  onUpdate, onDelete, onCopy, onDragStart, onDragOver, onDrop 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...drill });

  const safeType = drill.type ? drill.type.toLowerCase() : 'physical';
  const style = CATEGORY_STYLES[safeType] || CATEGORY_STYLES.physical;

  const handleOpenEdit = () => { setEditData({ ...drill }); setIsEditing(true); };
  const handleSave = () => { onUpdate(day, drill.id, editData); setIsEditing(false); };
  const handleCancel = () => { setIsEditing(false); };

  return (
    <>
      <div 
        className="relative flex gap-3 group pb-4"
        draggable={!isPreviewMode}
        onDragStart={(e) => onDragStart && onDragStart(e, day, drill, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop && onDrop(e, day, index)}
      >
        {!isLast && <div className="absolute top-8 bottom-0 left-[15px] w-px bg-slate-200 dark:bg-slate-700 print:bg-slate-300"></div>}

        <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-800 shrink-0 print:border-slate-400 ${style.color}`}>
          {style.icon}
        </div>

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

            {!isPreviewMode && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* زرار النسخ الجديد */}
                <button onClick={() => onCopy && onCopy(drill)} className="p-1 text-slate-400 hover:text-green-500 transition-colors" title="نسخ التمرين">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleOpenEdit} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="تعديل">
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

      {isEditing && !isPreviewMode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-500" /> تعديل التمرين</h3>
              <button onClick={handleCancel} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">النوع</label>
                  <select value={editData.type} onChange={(e) => setEditData({...editData, type: e.target.value})} className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    {Object.entries(EXERCISE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">النسبة (%)</label>
                  <div className="relative w-full">
                    <input type="number" value={editData.percentage || ''} onChange={(e) => setEditData({...editData, percentage: e.target.value})} className="w-full text-sm py-2.5 pl-7 pr-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
                    <Percent className="w-3.5 h-3.5 absolute left-2 top-3 text-slate-400" />
                  </div>
                </div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">الاسم</label><input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} placeholder="اسم التمرين..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white font-medium" autoFocus/></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">التفاصيل (عدات، وقت...)</label><textarea value={editData.details} onChange={(e) => setEditData({...editData, details: e.target.value})} placeholder="مثال: 5 sets x 5 reps..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white h-24 resize-none" /></div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <button onClick={() => onDelete(day, drill.id)} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4"/> مسح</button>
              <div className="flex gap-2"><button onClick={handleCancel} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm">إلغاء</button><button onClick={handleSave} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center gap-2"><Save className="w-4 h-4"/> حفظ</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}