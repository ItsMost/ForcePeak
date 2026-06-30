import React, { useState } from 'react';
import { User, Dumbbell, Zap, X, Save, Scale, Trash2, ShieldAlert } from 'lucide-react';

export default function AthleteProfileModal({ athlete, onClose, onSave, onDelete }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({
    id: athlete.id,
    name: athlete.name || '',
    groupName: athlete.groupName || '',
    birthYear: athlete.birthYear || '',
    weight: athlete.weight || '',
    height: athlete.height || '',
    bodyFat: athlete.bodyFat || '',
    verticalJump: athlete.verticalJump || '',
    standingLongJump: athlete.standingLongJump || '',
    squatJump: athlete.squatJump || '',
    clean: athlete.clean || '',
    halfSquat: athlete.halfSquat || '',
    quarterSquat: athlete.quarterSquat || '',
    fullSquat: athlete.fullSquat || '',
    bench: athlete.bench || '',
    deadlift: athlete.deadlift || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = () => {
    onSave(formData);
  };

  // Get athlete initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
      <div className="bg-[#FAFBFD] dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-[1050px] overflow-hidden border border-slate-200/60 dark:border-slate-800 flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Mockup Premium Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
              <User className="w-6 h-6"/>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Athletic Performance Dashboard</h3>
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400 mt-0.5 tracking-wider">
                PROFILE MANAGEMENT • <span className="text-slate-600 dark:text-slate-200">{formData.name || 'NEW ATHLETE'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Mockup Dashboard Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 bg-[#F5F7FA] dark:bg-slate-900/40">
          
          {/* ================= LEFT COLUMN (Lg: 5/12 grid) ================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 1: Full Athlete Name Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30 shrink-0">
                {getInitials(formData.name)}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">FULL ATHLETE NAME</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Enter Athlete Name"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">ATHLETE GROUP (e.g. Rehab, Sprinters)</label>
                  <input 
                    type="text" 
                    name="groupName" 
                    value={formData.groupName} 
                    onChange={handleChange} 
                    placeholder="e.g. Rehab, Sprinters, Group A"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Physical Metrics */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
                <Scale className="w-4 h-4 text-orange-500" /> Physical Metrics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">BIRTH YEAR</label>
                  <input 
                    type="number" 
                    name="birthYear" 
                    value={formData.birthYear} 
                    onChange={handleChange} 
                    placeholder="e.g. 2005"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">BODY FAT (%)</label>
                  <input 
                    type="number" 
                    name="bodyFat" 
                    step="0.1"
                    value={formData.bodyFat} 
                    onChange={handleChange} 
                    placeholder="e.g. 12.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">WEIGHT (KG)</label>
                  <input 
                    type="number" 
                    name="weight" 
                    value={formData.weight} 
                    onChange={handleChange} 
                    placeholder="e.g. 75"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">HEIGHT (CM)</label>
                  <input 
                    type="number" 
                    name="height" 
                    value={formData.height} 
                    onChange={handleChange} 
                    placeholder="e.g. 180"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Card 3: CNS & Plyometric Capacity */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
                <Zap className="w-4 h-4 text-orange-500" /> CNS & PLYOMETRIC CAPACITY
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">VERTICAL JUMP (CM)</label>
                  <input 
                    type="number" 
                    name="verticalJump" 
                    value={formData.verticalJump} 
                    onChange={handleChange} 
                    placeholder="e.g. 60"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">SQUAT JUMP (CM)</label>
                  <input 
                    type="number" 
                    name="squatJump" 
                    value={formData.squatJump} 
                    onChange={handleChange} 
                    placeholder="e.g. 55"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">STANDING LONG JUMP (METERS)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="standingLongJump" 
                  value={formData.standingLongJump} 
                  onChange={handleChange} 
                  placeholder="e.g. 2.50"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-orange-500/20 text-slate-850 dark:text-white font-bold text-xs sm:text-sm outline-none transition-all" 
                />
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (Lg: 7/12 grid) ================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 4: Gym Strength Records */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-5 h-full">
              <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
                <Dumbbell className="w-4 h-4 text-blue-500" /> GYM STRENGTH RECORDS (1RM)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">POWER CLEAN (KG)</label>
                  <input 
                    type="number" 
                    name="clean" 
                    value={formData.clean} 
                    onChange={handleChange} 
                    placeholder="e.g. 90"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">BENCH PRESS (KG)</label>
                  <input 
                    type="number" 
                    name="bench" 
                    value={formData.bench} 
                    onChange={handleChange} 
                    placeholder="e.g. 100"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">DEADLIFT (KG)</label>
                  <input 
                    type="number" 
                    name="deadlift" 
                    value={formData.deadlift} 
                    onChange={handleChange} 
                    placeholder="e.g. 180"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">FULL SQUAT (KG)</label>
                  <input 
                    type="number" 
                    name="fullSquat" 
                    value={formData.fullSquat} 
                    onChange={handleChange} 
                    placeholder="e.g. 140"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">HALF SQUAT (KG)</label>
                  <input 
                    type="number" 
                    name="halfSquat" 
                    value={formData.halfSquat} 
                    onChange={handleChange} 
                    placeholder="e.g. 160"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">QUARTER SQUAT (KG)</label>
                  <input 
                    type="number" 
                    name="quarterSquat" 
                    value={formData.quarterSquat} 
                    onChange={handleChange} 
                    placeholder="e.g. 180"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/25 text-slate-850 dark:text-white font-black text-xs sm:text-sm outline-none transition-all" 
                  />
                </div>
              </div>

              {/* Decorative Mockup Note */}
              <div className="mt-8 p-4 bg-blue-50/50 dark:bg-slate-900/60 rounded-2xl border border-blue-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                ℹ️ Peak strength testing parameters are locked strictly to 1-Repetition Maximum (1RM) indices. These calculations power the automated percentage multiplier blocks dynamically across the timeline workflow.
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
          <button 
            type="button" 
            onClick={() => setShowConfirmDelete(true)} 
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 border border-red-200 hover:border-red-300 dark:border-red-900/40 rounded-xl text-red-500 dark:text-red-400 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4"/> Delete Profile
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-black text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveClick} 
              className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/20 active:scale-98 transition-all font-black text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Save className="w-4 h-4"/> Save Changes
            </button>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Overlaid Box */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[28px] shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black mb-2 text-slate-800 dark:text-white">Are you absolutely sure?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
              This will permanently delete <span className="font-black text-slate-800 dark:text-white">"{formData.name}"</span> and all training workflows, histories, and analytics from the database. This action is irreversible!
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)} 
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-350 rounded-xl font-bold text-xs uppercase transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setShowConfirmDelete(false); onDelete(formData.id); }} 
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase shadow-md transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}