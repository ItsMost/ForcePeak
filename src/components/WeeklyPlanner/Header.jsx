import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ChevronDown, UserPlus, User, Smartphone, Monitor, Moon, Sun, Library, BookmarkPlus, Search, Activity
} from 'lucide-react';

export default function Header({
  currentDate, setCurrentDate, currentWeekStart, setShowMonthCalendar,
  selectedAthlete, setSelectedAthleteId, athletes, 
  isAthleteDropdownOpen, setIsAthleteDropdownOpen, setShowAddAthleteModal,
  setShowProfileModal, 
  isMobileView, setIsMobileView, isDarkMode, setIsDarkMode,
  showLibrary, setShowLibrary, handleToast, setSaveWeekTemplateModal,
  weeklyStats,
  isOnline, syncStatus
}) {
  
  const [athleteSearch, setAthleteSearch] = useState('');
  const monthYearString = currentWeekStart.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const filteredAthletes = athletes.filter(a => a.name.toLowerCase().includes(athleteSearch.toLowerCase()));

  return (
    <header className="min-h-[64px] h-auto py-2 sm:py-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors duration-200">
      
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-3 gap-x-1 sm:gap-6 w-full max-w-[1600px] mx-auto">
        
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0 order-1">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent hidden md:block">
            Weekly Planner
          </h1>
          
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 sm:p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setShowMonthCalendar(true)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-200">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span>{monthYearString}</span>
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 sm:p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Section: Weekly Load Indicators */}
        {weeklyStats && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 order-4 lg:order-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">W. LOAD:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${weeklyStats.loadColor}`}>
                {weeklyStats.load} ({weeklyStats.loadLabel})
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AVG INT:</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{weeklyStats.intensity}%</span>
            </div>
          </div>
        )}

        {/* Right Section (Tools) */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0 order-2 sm:order-3">
          <button onClick={() => setIsMobileView(!isMobileView)} className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isMobileView ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 hover:text-blue-500 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Mobile View Toggle">
            {isMobileView ? <Monitor className="w-4 h-4 sm:w-5 sm:h-5" /> : <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 sm:p-2 text-slate-400 hover:text-orange-500 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
            {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          
          <button onClick={() => setSaveWeekTemplateModal({ isOpen: true, name: '' })} className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border border-transparent rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 p-1.5 sm:px-4 sm:py-2">
            <BookmarkPlus className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Save Week</span>
          </button>
          
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-1.5 sm:px-4 sm:py-2 rounded-xl font-medium text-sm shadow-sm transition-all flex items-center gap-2 border ${showLibrary ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}>
            <Library className="w-4 h-4 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">Exercise Library</span>
          </button>
        </div>

        {/* Athlete Management */}
        <div className="relative flex items-center gap-1 sm:gap-2 flex-1 justify-center sm:justify-start order-3 sm:order-4 w-full lg:w-auto mt-1 lg:mt-0">
           
            {/* Sync Status Indicator Pill */}
            {syncStatus && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 bg-slate-50 dark:bg-slate-900/50">
                {syncStatus === 'synced' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-green-600 dark:text-green-400 hidden xs:inline">Synced</span>
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-amber-600 dark:text-amber-400 hidden xs:inline">Syncing</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-red-600 dark:text-red-400 hidden xs:inline">Offline</span>
                  </>
                )}
              </div>
            )}

           <button onClick={() => { setIsAthleteDropdownOpen(!isAthleteDropdownOpen); setAthleteSearch(''); }} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group w-full sm:w-auto bg-slate-50 sm:bg-transparent dark:bg-slate-800/50">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0">
              {selectedAthlete?.name ? selectedAthlete.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
              {selectedAthlete?.name || 'No Athlete'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform ${isAthleteDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {selectedAthlete && (
            <button onClick={() => setShowProfileModal(true)} className="p-2 sm:p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all shrink-0" title="View Profile">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button onClick={() => setShowAddAthleteModal(true)} className="p-2 sm:p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all shrink-0" title="Add New Athlete">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {isAthleteDropdownOpen && (
            <div className="absolute top-full mt-2 w-full sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-3 z-50 left-0">
              <div className="px-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search athlete..." value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white" autoFocus />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredAthletes.length > 0 ? (
                  filteredAthletes.map(athlete => (
                    <button key={athlete.id} onClick={() => { setSelectedAthleteId(athlete.id); setIsAthleteDropdownOpen(false); setAthleteSearch(''); handleToast(`Selected ${athlete.name}`); }} className={`w-full text-left px-4 py-3 sm:py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors dark:text-slate-200 ${selectedAthlete?.id === athlete.id ? 'text-orange-500 font-bold bg-orange-50/50 dark:bg-orange-500/10' : ''}`}>
                      {athlete.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-center text-slate-500">No athletes found</div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}