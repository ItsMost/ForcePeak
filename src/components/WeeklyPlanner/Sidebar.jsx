import { Copy, ClipboardPaste, Undo2, Redo2, BarChart3, Trash2, FileDown, Eye, EyeOff, Calendar, Play, FileText } from 'lucide-react';

export default function Sidebar({
  isPreviewMode, setIsPreviewMode, onCopyWeek, onPasteWeek,
  onUndo, onRedo, canUndo, canRedo, onShowStats, onClearWeek, onExportPDF, onBulkSave,
  isEditingBlock, onDeployBlock,
  isFourWeekView, onToggleFourWeekView
}) {
  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-16 md:h-full bg-white dark:bg-slate-800 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-row md:flex-col items-center justify-between px-2 sm:px-4 md:py-4 md:px-0 z-[100] shrink-0 print:hidden overflow-x-auto md:overflow-visible transition-colors duration-200">
      
      {/* Top/Left Action Tools */}
      <div className="flex flex-row md:flex-col items-center gap-1 sm:gap-3 w-max md:w-full">
        <button onClick={onCopyWeek} className="p-2 md:p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all" title="Copy Full Week">
          <Copy className="w-5 h-5" />
        </button>
        <button onClick={onPasteWeek} className="p-2 md:p-3 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all" title="Paste Week Block">
          <ClipboardPaste className="w-5 h-5" />
        </button>

        <div className="w-px h-6 md:w-8 md:h-px bg-slate-200 dark:bg-slate-700 mx-1 md:my-1"></div>

        <button onClick={onUndo} disabled={!canUndo} className={`p-2 md:p-3 rounded-xl transition-all ${canUndo ? 'text-slate-500 hover:text-blue-500 hover:bg-blue-50' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`} title="Undo">
          <Undo2 className="w-5 h-5" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={`p-2 md:p-3 rounded-xl transition-all ${canRedo ? 'text-slate-500 hover:text-blue-500 hover:bg-blue-50' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`} title="Redo">
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 md:w-8 md:h-px bg-slate-200 dark:bg-slate-700 mx-1 md:my-1"></div>

        <button onClick={onShowStats} className="p-2 md:p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Analytics Dashboard">
          <BarChart3 className="w-5 h-5" />
        </button>

        <button onClick={onBulkSave} className="p-2 md:p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all" title="Save Range as Meso-Block">
          <Calendar className="w-5 h-5" />
        </button>

        <button onClick={onToggleFourWeekView} className={`p-2 md:p-3 rounded-xl transition-all ${isFourWeekView ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'text-slate-400 hover:text-orange-500'}`} title="عرض 4 أسابيع / 4-Week Sheet View">
          <FileText className="w-5 h-5" />
        </button>

        <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-2 md:p-3 rounded-xl transition-all ${isPreviewMode ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500'}`} title="Toggle View">
          {isPreviewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>

        {isEditingBlock && (
          <button onClick={onDeployBlock} className="p-2 md:p-3 text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-xl transition-all" title="Deploy Block to Athlete / تطبيق القالب على لاعب">
            <Play className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom/Right Controls */}
      <div className="flex flex-row md:flex-col items-center gap-1 sm:gap-3 ml-auto md:ml-0">
        <button onClick={onExportPDF} className="p-2 md:p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all" title="Export PDF">
          <FileDown className="w-5 h-5" />
        </button>
        <button onClick={onClearWeek} className="p-2 md:p-3 text-slate-300 hover:text-red-500 rounded-xl transition-all" title="Clear Week">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}