import React from 'react';
import { Copy, ClipboardPaste, Trash2, Eye, Printer, Undo2, Redo2 } from 'lucide-react';

export default function Sidebar({ 
  isPreviewMode, setIsPreviewMode, 
  onCopyWeek, onPasteWeek, onClearWeek, onPrint,
  onUndo, onRedo, canUndo, canRedo 
}) {
  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-row items-center justify-around px-2 z-50 md:relative md:w-14 md:h-auto md:flex-col md:border-t-0 md:border-r md:py-6 md:gap-5 md:justify-start print:hidden transition-all shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
      
      {/* أدوات النسخ واللصق للأسبوع */}
      <button onClick={onCopyWeek} className="p-2.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="نسخ الأسبوع بالكامل">
        <Copy className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onPasteWeek} className="p-2.5 text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors" title="لصق الأسبوع المنسوخ">
        <ClipboardPaste className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <div className="hidden md:block w-6 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div className="md:hidden h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
      
      {/* أدوات التراجع والإعادة (Undo/Redo) */}
      <button 
        onClick={onUndo} 
        disabled={!canUndo} 
        className={`p-2.5 transition-colors ${canUndo ? 'text-slate-400 hover:text-orange-500 cursor-pointer' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`} 
        title="تراجع (Undo)"
      >
        <Undo2 className="w-5 h-5 md:w-5 md:h-5" />
      </button>

      <button 
        onClick={onRedo} 
        disabled={!canRedo} 
        className={`p-2.5 transition-colors ${canRedo ? 'text-slate-400 hover:text-orange-500 cursor-pointer' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`} 
        title="إعادة (Redo)"
      >
        <Redo2 className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <div className="hidden md:block w-6 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div className="md:hidden h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
      
      {/* أدوات المسح والطباعة */}
      <button onClick={onClearWeek} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors" title="مسح الأسبوع">
        <Trash2 className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-2.5 rounded-xl transition-colors ${isPreviewMode ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-500'}`} title="وضع الطباعة (Preview)">
        <Eye className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onPrint} className="p-2.5 text-slate-400 hover:text-purple-500 transition-colors" title="طباعة الأسبوع (Print)">
        <Printer className="w-5 h-5 md:w-5 md:h-5" />
      </button>
    </aside>
  );
}