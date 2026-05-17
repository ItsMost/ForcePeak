import React, { useState } from 'react';
import { User, Activity, Dumbbell, Zap, X, Save, Scale, Ruler } from 'lucide-react';

export default function AthleteProfileModal({ athlete, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: athlete.id,
    name: athlete.name || '',
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">بروفايل اللاعب</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">سجل أرقام واختبارات اللاعب بدقة لحساب الأوزان تلقائياً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              <User className="w-4 h-4 text-blue-500" /> البيانات الأساسية
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الاسم بالكامل</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">سنة الميلاد</label>
                <input type="number" name="birthYear" value={formData.birthYear} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Section 2: Body Metrics */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              <Scale className="w-4 h-4 text-green-500" /> المقاسات الجسمانية
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الوزن (KG)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-green-500 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الطول (CM)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-green-500 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">نسبة الدهون (%)</label>
                <input type="number" name="bodyFat" value={formData.bodyFat} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-green-500 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Section 3: Strength Tests (1RM) */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-900/30">
            <h4 className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-4">
              <Dumbbell className="w-4 h-4" /> اختبارات القوة القصوى (1RM بالـ KG)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Clean (كلين)</label>
                <input type="number" name="clean" value={formData.clean} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Bench Press</label>
                <input type="number" name="bench" value={formData.bench} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Deadlift</label>
                <input type="number" name="deadlift" value={formData.deadlift} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Full Squat</label>
                <input type="number" name="fullSquat" value={formData.fullSquat} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Half Squat</label>
                <input type="number" name="halfSquat" value={formData.halfSquat} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Quarter Squat</label>
                <input type="number" name="quarterSquat" value={formData.quarterSquat} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 dark:text-white font-bold" />
              </div>
            </div>
          </div>

          {/* Section 4: Power Tests (تمت إضافة الاختبارات الجديدة) */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-5 border border-yellow-100 dark:border-yellow-900/30">
            <h4 className="flex items-center gap-2 text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-4">
              <Zap className="w-4 h-4" /> اختبارات القدرة (Power / Jumps)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Vertical Jump (CM)</label>
                <input type="number" name="verticalJump" value={formData.verticalJump} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-yellow-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Standing Long Jump (CM)</label>
                <input type="number" name="standingLongJump" value={formData.standingLongJump} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-yellow-500 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Squat Jump (CM)</label>
                <input type="number" name="squatJump" value={formData.squatJump} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-yellow-500 dark:text-white font-bold" />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm">
            إلغاء
          </button>
          <button onClick={handleSaveClick} className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center gap-2">
            <Save className="w-4 h-4"/> حفظ البيانات
          </button>
        </div>

      </div>
    </div>
  );
}