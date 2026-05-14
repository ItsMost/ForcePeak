import React from 'react';
import { Copy, Trash2, Eye, Share2, Printer, FileSpreadsheet } from 'lucide-react';

export default function Sidebar({ 
  isPreviewMode, setIsPreviewMode, 
  onCopy, onClearWeek, onShare, onPrint, onExportExcel 
}) {
  return (
    // التصميم الجديد: شريط سفلي ثابت على الموبايل، وقائمة جانبية على الشاشات الكبيرة
    <aside className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-row items-center justify-around px-2 z-50 md:relative md:w-14 md:h-auto md:flex-col md:border-t-0 md:border-r md:py-6 md:gap-5 md:justify-start print:hidden transition-all shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
      
      <button onClick={onCopy} className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="Copy Week">
        <Copy className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onClearWeek} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors" title="Clear Week">
        <Trash2 className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      {/* فواصل لتنظيم الأيقونات */}
      <div className="hidden md:block w-6 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div className="md:hidden h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
      
      <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-2.5 rounded-xl transition-colors ${isPreviewMode ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-500'}`} title="Preview Mode">
        <Eye className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onShare} className="p-2.5 text-slate-400 hover:text-green-500 transition-colors" title="Share Plan">
        <Share2 className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onExportExcel} className="p-2.5 text-slate-400 hover:text-green-600 transition-colors" title="Export to Excel">
        <FileSpreadsheet className="w-5 h-5 md:w-5 md:h-5" />
      </button>
      
      <button onClick={onPrint} className="p-2.5 text-slate-400 hover:text-purple-500 transition-colors" title="Export to PDF">
        <Printer className="w-5 h-5 md:w-5 md:h-5" />
      </button>
    </aside>
  );
}