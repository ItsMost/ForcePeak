import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ChevronDown, ChevronUp, UserPlus, User, Smartphone, Monitor, Moon, Sun, Library, BookmarkPlus, Search, Activity,
  Layers, TrendingUp, LayoutDashboard, X, Edit2, Trash2
} from 'lucide-react';

export default function Header({
  currentDate, setCurrentDate, currentWeekStart, setShowMonthCalendar,
  selectedAthlete, setSelectedAthleteId, athletes, 
  isAthleteDropdownOpen, setIsAthleteDropdownOpen, setShowAddAthleteModal,
  setShowProfileModal, 
  isMobileView, setIsMobileView, isDarkMode, setIsDarkMode,
  showLibrary, setShowLibrary, handleToast, setSaveWeekTemplateModal,
  weeklyStats,
  isOnline, syncStatus, onDelete, onDeleteBlock,
  currentView, setCurrentView,
  onMoveAthlete,
  setShowPeriodizationPlanner,
  selectedBlockId, setSelectedBlockId, blockTemplates = [],
  isEditingBlock, activeBlockPhaseIndex, activeBlockWeekIndex, blockData,
  setActiveBlockWeekIndex, setActiveBlockPhaseIndex,
  isEditingMeso,
  activeMesoWeekIndex,
  setActiveMesoWeekIndex,
  mesoData,
  isEditingMacro,
  activeMacroWeekIndex,
  setActiveMacroWeekIndex,
  macroData,
  macroWeeks,
  onExitMeso,
  onExitMacro
}) {
  
  const isTemplateEditing = isEditingBlock || isEditingMeso || isEditingMacro;
  const [athleteSearch, setAthleteSearch] = useState('');
  const filteredAthletes = athletes.filter(a => a.name.toLowerCase().includes(athleteSearch.toLowerCase()));

  const [isBlockDropdownOpen, setIsBlockDropdownOpen] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');
  const filteredBlocks = (blockTemplates || []).filter(b => 
    (b.program_name || '').toLowerCase().includes(blockSearch.toLowerCase())
  );

  const [showMobileAthleteSheet, setShowMobileAthleteSheet] = useState(false);
  const [mobileSheetTab, setMobileSheetTab] = useState('athletes'); // 'athletes' | 'blocks'

  const handlePrevWeek = () => {
    if (isEditingBlock) {
      if (activeBlockWeekIndex > 0) {
        setActiveBlockWeekIndex(activeBlockWeekIndex - 1);
      }
    } else if (isEditingMeso) {
      if (activeMesoWeekIndex > 0) {
        setActiveMesoWeekIndex(activeMesoWeekIndex - 1);
      }
    } else if (isEditingMacro) {
      if (activeMacroWeekIndex > 0) {
        setActiveMacroWeekIndex(activeMacroWeekIndex - 1);
      }
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    }
  };

  const handleNextWeek = () => {
    if (isEditingBlock) {
      const maxWeeks = blockData?.phases?.[activeBlockPhaseIndex]?.weeks?.length || 0;
      if (activeBlockWeekIndex < maxWeeks - 1) {
        setActiveBlockWeekIndex(activeBlockWeekIndex + 1);
      }
    } else if (isEditingMeso) {
      const maxWeeks = mesoData?.weeks?.length || 0;
      if (activeMesoWeekIndex < maxWeeks - 1) {
        setActiveMesoWeekIndex(activeMesoWeekIndex + 1);
      }
    } else if (isEditingMacro) {
      const maxWeeks = macroWeeks?.length || 0;
      if (activeMacroWeekIndex < maxWeeks - 1) {
        setActiveMacroWeekIndex(activeMacroWeekIndex + 1);
      }
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    }
  };

  const handleGoToday = () => {
    if (isEditingBlock) {
      setActiveBlockWeekIndex(0);
    } else if (isEditingMeso) {
      setActiveMesoWeekIndex(0);
    } else if (isEditingMacro) {
      setActiveMacroWeekIndex(0);
    } else {
      setCurrentDate(new Date());
    }
  };

  const getHeaderLabel = () => {
    if (isEditingBlock && blockData) {
      const phase = blockData.phases?.[activeBlockPhaseIndex];
      const phaseName = phase?.name?.split('/')[0]?.trim() || `Phase ${activeBlockPhaseIndex + 1}`;
      return `${blockData.program_name || 'Block'} > ${phaseName} > Week ${activeBlockWeekIndex + 1}`;
    }
    if (isEditingMeso && mesoData) {
      return `${mesoData.program_name} > Week ${activeMesoWeekIndex + 1}`;
    }
    if (isEditingMacro && macroData) {
      const currentWeekItem = macroWeeks?.[activeMacroWeekIndex];
      const mesoNameLabel = currentWeekItem ? ` (${currentWeekItem.mesoName} W${currentWeekItem.mesoWeekIndex + 1})` : '';
      return `${macroData.program_name} > Week ${activeMacroWeekIndex + 1}${mesoNameLabel}`;
    }
    return getFormattedDateRange();
  };

  // Compute exact weekly date range matching: "May 30 - Jun 5, 2026"
  const getFormattedDateRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endMonth = end.toLocaleString('en-US', { month: 'short' });
    const endDay = end.getDate();
    const year = end.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  return (
    <header className="min-h-[64px] md:h-16 py-3 md:py-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 lg:px-4 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors duration-200 shadow-sm font-sans">
      
      {/* 📱 Mobile-Specific Single-Row Header */}
      <div className="flex md:hidden items-center justify-between w-full gap-1.5">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
              Peak Force
            </h1>
            <p className="text-[7.5px] font-black text-orange-500 uppercase tracking-widest leading-none">
              LAB
            </p>
          </div>
        </div>

        {/* Center: Athlete & Active Plan Selector Capsule Button */}
        <button
          type="button"
          onClick={() => {
            setShowMobileAthleteSheet(true);
            setAthleteSearch('');
            setBlockSearch('');
          }}
          className="flex-1 mx-1.5 flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xs active:scale-95 transition-all text-left"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
              <User className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex flex-col items-start leading-none">
              <span className="text-[10.5px] font-black text-slate-800 dark:text-white truncate max-w-[110px]">
                {isTemplateEditing ? (selectedBlockId && blockData ? blockData.program_name : 'Template') : (selectedAthlete?.name || 'اختر الرياضي')}
              </span>
              <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate max-w-[110px]">
                {isTemplateEditing ? 'Template Mode' : (selectedAthlete?.groupName || 'Live Athlete')}
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Right: Quick Tools (Calendar, Theme, Sync) */}
        <div className="flex items-center gap-1 shrink-0">
          {syncStatus && (
            <div className="flex items-center justify-center w-2 h-2 rounded-full" title={`Sync: ${syncStatus}`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`}></span>
            </div>
          )}
          <button
            onClick={() => setShowMonthCalendar(true)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
            title="Monthly Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 👤 Mobile Athlete & Plan Selector Bottom Sheet */}
      {showMobileAthleteSheet && (
        <div 
          className="fixed inset-0 z-[200] md:hidden bg-slate-950/70 backdrop-blur-sm flex items-end justify-center transition-all animate-fadeIn"
          onClick={() => setShowMobileAthleteSheet(false)}
        >
          <div 
            className="w-full max-h-[85vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col space-y-4 animate-slideUp text-right select-none"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center justify-center pb-1 shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3"></div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">اختيار الرياضي أو القالب</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">تبديل سهل وسريع للبرامج واللاعبين</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileAthleteSheet(false)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selector Tabs: Athletes vs Block Templates */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setMobileSheetTab('athletes')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                  mobileSheetTab === 'athletes' 
                    ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                الرياضيين ({athletes.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileSheetTab('blocks')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                  mobileSheetTab === 'blocks' 
                    ? 'bg-white dark:bg-slate-700 text-violet-500 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                قوالب التدريب ({blockTemplates?.length || 0})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={mobileSheetTab === 'athletes' ? "ابحث عن لاعب بالاسم..." : "ابحث عن قالب تدريب..."}
                value={mobileSheetTab === 'athletes' ? athleteSearch : blockSearch}
                onChange={(e) => mobileSheetTab === 'athletes' ? setAthleteSearch(e.target.value) : setBlockSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-bold dark:text-white"
                autoFocus
              />
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] pr-0.5">
              {mobileSheetTab === 'athletes' ? (
                <>
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map(athlete => {
                      const isSelected = selectedAthlete?.id === athlete.id && !isTemplateEditing;
                      return (
                        <div
                          key={athlete.id}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-500 shadow-sm'
                              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Athlete Info (Click to select) */}
                          <div 
                            onClick={() => {
                              setSelectedAthleteId(athlete.id);
                              setSelectedBlockId(null);
                              if (onExitMeso) onExitMeso();
                              if (onExitMacro) onExitMacro();
                              setShowMobileAthleteSheet(false);
                              setAthleteSearch('');
                              handleToast(`تم اختيار: ${athlete.name}`);
                            }}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {athlete.name?.substring(0, 2).toUpperCase() || 'PF'}
                            </div>
                            <div className="min-w-0 text-right">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-black truncate ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-white'}`}>
                                  {athlete.name}
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {athlete.groupName && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black">
                                    {athlete.groupName}
                                  </span>
                                )}
                                <span className="text-[9.5px] text-slate-400 font-semibold truncate">
                                  {athlete.weight ? `${athlete.weight}kg` : ''} {athlete.verticalJump ? `• CMJ: ${athlete.verticalJump}cm` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Icons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0 mr-2">
                            {/* Edit Athlete Numbers Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAthleteId(athlete.id);
                                setShowMobileAthleteSheet(false);
                                setShowProfileModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs active:scale-90 transition-all"
                              title="تعديل أرقام الرياضي"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Athlete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من حذف ملف الرياضي "${athlete.name}"؟`)) {
                                  onDelete(athlete.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs active:scale-90 transition-all"
                              title="حذف الرياضي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">لا يوجد رياضيين بهذا الاسم</div>
                  )}
                  
                  {/* Quick Add Athlete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileAthleteSheet(false);
                      setShowAddAthleteModal(true);
                    }}
                    className="w-full py-3 mt-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-orange-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ إضافة رياضي جديد</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Live Athlete Mode Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBlockId(null);
                      if (athletes.length > 0) setSelectedAthleteId(athletes[0].id);
                      setShowMobileAthleteSheet(false);
                      handleToast('تم التحويل إلى وضع الرياضي الحي');
                    }}
                    className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-black text-xs text-right active:scale-98"
                  >
                    <Activity className="w-4 h-4 text-orange-500" />
                    <span>وضع الرياضي الحي (Live Athlete Mode)</span>
                  </button>

                  {filteredBlocks.length > 0 ? (
                    filteredBlocks.map(block => (
                      <div
                        key={block.id}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                          selectedBlockId === block.id
                            ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-500'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setSelectedAthleteId(null);
                            setShowMobileAthleteSheet(false);
                            setBlockSearch('');
                            handleToast(`قالب: ${block.program_name}`);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 text-right"
                        >
                          <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-500 font-black text-xs flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-black truncate text-slate-800 dark:text-white">{block.program_name}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium">{block.program_type || 'Meso-Block'}</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 mr-2">
                          {onDeleteBlock && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من حذف القالب "${block.program_name}"؟`)) {
                                  onDeleteBlock(block.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs active:scale-90 transition-all"
                              title="حذف القالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {selectedBlockId === block.id && (
                            <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 ml-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">لا توجد قوالب محفوظة بهذا الاسم</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop-Specific Header Layout */}
      <div className="hidden md:flex flex-nowrap items-center justify-between gap-x-3 w-full h-full">
        
        {/* 1. Left branding block */}
        <div className="flex items-center gap-3 xl:gap-5 shrink-0 order-1">
          <div className="flex items-center gap-3 select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
                Peak Force
              </h1>
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mt-0.5">
                PERFORMANCE CORE
              </p>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-0.5 shadow-sm">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 select-none ${currentView === 'dashboard' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-850'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { if (selectedAthlete) setCurrentView('planner'); }} 
              disabled={!selectedAthlete}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 select-none ${!selectedAthlete ? 'opacity-50 cursor-not-allowed' : ''} ${currentView === 'planner' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-850'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Weekly Planner</span>
            </button>
          </div>
        </div>

        {/* 2. Center-Left date navigation capsule */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-full p-1 shadow-inner shrink-0 order-2">
          <button 
            onClick={handlePrevWeek} 
            className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleGoToday} 
            className="px-2.5 py-1 text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white rounded-full transition-all leading-none"
          >
            {isEditingBlock || isEditingMeso || isEditingMacro ? 'W1' : 'Today'}
          </button>
          
          <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-white px-2 select-none tracking-tight">
            {getHeaderLabel()}
          </span>
          
          <button 
            onClick={handleNextWeek} 
            className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowMonthCalendar(true)} 
            className="p-1.5 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800/80 rounded-full hover:text-orange-500 transition-colors shadow-sm ml-1 shrink-0" 
            title="Monthly Plan Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button 
            onClick={() => setShowPeriodizationPlanner(true)} 
            className="p-1.5 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800/80 rounded-full hover:text-orange-500 transition-colors shadow-sm ml-1 shrink-0" 
            title="Periodization Planner"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* 3. Center-Right stats indicators pill */}
        {weeklyStats && (
          <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850/80 order-3 shadow-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Load:</span>
              <span className="text-xs font-black text-slate-800 dark:text-white leading-none">
                {weeklyStats.load} AU
              </span>
            </div>
            
            <span className={`px-2 py-0.5 rounded-lg border text-[8.5px] font-bold uppercase tracking-wider shadow-sm leading-none ${weeklyStats.loadColor}`}>
              {weeklyStats.loadLabel}
            </span>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Intensity:</span>
              <span className="text-xs font-black text-slate-800 dark:text-white leading-none">
                {weeklyStats.intensity}%
              </span>
            </div>

            <div className="hidden 2xl:block w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <div className="hidden 2xl:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg border border-pink-100 bg-pink-50/50 dark:bg-pink-950/10 text-pink-600 dark:text-pink-400 text-[8.5px] font-bold uppercase tracking-wider shadow-sm leading-none">
                CNS: {weeklyStats.cnsPercentage}%
              </span>
              <span className="px-2 py-0.5 rounded-lg border border-blue-100 bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 text-[8.5px] font-bold uppercase tracking-wider shadow-sm leading-none">
                Struct: {weeklyStats.structuralPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* 4. Far Right switcher and tools */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end flex-nowrap order-4">
          
          {/* Sync Status Indicator Pill */}
          {syncStatus && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 bg-slate-50 dark:bg-slate-900/50">
              {syncStatus === 'synced' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-green-600 dark:text-green-400 hidden 2xl:inline">Synced</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-amber-600 dark:text-amber-400 hidden 2xl:inline">Syncing</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-red-600 dark:text-red-400 hidden 2xl:inline">Offline</span>
                </>
              )}
            </div>
          )}

          {/* Athlete switcher pill */}
          <div className="relative flex items-center flex-1 sm:flex-initial">
            <button 
              onClick={() => { setIsAthleteDropdownOpen(!isAthleteDropdownOpen); setAthleteSearch(''); }} 
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent hover:border-slate-150 dark:hover:border-slate-800 transition-all bg-slate-50 sm:bg-transparent dark:bg-slate-900 w-full sm:w-auto shrink-0 select-none shadow-sm sm:shadow-none"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[90px] xl:max-w-[150px] 2xl:max-w-[220px]">
                {isEditingBlock || isEditingMeso || isEditingMacro ? 'Template Mode' : (selectedAthlete?.name || 'No Athlete')}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAthleteDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAthleteDropdownOpen && (
              <div className="absolute top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-700 py-3 z-[110] left-0">
                <div className="px-3 pb-3 mb-2 border-b border-slate-150 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search athlete..." value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white" autoFocus />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map(athlete => {
                      const isFirst = athletes.findIndex(a => a.id === athlete.id) === 0;
                      const isLast = athletes.findIndex(a => a.id === athlete.id) === athletes.length - 1;
                      return (
                        <div 
                          key={athlete.id} 
                          className={`flex items-center justify-between px-4 py-1.5 group/row hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedAthlete?.id === athlete.id && !(isEditingBlock || isEditingMeso || isEditingMacro) ? 'bg-orange-50/50 dark:bg-orange-500/10' : ''}`}
                        >
                          <button 
                            type="button"
                            onClick={() => { 
                              setSelectedAthleteId(athlete.id); 
                              setSelectedBlockId(null);
                              if (onExitMeso) onExitMeso();
                              if (onExitMacro) onExitMacro();
                              setIsAthleteDropdownOpen(false); 
                              setAthleteSearch(''); 
                              handleToast(`Selected ${athlete.name}`); 
                            }} 
                            className={`flex-1 text-left text-xs font-black uppercase truncate pr-2 dark:text-slate-250 ${selectedAthlete?.id === athlete.id && !(isEditingBlock || isEditingMeso || isEditingMacro) ? 'text-orange-500 font-bold' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            {athlete.name}
                          </button>
                          
                          {/* Reordering Controls */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveAthlete(athlete.id, 'up');
                              }}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isFirst ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 'text-slate-400 hover:text-orange-500'}`}
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveAthlete(athlete.id, 'down');
                              }}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isLast ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 'text-slate-400 hover:text-orange-500'}`}
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-xs text-center text-slate-500">No athletes found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block shrink-0"></div>

          {/* Block Template switcher pill */}
          <div className="relative flex items-center flex-1 sm:flex-initial">
            <button 
              onClick={() => { setIsBlockDropdownOpen(!isBlockDropdownOpen); setBlockSearch(''); }} 
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent hover:border-slate-150 dark:hover:border-slate-800 transition-all bg-slate-50 sm:bg-transparent dark:bg-slate-900 w-full sm:w-auto shrink-0 select-none shadow-sm sm:shadow-none"
            >
              <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-500 shadow-sm shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[90px] xl:max-w-[150px] 2xl:max-w-[220px]">
                {selectedBlockId && blockData ? blockData.program_name || 'Block Program' : 'Live Athlete Plan'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBlockDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isBlockDropdownOpen && (
              <div className="absolute top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-700 py-3 z-[110] left-0">
                <div className="px-3 pb-3 mb-2 border-b border-slate-150 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search block template..." value={blockSearch} onChange={(e) => setBlockSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white" autoFocus />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {/* Option to return to Athlete/Live Plan */}
                  <div className="px-2 pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBlockId(null);
                        setIsBlockDropdownOpen(false);
                        if (athletes.length > 0) {
                          setSelectedAthleteId(athletes[0].id);
                        }
                        handleToast('Switched to Live Athlete Mode');
                      }}
                      className="w-full text-right px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" /> Live Athlete Mode
                    </button>
                  </div>
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                  
                  {filteredBlocks.length > 0 ? (
                    filteredBlocks.map(block => (
                      <div 
                        key={block.id} 
                        className={`flex items-center justify-between px-4 py-1.5 group/row hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedBlockId === block.id ? 'bg-violet-50/50 dark:bg-violet-500/10' : ''}`}
                      >
                        <button 
                          type="button"
                          onClick={() => { 
                            setSelectedBlockId(block.id); 
                            setSelectedAthleteId(null);
                            setIsBlockDropdownOpen(false); 
                            setBlockSearch(''); 
                            handleToast(`Template: ${block.program_name}`); 
                          }} 
                          className={`flex-1 text-right text-xs font-black uppercase truncate pr-2 dark:text-slate-250 ${selectedBlockId === block.id ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                          {block.program_name}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-center text-slate-500">No blocks found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Exit Edit button */}
          {(isEditingBlock || isEditingMeso || isEditingMacro) && (
            <button
              onClick={() => {
                if (isEditingBlock && setSelectedBlockId) setSelectedBlockId(null);
                if (isEditingMeso && onExitMeso) onExitMeso();
                if (isEditingMacro && onExitMacro) onExitMacro();
                handleToast('Switched to Live Athlete Mode');
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              title="Exit Editing"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Exit Edit</span>
            </button>
          )}

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block shrink-0"></div>

          {/* Library and tools buttons */}
          <button 
            onClick={() => setSaveWeekTemplateModal({ isOpen: true, name: '' })} 
            className="hidden sm:inline-flex p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="Save Week Template"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowLibrary(!showLibrary)} 
            className={`p-2 rounded-xl transition-all border shrink-0 ${showLibrary ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 text-orange-500' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-orange-500 shadow-sm'}`} 
            title="Exercise Library"
          >
            <Library className="w-4 h-4" /> 
          </button>

          <button 
            onClick={() => setShowProfileModal(true)} 
            className="hidden sm:inline-flex p-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="View Athlete Profile"
          >
            <User className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowAddAthleteModal(true)} 
            className="hidden sm:inline-flex p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="Add New Athlete"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block shrink-0"></div>

          <button onClick={() => setIsMobileView(!isMobileView)} className="hidden md:inline-flex p-2 rounded-xl border transition-all shrink-0 shadow-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800" title="Mobile View Toggle">
            {isMobileView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shrink-0 shadow-sm">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
}