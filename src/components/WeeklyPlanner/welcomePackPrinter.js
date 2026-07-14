/**
 * Welcome Pack HTML Print Engine for ForcePeak Weekly Planner.
 * Generates a premium multi-page athletic coaching welcome pack using a gritty, modern dark-mode style
 * with athletic orange accents, 100% clickable links, and perfect bilingual/multilingual font rendering.
 * Features:
 * - Dynamic page count (Cover, About, Philosophy, 1 page per Active Training Day, and a final Protocols Page).
 * - Skips rest days entirely.
 * - Each active day gets its own dedicated page with exercises laid out in a clean 2-column grid.
 * - Excludes day load points from training cards.
 * - Format reps/sec units explicitly (e.g. "8 reps", "30 sec", "40 m").
 * - English signature block with Head Coach Mahmoud Ali & Assistant Coach Mostafa Ali side-by-side.
 * - Final page uses a 2-column dashboard layout to show Nutrition, Check-ins, and the Weekly Summary.
 * - Minimalist thin line-art jumping athlete watermarks.
 * - Footer text is strictly in English: "PEAK FORCE ATHLETIC PERFORMANCE".
 */
export function generateWelcomePackHTML({ 
  schedule, 
  dayTitles, 
  weekDatesFull, 
  selectedAthlete, 
  calculateDayVolume,
  langMode = 'mix' // 'mix' | 'arabic' | 'english'
}) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const athleteName = selectedAthlete ? selectedAthlete.name : 'Elite Athlete';
  const dateStart = weekDatesFull[0] ? new Date(weekDatesFull[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const dateEnd = weekDatesFull[6] ? new Date(weekDatesFull[6]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Theme configuration (Gritty dark slate & energetic athletic orange)
  const T = {
    bg: '#121212',          // Ultra-dark charcoal
    cardBg: '#1e1e1e',      // Slightly lighter charcoal for cards
    border: '#2e2e2e',
    primary: '#ff6b00',     // Athletic Orange
    accent: '#f97316',
    text: '#ffffff',        // High contrast white
    muted: '#94a3b8',       // Slate 400
    gridBorder: '#333333'
  };

  // Category border colors mapping
  const getCategoryColor = (type) => {
    const t = (typeof type === 'string') ? type.toLowerCase() : 'physical';
    const types = {
      strength: T.primary,
      power: '#ef4444',
      core: '#a855f7',
      mobility: '#e11d48',
      isometric: '#f97316',
      physical: T.muted,
      speed: '#10b981',
      endurance: '#06b6d4'
    };
    return types[t] || T.muted;
  };

  // Translation Dictionaries
  const dict = {
    cover: {
      tagline: { en: 'ATHLETIC PERFORMANCE LAB', ar: 'مختبر الأداء الرياضي والعضلي' },
      title: { en: 'PEAK FORCE', ar: 'بييك فورس' },
      subtitle: { en: 'Elite Athletic Performance & Strength Guide', ar: 'دليل الأداء الرياضي والقوة البدنية للنخبة' },
      preparedFor: { en: 'Prepared For', ar: 'معد خصيصاً لـ' },
      headCoach: { en: 'Head Coach', ar: 'المدرب الرئيسي' },
      systemBlueprint: { en: 'System Blueprint', ar: 'النظام التدريبي' },
      dateStart: { en: 'Date Start', ar: 'تاريخ البدء' }
    },
    page2: {
      title: { en: 'Who Am I & Why Are You Here?', ar: 'من أنا ولماذا أنت هنا؟' },
      lead: { 
        en: 'This is not a recreational gym plan. This is a biomechanically-optimized sports performance system built for elite results.',
        ar: 'هذا ليس برنامجًا تدريبيًا عاديًا للتسلية. هذا نظام متكامل لتحسين الأداء الرياضي والميكانيكا الحيوية مصمم خصيصًا للنخبة لتحقيق نتائج خارقة وقابلة للقياس.'
      },
      body: {
        en: 'Most training regimens focus purely on vanity or basic hypertrophy. The PEAK FORCE system targets the central nervous system, muscle-tendon architecture, and raw athletic output. If you want to jump higher, sprint faster, and apply force instantly, you must train the qualities that govern those adaptations.',
        ar: 'معظم البرامج التدريبية تركز فقط على الشكل الخارجي أو الضخامة العضلية البسيطة. لكن نظام PEAK FORCE يستهدف تحفيز الجهاز العصبي المركزي، وتطوير البنية الوترية والعضلية، والقدرة التفجيرية الخام. إذا كنت ترغب في زيادة القفز العمودي، وسرعة الجري، وتوليد القوة بشكل فوري، فعليك تدريب الصفات الحركية الفسيولوجية التي تحكم هذه التكيفات.'
      },
      point1Title: { en: '1. Biomechanics & Joint Integrity', ar: '1. الميكانيكا الحيوية وسلامة المفاصل' },
      point1Desc: {
        en: 'We align movement vectors with your specific anatomy. By training structural integrity through full range of motion and loaded mobility, we maximize force transfer while bulletproofing your joints.',
        ar: 'نقوم بمحاذاة زوايا الحركة مع تشريحك الخاص. من خلال تدريب سلامة البنية الحركية عبر المدى الحركي الكامل والمرونة المحملة بالأوزان، نضمن أقصى انتقال للقوة مع حماية كاملة للمفاصل.'
      },
      point2Title: { en: '2. Rate of Force Development (RFD)', ar: '2. معدل توليد القوة (RFD)' },
      point2Desc: {
        en: 'Strength is useless if you cannot apply it in milliseconds. RFD dictates your explosiveness off the ground and sprint acceleration. We train the neuromuscular system to fire all motor units instantly.',
        ar: 'القوة بلا سرعة لا قيمة لها في الملعب. معدل توليد القوة هو ما يحدد قدرتك التفجيرية وسرعة انطلاقك. نحن ندرب الجهاز العصبي لتجنيد الألياف العضلية فوراً وفي أجزاء من الثانية.'
      },
      point3Title: { en: '3. Measurable Performance Output', ar: '3. نتائج رياضية قابلة للقياس' },
      point3Desc: {
        en: 'We track progress using hard metrics: vertical jump height, sprint velocity, reactive strength index, and relative strength ratios. Numbers do not lie.',
        ar: 'نحن نقيس التقدم باستخدام أرقام حقيقية وملموسة: ارتفاع القفز العمودي، وسرعة الجري، ومؤشر القوة التفاعلية، ونسب القوة النسبية لوزن الجسم. الأرقام لا تكذب.'
      }
    },
    page3: {
      title: { en: 'The Rules of the Game', ar: 'قواعد اللعبة وقوانين التدريب' },
      lead: {
        en: 'To achieve elite adaptations, we must follow a strict, non-negotiable set of training rules.',
        ar: 'لتحقيق أفضل التكيفات الرياضية والبدنية، يجب الالتزام التام بالقواعد الثلاث التالية التي لا تقبل الجدال:'
      },
      rule1Title: { en: 'Auto-regulation (RPE & RIR)', ar: 'الضبط الذاتي للأحمال (RPE / RIR)' },
      rule1Desc: {
        en: 'Your body fluctuates daily based on sleep, stress, and recovery. Instead of chasing fixed numbers, we use Rate of Perceived Exertion (RPE). If you are feeling 100%, push the load. If you are fatigued, regulate the load downward. This prevents overtraining and guarantees consistent long-term progress.',
        ar: 'تتغير طاقة جسمك ونشاطه يومياً بناءً على جودة النوم، التوتر، والاستشفاء. بدلاً من مطاردة أرقام جامدة، نستخدم مقياس الجهد المحسوس (RPE). إذا كنت بكامل طافتك اضغط في الوزن، وإذا كنت مجهداً خفف الحمل لحماية نفسك وضمان الاستمرار.'
      },
      rule2Title: { en: 'Video Analysis & Cues', ar: 'تحليل الفيديو والملاحظات الفنية' },
      rule2Desc: {
        en: 'You must record your working sets for primary compound movements. Form dictates muscle recruitment. Send these videos to the coach weekly. We will analyze bar speed, joint angles, and mechanical deficits to adjust your cues and program parameters.',
        ar: 'يجب عليك تصوير مجموعات العمل الأساسية للتمارين المركبة. التكنيك هو ما يحدد تجنيد العضلات المناسبة. أرسل مقاطع الفيديو للمدرب أسبوعياً، حيث سنقوم بتحليل سرعة البار وزوايا الحركة وتعديل البرنامج بناءً عليها.'
      },
      rule3Title: { en: 'Strict Consistency & Commitment', ar: 'الالتزام التام والاستمرارية' },
      rule3Desc: {
        en: 'Consistency is the ultimate driver of athletic progress. Missing sessions breaks the adaptive chain and resets your biological adaptations. Showing up and executing the plan day after day is what builds elite physical capacity. Commitment to the process is the foundation of peak performance.',
        ar: 'الالتزام والاستمرارية هما المحركان الأساسيان للتطور الرياضي. الغياب وتفويت الحصص التدريبية يقطع سلسلة تكيف الجسم ويحرمك من النتائج. الانضباط اليومي وتنفيذ البرنامج التدريبي خطوة بخطوة هو ما يصنع الفارق الحقيقي ويبني الأداء البدني العالي.'
      }
    },
    page4: {
      days: {
        Saturday: { en: 'SATURDAY', ar: 'السبت' },
        Sunday: { en: 'SUNDAY', ar: 'الأحد' },
        Monday: { en: 'MONDAY', ar: 'الإثنين' },
        Tuesday: { en: 'TUESDAY', ar: 'الثلاثاء' },
        Wednesday: { en: 'WEDNESDAY', ar: 'الأربعاء' },
        Thursday: { en: 'THURSDAY', ar: 'الخميس' },
        Friday: { en: 'FRIDAY', ar: 'الجمعة' }
      },
      rest: { en: 'REST & ACTIVE RECOVERY', ar: 'راحة واستشفاء نشط' }
    },
    page5: {
      title: { en: 'Nutrition & Check-In Protocol', ar: 'بروتوكول التغذية والمتابعة الأسبوعية' },
      lead: {
        en: 'Adaptation does not happen in the gym; it happens during recovery, fueled by your nutrition.',
        ar: 'التكيف والبناء لا يحدثان داخل صالة التدريب؛ بل يحدثان أثناء الاستشفاء والنوم، ووقود ذلك هو تغذيتك الرياضية.'
      },
      nutritionTitle: { en: 'Fueling for Performance', ar: 'التغذية للأداء الرياضي العالي' },
      nutritionDesc: {
        en: 'You must treat food as fuel. To build explosive power, your muscles require carbohydrates for rapid ATP synthesis and proteins for muscle fiber repair. Maintain a clean, whole-foods diet high in micronutrients and clean hydration.',
        ar: 'يجب أن تعامل الطعام كوقود لجسمك. لبناء قدرة تفجيرية، تحتاج عضلاتك إلى الكربوهيدرات لإنتاج الطاقة السريعة (ATP) والبروتين لإصلاح الألياف العضلية. حافظ على نظام غذائي نظيف ومتكامل ونسبة ترطيب عالية.'
      },
      macroTitle: { en: 'Macronutrient Guidelines', ar: 'إرشادات المغذيات الكبرى الأساسية' },
      macroDesc: {
        en: '* <strong>Protein:</strong> 2.0g per kg of bodyweight daily (essential for muscle repair).<br/>* <strong>Carbohydrates:</strong> 4.0g - 6.0g per kg of bodyweight (essential for glycolytic energy).<br/>* <strong>Fats:</strong> 1.0g per kg of bodyweight (essential for hormonal health and joint recovery).',
        ar: '* <strong>البروتين:</strong> 2.0 جم لكل كيلوجرام من وزن الجسم يومياً (أساسي لإصلاح العضلات).<br/>* <strong>الكربوهيدرات:</strong> 4.0 - 6.0 جم لكل كيلوجرام (أساسي لمخازن الطاقة والجلوكوز).<br/>* <strong>الدهون:</strong> 1.0 جم لكل كيلوجرام (هام للهرمونات وصحة المفاصل).'
      },
      checkinTitle: { en: 'Mandatory Friday Check-In', ar: 'التقرير الأسبوعي الإلزامي يوم الجمعة' },
      checkinDesc: {
        en: 'Every Friday, you must submit your weekly logs. Send video clips of your primary sets, record your bodyweight, and note your fatigue scores (1-10 CNS fatigue). Feedback and adjustments will be pushed before your Saturday workout.',
        ar: 'كل يوم جمعة، يجب عليك إرسال تقريرك الأسبوعي بشكل إلزامي. أرسل مقاطع الفيديو لأوزانك الأساسية، وسجل وزن جسمك، واكتب مستوى التعب العام لمراجعة وتحديث برنامجك قبل تمرين يوم السبت.'
      }
    }
  };

  // Language selectors helper
  const getVal = (dictObj, isHeadline = false) => {
    if (langMode === 'english') {
      return dictObj.en;
    } else if (langMode === 'arabic') {
      return dictObj.ar;
    } else {
      // 'mix' mode: Page 1 is English. Headlines are English. Body is Arabic.
      return isHeadline ? dictObj.en : dictObj.ar;
    }
  };

  // Cover page language config
  const coverLang = (langMode === 'arabic') ? 'ar' : 'en';

  // Group active training days (skip rest days completely)
  const activeDays = DAYS_OF_WEEK.filter(day => (schedule[day] || []).length > 0);
  const totalActive = activeDays.length;
  const totalPages = 4 + totalActive; // Cover (1) + About (2) + Philosophy (3) + Active Days (totalActive) + Protocols (1)

  // Dynamic footer template
  const getFooterHTML = (pageNum) => {
    return `
      <div class="page-footer ltr">
        <span>PEAK FORCE ATHLETIC PERFORMANCE</span>
        <span>Page ${pageNum} of ${totalPages}</span>
      </div>
    `;
  };

  // Render a training day page with a 2-column exercise grid inside the page
  const renderTrainingDayPageHTML = (day, dayIdx, pageNum) => {
    const drills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIdx] ? new Date(weekDatesFull[dayIdx]) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
    const dayTitle = dayTitles[day] || 'Training Protocol';

    let drillsHtml = '';
    drills.forEach((drill, index) => {
      if (!drill) return;
      const catColor = getCategoryColor(drill.type || 'physical');
      
      // Determine unit formatting: reps for counts, sec for timer holds
      let repsUnitStr = '';
      const drillUnit = typeof drill.unit === 'string' ? drill.unit.toLowerCase() : '';
      if (drillUnit === 'sec' || drillUnit === 'seconds' || drillUnit === 's') {
        repsUnitStr = 'sec';
      } else if (drillUnit === 'min' || drillUnit === 'minutes' || drillUnit === 'm') {
        repsUnitStr = 'min';
      } else if (drillUnit === 'meters' || drillUnit === 'm') {
        repsUnitStr = 'm';
      } else {
        repsUnitStr = 'reps';
      }

      const repsVal = (drillUnit === 'meters' || drillUnit === 'm') ? drill.distance : drill.reps;
      const repsDisplay = repsVal ? `${repsVal} ${repsUnitStr}` : '';
      const intensityVal = drill.percentage ? `@${drill.percentage}%` : '';

      // Clean double quotes safely
      let cleanNotes = drill.details ? String(drill.details).trim() : '';
      if (cleanNotes.startsWith('"') && cleanNotes.endsWith('"')) {
        cleanNotes = cleanNotes.substring(1, cleanNotes.length - 1);
      }

      drillsHtml += `
        <div class="drill-card" style="border-left: 5px solid ${catColor}">
          <div class="drill-header">
            <span class="drill-index" style="background-color: ${catColor}">${index + 1}</span>
            <span class="drill-title">${drill.title || 'Unnamed Exercise'}</span>
            ${drill.video_url ? `<a href="${drill.video_url.trim()}" target="_blank" class="video-link">Link</a>` : ''}
          </div>
          
          <div class="drill-params">
            ${drill.sets ? `<div class="param-badge"><strong>${drill.sets}</strong> Sets</div>` : ''}
            ${repsDisplay ? `<div class="param-badge"><strong>${repsDisplay}</strong></div>` : ''}
            ${intensityVal ? `<div class="param-badge text-orange"><strong>${intensityVal}</strong></div>` : ''}
            ${drill.rest ? `<div class="param-badge">⏱ <strong>${drill.rest} Rest</strong></div>` : ''}
            ${drill.tempo ? `<div class="param-badge">T: <strong>${drill.tempo}</strong></div>` : ''}
            ${drill.focus ? `<div class="param-badge text-rose-500 font-bold">${drill.focus}</div>` : ''}
          </div>

          ${cleanNotes ? `<div class="drill-notes">${cleanNotes}</div>` : ''}
        </div>
      `;
    });

    const dayNameTranslated = dict.page4.days[day][langMode === 'english' ? 'en' : 'ar'];

    return `
      <!-- DEDICATED TRAINING DAY PAGE -->
      <section class="page">
        <header class="page-header ltr">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Workout Blueprint</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ltr">${dayNameTranslated.toUpperCase()} <span class="day-card-date">${formattedDate}</span></h2>
        <div class="intro-lead ltr">FOCUS: ${dayTitle.toUpperCase()}</div>

        <!-- 2-Column Spacious Grid for Exercises on this Day -->
        <div class="day-drills-grid ltr">
          ${drillsHtml}
        </div>

        <!-- Smooth thin line-art jumping athlete watermark at the bottom of the page -->
        <div class="jump-silhouette-container" style="margin-top: auto; margin-bottom: 20px;">
          <svg class="jump-silhouette" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 7.5v6.5M8 11.5l4-2.5 4 2.5M7 21.5c1.5-2 3.5-3 5-3s3.5 1 5 3" />
          </svg>
        </div>

        ${getFooterHTML(pageNum)}
      </section>
    `;
  };

  // Compile active day pages HTML content
  let activeDaysPagesHtml = '';
  activeDays.forEach((day, idx) => {
    const originalIdx = DAYS_OF_WEEK.indexOf(day);
    activeDaysPagesHtml += renderTrainingDayPageHTML(day, originalIdx, 4 + idx);
  });

  // Prepare full A4 HTML structure
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>PEAK FORCE Welcome Pack - ${athleteName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Outfit', 'Cairo', system-ui, -apple-system, sans-serif;
          background-color: ${T.bg};
          color: ${T.text};
          line-height: 1.6;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Helper alignment classes */
        .rtl {
          direction: rtl;
          text-align: right;
        }
        .ltr {
          direction: ltr;
          text-align: left;
        }
        .text-center {
          text-align: center;
        }

        /* Page Layout */
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 15mm;
          margin: 0 auto;
          position: relative;
          background-color: ${T.bg};
          border-bottom: 2px dashed ${T.border};
          page-break-after: always;
          break-after: page;
          display: flex;
          flex-direction: column;
        }
        .page:last-child {
          border-bottom: none;
          page-break-after: avoid;
          break-after: avoid;
        }

        /* Cover Page (Page 1) */
        .cover-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border: 2px solid ${T.primary};
          border-radius: 24px;
          padding: 40px;
          margin: 20px 0;
          position: relative;
          background-color: ${T.cardBg};
        }
        .cover-tagline {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 5px;
          color: ${T.primary};
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .cover-title {
          font-size: 64px;
          font-weight: 900;
          color: ${T.text};
          line-height: 1;
          letter-spacing: -2px;
          margin-bottom: 10px;
        }
        .cover-subtitle {
          font-size: 15px;
          font-weight: 800;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 2px;
          max-width: 450px;
          margin-bottom: 60px;
        }
        .cover-meta {
          border-top: 1px solid ${T.border};
          padding-top: 30px;
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
        }
        .meta-label {
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta-val {
          color: ${T.text};
        }
        .meta-val.orange {
          color: ${T.primary};
        }

        /* Generic Page Headers */
        .page-header {
          border-bottom: 2px solid ${T.primary};
          padding-bottom: 15px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-left .brand {
          font-size: 15px;
          font-weight: 900;
          color: ${T.primary};
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .header-left .tag {
          font-size: 10px;
          font-weight: 700;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }
        .header-right {
          font-size: 11px;
          font-weight: 700;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Page Content Styles */
        .page-title {
          font-size: 32px;
          font-weight: 900;
          color: ${T.text};
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }
        .orange-dot {
          color: ${T.primary};
        }
        .intro-lead {
          font-size: 16px;
          font-weight: 700;
          color: ${T.primary};
          margin-bottom: 20px;
        }
        .body-p {
          font-size: 13.5px;
          color: ${T.muted};
          margin-bottom: 18px;
          text-align: justify;
        }
        .highlight-card {
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .highlight-title {
          font-size: 14.5px;
          font-weight: 800;
          color: ${T.text};
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        /* Rules Layout (Page 3) */
        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .rule-item {
          display: flex;
          gap: 20px;
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 20px;
        }
        .rule-number {
          font-size: 32px;
          font-weight: 900;
          color: ${T.primary};
          line-height: 1;
        }
        .rule-content .rule-title {
          font-size: 16px;
          font-weight: 800;
          color: ${T.text};
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .rule-content .rule-desc {
          font-size: 13px;
          color: ${T.muted};
          line-height: 1.5;
        }

        /* 2-Column Grid inside dedicated active day pages */
        .day-drills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .day-card-date {
          font-size: 16px;
          color: ${T.muted};
          font-weight: 700;
          margin-left: 10px;
        }
        .drill-card {
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .drill-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drill-index {
          font-size: 10.5px;
          font-weight: 950;
          color: #ffffff;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .drill-title {
          font-size: 13.5px;
          font-weight: 900;
          color: ${T.text};
          flex-grow: 1;
          word-break: break-word; /* Wrap naturally without clipping */
        }
        .video-link {
          font-size: 9.5px;
          color: ${T.primary};
          text-decoration: none;
          font-weight: 800;
          border: 1px solid ${T.primary}40;
          padding: 2px 8px;
          border-radius: 6px;
          background-color: ${T.primary}08;
          flex-shrink: 0;
        }
        .video-link:hover {
          background-color: ${T.primary}15;
        }
        .drill-params {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .param-badge {
          font-size: 10.5px;
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          padding: 3px 8px;
          border-radius: 6px;
          color: ${T.text};
          font-weight: 600;
        }
        .param-badge strong {
          color: ${T.accent};
        }
        .drill-notes {
          font-size: 11px;
          font-style: italic;
          color: ${T.muted};
          border-top: 1px dashed ${T.border};
          padding-top: 6px;
          line-height: 1.4;
          white-space: pre-line;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed ${T.border};
          border-radius: 12px;
          padding: 24px;
          background-color: ${T.bg}20;
        }
        .empty-title {
          font-size: 11px;
          font-weight: 900;
          color: ${T.muted};
          text-align: center;
        }

        /* Page 6: Protocols & Weekly Summary Dashboard */
        .protocols-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 20px;
          flex: 1;
        }
        .protocols-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .protocols-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .summary-card {
          background-color: ${T.cardBg};
          border: 1.5px dashed ${T.primary}60;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .summary-card-header {
          border-bottom: 1.5px solid ${T.border};
          padding-bottom: 8px;
        }
        .summary-card-name {
          font-size: 16px;
          font-weight: 900;
          color: ${T.primary};
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .summary-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .summary-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px solid ${T.border};
          padding-bottom: 8px;
          font-weight: 700;
        }
        .summary-stat-row span {
          color: ${T.muted};
        }
        .summary-stat-row strong {
          color: ${T.text};
        }
        .text-orange {
          color: ${T.primary} !important;
        }
        .summary-advice {
          font-size: 11px;
          line-height: 1.5;
          color: ${T.muted};
          background-color: ${T.bg};
          padding: 12px;
          border-radius: 8px;
          border: 1px solid ${T.border}80;
        }

        /* Smooth thin line-art jumping athlete watermark */
        .jump-silhouette-container {
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0.08; /* Super subtle, smooth watermark */
          width: 100%;
        }
        .jump-silhouette {
          width: 120px;
          height: 120px;
          color: ${T.primary};
        }

        /* Side-by-Side English Signature Block (Page 6) */
        .signature-row {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          gap: 40px;
          width: 100%;
        }
        .signature-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        .signature-line {
          width: 100%;
          max-width: 180px;
          border-top: 2px solid ${T.primary};
          margin-bottom: 8px;
        }
        .signature-text {
          font-size: 14px;
          font-weight: 900;
          color: ${T.text};
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .signature-title {
          font-size: 10px;
          font-weight: 700;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        /* Generic Footer */
        .page-footer {
          margin-top: auto;
          border-top: 1px solid ${T.border};
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Print Media Overrides */
        @media print {
          body {
            background-color: #121212 !important;
            color: #ffffff !important;
            padding: 0;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 18mm 15mm;
            border-bottom: none;
          }
          .drill-card {
            box-shadow: none !important;
            border: 1px solid #333333 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>

      <!-- PAGE 1: COVER -->
      <section class="page ${coverLang === 'ar' ? 'rtl' : 'ltr'}">
        <div class="cover-container">
          <div class="cover-tagline">${dict.cover.tagline[coverLang]}</div>
          <h1 class="cover-title">${dict.cover.title[coverLang]}</h1>
          <div class="cover-subtitle">${dict.cover.subtitle[coverLang]}</div>
          
          <div class="cover-meta">
            <div class="meta-row">
              <span class="meta-label">${dict.cover.preparedFor[coverLang]}</span>
              <span class="meta-val orange">${athleteName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${dict.cover.headCoach[coverLang]}</span>
              <span class="meta-val">Mahmoud Ali</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${dict.cover.systemBlueprint[coverLang]}</span>
              <span class="meta-val">V1.0 (Active)</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${dict.cover.dateStart[coverLang]}</span>
              <span class="meta-val">${dateStart}</span>
            </div>
          </div>
        </div>
        ${getFooterHTML(1)}
      </section>

      <!-- PAGE 2: ABOUT THE PROGRAM -->
      <section class="page ${langMode === 'english' ? 'ltr' : 'rtl'}">
        <header class="page-header ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">${langMode === 'english' ? 'Program Overview' : 'نظرة عامة على البرنامج'}</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ${langMode === 'english' ? 'ltr' : 'ltr'}">${getVal(dict.page2.title, true)}<span class="orange-dot">?</span></h2>
        
        <div class="intro-lead">
          ${getVal(dict.page2.lead)}
        </div>

        <p class="body-p">
          ${getVal(dict.page2.body)}
        </p>

        <div class="highlight-card">
          <div class="highlight-title">${getVal(dict.page2.point1Title, true)}</div>
          <p class="body-p" style="margin-bottom: 0;">
            ${getVal(dict.page2.point1Desc)}
          </p>
        </div>

        <div class="highlight-card">
          <div class="highlight-title">${getVal(dict.page2.point2Title, true)}</div>
          <p class="body-p" style="margin-bottom: 0;">
            ${getVal(dict.page2.point2Desc)}
          </p>
        </div>

        <div class="highlight-card">
          <div class="highlight-title">${getVal(dict.page2.point3Title, true)}</div>
          <p class="body-p" style="margin-bottom: 0;">
            ${getVal(dict.page2.point3Desc)}
          </p>
        </div>

        <!-- Jump Athlete Silhouette Watermark (Thin smooth line-art style) -->
        <div class="jump-silhouette-container">
          <svg class="jump-silhouette" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 7.5v6.5M8 11.5l4-2.5 4 2.5M7 21.5c1.5-2 3.5-3 5-3s3.5 1 5 3" />
          </svg>
        </div>

        ${getFooterHTML(2)}
      </section>

      <!-- PAGE 3: TRAINING PHILOSOPHY -->
      <section class="page ${langMode === 'english' ? 'ltr' : 'rtl'}">
        <header class="page-header ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">${langMode === 'english' ? 'Training Philosophy' : 'فلسفة التدريب الرياضي'}</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ${langMode === 'english' ? 'ltr' : 'ltr'}">${getVal(dict.page3.title, true)}<span class="orange-dot">.</span></h2>

        <div class="intro-lead">
          ${getVal(dict.page3.lead)}
        </div>

        <div class="rules-list">
          <div class="rule-item">
            <div class="rule-number">01</div>
            <div class="rule-content">
              <h3 class="rule-title">${getVal(dict.page3.rule1Title, true)}</h3>
              <p class="rule-desc">
                ${getVal(dict.page3.rule1Desc)}
              </p>
            </div>
          </div>

          <div class="rule-item">
            <div class="rule-number">02</div>
            <div class="rule-content">
              <h3 class="rule-title">${getVal(dict.page3.rule2Title, true)}</h3>
              <p class="rule-desc">
                ${getVal(dict.page3.rule2Desc)}
              </p>
            </div>
          </div>

          <div class="rule-item">
            <div class="rule-number">03</div>
            <div class="rule-content">
              <h3 class="rule-title">${getVal(dict.page3.rule3Title, true)}</h3>
              <p class="rule-desc">
                ${getVal(dict.page3.rule3Desc)}
              </p>
            </div>
          </div>
        </div>

        <!-- Jump Athlete Silhouette Watermark (Thin smooth line-art style) -->
        <div class="jump-silhouette-container" style="margin-top: 15px;">
          <svg class="jump-silhouette" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 7.5v6.5M8 11.5l4-2.5 4 2.5M7 21.5c1.5-2 3.5-3 5-3s3.5 1 5 3" />
          </svg>
        </div>

        ${getFooterHTML(3)}
      </section>

      <!-- DYNAMIC ACTIVE TRAINING DAY PAGES (1 page per active day, 2-column exercise grid) -->
      ${activeDaysPagesHtml}

      <!-- FINAL PAGE: PROTOCOLS & WEEKLY LOAD SUMMARY DASHBOARD -->
      <section class="page ${langMode === 'english' ? 'ltr' : 'rtl'}">
        <header class="page-header ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">${langMode === 'english' ? 'Protocols' : 'البروتوكولات والمتابعة'}</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ${langMode === 'english' ? 'ltr' : 'ltr'}">${getVal(dict.page5.title, true)}<span class="orange-dot">.</span></h2>

        <!-- Dashboard Layout: 2 Columns side-by-side -->
        <div class="protocols-grid ltr">
          
          <!-- Left Column: Nutrition & Macronutrients -->
          <div class="protocols-left ${langMode === 'english' ? 'ltr' : 'rtl'}">
            <div class="intro-lead" style="margin-bottom: 12px;">
              ${getVal(dict.page5.lead)}
            </div>
            
            <p class="body-p" style="margin-bottom: 14px;">
              <strong>${getVal(dict.page5.nutritionTitle, true)}:</strong> ${getVal(dict.page5.nutritionDesc)}
            </p>

            <div class="highlight-card" style="padding: 16px; margin-bottom: 0;">
              <div class="highlight-title" style="font-size: 13.5px;">${getVal(dict.page5.macroTitle, true)}</div>
              <p class="body-p" style="margin-bottom: 0; font-size: 11.5px; line-height: 1.4;">
                ${getVal(dict.page5.macroDesc)}
              </p>
            </div>
          </div>

          <!-- Right Column: Check-ins & Weekly Load Profile -->
          <div class="protocols-right ${langMode === 'english' ? 'ltr' : 'rtl'}">
            <div class="highlight-card" style="border-left: 4px solid ${T.primary}; padding: 16px; margin-bottom: 0;">
              <div class="highlight-title" style="color: ${T.primary}; font-size: 13.5px;">${getVal(dict.page5.checkinTitle, true)}</div>
              <p class="body-p" style="margin-bottom: 0; font-size: 11px; color: ${T.text}; font-weight: 600; line-height: 1.4;">
                ${getVal(dict.page5.checkinDesc)}
              </p>
            </div>

            <!-- Weekly Summary Card -->
            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-name">${langMode === 'english' ? 'WEEKLY LOAD PROFILE' : 'ملخص الحمل الأسبوعي'}</span>
              </div>
              <div class="summary-body">
                <div class="summary-stat-row">
                  <span>${langMode === 'english' ? 'Active Training Days' : 'أيام التدريب الفعالة'}</span>
                  <strong>${totalActive} / 7 Days</strong>
                </div>
                <div class="summary-stat-row">
                  <span>${langMode === 'english' ? 'Total Exercises' : 'إجمالي عدد التمارين'}</span>
                  <strong>${DAYS_OF_WEEK.reduce((acc, d) => acc + (schedule[d]?.length || 0), 0)} Drills</strong>
                </div>
                <div class="summary-stat-row">
                  <span>${langMode === 'english' ? 'Target Athlete Level' : 'مستوى اللاعب المستهدف'}</span>
                  <strong class="text-orange">Elite Athletics</strong>
                </div>
                <div class="summary-advice">
                  ${langMode === 'english' 
                    ? `💡 <strong>Coach Note:</strong> Focus on proper movement mechanics, record your working sets for technique verification, and communicate any fatigue fluctuations immediately.`
                    : `💡 <strong>ملاحظة الكوتش:</strong> التزم التكنيك الفني الصحيح لكل تمرين وسجل مجموعاتك الأساسية للتعديل والمتابعة. تواصل مع المدرب في حال وجود أي استفسار.`}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Jump Athlete Silhouette Watermark (Thin smooth line-art style) -->
        <div class="jump-silhouette-container" style="margin-top: 15px; margin-bottom: 10px;">
          <svg class="jump-silhouette" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 80px; height: 80px;">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 7.5v6.5M8 11.5l4-2.5 4 2.5M7 21.5c1.5-2 3.5-3 5-3s3.5 1 5 3" />
          </svg>
        </div>

        <!-- Side-by-Side Signature Block (Page 6) - Strictly in English -->
        <div class="signature-row ltr">
          <div class="signature-col">
            <div class="signature-line"></div>
            <div class="signature-text">Coach Mahmoud Ali</div>
            <div class="signature-title">PEAK FORCE Head Coach</div>
          </div>
          <div class="signature-col">
            <div class="signature-line"></div>
            <div class="signature-text">Coach Mostafa Ali</div>
            <div class="signature-title">PEAK FORCE Assistant Coach</div>
          </div>
        </div>

        ${getFooterHTML(totalPages)}
      </section>

    </body>
    </html>
  `;

  // Create UTF-8 HTML Blob to ensure perfect character rendering and link behavior
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
