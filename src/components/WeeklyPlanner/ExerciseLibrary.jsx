import React from 'react';
import { Library, X, Layers, Plus } from 'lucide-react';
import { DRILL_TYPES } from '../../data/constants';

export default function ExerciseLibrary({
  showLibrary,
  setShowLibrary,
  library,
  handleLibraryDragStart,
  setAddExerciseModal,
  setSaveWeekTemplateModal,
}) {
  return (
    <div
      className={`absolute top-0 right-0 h-full w-80 max-w-[90%] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-300 z-30 flex flex-col print:hidden ${
        showLibrary ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Library className="w-5 h-5 text-orange-500" /> مكتبة التمارين
        </h3>
        <button
          onClick={() => setShowLibrary(false)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> قوالب الأيام (TEMPLATES)
            </h4>
            {/* زر الإضافة الجديد للقوالب */}
            <button
              onClick={() =>
                setSaveWeekTemplateModal({ isOpen: true, name: '' })
              }
              className="text-orange-500 hover:text-orange-600 p-1 bg-orange-50 dark:bg-orange-900/30 rounded transition-colors"
              title="إضافة الأسبوع كقالب"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {library.templates.map((tpl) => (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => handleLibraryDragStart(e, tpl, true)}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md cursor-grab bg-white dark:bg-slate-800 transition-all"
              >
                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  {tpl.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {tpl.drills.length} تمارين متضمنة
                </div>
              </div>
            ))}
            {library.templates.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">
                لا توجد قوالب محفوظة.
              </p>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              تمارين فردية
            </h4>
            <button
              onClick={() =>
                setAddExerciseModal({
                  isOpen: true,
                  title: '',
                  details: '',
                  type: 'physical',
                  percentage: '',
                })
              }
              className="text-orange-500 hover:text-orange-600 p-1 bg-orange-50 dark:bg-orange-900/30 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {library.drills.map((drill) => {
              const typeStyle = DRILL_TYPES[drill.type];
              const Icon = typeStyle.icon;
              return (
                <div
                  key={drill.id}
                  draggable
                  onDragStart={(e) => handleLibraryDragStart(e, drill, false)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-300 cursor-grab bg-white dark:bg-slate-800 flex items-center gap-3 transition-all relative"
                >
                  <div
                    className={`w-8 h-8 rounded-full border ${typeStyle.border} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${typeStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">
                      {drill.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {drill.details}
                    </div>
                  </div>
                  {drill.percentage && (
                    <div className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded">
                      {drill.percentage}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-xs text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50">
        اسحب الكروت وأفلتها في الأيام لإضافتها.
      </div>
    </div>
  );
}
