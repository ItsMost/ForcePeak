import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ChevronDown, ChevronUp, UserPlus, User, Smartphone, Monitor, Moon, Sun, Library, BookmarkPlus, Search, Activity,
  Layers
} from 'lucide-react';

export default function Header({
  currentDate, setCurrentDate, currentWeekStart, setShowMonthCalendar,
  selectedAthlete, setSelectedAthleteId, athletes, 
  isAthleteDropdownOpen, setIsAthleteDropdownOpen, setShowAddAthleteModal,
  setShowProfileModal, 
  isMobileView, setIsMobileView, isDarkMode, setIsDarkMode,
  showLibrary, setShowLibrary, handleToast, setSaveWeekTemplateModal,
  weeklyStats,
  isOnline, syncStatus, onDelete,
  onMoveAthlete,
  setShowPeriodizationPlanner
}) {
  
  const [athleteSearch, setAthleteSearch] = useState('');
  const filteredAthletes = athletes.filter(a => a.name.toLowerCase().includes(athleteSearch.toLowerCase()));

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
    <header className="min-h-[64px] h-auto py-3 sm:py-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors duration-200 shadow-sm font-sans">
      
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-3 gap-x-4 w-full max-w-[1600px] mx-auto">
        
        {/* 1. Left branding block */}
        <div className="flex items-center gap-3 shrink-0 order-1 select-none">
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

        {/* 2. Center-Left date navigation capsule */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-full p-1 shadow-inner shrink-0 order-2">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} 
            className="p-1 rounded-full hover:bg-white dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white rounded-full transition-all leading-none"
          >
            Today
          </button>
          
          <span className="text-xs md:text-sm font-black text-slate-800 dark:text-white px-2 select-none tracking-tight">
            {getFormattedDateRange()}
          </span>
          
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} 
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
            title="Periodization Planner / مخطط الدورات التدريبية"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* 3. Center-Right stats indicators pill */}
        {weeklyStats && (
          <div className="hidden xl:flex items-center gap-3.5 px-4 py-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850/80 order-4 lg:order-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Load:</span>
              <span className="text-xs font-black text-slate-800 dark:text-white leading-none">
                {weeklyStats.load} AU
              </span>
            </div>
            
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider shadow-sm leading-none ${weeklyStats.loadColor}`}>
              {weeklyStats.loadLabel}
            </span>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Intensity:</span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none">
                {weeklyStats.intensity}%
              </span>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full border border-pink-100 bg-pink-50/50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 text-[8.5px] font-black uppercase tracking-wider shadow-sm leading-none">
                CNS: {weeklyStats.cnsPercentage}%
              </span>
              <span className="px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8.5px] font-black uppercase tracking-wider shadow-sm leading-none">
                Struct: {weeklyStats.structuralPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* 4. Far Right switcher and tools */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 order-3 sm:order-4 w-full lg:w-auto mt-1 lg:mt-0 justify-end flex-1 lg:flex-initial">
          
          {/* Athlete switcher pill */}
          <div className="relative flex items-center">
            <button 
              onClick={() => { setIsAthleteDropdownOpen(!isAthleteDropdownOpen); setAthleteSearch(''); }} 
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent hover:border-slate-150 dark:hover:border-slate-800 transition-all bg-slate-50 sm:bg-transparent dark:bg-slate-900 w-full sm:w-auto shrink-0 select-none shadow-sm sm:shadow-none"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-[11px] shadow-sm shrink-0">
                {selectedAthlete?.name ? selectedAthlete.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                {selectedAthlete?.name || 'No Athlete'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAthleteDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAthleteDropdownOpen && (
              <div className="absolute top-full mt-2 w-full sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-700 py-3 z-50 right-0">
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
                          className={`flex items-center justify-between px-4 py-1.5 group/row hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedAthlete?.id === athlete.id ? 'bg-orange-50/50 dark:bg-orange-500/10' : ''}`}
                        >
                          <button 
                            type="button"
                            onClick={() => { 
                              setSelectedAthleteId(athlete.id); 
                              setIsAthleteDropdownOpen(false); 
                              setAthleteSearch(''); 
                              handleToast(`Selected ${athlete.name}`); 
                            }} 
                            className={`flex-1 text-left text-xs font-black uppercase truncate pr-2 dark:text-slate-250 ${selectedAthlete?.id === athlete.id ? 'text-orange-500 font-bold' : 'text-slate-700 dark:text-slate-200'}`}
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

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block shrink-0"></div>

          {/* Library and tools buttons */}
          <button 
            onClick={() => setSaveWeekTemplateModal({ isOpen: true, name: '' })} 
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="Save Week Template / حفظ الأسبوع"
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
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="View Athlete Profile"
          >
            <User className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowAddAthleteModal(true)} 
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 transition-all shrink-0 shadow-sm" 
            title="Add New Athlete"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block shrink-0"></div>

          <button onClick={() => setIsMobileView(!isMobileView)} className={`p-2 rounded-xl border transition-all shrink-0 shadow-sm ${isMobileView ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200' : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'}`} title="Mobile View Toggle">
            {isMobileView ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-500 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shrink-0 shadow-sm">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
}