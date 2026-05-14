import React from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ChevronDown, UserPlus, User, Smartphone, Monitor, Moon, Sun, Library, BookmarkPlus 
} from 'lucide-react';

export default function Header({
  // الخصائص (Props) التي يستقبلها الهيدر من الملف الرئيسي index.jsx
  currentDate, setCurrentDate, currentWeekStart, setShowMonthCalendar,
  selectedAthlete, setSelectedAthleteId, athletes, 
  isAthleteDropdownOpen, setIsAthleteDropdownOpen, setShowAddAthleteModal,
  setShowProfileModal, 
  isMobileView, setIsMobileView, isDarkMode, setIsDarkMode,
  showLibrary, setShowLibrary, handleToast, setSaveWeekTemplateModal
}) {
  
  // تحويل تاريخ بداية الأسبوع إلى نص مقروء (مثال: May 2026)
  const monthYearString = currentWeekStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-6 w-full max-w-[1600px] mx-auto">
        
        {/* ================= القسم الأيسر: اسم التطبيق والتاريخ ================= */}
        <div className="flex items-center gap-6">
          {/* إخفاء اسم التطبيق على الموبايل لتوفير مساحة إذا لزم الأمر، أو تركه ظاهراً */}
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent hidden md:block">
            Weekly Planner
          </h1>
          
          {/* أزرار التنقل بين الأسابيع (تختفي على الشاشات الصغيرة جداً لتوفير المساحة) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700 hidden sm:flex">
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setShowMonthCalendar(true)} className="flex items-center gap-2 px-3 py-1 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-200">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              {monthYearString}
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= القسم الأوسط: إدارة اللاعبين والقوالب ================= */}
        <div className="relative flex items-center gap-1 sm:gap-2 flex-1 justify-center md:justify-center justify-start">
           
           {/* زر القائمة المنسدلة لاختيار اللاعب */}
           <button onClick={() => setIsAthleteDropdownOpen(!isAthleteDropdownOpen)} className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
            {/* عرض الحرف الأول من اسم اللاعب */}
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {selectedAthlete?.name ? selectedAthlete.name.charAt(0).toUpperCase() : '?'}
            </div>
            {/* إخفاء اسم اللاعب بالكامل على الشاشات الصغيرة جداً */}
            <span className="font-semibold text-slate-800 dark:text-slate-100 hidden sm:inline truncate max-w-[150px]">
              {selectedAthlete?.name || 'No Athlete'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAthleteDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* زر فتح بروفايل اللاعب (يظهر فقط إذا كان هناك لاعب محدد) */}
          {selectedAthlete && (
            <button onClick={() => setShowProfileModal(true)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all" title="View Profile">
              <User className="w-5 h-5" />
            </button>
          )}

          {/* زر إضافة لاعب جديد */}
          <button onClick={() => setShowAddAthleteModal(true)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all" title="Add New Athlete">
            <UserPlus className="w-5 h-5" />
          </button>

          {/* زر حفظ الأسبوع الحالي كقالب */}
          <button onClick={() => setSaveWeekTemplateModal({isOpen: true, name: ''})} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all hidden sm:block" title="Save Week as Template">
            <BookmarkPlus className="w-5 h-5" />
          </button>

          {/* القائمة المنسدلة بأسماء اللاعبين المتاحين */}
          {isAthleteDropdownOpen && (
            <div className="absolute top-full mt-2 w-56 sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 left-0 sm:left-auto">
              {athletes.map(athlete => (
                <button 
                  key={athlete.id} 
                  onClick={() => { 
                    setSelectedAthleteId(athlete.id); 
                    setIsAthleteDropdownOpen(false); 
                    handleToast(`تم اختيار ${athlete.name}`); 
                  }} 
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors dark:text-slate-200 ${selectedAthlete?.id === athlete.id ? 'text-orange-500 font-medium bg-orange-50/50 dark:bg-orange-500/10' : ''}`}
                >
                  {athlete.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= القسم الأيمن: إعدادات العرض ومكتبة التمارين ================= */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          
          {/* زر التبديل بين وضع الموبايل والكمبيوتر (متاح دائماً الآن) */}
          <button onClick={() => setIsMobileView(!isMobileView)} className={`p-2 rounded-lg transition-colors ${isMobileView ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 hover:text-blue-500 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Mobile View Toggle">
            {isMobileView ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </button>
          
          {/* زر تبديل الوضع الليلي والنهاري */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-orange-500 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* خط فاصل يظهر فقط على الشاشات الكبيرة */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          
          {/* زر فتح/إغلاق مكتبة التمارين الجانبية */}
          <button onClick={() => setShowLibrary(!showLibrary)} className={`px-2 py-2 sm:px-4 sm:py-2 rounded-xl font-medium text-sm shadow-sm transition-all flex items-center gap-2 border ${showLibrary ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}>
            <Library className="w-5 h-5 sm:w-4 sm:h-4" /> 
            {/* النص مخفي على الموبايل وظاهر على الكمبيوتر لتوفير المساحة */}
            <span className="hidden sm:inline">مكتبة التمارين</span>
          </button>
        </div>

      </div>
    </header>
  );
}