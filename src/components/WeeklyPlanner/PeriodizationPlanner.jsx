import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Calendar, Plus, Trash2, Edit2, Check, HelpCircle, 
  Sparkles, ChevronRight, ChevronLeft, Dumbbell, Play, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format date as YYYY-MM-DD
const getDbDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Colors matching the main index.jsx
const PHASE_COLORS = [
  { hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Blue (General)' },
  { hex: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-500', label: 'Violet (Preparation)' },
  { hex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Emerald (Strength)' },
  { hex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Amber (Power)' },
  { hex: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Rose (Peak)' },
  { hex: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500', label: 'Cyan (Transition)' }
];

const SYSTEM_PRESETS = [
  { id: 'sys-fdp-meso', program_name: '✨ [FDP] بروتوكول القوة الافتراضي / Default Max Strength', type: 'meso' },
  { id: 'sys-edp-meso', program_name: '✨ [EDP] بروتوكول القدرة الانفجارية / Default Elastic SSC', type: 'meso' },
  { id: 'sys-rsd-meso', program_name: '✨ [RSD] بروتوكول الصلابة والارتداد / Default Stiffness Plyos', type: 'meso' },
  { id: 'sys-hvrp-meso', program_name: '✨ [HVRP] بروتوكول السرعة العالية / Default High-Velocity RFD', type: 'meso' },
];

const getSystemPresetMeso = (programId) => {
  const protocol = programId.replace('sys-', '').replace('-meso', '').toUpperCase(); // FDP, EDP, RSD, HVRP
  
  if (protocol === 'FDP') {
    return {
      id: programId,
      program_name: 'Max Strength Protocol (FDP)',
      type: 'meso',
      weeks: [
        {
          title: "أسبوع 1: التكيف العصبي والقوة القصوى / Week 1: Max Strength & Neural Prep",
          drills: {
            Saturday: [
              { title: "Back Squat / سكوات خلفي (VBT)", type: "strength", details: "السرعة المستهدفة: 0.40 m/s | حد خسارة السرعة: 10% VL", sets: "4", reps: "5", rest: "3-4 min" },
              { title: "Bench Press / بنش برس (VBT)", type: "strength", details: "السرعة المستهدفة: 0.45 m/s | حد خسارة السرعة: 12% VL", sets: "4", reps: "5", rest: "3 min" },
              { title: "Romanian Deadlift / رفعة رومانية", type: "strength", details: "تركيز على التثبيت والتحكم اللامركزي", sets: "3", reps: "6", rest: "2 min" }
            ],
            Monday: [
              { title: "Deadlift / رفعة مميتة (VBT)", type: "strength", details: "السرعة المستهدفة: 0.35 m/s | حد خسارة السرعة: 10% VL", sets: "3", reps: "4", rest: "4 min" },
              { title: "Military Press / ضغط عسكري كتف", type: "strength", details: "زيادة الحمل التدريجي", sets: "4", reps: "6", rest: "2.5 min" },
              { title: "Weighted Pull-ups / عقلة بوزن", type: "strength", details: "سحب قوي مع تحكم في النزول", sets: "3", reps: "5", rest: "2 min" }
            ],
            Wednesday: [
              { title: "Leg Press / مكبس أرجل ثقيل", type: "strength", details: "قوة قصوى ميكانيكية", sets: "4", reps: "6", rest: "3 min" },
              { title: "Incline Dumbbell Press / بنش دمبل مائل", type: "strength", details: "تفعيل ألياف الصدر العلوية", sets: "3", reps: "8", rest: "2 min" },
              { title: "Heavy Farmers Walk / مشي المزارع ثقيل", type: "strength", details: "ثبات الجذع وقوة القبضة | 30 متر", sets: "3", reps: "1", rest: "2 min" }
            ]
          }
        },
        {
          title: "أسبوع 2: زيادة الكثافة وتفعيل الوحدات الحركية / Week 2: High Intensity & Motor Unit Recruitment",
          drills: {
            Saturday: [
              { title: "Back Squat / سكوات خلفي (VBT)", type: "strength", details: "السرعة المستهدفة: 0.38 m/s | حد خسارة السرعة: 10% VL", sets: "4", reps: "4", rest: "4 min" },
              { title: "Bench Press / بنش برس (VBT)", type: "strength", details: "السرعة المستهدفة: 0.42 m/s | حد خسارة السرعة: 12% VL", sets: "4", reps: "4", rest: "3 min" },
              { title: "Romanian Deadlift / رفعة رومانية", type: "strength", details: "زيادة طفيفة في الوزن", sets: "3", reps: "5", rest: "2.5 min" }
            ],
            Monday: [
              { title: "Deadlift / رفعة مميتة (VBT)", type: "strength", details: "السرعة المستهدفة: 0.32 m/s | حد خسارة السرعة: 10% VL", sets: "4", reps: "3", rest: "4 min" },
              { title: "Military Press / ضغط عسكري كتف", type: "strength", details: "قوة تفجيرية بالأكتاف", sets: "4", reps: "5", rest: "3 min" },
              { title: "Weighted Pull-ups / عقلة بوزن", type: "strength", details: "تكرار منخفض بوزن أعلى", sets: "4", reps: "4", rest: "2.5 min" }
            ],
            Wednesday: [
              { title: "Leg Press / مكبس أرجل ثقيل", type: "strength", details: "زيادة التحميل", sets: "4", reps: "5", rest: "3 min" },
              { title: "Incline Dumbbell Press / بنش دمبل مائل", type: "strength", details: "أقصى انقباض عضلي", sets: "3", reps: "6", rest: "2 min" },
              { title: "Heavy Farmers Walk / مشي المزارع ثقيل", type: "strength", details: "قوة قبضة قصوى | 30 متر", sets: "4", reps: "1", rest: "2 min" }
            ]
          }
        },
        {
          title: "أسبوع 3: ذروة التحميل والمقاومة القصوى / Week 3: Peak Overload & Max Resistance",
          drills: {
            Saturday: [
              { title: "Back Squat / سكوات خلفي (VBT)", type: "strength", details: "السرعة المستهدفة: 0.35 m/s | حد خسارة السرعة: 10% VL", sets: "5", reps: "3", rest: "4 min" },
              { title: "Bench Press / بنش برس (VBT)", type: "strength", details: "السرعة المستهدفة: 0.38 m/s | حد خسارة السرعة: 10% VL", sets: "5", reps: "3", rest: "4 min" },
              { title: "Romanian Deadlift / رفعة رومانية", type: "strength", details: "أقصى تحكم في النزول", sets: "3", reps: "4", rest: "3 min" }
            ],
            Monday: [
              { title: "Deadlift / رفعة مميتة (VBT)", type: "strength", details: "السرعة المستهدفة: 0.30 m/s | حد خسارة السرعة: 10% VL", sets: "3", reps: "2", rest: "5 min" },
              { title: "Military Press / ضغط عسكري كتف", type: "strength", details: "تكرارات منخفضة بوزن أقصى", sets: "4", reps: "3", rest: "3 min" },
              { title: "Weighted Pull-ups / عقلة بوزن", type: "strength", details: "أقصى وزن مضاف", sets: "4", reps: "3", rest: "3 min" }
            ],
            Wednesday: [
              { title: "Leg Press / مكبس أرجل ثقيل", type: "strength", details: "أقصى دفع ممكن", sets: "4", reps: "4", rest: "4 min" },
              { title: "Incline Dumbbell Press / بنش دمبل مائل", type: "strength", details: "أقصى وزن للدمبلز", sets: "4", reps: "5", rest: "2.5 min" },
              { title: "Heavy Farmers Walk / مشي المزارع ثقيل", type: "strength", details: "مشي المزارع | 20 متر بوزن أقصى", sets: "3", reps: "1", rest: "3 min" }
            ]
          }
        },
        {
          title: "أسبوع 4: تقليل الحمل والتكيف الاستشفائي / Week 4: Deload & Supercompensation",
          drills: {
            Saturday: [
              { title: "Back Squat / سكوات خلفي (VBT)", type: "strength", details: "تخفيض الحمل 40% | سرعة عالية مع الحفاظ على التكنيك", sets: "3", reps: "3", rest: "3 min" },
              { title: "Bench Press / بنش برس (VBT)", type: "strength", details: "تخفيض الحمل 40% | سرعة وتكنيك ممتاز", sets: "3", reps: "3", rest: "3 min" }
            ],
            Monday: [
              { title: "Deadlift / رفعة مميتة (VBT)", type: "strength", details: "تخفيض الحمل 40% | سحب حركي سلس وسريع", sets: "2", reps: "3", rest: "3 min" },
              { title: "Military Press / ضغط عسكري كتف", type: "strength", details: "حمل خفيف للاستشفاء الحركي", sets: "3", reps: "4", rest: "2.5 min" }
            ],
            Wednesday: [
              { title: "Leg Press / مكبس أرجل خفيف", type: "strength", details: "استشفاء وتدفق دموي", sets: "3", reps: "6", rest: "2 min" },
              { title: "Farmers Walk / مشي المزارع معتدل", type: "strength", details: "مشي خفيف للجذع | 30 متر", sets: "2", reps: "1", rest: "2 min" }
            ]
          }
        }
      ]
    };
  } else if (protocol === 'EDP') {
    return {
      id: programId,
      program_name: 'Elastic/SSC Protocol (EDP)',
      type: 'meso',
      weeks: [
        {
          title: "أسبوع 1: القدرة الديناميكية والتنشيط / Week 1: Dynamic Power & Activation",
          drills: {
            Saturday: [
              { title: "Loaded Squat Jump / قفز القرفصاء بالوزن (VBT)", type: "power", details: "السرعة المستهدفة: 0.85-0.95 m/s | الحمل: 30% 1RM", sets: "4", reps: "5", rest: "3 min" },
              { title: "Power Clean / الباور كلين (VBT)", type: "power", details: "السرعة المستهدفة: 0.90 m/s | تركيز تفجيري", sets: "4", reps: "3", rest: "3 min" },
              { title: "Countermovement Jump (CMJ)", type: "power", details: "قفز بدون وزن مع أقصى ارتفاع", sets: "3", reps: "6", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / رفعة تفجيرية بالبار السداسي", type: "power", details: "السرعة المستهدفة: 0.80 m/s | الحمل: 50% 1RM", sets: "4", reps: "4", rest: "3 min" },
              { title: "Push Press / ضغط علوي متفجر (VBT)", type: "power", details: "السرعة المستهدفة: 1.00 m/s", sets: "4", reps: "4", rest: "2.5 min" },
              { title: "Medicine Ball Chest Pass / رمي كرة طبية", type: "power", details: "أقصى قوة دفع أفقية للصدر", sets: "3", reps: "8", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Kettlebell Swing / أرجحة الكيتل بيل", type: "power", details: "أقصى امتداد تفجيري للحوض", sets: "4", reps: "10", rest: "2 min" },
              { title: "Broad Jump / قفز عريض", type: "power", details: "أقصى مسافة أفقية مع هبوط سليم", sets: "3", reps: "5", rest: "2 min" },
              { title: "Rotational MB Throw / رمي جانبي تفجيري", type: "power", details: "قوة الدوران للجذع والوسط", sets: "3", reps: "6", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 2: تراكم الطاقة والقوة المتفجرة / Week 2: Power Accumulation & Elastic SSC",
          drills: {
            Saturday: [
              { title: "Loaded Squat Jump / قفز القرفصاء بالوزن (VBT)", type: "power", details: "السرعة المستهدفة: 0.82-0.90 m/s | الحمل: 35% 1RM", sets: "4", reps: "4", rest: "3 min" },
              { title: "Power Clean / الباور كلين (VBT)", type: "power", details: "السرعة المستهدفة: 0.95 m/s", sets: "4", reps: "3", rest: "3 min" },
              { title: "Dumbbell Jump Squat / قفز دمبلز", type: "power", details: "قفز متفجر مستمر", sets: "3", reps: "5", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / رفعة تفجيرية بالبار السداسي", type: "power", details: "السرعة المستهدفة: 0.85 m/s | الحمل: 45% 1RM", sets: "4", reps: "3", rest: "3 min" },
              { title: "Push Press / ضغط علوي متفجر (VBT)", type: "power", details: "السرعة المستهدفة: 1.05 m/s", sets: "4", reps: "3", rest: "2.5 min" },
              { title: "Medicine Ball Overhead Throw / رمي خلفي علوي", type: "power", details: "أقصى قوة دفع خلفي عمودي", sets: "3", reps: "6", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Kettlebell Swing / أرجحة الكيتل بيل", type: "power", details: "أرجحة سريعة ثقيلة", sets: "4", reps: "8", rest: "2 min" },
              { title: "Triple Jump / وثب ثلاثي متتالي", type: "power", details: "تقليل وقت التلامس بالربط", sets: "3", reps: "3", rest: "2 min" },
              { title: "Rotational MB Throw / رمي جانبي تفجيري", type: "power", details: "قوة الدوران السريعة للوركين", sets: "3", reps: "6", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 3: ذروة القدرة والحمل الباليستي / Week 3: Peak Power & Ballistic Load",
          drills: {
            Saturday: [
              { title: "Loaded Squat Jump / قفز القرفصاء بالوزن (VBT)", type: "power", details: "السرعة المستهدفة: 0.80-0.88 m/s | الحمل: 40% 1RM", sets: "5", reps: "3", rest: "4 min" },
              { title: "Power Clean / الباور كلين (VBT)", type: "power", details: "السرعة المستهدفة: 1.00 m/s | أقصى سرعة التقاط", sets: "4", reps: "2", rest: "3.5 min" },
              { title: "Countermovement Jump (CMJ) (Weighted)", type: "power", details: "قفز بدمبل خفيف بأقصى نية", sets: "3", reps: "4", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / رفعة تفجيرية بالبار السداسي", type: "power", details: "السرعة المستهدفة: 0.90 m/s | الحمل: 40% 1RM", sets: "4", reps: "3", rest: "3 min" },
              { title: "Push Press / ضغط علوي متفجر (VBT)", type: "power", details: "السرعة المستهدفة: 1.10 m/s", sets: "5", reps: "2", rest: "3 min" },
              { title: "Medicine Ball Chest Pass / رمي كرة طبية", type: "power", details: "تفعيل الوحدات الحركية السريعة للصدر", sets: "4", reps: "5", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Banded Kettlebell Swing / أرجحة كيتل بيل بالمطاط", type: "power", details: "سحب مطاطي لزيادة السرعة اللامركزية", sets: "4", reps: "8", rest: "2 min" },
              { title: "Hurdle Jumps / قفز الحواجز التفاعلي", type: "power", details: "قفز حواجز متتالي مع تقليل زمن التلامس", sets: "3", reps: "5", rest: "2.5 min" },
              { title: "Rotational MB Throw / رمي جانبي تفجيري", type: "power", details: "أقصى قوة دفع بالستية للوسط", sets: "4", reps: "5", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 4: استشفاء وتسهيل عصبي / Week 4: Deload & Supercompensation",
          drills: {
            Saturday: [
              { title: "Loaded Squat Jump / قفز القرفصاء خفيف جداً", type: "power", details: "حمل 15% | سرعة قصوى لتخفيف الضغط", sets: "3", reps: "3", rest: "3 min" },
              { title: "Countermovement Jump (CMJ)", type: "power", details: "قفز بدون وزن لتسريع التكنيك", sets: "3", reps: "4", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / سحب تفجيري خفيف", type: "power", details: "حمل 30% | سرعة وتألق حركي", sets: "3", reps: "3", rest: "3 min" },
              { title: "Medicine Ball Chest Pass / رمي كرة طبية خفيفة", type: "power", details: "رمي سريع جداً بدون جهد أقصى", sets: "3", reps: "5", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Kettlebell Swing / أرجحة كيتل بيل خفيفة", type: "power", details: "استشفاء حركي للحوض", sets: "3", reps: "6", rest: "2 min" },
              { title: "Broad Jump / قفز عريض معتدل", type: "power", details: "تركيز على سلاسة الهبوط والتوازن", sets: "2", reps: "3", rest: "2 min" }
            ]
          }
        }
      ]
    };
  } else if (protocol === 'RSD') {
    return {
      id: programId,
      program_name: 'Reactive/Stiffness Protocol (RSD)',
      type: 'meso',
      weeks: [
        {
          title: "أسبوع 1: صلابة الكاحل وامتصاص الصدمات / Week 1: Ankle Stiffness & Shock Absorption",
          drills: {
            Saturday: [
              { title: "Ankle Pogo Jumps / قفز البوجو للكاحل", type: "isometric", details: "زمن التلامس: < 180ms | صلابة الكاحل وركبة ممدودة", sets: "3", reps: "15", rest: "1.5 min" },
              { title: "Depth Jumps / قفز العمق (ارتفاع 30سم)", type: "power", details: "القفز الفوري لأعلى بمجرد لمس الأرض", sets: "4", reps: "5", rest: "2.5 min" },
              { title: "Single Leg Box Drop / سقوط على رجل واحدة", type: "isometric", details: "سقوط من صندوق وثبات تام لمنع الامتصاص الزائد", sets: "3", reps: "5", rest: "1.5 min" }
            ],
            Monday: [
              { title: "Continuous Hurdle Hops / قفز الحواجز المتتالي", type: "power", details: "حواجز بارتفاع متوسط | تقليل زمن الأرض", sets: "3", reps: "6", rest: "2 min" },
              { title: "Lateral Bound with Stick / وثب جانبي وثبات", type: "power", details: "وثب جانبي مع ثبات ثانيتين على رجل واحدة", sets: "3", reps: "6", rest: "1.5 min" },
              { title: "Split Squat Jump / قفز الاسبليت سكوات التفاعلي", type: "power", details: "تغيير سريع للقدمين في الهواء", sets: "3", reps: "5", rest: "2 min" }
            ],
            Wednesday: [
              { title: "Band-Assisted Pogos / بوجو بمساعدة المطاط", type: "power", details: "سحب مطاطي لأعلى لتقليل الحمل وزيادة التلامس السريع", sets: "3", reps: "12", rest: "1.5 min" },
              { title: "Single-Leg Pogo Jump / بوجو رجل واحدة", type: "isometric", details: "صلابة الكاحل الفردية", sets: "3", reps: "8", rest: "1.5 min" },
              { title: "Medicine Ball Slam / رمي تفجيري سفلي", type: "power", details: "رمي سريع مع ثبات الجذع", sets: "3", reps: "8", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 2: زيادة شدة الارتداد وتقليل زمن التلامس / Week 2: Decreasing Contact Time & Elastic Build",
          drills: {
            Saturday: [
              { title: "Ankle Pogo Jumps / قفز البوجو للكاحل", type: "isometric", details: "زمن التلامس: < 160ms | أقصى صلابة ممكنة", sets: "3", reps: "15", rest: "1.5 min" },
              { title: "Depth Jumps / قفز العمق (ارتفاع 40سم)", type: "power", details: "زمن التلامس < 200ms | قفز عمودي أقصى", sets: "4", reps: "4", rest: "3 min" },
              { title: "Single Leg Box Drop / سقوط على رجل واحدة", type: "isometric", details: "سقوط من صندوق أعلى قليلاً وثبات تام", sets: "3", reps: "4", rest: "1.5 min" }
            ],
            Monday: [
              { title: "Continuous Hurdle Hops / قفز الحواجز المتتالي", type: "power", details: "حواجز أعلى قليلاً | ارتداد متفجر", sets: "4", reps: "5", rest: "2.5 min" },
              { title: "Lateral Bound with Stick / وثب جانبي وثبات", type: "power", details: "زيادة مسافة الوثب الجانبي", sets: "3", reps: "5", rest: "1.5 min" },
              { title: "Split Squat Jump / قفز الاسبليت سكوات التفاعلي", type: "power", details: "قوة تفجيرية في وضعية مقصية", sets: "3", reps: "5", rest: "2 min" }
            ],
            Wednesday: [
              { title: "Band-Assisted Pogos / بوجو بمساعدة المطاط", type: "power", details: "زيادة شدة المطاط لزيادة التلامس السريع", sets: "3", reps: "12", rest: "1.5 min" },
              { title: "Single-Leg Pogo Jump / بوجو رجل واحدة", type: "isometric", details: "أقصى سرعة وقوة ارتداد", sets: "3", reps: "10", rest: "1.5 min" },
              { title: "Medicine Ball Slam / رمي تفجيري سفلي", type: "power", details: "رمي الكرة بأقصى قوة وسرعة للأرض", sets: "3", reps: "6", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 3: ذروة الصلابة التفاعلية والبلايومتركس المكثف / Week 3: Peak Reactive Stiffness & Max Plyos",
          drills: {
            Saturday: [
              { title: "Ankle Pogo Jumps / قفز البوجو للكاحل (المحمل)", type: "isometric", details: "مسك دمبلز خفيفة جداً (5-10 كجم) | حافظ على صلابة الكاحل", sets: "4", reps: "10", rest: "2 min" },
              { title: "Depth Jumps / قفز العمق (ارتفاع 50سم)", type: "power", details: "أقصى عمق للاعبين النخبة | زمن التلامس < 190ms", sets: "5", reps: "3", rest: "3.5 min" },
              { title: "Single-Leg Depth Jump / قفز العمق رجل واحدة", type: "power", details: "سقوط من صندوق منخفض والقفز الفوري برجل واحدة", sets: "3", reps: "3", rest: "2.5 min" }
            ],
            Monday: [
              { title: "Continuous Hurdle Hops / قفز الحواجز التفاعلي", type: "power", details: "أقصى سرعة ربط بين الحواجز بارتفاع كبير", sets: "4", reps: "5", rest: "3 min" },
              { title: "Lateral Bound with Double Hop / وثب جانبي مع قفز إضافي", type: "power", details: "وثب جانبي ثم قفزة بوجو سريعة فورا على رجل واحدة", sets: "3", reps: "4", rest: "2 min" },
              { title: "Split Squat Jump / قفز الاسبليت سكوات التفاعلي", type: "power", details: "أقصى ارتفاع للقفز المتبادل", sets: "4", reps: "4", rest: "2.5 min" }
            ],
            Wednesday: [
              { title: "Band-Assisted Pogos / بوجو بمساعدة المطاط", type: "power", details: "أسرع تلامس للأرض (الهدف < 130ms)", sets: "4", reps: "10", rest: "1.5 min" },
              { title: "Single-Leg Pogo Jump / بوجو رجل واحدة", type: "isometric", details: "بوجو فردي متفجر", sets: "4", reps: "8", rest: "1.5 min" },
              { title: "Medicine Ball Slam / رمي تفجيري سفلي", type: "power", details: "أقصى تسارع ورمي بالستي", sets: "4", reps: "5", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 4: خفض الكثافة واستشفاء المفاصل / Week 4: Deload & Joint Recovery",
          drills: {
            Saturday: [
              { title: "Ankle Pogo Jumps / بوجو كاحل معتدل", type: "isometric", details: "قفز بوجو خفيف جداً للترطيب الوتر الحركي", sets: "3", reps: "10", rest: "1.5 min" },
              { title: "Single Leg Box Drop / سقوط خفيف للثبات", type: "isometric", details: "سقوط من صندوق منخفض للتركيز على وضع الركبة", sets: "3", reps: "4", rest: "1.5 min" }
            ],
            Monday: [
              { title: "Hurdle Hops / قفز حواجز منخفضة", type: "power", details: "حواجز منخفضة جداً للتعافي والتكنيك السلس", sets: "3", reps: "4", rest: "2 min" },
              { title: "Lateral Bound with Stick / وثب جانبي خفيف", type: "power", details: "توازن وحركة هبوط سلسة", sets: "3", reps: "4", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Band-Assisted Pogos / بوجو بمساعدة المطاط", type: "power", details: "بوجو خفيف جداً بالمطاط", sets: "3", reps: "8", rest: "1.5 min" },
              { title: "Medicine Ball Slam / رمي كرة خفيفة", type: "power", details: "رمي خفيف للاستشفاء", sets: "2", reps: "5", rest: "1.5 min" }
            ]
          }
        }
      ]
    };
  } else if (protocol === 'HVRP') {
    return {
      id: programId,
      program_name: 'High-Velocity/RFD Protocol (HVRP)',
      type: 'meso',
      weeks: [
        {
          title: "أسبوع 1: السرعة العصبية ومعدل القوة / Week 1: Neuromuscular Speed & RFD",
          drills: {
            Saturday: [
              { title: "Speed Squat / سكوات سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.15-1.25 m/s | الحمل: 35-45% 1RM", sets: "5", reps: "3", rest: "3 min" },
              { title: "Speed Bench Press / بنش سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.20-1.30 m/s | الحمل: 35-40% 1RM", sets: "5", reps: "3", rest: "3 min" },
              { title: "Banded Kettlebell Swings / أرجحة كيتل بيل بالمطاط", type: "speed", details: "سرعة قصوى ونية دفع تفجيرية", sets: "4", reps: "8", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / سحب سريع بالبار السداسي", type: "speed", details: "السرعة المستهدفة: 1.10 m/s | الحمل: 40% 1RM", sets: "4", reps: "3", rest: "3 min" },
              { title: "Medicine Ball Rotational Slams / رمي جانبي تفجيري", type: "speed", details: "أقصى سرعة نقل طاقة للجذع", sets: "3", reps: "6", rest: "1.5 min" },
              { title: "Dynamic Clapping Push-ups / ضغط بالستوري بالتصفيق", type: "speed", details: "أقصى قدرة دفع علوية تفاعلية", sets: "3", reps: "5", rest: "2 min" }
            ],
            Wednesday: [
              { title: "Assisted Jumps / قفز بمساعدة المطاط", type: "speed", details: "القفز بسرعة هواء أعلى من الطبيعي", sets: "4", reps: "6", rest: "2 min" },
              { title: "Dumbbell Shrugs (Speed) / هز أكتاف تفجيري بالدمبل", type: "speed", details: "سرعة رفع الكتف لتوليد القوة للسرعة", sets: "3", reps: "8", rest: "1.5 min" },
              { title: "Underhand Med Ball Throw / رمي أمامي سفلي لأعلى", type: "speed", details: "أقصى سرعة انطلاق بالستية", sets: "3", reps: "5", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 2: السرعة والبالستية العالية / Week 2: Ballistics & Dynamic Velocity",
          drills: {
            Saturday: [
              { title: "Speed Squat / سكوات سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.20-1.30 m/s | الحمل: 35% 1RM", sets: "6", reps: "3", rest: "3 min" },
              { title: "Speed Bench Press / بنش سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.25-1.35 m/s | الحمل: 35% 1RM", sets: "6", reps: "3", rest: "3 min" },
              { title: "Banded Kettlebell Swings / أرجحة كيتل بيل بالمطاط", type: "speed", details: "زيادة سرعة الدفع والمطاط", sets: "4", reps: "6", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / سحب سريع بالبار السداسي", type: "speed", details: "السرعة المستهدفة: 1.15 m/s | الحمل: 35% 1RM", sets: "4", reps: "3", rest: "3 min" },
              { title: "Medicine Ball Rotational Slams / رمي جانبي تفجيري", type: "speed", details: "رمي سريع جداً للوسط", sets: "4", reps: "6", rest: "1.5 min" },
              { title: "Dynamic Clapping Push-ups / ضغط بالستوري بالتصفيق", type: "speed", details: "تصفيق مزدوج في الهواء إن أمكن", sets: "3", reps: "4", rest: "2.5 min" }
            ],
            Wednesday: [
              { title: "Assisted Jumps / قفز بمساعدة المطاط", type: "speed", details: "أقصى ارتفاع وسرعة قفز", sets: "4", reps: "5", rest: "2.5 min" },
              { title: "Dumbbell Shrugs (Speed) / هز أكتاف تفجيري بالدمبل", type: "speed", details: "تكرار سريع جداً لمد الأوتار", sets: "3", reps: "8", rest: "1.5 min" },
              { title: "Underhand Med Ball Throw / رمي أمامي سفلي لأعلى", type: "speed", details: "أقصى نية تسارع للرمي", sets: "4", reps: "4", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 3: ذروة التسهيل العصبي والسرعة المطلقة / Week 3: Peak Neural Facilitation & Max Velocity",
          drills: {
            Saturday: [
              { title: "Speed Squat / سكوات سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.25-1.35 m/s | الحمل: 30% 1RM", sets: "6", reps: "2", rest: "4 min" },
              { title: "Speed Bench Press / بنش سريع (VBT)", type: "speed", details: "السرعة المستهدفة: 1.30-1.40 m/s | الحمل: 30% 1RM", sets: "6", reps: "2", rest: "4 min" },
              { title: "Banded Kettlebell Swings / أرجحة كيتل بيل بالمطاط", type: "speed", details: "أقصى أرجحة متفجرة ممكنة للكيتلبيل", sets: "4", reps: "6", rest: "2 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / سحب سريع بالبار السداسي", type: "speed", details: "السرعة المستهدفة: 1.20 m/s | الحمل: 30% 1RM", sets: "5", reps: "2", rest: "3.5 min" },
              { title: "Medicine Ball Rotational Slams / رمي جانبي تفجيري", type: "speed", details: "أقصى تسارع بالستي للدوران", sets: "4", reps: "5", rest: "1.5 min" },
              { title: "Dynamic Clapping Push-ups / ضغط بالستوري بالتصفيق", type: "speed", details: "دفع بالستي أقصى للصدر والذراعين", sets: "4", reps: "4", rest: "2.5 min" }
            ],
            Wednesday: [
              { title: "Assisted Jumps / قفز بمساعدة المطاط", type: "speed", details: "السرعة القصوى المطلقة للتلامس والهواء", sets: "5", reps: "4", rest: "2.5 min" },
              { title: "Dumbbell Shrugs (Speed) / هز أكتاف تفجيري بالدمبل", type: "speed", details: "أقصى سرعة انقباض لترابيس الرقبة", sets: "4", reps: "6", rest: "1.5 min" },
              { title: "Underhand Med Ball Throw / رمي أمامي سفلي لأعلى", type: "speed", details: "أقصى قوة دفع بالستية عمودية", sets: "4", reps: "4", rest: "1.5 min" }
            ]
          }
        },
        {
          title: "أسبوع 4: تقليص الحمل والسرعة المتجددة / Week 4: Deload & Speed Supercompensation",
          drills: {
            Saturday: [
              { title: "Speed Squat / سكوات سريع خفيف", type: "speed", details: "تخفيض الحمل 30% | تركيز على مرونة الركبتين والسرعة", sets: "3", reps: "2", rest: "3 min" },
              { title: "Speed Bench Press / بنش سريع خفيف", type: "speed", details: "سرعة ممتازة للذراعين بدون تعب", sets: "3", reps: "2", rest: "3 min" }
            ],
            Monday: [
              { title: "Hex Bar Deadlift (Speed) / سحب سريع خفيف", type: "speed", details: "سحب سلس جداً وتألق عصبي", sets: "2", reps: "2", rest: "3 min" },
              { title: "Medicine Ball Rotational Slams / رمي جانبي خفيف", type: "speed", details: "دوران خفيف للاستشفاء الحركي", sets: "2", reps: "4", rest: "1.5 min" }
            ],
            Wednesday: [
              { title: "Assisted Jumps / قفز خفيف جداً بمطاط", type: "speed", details: "قفز تفاعلي خفيف للتعافي", sets: "3", reps: "4", rest: "2 min" },
              { title: "Underhand Med Ball Throw / رمي خفيف لأعلى", type: "speed", details: "رمي خفيف للاستشفاء", sets: "2", reps: "3", rest: "1.5 min" }
            ]
          }
        }
      ]
    };
  }
  return null;
};

const DEFICIT_GUIDELINES = {
  FDP: {
    title: "بروتوكول عجز القوة القصوى (FDP)",
    englishTitle: "Max Force Deficit Protocol",
    focus: "بناء أساس متين من القوة المطلقة والتحمل العضلي وتجنيد الوحدات الحركية السريعة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Eccentric Control -> Concentric Acceleration" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "0.30 - 0.50 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "10% - 15% (Strength/Hypertrophy)" },
      { label: "زمن التلامس / Contact Time", value: "غير مؤثر (> 250ms)" },
      { label: "الأحمال المقترحة / Load Target", value: "80% - 90% 1RM" }
    ],
    tips: [
      "التركيز على التمارين المركبة الثقيلة (Squats, Bench Press, Deadlift).",
      "الحفاظ على وقت راحة كافٍ (3-5 دقائق) بين المجموعات لضمان التعافي العصبي الكامل.",
      "استخدم VBT لضبط الحمل اليومي: إذا كانت السرعة أعلى من 0.50 m/s، قم بزيادة الوزن."
    ]
  },
  EDP: {
    title: "بروتوكول عجز الدورة المطاطية (EDP)",
    englishTitle: "Elastic SSC Deficit Protocol",
    focus: "تطوير قدرة العضلات والأوتار على تخزين وإطلاق الطاقة المطاطية (الدورة المطاطية البطيئة).",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Slow SSC (Stretch-Shortening Cycle)" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "0.75 - 1.00 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "< 10% (Avoid fatigue, maintain power)" },
      { label: "زمن التلامس / Contact Time", value: "معتدل (250ms - 400ms)" },
      { label: "الأحمال المقترحة / Load Target", value: "30% - 60% 1RM (Loaded Jumps)" }
    ],
    tips: [
      "تمارين القفز المحمل (Loaded Squat Jumps) والقفز العمودي CMJ.",
      "تجنب الإجهاد العضلي التام؛ الهدف هو إنتاج أقصى قدرة انفجارية تفاعلية.",
      "التركيز على سرعة الانتقال بين النزول والصعود (Amortization Phase)."
    ]
  },
  RSD: {
    title: "بروتوكول عجز الصلابة الارتدادية (RSD)",
    englishTitle: "Reactive & Stiffness Deficit",
    focus: "زيادة صلابة الكاحل والأوتار لتقليل زمن التلامس مع الأرض وزيادة معدل نقل القوة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Fast SSC (Rapid Stretch-Shortening)" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "غير مطبق (تعتمد على ارتفاع القفز والزمن)" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "تجنب هبوط الارتفاع أو زيادة زمن التلامس" },
      { label: "زمن التلامس / Contact Time", value: "سريع جداً (< 200ms - 250ms)" },
      { label: "مؤشر الارتداد / RSI Target", value: "> 2.50 (Reactive Strength Index)" }
    ],
    tips: [
      "تمارين البلايومتركس السريعة (Depth Jumps, Hurdle Hops, Pogo Jumps).",
      "يجب أن تكون الأرض صلبة والتلامس كأنه على سطح ساخن جداً.",
      "توقف فوراً عند زيادة زمن التلامس عن 250 مللي ثانية."
    ]
  },
  HVRP: {
    title: "بروتوكول عجز السرعة ومعدل القوة (HVRP)",
    englishTitle: "High-Velocity RFD Deficit",
    focus: "تطوير أقصى سرعة ممكنة للجهاز العصبي ومعدل نمو القوة السريع بالأوزان الخفيفة.",
    metrics: [
      { label: "نوع الانقباض / Contraction", value: "Ballistic / High-Velocity Acceleration" },
      { label: "سرعة VBT المستهدفة / Velocity Target", value: "1.10 - 1.30 m/s" },
      { label: "خسارة السرعة / Velocity Loss Limit", value: "< 5% - 8% (Focus on maximum speed)" },
      { label: "زمن التلامس / Contact Time", value: "سريع جداً" },
      { label: "الأحمال المقترحة / Load Target", value: "0% - 30% 1RM (Light/Banded)" }
    ],
    tips: [
      "تمارين دفع الدمبل الخفيف، تمارين الحبال المطاطية، ورمي الكرات الطبية.",
      "التنفيذ بأقصى نية للحركة المتفجرة (Maximal Intent of Velocity).",
      "فترات راحة كاملة لضمان أداء كل تكرار بأعلى سرعة ممكنة."
    ]
  }
};

const getMesoBlockConfig = (deficit, idx, totalBlocks) => {
  const isLast = idx === totalBlocks - 1;
  
  const configs = {
    FDP: [
      { name: "تأسيس القوة والتحمل العضلي / Strength Base Prep", focus: "Hypertrophy & Work Capacity" },
      { name: "تطوير القوة القصوى / Max Strength Build", focus: "Absolute Strength" },
      { name: "تطوير القوة الانفجارية / Explosive Strength", focus: "RFD & Power" },
      { name: "نقل القوة للسرعة / Force-Velocity Integration", focus: "Dynamic Effort" },
      { name: "القدرة والسرعة القصوى / Power & Velocity Peak", focus: "High Velocity RFD" },
      { name: "تحقيق الذروة والانتقال / Peaking & Taper", focus: "Maximum Velocity" }
    ],
    EDP: [
      { name: "تحسين المرونة والقاعدة الهوائية / Elastic Base Prep", focus: "Tendon Elasticity" },
      { name: "القوة الديناميكية / Dynamic Strength Base", focus: "Dynamic Effort Strength" },
      { name: "تطوير الدورة المطاطية / Elastic SSC Development", focus: "Stretch-Shortening Cycle" },
      { name: "القدرة الارتدادية / Ballistic Power", focus: "Ballistic Jump Power" },
      { name: "السرعة المتفجرة / Explosive Speed", focus: "Unloaded SSC Power" },
      { name: "ذروة الأداء والارتداد / Peak Reactive SSC", focus: "Taper & Max Elasticity" }
    ],
    RSD: [
      { name: "تأسيس صلابة المفاصل / Joint Stiffness Base", focus: "Isometric & Eccentric Prep" },
      { name: "تطوير الارتداد البطيء / Slow SSC Reactive Build", focus: "Slow SSC Plyometrics" },
      { name: "تطوير الارتداد السريع / Fast SSC Reactive Build", focus: "Fast SSC Plyometrics" },
      { name: "الصلابة الديناميكية والتحميل / Reactive Stiffness Load", focus: "High Intensity Drops" },
      { name: "أقصى ارتداد تفجيري / Max Reactive Power", focus: "Elastic Velocity" },
      { name: "ذروة الصلابة والسرعة / Peak Stiffness Taper", focus: "Taper & Reactive Speed" }
    ],
    HVRP: [
      { name: "تأسيس السرعة والتسارع / Acceleration Base", focus: "Acceleration Mechanics" },
      { name: "القوة السريعة والقدرة / Speed-Strength Build", focus: "Speed-Strength VBT" },
      { name: "معدل نمو القوة السريع / Rapid RFD Development", focus: "Explosive RFD" },
      { name: "التفجير الحركي والسرعة / Ballistic RFD & Velocity", focus: "Ballistic Velocity" },
      { name: "السرعة القصوى المطلقة / Absolute Velocity Peak", focus: "Max Speed VBT" },
      { name: "ذروة السرعة والتناقص / Peak Speed Taper", focus: "Taper & Velocity" }
    ]
  };

  const protocolConfigs = configs[deficit] || configs.FDP;
  if (totalBlocks <= 3) {
    if (idx === 0) return protocolConfigs[0];
    if (isLast) return protocolConfigs[5];
    return protocolConfigs[2];
  }
  const configIdx = Math.min(idx, protocolConfigs.length - 1);
  return protocolConfigs[configIdx];
};

export default function PeriodizationPlanner({ athlete, onClose, handleToast, programs, refreshDeploymentsCallback }) {
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' or 'templates'
  const [deployments, setDeployments] = useState([]);
  const [masterTemplates, setMasterTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Deploy Template modal states
  const [showDeployTemplateModal, setShowDeployTemplateModal] = useState(false);
  const [selectedTemplateToDeploy, setSelectedTemplateToDeploy] = useState('');
  const [deployStartDate, setDeployStartDate] = useState('');
  
  // Master Template Designer Modal states
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDeficit, setTplDeficit] = useState('FDP'); // FDP, EDP, RSD, HVRP
  const [tplDurationWeeks, setTplDurationWeeks] = useState(24); // 12, 24, 36, 48
  const [tplMicros, setTplMicros] = useState({}); // mapping: weekIndex -> 'Load' | 'Deload' | 'Test'
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showGuidancePanel, setShowGuidancePanel] = useState(true);
  
  // Meso blocks creation inside template
  const [tplMesos, setTplMesos] = useState([]); // list of mesos: { id, name, startWeek, durationWeeks, focus, color, programId }
  const [showAddMesoBlock, setShowAddMesoBlock] = useState(false);
  const [newMesoName, setNewMesoName] = useState('');
  const [newMesoStartWeek, setNewMesoStartWeek] = useState(1);
  const [newMesoDuration, setNewMesoDuration] = useState(4);
  const [newMesoFocus, setNewMesoFocus] = useState('Strength');
  const [newMesoColor, setNewMesoColor] = useState(PHASE_COLORS[0].hex);
  const [newMesoProgramId, setNewMesoProgramId] = useState('');

  // Local Athlete View states
  const [activeMacroDetail, setActiveMacroDetail] = useState(null);
  
  // States for editing deployed Macro and Mesocycles
  const [isEditingMacroName, setIsEditingMacroName] = useState(false);
  const [macroEditName, setMacroEditName] = useState('');
  const [showMesoEditModal, setShowMesoEditModal] = useState(false);
  const [editingMesoId, setEditingMesoId] = useState(null);
  const [mesoFormName, setMesoFormName] = useState('');
  const [mesoFormStartWeek, setMesoFormStartWeek] = useState(1);
  const [mesoFormDuration, setMesoFormDuration] = useState(4);
  const [mesoFormColor, setMesoFormColor] = useState(PHASE_COLORS[0].hex);
  const [mesoFormProgramId, setMesoFormProgramId] = useState('');
  const [mesoFormCloneDrills, setMesoFormCloneDrills] = useState(false);

  // Helper to parse name and deficit protocol
  const getCleanNameAndDeficit = (fullName) => {
    const match = (fullName || '').match(/^\[(FDP|EDP|RSD|HVRP)\]\s*(.*)$/);
    if (match) {
      return { deficit: match[1], name: match[2] };
    }
    return { deficit: null, name: fullName };
  };

  // Fetch deployments for the athlete
  const fetchLocalDeployments = async () => {
    if (!athlete?.id) return;
    try {
      const { data, error } = await supabase
        .from('periodization_deployments')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('start_date', { ascending: true });
      if (!error && data) {
        setDeployments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Master Periodization Templates from agilitylap_programs
  const fetchMasterTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agilitylap_programs')
        .select('*')
        .eq('type', 'periodization_template')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMasterTemplates(data);
      }
    } catch (err) {
      console.error(err);
      handleToast('Error fetching periodization templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalDeployments();
    fetchMasterTemplates();
  }, [athlete]);

  // Generate 12 months starting from current month
  const months = [];
  const now = new Date();
  let currentMonthPointer = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    months.push(new Date(currentMonthPointer));
    currentMonthPointer.setMonth(currentMonthPointer.getMonth() + 1);
  }

  // Get start of week (Saturday-based) matching main index.jsx helper
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const dayOffset = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - dayOffset);
    return d;
  };

  // Get weeks starting in a calendar month
  const getWeeksInMonth = (monthDate) => {
    const weeksList = [];
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    let d = new Date(year, month, 1);
    const startOfWeekVal = getStartOfWeek(d);
    d = new Date(startOfWeekVal);
    
    while (true) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekStart.getMonth() === month && weekStart.getFullYear() === year) {
        weeksList.push({
          start: weekStart,
          end: weekEnd,
          startStr: getDbDateStr(weekStart),
          endStr: getDbDateStr(weekEnd)
        });
      } else if (weekStart.getFullYear() > year || (weekStart.getFullYear() === year && weekStart.getMonth() > month)) {
        break;
      }
      d.setDate(d.getDate() + 7);
    }
    return weeksList;
  };

  const getMacroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'macro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMesoForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'meso' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  const getMicroForDate = (dateStr) => {
    return deployments.find(d => d.program_type === 'micro' && dateStr >= d.start_date && dateStr <= d.end_date);
  };

  // Delete Deployment (Macro or Meso)
  const handleDeleteDeployment = async (id, name, type) => {
    const isConfirm = window.confirm(`هل أنت متأكد من حذف ${type === 'macro' ? 'الدورة الكبرى' : 'الدورة المتوسطة'} "${name}"؟`);
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const target = deployments.find(d => d.id === id);
      if (target && type === 'macro') {
        // Cascade delete all deployments within date range
        await supabase
          .from('periodization_deployments')
          .delete()
          .eq('athlete_id', athlete.id)
          .gte('start_date', target.start_date)
          .lte('end_date', target.end_date);
      } else {
        await supabase
          .from('periodization_deployments')
          .delete()
          .eq('id', id);
      }

      handleToast('تم الحذف بنجاح!');
      setActiveMacroDetail(null);
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء الحذف.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helpers for editing deployed Macro and Mesocycles
  const getMacroMesos = (macro) => {
    if (!macro) return [];
    return deployments.filter(d => 
      d.program_type === 'meso' && 
      d.start_date >= macro.start_date && 
      d.end_date <= macro.end_date
    );
  };

  const handleStartEditMacroName = () => {
    const { name } = getCleanNameAndDeficit(activeMacroDetail.program_name);
    setMacroEditName(name || '');
    setIsEditingMacroName(true);
  };

  const handleSaveMacroName = async () => {
    if (!macroEditName.trim()) {
      handleToast('الرجاء كتابة اسم!');
      return;
    }
    setIsLoading(true);
    try {
      const { deficit } = getCleanNameAndDeficit(activeMacroDetail.program_name);
      const newFullName = deficit ? `[${deficit}] ${macroEditName}` : macroEditName;
      
      const { error } = await supabase
        .from('periodization_deployments')
        .update({ program_name: newFullName })
        .eq('id', activeMacroDetail.id);

      if (!error) {
        handleToast('تم تحديث اسم الدورة الكبرى!');
        setActiveMacroDetail({ ...activeMacroDetail, program_name: newFullName });
        setIsEditingMacroName(false);
        await fetchLocalDeployments();
        if (refreshDeploymentsCallback) refreshDeploymentsCallback();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تحديث الاسم.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMesoEditModal = (meso = null) => {
    if (meso) {
      // Edit mode: pre-populate
      setEditingMesoId(meso.id);
      setMesoFormName(meso.program_name);
      setMesoFormColor(meso.color || PHASE_COLORS[0].hex);
      setMesoFormProgramId(meso.program_id || '');
      setMesoFormCloneDrills(false); // default false when editing to avoid accidental overwrite
      
      // Calculate startWeek and duration based on activeMacroDetail start date
      const macroStart = new Date(activeMacroDetail.start_date + 'T00:00:00');
      const mesoStart = new Date(meso.start_date + 'T00:00:00');
      const mesoEnd = new Date(meso.end_date + 'T00:00:00');
      
      const startWeekNum = Math.round((mesoStart - macroStart) / (1000 * 60 * 60 * 24 * 7)) + 1;
      const durationNum = Math.round((mesoEnd - mesoStart) / (1000 * 60 * 60 * 24 * 7)) + 1;
      
      setMesoFormStartWeek(startWeekNum || 1);
      setMesoFormDuration(durationNum || 4);
    } else {
      // Add mode: default values
      setEditingMesoId(null);
      setMesoFormName('');
      setMesoFormColor(PHASE_COLORS[0].hex);
      setMesoFormProgramId('');
      setMesoFormStartWeek(1);
      setMesoFormDuration(4);
      setMesoFormCloneDrills(true); // default true when creating
    }
    setShowMesoEditModal(true);
  };

  const handleSaveMesoEditModal = async () => {
    if (!mesoFormName.trim()) {
      handleToast('الرجاء كتابة اسم الدورة المتوسطة!');
      return;
    }
    
    setIsLoading(true);
    try {
      const weeks = getMacroWeeks(activeMacroDetail);
      
      // Check boundaries
      const startWeekIdx = Number(mesoFormStartWeek) - 1;
      const endWeekIdx = startWeekIdx + Number(mesoFormDuration) - 1;
      
      if (endWeekIdx >= weeks.length) {
        handleToast('⚠️ الدورة المتوسطة تتجاوز عدد أسابيع الدورة الكبرى!');
        setIsLoading(false);
        return;
      }
      
      const mStart = weeks[startWeekIdx].start;
      const mEnd = weeks[endWeekIdx].end;
      
      // Check overlaps with other mesos (excluding the one being edited)
      const allMesos = getMacroMesos(activeMacroDetail).filter(m => m.id !== editingMesoId);
      const overlap = allMesos.find(m => 
        (getDbDateStr(mStart) >= m.start_date && getDbDateStr(mStart) <= m.end_date) ||
        (getDbDateStr(mEnd) >= m.start_date && getDbDateStr(mEnd) <= m.end_date)
      );
      
      if (overlap) {
        handleToast(`⚠️ تداخل مع دورة متوسطة أخرى: "${overlap.program_name}"`);
        setIsLoading(false);
        return;
      }
      
      const payload = {
        athlete_id: athlete.id,
        program_name: mesoFormName,
        program_type: 'meso',
        start_date: getDbDateStr(mStart),
        end_date: getDbDateStr(mEnd),
        color: mesoFormColor,
        program_id: mesoFormProgramId || null
      };
      
      if (editingMesoId) {
        // Update
        const { error } = await supabase
          .from('periodization_deployments')
          .update(payload)
          .eq('id', editingMesoId);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('periodization_deployments')
          .insert([payload]);
        if (error) throw error;
      }
      
      // Optionally clone drills from program block
      if (mesoFormCloneDrills && mesoFormProgramId) {
        let program;
        if (mesoFormProgramId.startsWith('sys-')) {
          program = getSystemPresetMeso(mesoFormProgramId);
        } else {
          program = programs.find(p => p.id === mesoFormProgramId);
        }
        if (program && program.weeks) {
          for (let i = 0; i < program.weeks.length; i++) {
            const futureWeekStart = new Date(mStart);
            futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
            const weekTemplateObject = program.weeks[i].drills || {};
            const targetBlockTitle = program.weeks[i].title || 'Meso-Template Workout';
            
            for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
              const dayDate = new Date(futureWeekStart);
              dayDate.setDate(dayDate.getDate() + j);
              
              let clonedDrills = [];
              if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
                clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                  ...drill, 
                  id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                }));
              } else if (Array.isArray(weekTemplateObject)) {
                clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                  ...drill, 
                  id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                }));
              }
              
              await supabase.from('agilitylap_workouts').upsert({ 
                athlete_id: athlete.id, 
                workout_date: getDbDateStr(dayDate), 
                workout_title: targetBlockTitle, 
                drills: clonedDrills 
              }, { onConflict: 'athlete_id,workout_date' });
            }
          }
        }
      }
      
      handleToast(editingMesoId ? 'تم تحديث الدورة المتوسطة بنجاح!' : 'تمت إضافة الدورة المتوسطة بنجاح!');
      setShowMesoEditModal(false);
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء معالجة الدورة المتوسطة.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Auto-Periodization Generator
  const handleAutoGeneratePeriodization = () => {
    const generatedMesos = [];
    const generatedMicros = {};
    const numBlocks = Math.floor(tplDurationWeeks / 4);

    for (let b = 0; b < numBlocks; b++) {
      const startWeek = b * 4 + 1;
      const { name, focus } = getMesoBlockConfig(tplDeficit, b, numBlocks);
      const color = PHASE_COLORS[b % PHASE_COLORS.length].hex;
      
      generatedMesos.push({
        id: Date.now() + b,
        name: name,
        startWeek: startWeek,
        durationWeeks: 4,
        focus: focus,
        color: color,
        programId: `sys-${tplDeficit.toLowerCase()}-meso`
      });

      // Fill micros for this 4-week block
      for (let w = 0; w < 4; w++) {
        const weekIdx = (startWeek - 1) + w;
        let focusType = 'Load';
        if (w === 3) {
          focusType = 'Deload';
        } else if (w === 2 && b === numBlocks - 1) {
          // Last block's 3rd week is Test
          focusType = 'Test';
        }
        generatedMicros[weekIdx] = focusType;
      }
    }
    
    setTplMesos(generatedMesos);
    setTplMicros(generatedMicros);
    handleToast('✨ تم التوليد الذكي التلقائي بنجاح! / Auto-periodization generated!');
  };

  // Create/Update Periodization Master Template
  const handleSaveMasterTemplate = async () => {
    if (!tplName.trim()) {
      handleToast('الرجاء كتابة اسم القالب!');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        program_name: tplName,
        type: 'periodization_template',
        weeks: [
          {
            isPeriodizationTemplate: true,
            deficitProtocol: tplDeficit,
            durationWeeks: tplDurationWeeks,
            mesocycles: tplMesos,
            microcycles: tplMicros
          }
        ]
      };

      let error;
      if (editingTemplateId) {
        const res = await supabase
          .from('agilitylap_programs')
          .update(payload)
          .eq('id', editingTemplateId);
        error = res.error;
      } else {
        const res = await supabase
          .from('agilitylap_programs')
          .insert([payload]);
        error = res.error;
      }

      if (!error) {
        handleToast(editingTemplateId ? `تم تحديث القالب الدوري "${tplName}" بنجاح!` : `تم حفظ القالب الدوري "${tplName}" بنجاح!`);
        setShowCreateTemplate(false);
        setEditingTemplateId(null);
        setTplName('');
        setTplMesos([]);
        setTplMicros({});
        await fetchMasterTemplates();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء حفظ القالب الدوري.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-populate template designer for editing
  const handleEditMasterTemplate = (template) => {
    const details = template.weeks?.[0] || {};
    setEditingTemplateId(template.id);
    setTplName(template.program_name);
    setTplDeficit(details.deficitProtocol || 'FDP');
    setTplDurationWeeks(details.durationWeeks || 12);
    setTplMesos(details.mesocycles || []);
    setTplMicros(details.microcycles || {});
    setShowCreateTemplate(true);
  };

  const handleCloseTemplateDesigner = () => {
    setShowCreateTemplate(false);
    setEditingTemplateId(null);
    setTplName('');
    setTplMesos([]);
    setTplMicros({});
  };

  // Delete Master Template
  const handleDeleteMasterTemplate = async (id, name) => {
    const isConfirm = window.confirm(`هل أنت متأكد من حذف القالب العام "${name}" نهائياً؟`);
    if (!isConfirm) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('agilitylap_programs')
        .delete()
        .eq('id', id);
      if (!error) {
        handleToast('تم حذف القالب بنجاح!');
        await fetchMasterTemplates();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ في الحذف.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deploy Master Template to selected Athlete
  const handleDeployTemplateToAthlete = async () => {
    if (!selectedTemplateToDeploy) {
      handleToast('الرجاء اختيار قالب تدريبي لتطبيقه!');
      return;
    }
    if (!deployStartDate) {
      handleToast('الرجاء اختيار تاريخ البداية!');
      return;
    }

    setIsLoading(true);
    try {
      const templateRecord = masterTemplates.find(t => t.id === selectedTemplateToDeploy);
      if (!templateRecord || !templateRecord.weeks?.[0]) {
        handleToast('فشل تحميل بيانات القالب.');
        setIsLoading(false);
        return;
      }

      const tplDetails = templateRecord.weeks[0];
      const startBaseDate = getStartOfWeek(new Date(deployStartDate)); // Saturday start
      const totalWeeks = Number(tplDetails.durationWeeks) || 12;
      const endBaseDate = new Date(startBaseDate);
      endBaseDate.setDate(endBaseDate.getDate() + (totalWeeks * 7) - 1); // Friday end

      // 1. Clean overlapping deployments inside this date range
      await supabase
        .from('periodization_deployments')
        .delete()
        .eq('athlete_id', athlete.id)
        .gte('start_date', getDbDateStr(startBaseDate))
        .lte('end_date', getDbDateStr(endBaseDate));

      // 2. Deploy Macrocycle row
      const macroNameFormatted = `[${tplDetails.deficitProtocol}] ${templateRecord.program_name}`;
      await supabase
        .from('periodization_deployments')
        .insert([{
          athlete_id: athlete.id,
          program_name: macroNameFormatted,
          program_type: 'macro',
          start_date: getDbDateStr(startBaseDate),
          end_date: getDbDateStr(endBaseDate),
          color: '#3b82f6'
        }]);

      // 3. Deploy Mesocycles & clone workouts
      const mesos = tplDetails.mesocycles || [];
      for (const meso of mesos) {
        const startOffsetWeeks = Number(meso.startWeek) - 1;
        const mesoWeeksCount = Number(meso.durationWeeks);
        
        const mStart = new Date(startBaseDate);
        mStart.setDate(mStart.getDate() + (startOffsetWeeks * 7));
        const mEnd = new Date(mStart);
        mEnd.setDate(mEnd.getDate() + (mesoWeeksCount * 7) - 1);

        // Save meso deployment
        await supabase
          .from('periodization_deployments')
          .insert([{
            athlete_id: athlete.id,
            program_id: meso.programId || null,
            program_name: meso.name,
            program_type: 'meso',
            start_date: getDbDateStr(mStart),
            end_date: getDbDateStr(mEnd),
            color: meso.color
          }]);

        // Copy daily exercises to athlete schedule (if a Meso Program Template is linked)
        if (meso.programId) {
          let program;
          if (meso.programId.startsWith('sys-')) {
            program = getSystemPresetMeso(meso.programId);
          } else {
            program = programs.find(p => p.id === meso.programId);
          }
          if (program && program.weeks) {
            for (let i = 0; i < program.weeks.length; i++) {
              const futureWeekStart = new Date(mStart);
              futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
              const weekTemplateObject = program.weeks[i].drills || {};
              const targetBlockTitle = program.weeks[i].title || 'Meso-Template Workout';
              
              for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
                const dayDate = new Date(futureWeekStart);
                dayDate.setDate(dayDate.getDate() + j);
                
                let clonedDrills = [];
                if (weekTemplateObject && !Array.isArray(weekTemplateObject)) {
                  clonedDrills = (weekTemplateObject[DAYS_OF_WEEK[j]] || []).map((drill, idx) => ({ 
                    ...drill, 
                    id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                  }));
                } else if (Array.isArray(weekTemplateObject)) {
                  clonedDrills = weekTemplateObject.map((drill, idx) => ({ 
                    ...drill, 
                    id: `deployedtpl-${Date.now()}-${i}-${j}-${idx}-${Math.random()}` 
                  }));
                }
                
                await supabase.from('agilitylap_workouts').upsert({ 
                  athlete_id: athlete.id, 
                  workout_date: getDbDateStr(dayDate), 
                  workout_title: targetBlockTitle, 
                  drills: clonedDrills 
                }, { onConflict: 'athlete_id,workout_date' });
              }
            }
          }
        }
      }

      // 4. Deploy Microcycles
      const micros = tplDetails.microcycles || {};
      for (const [wIdx, focusType] of Object.entries(micros)) {
        if (focusType && focusType !== 'None') {
          const wOffset = Number(wIdx);
          const wStart = new Date(startBaseDate);
          wStart.setDate(wStart.getDate() + (wOffset * 7));
          const wEnd = new Date(wStart);
          wEnd.setDate(wEnd.getDate() + 6);

          let color = '#f59e0b'; // amber for load
          if (focusType === 'Deload') color = '#10b981'; // emerald for deload
          if (focusType === 'Test') color = '#3b82f6'; // blue for test

          await supabase.from('periodization_deployments').insert([{
            athlete_id: athlete.id,
            program_name: focusType,
            program_type: 'micro',
            start_date: getDbDateStr(wStart),
            end_date: getDbDateStr(wEnd),
            color: color
          }]);
        }
      }

      handleToast(`تم تطبيق ونشر القالب الدوري "${templateRecord.program_name}" للاعب بنجاح!`);
      setShowDeployTemplateModal(false);
      setDeployStartDate('');
      setSelectedTemplateToDeploy('');
      await fetchLocalDeployments();
      if (refreshDeploymentsCallback) refreshDeploymentsCallback();
    } catch (err) {
      console.error(err);
      handleToast('حدث خطأ أثناء تطبيق القالب.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weeks within a macrocycle
  const getMacroWeeks = (macro) => {
    const start = new Date(macro.start_date + 'T00:00:00');
    const end = new Date(macro.end_date + 'T00:00:00');
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);
    
    const weeksList = [];
    let current = new Date(start);
    for (let i = 0; i < totalWeeks; i++) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      weeksList.push({
        index: i,
        start: wStart,
        end: wEnd,
        startStr: getDbDateStr(wStart),
        endStr: getDbDateStr(wEnd)
      });
      current.setDate(current.getDate() + 7);
    }
    return weeksList;
  };

  // Add Meso block into the local template designer array
  const handleAddMesoToTemplate = () => {
    if (!newMesoName.trim()) {
      handleToast('الرجاء كتابة اسم الدورة المتوسطة!');
      return;
    }
    
    // Check overlaps within the template weeks
    const endWeek = Number(newMesoStartWeek) + Number(newMesoDuration) - 1;
    if (endWeek > tplDurationWeeks) {
      handleToast('⚠️ الدورة المتوسطة تتجاوز عدد أسابيع القالب الكلية!');
      return;
    }

    const overlap = tplMesos.find(m => 
      (Number(newMesoStartWeek) >= m.startWeek && Number(newMesoStartWeek) < m.startWeek + m.durationWeeks) ||
      (endWeek >= m.startWeek && endWeek < m.startWeek + m.durationWeeks)
    );

    if (overlap) {
      handleToast(`⚠️ تداخل مع دورة متوسطة أخرى: "${overlap.name}"`);
      return;
    }

    setTplMesos([...tplMesos, {
      id: Date.now(),
      name: newMesoName,
      startWeek: Number(newMesoStartWeek),
      durationWeeks: Number(newMesoDuration),
      focus: newMesoFocus,
      color: newMesoColor,
      programId: newMesoProgramId
    }]);

    setNewMesoName('');
    setShowAddMesoBlock(false);
    handleToast('تمت إضافة الدورة المتوسطة للقالب!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-2 sm:p-6 print:hidden" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
        
        {/* Main Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                مخطط فترات التدريب الدوري — Periodization Planner
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
                اللاعب النشط: <span className="text-orange-500 font-extrabold">{athlete?.name}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tabs Controller */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('roadmap')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'roadmap' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                تخطيط اللاعب / Athlete Roadmap
              </button>
              <button 
                onClick={() => setActiveTab('templates')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'templates' ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                البرامج العامة / Master Templates
              </button>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Athlete Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Deploy Template Header Banner */}
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 dark:from-orange-500/20 dark:to-transparent border border-orange-200/50 dark:border-orange-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <Sparkles className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">تخطيط وتوزيع الموسم الرياضي 💡</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      اعرض التقويم الفعلي للرياضي حالياً. يمكنك تلوين وتقسيم الموسم يدوياً أو تطبيق برنامج كامل جاهز من القوالب العامة دفعة واحدة.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDeployTemplateModal(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> تطبيق قالب عام (Deploy)
                </button>
              </div>

              {/* Months Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {months.map((monthDate, mi) => {
                  const monthName = monthDate.toLocaleString('ar-EG', { month: 'long' });
                  const monthNameEn = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                  const weeksList = getWeeksInMonth(monthDate);
                  
                  return (
                    <div 
                      key={mi} 
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {monthName} <span className="text-xs font-normal text-slate-450 dark:text-slate-500">/ {monthNameEn}</span>
                        </h4>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {weeksList.length === 0 ? (
                          <div className="text-center text-xs text-slate-400 py-4">لا توجد أسابيع تبدأ في هذا الشهر</div>
                        ) : (
                          weeksList.map((week, wi) => {
                            const macro = getMacroForDate(week.startStr);
                            const meso = getMesoForDate(week.startStr);
                            const micro = getMicroForDate(week.startStr);
                            
                            return (
                              <div 
                                key={wi}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                  meso ? 'bg-slate-50 dark:bg-slate-900/60' : 'bg-transparent border-slate-100 dark:border-slate-800'
                                }`}
                                style={{ 
                                  borderColor: meso ? meso.color + '40' : undefined,
                                  borderLeftWidth: macro ? '4px' : undefined,
                                  borderLeftColor: macro ? macro.color : undefined
                                }}
                              >
                                <div className="flex flex-col gap-0.5 truncate max-w-[60%]">
                                  <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500">
                                    {week.start.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {week.end.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {meso && (
                                    <span className="font-extrabold truncate text-[11px]" style={{ color: meso.color }}>
                                      Meso: {meso.program_name}
                                    </span>
                                  )}
                                  {macro && !meso && (() => {
                                    const { deficit, name } = getCleanNameAndDeficit(macro.program_name);
                                    return (
                                      <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] truncate flex items-center gap-1">
                                        Macro: 
                                        {deficit && (
                                          <span className={`px-1 py-0.2 rounded text-[7.5px] font-black text-white shrink-0 ${
                                            deficit === 'FDP' ? 'bg-red-500' :
                                            deficit === 'EDP' ? 'bg-violet-500' :
                                            deficit === 'RSD' ? 'bg-cyan-500' :
                                            'bg-amber-500 text-slate-950'
                                          }`}>
                                            {deficit}
                                          </span>
                                        )}
                                        <span className="truncate">{name}</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {micro && (
                                    <span 
                                      className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider text-white"
                                      style={{ backgroundColor: micro.color }}
                                    >
                                      {micro.program_name === 'Load' ? 'شحن' : micro.program_name === 'Deload' ? 'استشفاء' : 'اختبار'}
                                    </span>
                                  )}

                                  {macro ? (
                                    <button
                                      onClick={() => setActiveMacroDetail(macro)}
                                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
                                      title="عرض تفاصيل الدورة الكبرى والتقسيم"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
              {activeMacroDetail ? (
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between h-full min-h-[500px]">
                  <div>
                    <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                      <div>
                        <span className="px-2 py-0.5 bg-blue-500 rounded-md text-[8.5px] font-black uppercase tracking-wider text-white mb-1 inline-block">
                          دورة كبرى نشطة / Macrocycle
                        </span>
                        {(() => {
                          const { deficit, name } = getCleanNameAndDeficit(activeMacroDetail.program_name);
                          return (
                            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 flex-wrap">
                              {deficit && (
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black text-white shrink-0 ${
                                  deficit === 'FDP' ? 'bg-red-500' :
                                  deficit === 'EDP' ? 'bg-violet-500' :
                                  deficit === 'RSD' ? 'bg-cyan-500' :
                                  'bg-amber-500 text-slate-950'
                                }`}>
                                  {deficit}
                                </span>
                              )}
                              <span>{name}</span>
                            </h4>
                          );
                        })()}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                          {new Date(activeMacroDetail.start_date + 'T00:00:00').toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(activeMacroDetail.end_date + 'T00:00:00').toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteDeployment(activeMacroDetail.id, activeMacroDetail.program_name, 'macro')}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        title="حذف الدورة الكبرى بالكامل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {getMacroWeeks(activeMacroDetail).map((week, idx) => {
                        const meso = getMesoForDate(week.startStr);
                        const micro = getMicroForDate(week.startStr);
                        
                        return (
                          <div 
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                            style={{ borderRight: meso ? `4px solid ${meso.color}` : undefined }}
                          >
                            <div className="flex flex-col gap-0.5 truncate max-w-[55%]">
                              <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-350">
                                الأسبوع {idx + 1}
                              </span>
                              <span className="text-[9.5px] text-slate-450 dark:text-slate-500 font-medium">
                                {week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {meso && (
                                <span className="font-bold text-[9.5px] truncate" style={{ color: meso.color }}>
                                  {meso.program_name}
                                </span>
                              )}
                            </div>

                            <select
                              value={micro?.program_name || 'None'}
                              onChange={(e) => handleSetMicroFocus(week, e.target.value)}
                              className="text-[10px] bg-slate-50 dark:bg-slate-850 border dark:border-slate-700 p-1.5 rounded-lg outline-none font-bold text-slate-600 dark:text-slate-300"
                            >
                              <option value="None">- لا دورة صغرى -</option>
                              <option value="Load">شحن / Load</option>
                              <option value="Deload">استشفاء / Deload</option>
                              <option value="Test">اختبار / Test</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                      onClick={() => setActiveMacroDetail(null)}
                      className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs text-center"
                    >
                      إغلاق التفاصيل
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 min-h-[350px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider mb-3">تطبيق الخطط الدورية 🧪</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      القوالب العامة تمكنك من توزيع التخطيط السنوي بالكامل على أي رياضي بضغطة زر. صمم برامجك في علامة التبويب المجاورة، ثم طبقها هنا لتنزل التمارين تلقائياً.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Master Templates Manager */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">قوالب الفترات الدورية العامة (Master Templates)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  صمم برامج فترات عامة مخصصة لمعالجة العجز الرياضي والبدني، وقم بحفظها لإعادة تطبيقها على أي رياضي لاحقاً.
                </p>
              </div>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> تصميم قالب عام جديد
              </button>
            </div>

            {/* Templates Grid List */}
            {masterTemplates.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 border border-dashed rounded-3xl">
                <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا يوجد قوالب دورية عامة محفوظة حالياً</p>
                <p className="text-xs text-slate-400 mt-1">اضغط على زر "تصميم قالب عام جديد" بالأعلى لتبدأ تخطيط برنامجك الرياضي الأول.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {masterTemplates.map((template) => {
                  const details = template.weeks?.[0] || {};
                  const protocol = details.deficitProtocol || 'FDP';
                  const weeksCount = details.durationWeeks || 12;
                  const mesosCount = details.mesocycles?.length || 0;
                  
                  return (
                    <div 
                      key={template.id}
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black text-white ${
                            protocol === 'FDP' ? 'bg-red-500' :
                            protocol === 'EDP' ? 'bg-violet-500' :
                            protocol === 'RSD' ? 'bg-cyan-500' :
                            'bg-amber-500 text-slate-950'
                          }`}>
                            {protocol}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {weeksCount} أسبوع ({Math.round(weeksCount/4)} شهور)
                          </span>
                        </div>
                        
                        <h5 className="text-sm font-black text-slate-800 dark:text-white truncate">
                          {template.program_name}
                        </h5>
                        
                        <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            عدد الكتل المتوسطة (Meso): <span className="font-bold text-slate-700 dark:text-slate-300">{mesosCount}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                            الدورات الصغرى (Micro): <span className="font-bold text-slate-700 dark:text-slate-300">{Object.keys(details.microcycles || {}).length} أسابيع محددة</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <button
                          onClick={() => {
                            setSelectedTemplateToDeploy(template.id);
                            setShowDeployTemplateModal(true);
                            setActiveTab('roadmap');
                          }}
                          className="px-3.5 py-1.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> تطبيق للاعب الفعلي
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditMasterTemplate(template)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all"
                            title="تعديل القالب / Edit Template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMasterTemplate(template.id, template.program_name)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition-all"
                            title="حذف القالب / Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: Create/Design Master Template */}
        {showCreateTemplate && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-2 sm:p-6" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col font-sans">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" /> تصميم وإعداد قالب دوري عام جديد
                </h3>
                <button onClick={handleCloseTemplateDesigner} className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 rounded-full"><X className="w-4 h-4 dark:text-white"/></button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                
                {/* Inputs & Config (Left side inside modal) */}
                <div className="flex-1 space-y-4">
                  
                  {/* Template Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم القالب الدوري:</label>
                    <input 
                      type="text" 
                      placeholder="مثال: برنامج تحسين عجز القوة 6 شهور"
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Deficit Protocol */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بروتوكول العجز البدني:</label>
                        <button
                          type="button"
                          onClick={() => setShowGuidancePanel(!showGuidancePanel)}
                          className="text-[10px] text-orange-500 font-extrabold flex items-center gap-1 hover:underline shrink-0"
                        >
                          {showGuidancePanel ? 'إخفاء الإرشادات 📖' : 'عرض الإرشادات 📘'}
                        </button>
                      </div>
                      <select
                        value={tplDeficit}
                        onChange={(e) => setTplDeficit(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                      >
                        <option value="FDP">FDP / عجز القوة القصوى</option>
                        <option value="EDP">EDP / عجز الدورة المطاطية</option>
                        <option value="RSD">RSD / عجز الصلابة الارتدادية</option>
                        <option value="HVRP">HVRP / عجز السرعة ومعدل القوة</option>
                      </select>
                    </div>

                    {/* Total Duration */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الكلية:</label>
                      <select
                        value={tplDurationWeeks}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setTplDurationWeeks(w);
                          // Clean up out-of-range mesos
                          setTplMesos(tplMesos.filter(m => m.startWeek + m.durationWeeks - 1 <= w));
                        }}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                      >
                        <option value={12}>12 أسبوعاً (3 أشهر)</option>
                        <option value={24}>24 أسبوعاً (6 أشهر)</option>
                        <option value={36}>36 أسبوعاً (9 أشهر)</option>
                        <option value={48}>48 أسبوعاً (12 شهراً)</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-Generate Button */}
                  <button
                    type="button"
                    onClick={handleAutoGeneratePeriodization}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    توليد تخطيط ذكي تلقائي / 1-Click Auto-Periodize
                  </button>

                  {/* Add Mesocycle Block container */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-orange-500" /> إضافة دورة متوسطة (Mesocycle)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMesoBlock(!showAddMesoBlock)}
                        className="text-[10px] text-orange-500 font-bold bg-white dark:bg-slate-800 border p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {showAddMesoBlock ? 'إخفاء' : 'إضافة دورة متوسطة'}
                      </button>
                    </div>

                    {showAddMesoBlock && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">اسم الدورة المتوسطة:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: دورة التحمل العضلي"
                              value={newMesoName}
                              onChange={(e) => setNewMesoName(e.target.value)}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">التركيز الفسيولوجي:</label>
                            <input 
                              type="text" 
                              placeholder="مثال: Absolute Strength"
                              value={newMesoFocus}
                              onChange={(e) => setNewMesoFocus(e.target.value)}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">أسبوع البداية في القالب:</label>
                            <select
                              value={newMesoStartWeek}
                              onChange={(e) => setNewMesoStartWeek(Number(e.target.value))}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            >
                              {Array.from({ length: tplDurationWeeks }, (_, k) => k + 1).map(w => (
                                <option key={w} value={w}>الأسبوع {w}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">المدة الزمنية (أسابيع):</label>
                            <select
                              value={newMesoDuration}
                              onChange={(e) => setNewMesoDuration(Number(e.target.value))}
                              className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                            >
                              <option value={3}>3 أسابيع</option>
                              <option value={4}>4 أسابيع</option>
                              <option value={5}>5 أسابيع</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">اللون المميز للفترة:</label>
                            <div className="flex gap-1 items-center justify-center h-9">
                              {PHASE_COLORS.map((pc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setNewMesoColor(pc.hex)}
                                  className={`w-4 h-4 rounded-full border transition-transform ${newMesoColor === pc.hex ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'}`}
                                  style={{ backgroundColor: pc.hex }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Link program block */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">ربط كتلة تمارين فعلية (Meso Program Template):</label>
                          <select
                            value={newMesoProgramId}
                            onChange={(e) => setNewMesoProgramId(e.target.value)}
                            className="w-full text-[11px] p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none"
                          >
                            <option value="">-- اختياري: اختر برنامج تمارين لربطه بالكتلة --</option>
                            {[
                              ...SYSTEM_PRESETS,
                              ...programs.filter(p => p.type === 'meso')
                            ].map(p => (
                              <option key={p.id} value={p.id}>
                                {p.program_name} {p.weeks ? `(${p.weeks.length} أسابيع)` : '(4 أسابيع)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMesoToTemplate}
                          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs"
                        >
                          حفظ وإدراج الدورة المتوسطة داخل القالب
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weeks visual timeline designer (Right side inside modal) */}
                <div className="w-full md:w-96 border-r md:border-r border-slate-200 dark:border-slate-700 pr-0 md:pr-6 flex flex-col">
                  <h5 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3">أسابيع وتفاصيل القالب</h5>
                  
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1.5">
                    {Array.from({ length: tplDurationWeeks }, (_, idx) => {
                      const weekIndex = idx;
                      const weekNum = idx + 1;
                      
                      // Check if week belongs to any meso
                      const meso = tplMesos.find(m => weekNum >= m.startWeek && weekNum < m.startWeek + m.durationWeeks);
                      const activeFocus = tplMicros[weekIndex] || 'None';

                      return (
                        <div 
                          key={weekIndex}
                          className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs transition-all"
                          style={{ borderRight: meso ? `4px solid ${meso.color}` : undefined }}
                        >
                          <div className="truncate max-w-[50%]">
                            <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-350 block">
                              الأسبوع {weekNum}
                            </span>
                            {meso && (
                              <span className="font-bold text-[9px] truncate block mt-0.5" style={{ color: meso.color }}>
                                {meso.name}
                              </span>
                            )}
                          </div>

                          {/* Set Micro focus (Click-to-Toggle pills) */}
                          <div className="flex items-center gap-0.5 bg-slate-200/65 dark:bg-slate-800 p-0.5 rounded-lg shrink-0 border border-slate-300/30">
                            {[
                              { key: 'None', label: 'بدون', colorActive: 'bg-slate-500 text-white shadow-sm font-black', colorInactive: 'text-slate-500 dark:text-slate-400 hover:bg-slate-300/40 dark:hover:bg-slate-700' },
                              { key: 'Load', label: 'شحن', colorActive: 'bg-amber-500 text-white font-black shadow-sm shadow-amber-500/20', colorInactive: 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10' },
                              { key: 'Deload', label: 'استشفاء', colorActive: 'bg-emerald-500 text-white font-black shadow-sm shadow-emerald-500/20', colorInactive: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' },
                              { key: 'Test', label: 'اختبار', colorActive: 'bg-blue-500 text-white font-black shadow-sm shadow-blue-500/20', colorInactive: 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10' }
                            ].map(btn => {
                              const isActive = activeFocus === btn.key;
                              return (
                                <button
                                  key={btn.key}
                                  type="button"
                                  onClick={() => setTplMicros({ ...tplMicros, [weekIndex]: btn.key })}
                                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-black transition-all ${isActive ? btn.colorActive : btn.colorInactive}`}
                                  title={btn.key}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sports Science Guidance Panel */}
                {showGuidancePanel && (
                  <div className="w-full lg:w-72 border-r border-slate-200 dark:border-slate-700 pr-0 lg:pr-6 flex flex-col transition-all">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl h-full flex flex-col justify-between">
                      {(() => {
                        const guide = DEFICIT_GUIDELINES[tplDeficit] || DEFICIT_GUIDELINES.FDP;
                        return (
                          <div className="space-y-3.5 text-right">
                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                              <HelpCircle className="w-4 h-4 text-orange-500" />
                              <h5 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                                {guide.title}
                                <span className="block text-[9.5px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">{guide.englishTitle}</span>
                              </h5>
                            </div>
                            
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              💡 {guide.focus}
                            </p>

                            <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                              {guide.metrics.map((m, mIdx) => (
                                <div key={mIdx} className="flex flex-col gap-0.5 text-[10px]">
                                  <span className="font-extrabold text-slate-400 dark:text-slate-500 text-[9px]">{m.label}</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-350">{m.value}</span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[9.5px] font-extrabold text-orange-500 block">💡 توصيات علمية هامة:</span>
                              <ul className="list-disc list-inside space-y-1 text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed pr-1 font-medium">
                                {guide.tips.map((tip, tIdx) => (
                                  <li key={tIdx} className="text-right list-none relative pr-3 before:content-['•'] before:absolute before:right-0 before:text-orange-500">
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                <button
                  onClick={handleSaveMasterTemplate}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ القالب العام
                </button>
                <button
                  onClick={handleCloseTemplateDesigner}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 3: Deploy/Apply Master Template Modal */}
        {showDeployTemplateModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 font-sans" dir="rtl">
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-orange-500 animate-pulse" /> تطبيق ونشر قالب دوري عام
              </h3>

              <div className="space-y-4 text-right">
                
                {/* Select template */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اختر القالب الدوري العام:</label>
                  <select
                    value={selectedTemplateToDeploy}
                    onChange={(e) => setSelectedTemplateToDeploy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value="">-- اختر قالب للبدء --</option>
                    {masterTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.program_name}</option>
                    ))}
                  </select>
                </div>

                {/* Choose start date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">تاريخ بداية التطبيق للاعب (السبت):</label>
                  <input
                    type="date"
                    value={deployStartDate}
                    onChange={(e) => setDeployStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    ⚠️ ملحوظة: سيقوم النظام بتعديل التواريخ تلقائياً لتوافق أقرب يوم **سبت** (بداية الأسبوع التدريبي).
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 p-3 rounded-2xl text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  ⚠️ تحذير: تطبيق قالب دوري جديد سيقوم بإلغاء وإعادة كتابة أي فترات تدريبية متداخلة أو تمارين يومية مخزنة مسبقاً للاعب الحالي ضمن نطاق تاريخ القالب.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeployTemplateToAthlete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> تأكيد ونشر الجدول
                </button>
                <button
                  onClick={() => setShowDeployTemplateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Edit Deployed Mesocycle Modal */}
        {showMesoEditModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 font-sans" dir="rtl">
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" /> 
                {editingMesoId ? 'تعديل الدورة المتوسطة المنشورة' : 'إضافة دورة متوسطة جديدة للاعب'}
              </h3>

              <div className="space-y-4 text-right">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم الدورة المتوسطة (Meso Name):</label>
                  <input
                    type="text"
                    value={mesoFormName}
                    onChange={(e) => setMesoFormName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                    placeholder="مثال: دورة القوة الانفجارية"
                  />
                </div>

                {/* Start Week selection within Active Macro */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">أسبوع البداية في الدورة الكبرى:</label>
                  <select
                    value={mesoFormStartWeek}
                    onChange={(e) => setMesoFormStartWeek(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    {activeMacroDetail && getMacroWeeks(activeMacroDetail).map((w, idx) => (
                      <option key={idx} value={idx + 1}>الأسبوع {idx + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الزمنية (أسابيع):</label>
                  <select
                    value={mesoFormDuration}
                    onChange={(e) => setMesoFormDuration(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white font-bold"
                  >
                    <option value={3}>3 أسابيع</option>
                    <option value={4}>4 أسابيع</option>
                    <option value={5}>5 أسابيع</option>
                  </select>
                </div>

                {/* Color Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اللون المميز للمرحلة:</label>
                  <div className="flex gap-2">
                    {PHASE_COLORS.map((pc, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setMesoFormColor(pc.hex)}
                        className={`w-6 h-6 rounded-full border transition-transform ${mesoFormColor === pc.hex ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: pc.hex }}
                        title={pc.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Link to Program Template */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-orange-500" /> ربط كتلة تمارين فعلية (Program Template)
                    </span>
                    <span className="text-[9.5px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-black px-1.5 py-0.5 rounded-md">
                      اختياري
                    </span>
                  </div>

                  <select
                    value={mesoFormProgramId}
                    onChange={(e) => setMesoFormProgramId(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-xl outline-none"
                  >
                    <option value="">-- اختر برنامج تمارين لربطه --</option>
                    {programs.filter(p => p.type === 'meso').map(p => (
                      <option key={p.id} value={p.id}>{p.program_name} ({p.weeks?.length || 0} أسابيع)</option>
                    ))}
                  </select>

                  {mesoFormProgramId && (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="checkbox" 
                        id="meso-form-clone-chk"
                        checked={mesoFormCloneDrills}
                        onChange={(e) => setMesoFormCloneDrills(e.target.checked)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="meso-form-clone-chk" className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
                        {editingMesoId ? 'إعادة استيراد وتنزيل التمارين إلى جدول اللاعب' : 'تنزيل وتعبئة جدول الرياضي الفعلي بالتمارين فور الحفظ'}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveMesoEditModal}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> حفظ التغييرات
                </button>
                <button
                  onClick={() => setShowMesoEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
