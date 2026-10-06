import React, { useState } from 'react';
import { 
  Calendar, LayoutDashboard, Library, BarChart3, MoreHorizontal, X,
  Copy, ClipboardPaste, Undo2, Redo2, FileDown, Sparkles, FileText,
  Eye, EyeOff, Trash2, Play, CalendarPlus, ChevronUp
} from 'lucide-react';

export default function MobileBottomNav({
  currentView, setCurrentView,
  showLibrary, setShowLibrary,
  onShowStats,
  onCopyWeek, onPasteWeek,
  onUndo, onRedo, canUndo, canRedo,
  onExportPDF, onOpenWelcomePack,
  onClearWeek, onBulkSave,
  isFourWeekView, onToggleFourWeekView,
  isPreviewMode, setIsPreviewMode,
  isEditingBlock, onDeployBlock,
  selectedAthlete
}) {
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const isPlannerActive = currentView === 'planner' && !showLibrary;
  const isDashboardActive = currentView === 'dashboard' && !showLibrary;
  const isLibraryActive = showLibrary;

  const handleTabClick = (tab) => {
    if (tab === 'planner') {
      setShowLibrary(false);
      setCurrentView('planner');
    } else if (tab === 'dashboard') {
      setShowLibrary(false);
      setCurrentView('dashboard');
    } else if (tab === 'library') {
      setShowLibrary(true);
    } else if (tab === 'stats') {
      onShowStats();
    } else if (tab === 'actions') {
      setShowActionsSheet(true);
    }
  };

  return (
    <>
      {/* 📱 1. Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-[80] md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] flex items-center justify-around print:hidden select-none"
      >
        {/* Tab 1: Planner */}
        <button
          onClick={() => handleTabClick('planner')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isPlannerActive 
              ? 'text-orange-500 font-black' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isPlannerActive ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-500' : ''}`}>
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">الجدول</span>
        </button>

        {/* Tab 2: Athletes / Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isDashboardActive 
              ? 'text-orange-500 font-black' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isDashboardActive ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-500' : ''}`}>
            <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">اللاعبين</span>
        </button>

        {/* Tab 3: Exercise Library */}
        <button
          onClick={() => handleTabClick('library')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isLibraryActive 
              ? 'text-orange-500 font-black' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isLibraryActive ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-500' : ''}`}>
            <Library className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">المكتبة</span>
        </button>

        {/* Tab 4: Workload Analytics */}
        <button
          onClick={() => handleTabClick('stats')}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold active:scale-95"
        >
          <div className="p-1.5 rounded-xl">
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">التحليلات</span>
        </button>

        {/* Tab 5: More Actions Sheet Trigger */}
        <button
          onClick={() => handleTabClick('actions')}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 text-slate-400 dark:text-slate-500 hover:text-orange-500 font-bold active:scale-95"
        >
          <div className="p-1.5 rounded-xl relative">
            <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            {(canUndo || isEditingBlock) && (
              <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-1 right-1 animate-pulse"></span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">المزيد</span>
        </button>
      </nav>

      {/* 📋 2. Week Actions Bottom Sheet (Modal Sheet) */}
      {showActionsSheet && (
        <div 
          className="fixed inset-0 z-[200] md:hidden bg-slate-950/70 backdrop-blur-sm flex items-end justify-center transition-all animate-fadeIn"
          onClick={() => setShowActionsSheet(false)}
        >
          <div 
            className="w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl space-y-4 animate-slideUp text-right select-none"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center justify-center pb-2">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3"></div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-500 font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">إجراءات وأدوات التدريب</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">تحكم كامل في الأسبوع الحالي والطباعة</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowActionsSheet(false)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Copy Week */}
              <button
                onClick={() => { onCopyWeek(); setShowActionsSheet(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight">نسخ الأسبوع</span>
                  <span className="text-[9px] text-slate-400 font-normal">Copy Full Week</span>
                </div>
              </button>

              {/* Paste Week */}
              <button
                onClick={() => { onPasteWeek(); setShowActionsSheet(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-green-50 dark:hover:bg-green-950/20 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight">لصق الأسبوع</span>
                  <span className="text-[9px] text-slate-400 font-normal">Paste Week</span>
                </div>
              </button>

              {/* Undo */}
              <button
                onClick={() => { if (canUndo) onUndo(); }}
                disabled={!canUndo}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                  canUndo 
                    ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60 active:scale-95' 
                    : 'opacity-40 bg-slate-100 dark:bg-slate-900 border-transparent cursor-not-allowed'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight font-bold text-xs">تراجع للخلف</span>
                  <span className="text-[9px] text-slate-400 font-normal">Undo Action</span>
                </div>
              </button>

              {/* Redo */}
              <button
                onClick={() => { if (canRedo) onRedo(); }}
                disabled={!canRedo}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                  canRedo 
                    ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60 active:scale-95' 
                    : 'opacity-40 bg-slate-100 dark:bg-slate-900 border-transparent cursor-not-allowed'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Redo2 className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight font-bold text-xs">إعادة الخطوة</span>
                  <span className="text-[9px] text-slate-400 font-normal">Redo Action</span>
                </div>
              </button>

              {/* Export PDF */}
              <button
                onClick={() => { onExportPDF(); setShowActionsSheet(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 font-bold text-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
                  <FileDown className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight">تصدير PDF</span>
                  <span className="text-[9px] text-orange-400/80 font-normal">Official Report</span>
                </div>
              </button>

              {/* Welcome Pack */}
              <button
                onClick={() => { onOpenWelcomePack(); setShowActionsSheet(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold text-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight">كتيّب الترحيب</span>
                  <span className="text-[9px] text-orange-400/80 font-normal">Welcome Pack</span>
                </div>
              </button>

              {/* 4-Week Sheet View */}
              <button
                onClick={() => { onToggleFourWeekView(); setShowActionsSheet(false); }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all active:scale-95 ${
                  isFourWeekView
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isFourWeekView ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight font-bold text-xs">عرض 4 أسابيع</span>
                  <span className={`text-[9px] font-normal ${isFourWeekView ? 'text-white/80' : 'text-slate-400'}`}>4-Week Overview</span>
                </div>
              </button>

              {/* Preview Mode Toggle */}
              <button
                onClick={() => { setIsPreviewMode(!isPreviewMode); setShowActionsSheet(false); }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all active:scale-95 ${
                  isPreviewMode
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isPreviewMode ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div className="text-right">
                  <span className="block leading-tight font-bold text-xs">وضع المعاينة</span>
                  <span className={`text-[9px] font-normal ${isPreviewMode ? 'text-white/80' : 'text-slate-400'}`}>Preview Mode</span>
                </div>
              </button>

              {/* Save as Meso/Macro Block */}
              <button
                onClick={() => { onBulkSave(); setShowActionsSheet(false); }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight font-bold text-xs">حفظ ككتلة تدريب</span>
                  <span className="text-[9px] text-slate-400 font-normal">Save Meso-Block</span>
                </div>
              </button>

              {/* Deploy Block (if editing block) */}
              {isEditingBlock && (
                <button
                  onClick={() => { onDeployBlock(); setShowActionsSheet(false); }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 font-bold text-xs transition-all active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-500 text-white flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="block leading-tight font-bold text-xs">نشر البرنامج</span>
                    <span className="text-[9px] text-violet-400 font-normal">Deploy to Athlete</span>
                  </div>
                </button>
              )}

              {/* Clear Week */}
              <button
                onClick={() => { onClearWeek(); setShowActionsSheet(false); }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs transition-all active:scale-95 mt-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>تفريغ جدول الأسبوع بالكامل (Clear Week)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
