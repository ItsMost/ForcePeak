import React, { useState } from 'react';
import { X, User, Activity, Dumbbell, Calendar, Save } from 'lucide-react';

export default function AthleteProfileModal({ athlete, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...athlete });

  const currentYear = new Date().getFullYear();
  const age = formData.birthYear ? currentYear - formData.birthYear : '-';
  // حساب البوصة تلقائياً للوثب العمودي
  const jumpInches = formData.verticalJump
    ? (formData.verticalJump / 2.54).toFixed(1)
    : '0';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <User className="w-6 h-6 text-orange-500" /> Athlete Profile
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Basic Info
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Birth Year{' '}
                  <span className="text-orange-500 font-bold ml-1">
                    (Age: {age})
                  </span>
                </label>
                <input
                  type="number"
                  name="birthYear"
                  value={formData.birthYear || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                />
              </div>

              {/* إضافة الطول */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Body Fat %
                </label>
                <input
                  type="number"
                  name="bodyFat"
                  value={formData.bodyFat || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Performance Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="col-span-2 md:col-span-4 mb-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Vertical Jump (cm)
                  <span className="text-slate-400 font-normal text-[11px] ml-2 tracking-wide">
                    {jumpInches} inches
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="verticalJump"
                  value={formData.verticalJump || ''}
                  onChange={handleChange}
                  className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                  placeholder="e.g. 60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Clean (kg)
                </label>
                <input
                  type="number"
                  name="clean"
                  value={formData.clean || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Half Squat (kg)
                </label>
                <input
                  type="number"
                  name="halfSquat"
                  value={formData.halfSquat || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Quarter Squat (kg)
                </label>
                <input
                  type="number"
                  name="quarterSquat"
                  value={formData.quarterSquat || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Bench Press (kg)
                </label>
                <input
                  type="number"
                  name="bench"
                  value={formData.bench || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors font-medium text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
