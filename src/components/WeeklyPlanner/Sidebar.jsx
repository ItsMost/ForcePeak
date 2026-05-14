import React from 'react';
import {
  Copy,
  Trash2,
  Eye,
  Share2,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export default function Sidebar({
  isMobileView,
  isPreviewMode,
  setIsPreviewMode,
  onCopy,
  onClearWeek,
  onShare,
  onPrint,
  onExportExcel,
}) {
  return (
    // تم إزالة كود الإخفاء (hidden) لتظل القائمة ظاهرة دائماً
    <aside className="w-14 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-6 gap-5 bg-white dark:bg-slate-800 shrink-0 z-10 print:hidden">
      <button
        onClick={onCopy}
        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        title="Copy Week"
      >
        <Copy className="w-5 h-5" />
      </button>
      <button
        onClick={onClearWeek}
        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        title="Clear Week"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <button
        onClick={() => setIsPreviewMode(!isPreviewMode)}
        className={`p-2 rounded-lg transition-colors ${
          isPreviewMode
            ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'text-slate-400 hover:text-blue-500'
        }`}
        title="Preview Mode"
      >
        <Eye className="w-5 h-5" />
      </button>
      <button
        onClick={onShare}
        className="p-2 text-slate-400 hover:text-green-500 transition-colors"
        title="Share Plan"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        onClick={onExportExcel}
        className="p-2 text-slate-400 hover:text-green-600 transition-colors"
        title="Export to Excel (CSV)"
      >
        <FileSpreadsheet className="w-5 h-5" />
      </button>
      <button
        onClick={onPrint}
        className="p-2 text-slate-400 hover:text-purple-500 transition-colors"
        title="Export to PDF / Print"
      >
        <Printer className="w-5 h-5" />
      </button>
    </aside>
  );
}
