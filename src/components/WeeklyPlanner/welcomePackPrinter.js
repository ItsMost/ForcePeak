/**
 * Welcome Pack HTML Print Engine for ForcePeak Weekly Planner.
 * Generates a premium 6-page athletic coaching welcome pack using a gritty, modern dark-mode style
 * with athletic orange accents, 100% clickable links, and perfect bilingual/multilingual font rendering.
 * Splits the workout blueprint across 2 pages in a highly readable 2-column grid layout.
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

  const getCategoryLabel = (type) => {
    const t = (typeof type === 'string') ? type.toLowerCase() : 'physical';
    const labels = {
      strength: 'STRENGTH',
      power: 'PLYOS',
      core: 'CORE',
      mobility: 'MOBILITY',
      isometric: 'ISOMETRIC',
      physical: 'PHYSICAL',
      speed: 'SPEED',
      endurance: 'ENDURANCE'
    };
    return labels[t] || 'DRILL';
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
      rule3Title: { en: 'Strict Consistency & Effort', ar: 'الالتزام التام وبذل أقصى جهد' },
      rule3Desc: {
        en: 'Missed sessions break the adaptive chain. Every session, set, and rep must be executed with maximal intent. Moving a light weight with explosive velocity trains the nervous system; moving it slowly does not. Consistency is the foundation of peak physical performance.',
        ar: 'الغياب أو التهاون يقطع سلسلة التكيف البدني. كل تكرار وكل مجموعة يجب أن تؤدى بأقصى سرعة وقوة تفجيرية لتدريب الجهاز العصبي بكفاءة. الالتزام المستمر هو الأساس لبناء بطل رياضي.'
      }
    },
    page4: {
      title: { en: 'Weekly Workout Blueprint - Part I', ar: 'مخطط التدريب الأسبوعي - الجزء الأول' },
      title2: { en: 'Weekly Workout Blueprint - Part II', ar: 'مخطط التدريب الأسبوعي - الجزء الثاني' },
      lead: {
        en: 'Your current customized schedule and training layout. Check the video links for demonstrations.',
        ar: 'جدولك التدريبي الحالي والمخصص. اضغط على روابط الفيديو لمشاهدة شرح التمارين وتكنيك الحركة.'
      },
      days: {
        Saturday: { en: 'SATURDAY', ar: 'السبت' },
        Sunday: { en: 'SUNDAY', ar: 'الأحد' },
        Monday: { en: 'MONDAY', ar: 'الإثنين' },
        Tuesday: { en: 'TUESDAY', ar: 'الثلاثاء' },
        Wednesday: { en: 'WEDNESDAY', ar: 'الأربعاء' },
        Thursday: { en: 'THURSDAY', ar: 'الخميس' },
        Friday: { en: 'FRIDAY', ar: 'الجمعة' }
      },
      rest: { en: 'REST & ACTIVE RECOVERY', ar: 'راحة واستشفاء نشط' },
      breakdownTitle: { en: 'Weekly Schedule Breakdown', ar: 'تفاصيل المخطط التدريبي الأسبوعي' },
      breakdownDesc: {
        en: '<strong>Days 1-2:</strong> Explosive Power & Max Strength (Neuromuscular development).<br/><strong>Day 3:</strong> Active Recovery & Mobility (Tissue adaptation).<br/><strong>Days 4-5:</strong> Vertical Jump Development & Accessory Work (Reactive strength).',
        ar: '<strong>الأيام 1-2:</strong> القدرة التفجيرية والقوة القصوى (تطوير الجهاز العصبي العضلي).<br/><strong>اليوم 3:</strong> استشفاء نشط ومرونة حركية (تهيئة الأنسجة).<br/><strong>الأيام 4-5:</strong> تطوير القفز العمودي والتمارين المساعدة (القوة التفاعلية).'
      }
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
      },
      aiPromptLabel: { en: 'Visual Design Prompt (Midjourney / DALL-E):', ar: 'مساعد التصميم البصري (Midjourney / DALL-E):' }
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

  // Helper to render a day card inside the 2-column print grid
  const renderDayCardHTML = (day, dayIdx) => {
    const drills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIdx] ? new Date(weekDatesFull[dayIdx]) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
    const dayTitle = dayTitles[day] || 'Training Protocol';
    const dayVolume = calculateDayVolume(drills);

    let drillsHtml = '';
    if (drills.length === 0) {
      drillsHtml = `
        <div class="empty-state">
          <div class="empty-title">${dict.page4.rest[langMode === 'english' ? 'en' : 'ar']}</div>
        </div>
      `;
    } else {
      drills.forEach((drill, index) => {
        if (!drill) return;
        const catColor = getCategoryColor(drill.type || 'physical');
        const catLabel = getCategoryLabel(drill.type || 'physical');
        const drillUnit = typeof drill.unit === 'string' ? drill.unit : '';
        const isMeters = drillUnit.toLowerCase() === 'meters';
        const repsVal = isMeters ? drill.distance : drill.reps;
        
        let unitStr = '';
        if (drillUnit) {
          const u = drillUnit.toLowerCase();
          if (u === 'meters') unitStr = 'm';
          else if (u === 'sec') unitStr = 's';
          else if (u === 'min') unitStr = 'm';
          else if (u === 'jumps') unitStr = 'j';
        }

        const intensityVal = drill.percentage ? `@${drill.percentage}%` : '';

        // Clean double quotes safely
        let cleanNotes = drill.details ? String(drill.details).trim() : '';
        if (cleanNotes.startsWith('"') && cleanNotes.endsWith('"')) {
          cleanNotes = cleanNotes.substring(1, cleanNotes.length - 1);
        }

        drillsHtml += `
          <div class="drill-card" style="border-left: 4px solid ${catColor}">
            <div class="drill-header">
              <span class="drill-index" style="background-color: ${catColor}">${index + 1}</span>
              <span class="drill-title">${drill.title || 'Unnamed Exercise'}</span>
              ${drill.video_url ? `<a href="${drill.video_url.trim()}" target="_blank" class="video-link">Link</a>` : ''}
            </div>
            
            <div class="drill-params">
              ${drill.sets ? `<div class="param-badge"><strong>${drill.sets}</strong> Sets</div>` : ''}
              ${repsVal ? `<div class="param-badge"><strong>${repsVal}${unitStr}</strong> Vol</div>` : ''}
              ${intensityVal ? `<div class="param-badge text-orange"><strong>${intensityVal}</strong></div>` : ''}
              ${drill.rest ? `<div class="param-badge">⏱ <strong>${drill.rest}</strong></div>` : ''}
              ${drill.tempo ? `<div class="param-badge">T: <strong>${drill.tempo}</strong></div>` : ''}
              ${drill.focus ? `<div class="param-badge text-rose-500 font-bold">${drill.focus}</div>` : ''}
            </div>

            ${cleanNotes ? `<div class="drill-notes">${cleanNotes}</div>` : ''}
          </div>
        `;
      });
    }

    const dayNameTranslated = dict.page4.days[day][langMode === 'english' ? 'en' : 'ar'];

    return `
      <div class="day-card">
        <div class="day-card-header">
          <div>
            <h3 class="day-card-name">${dayNameTranslated.toUpperCase()}</h3>
            <span class="day-card-date">${formattedDate}</span>
          </div>
          <span class="day-card-load">${dayVolume.totalVolumeScore} Load</span>
        </div>
        <div class="day-card-focus"><span>FOCUS:</span> ${dayTitle.toUpperCase()}</div>
        <div class="day-card-drills">
          ${drillsHtml}
        </div>
      </div>
    `;
  };

  // Prepare full 6-page HTML content
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

        /* 6-Page Grid Layout */
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm;
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
          font-size: 13px;
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
          font-size: 14px;
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
          font-size: 15px;
          font-weight: 800;
          color: ${T.text};
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .rule-content .rule-desc {
          font-size: 12px;
          color: ${T.muted};
        }

        /* Blueprint 2-Column Grid (Page 4 & 5) */
        .blueprint-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          flex: 1;
        }
        .day-card {
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .day-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid ${T.border};
          padding-bottom: 6px;
        }
        .day-card-name {
          font-size: 16px;
          font-weight: 900;
          color: ${T.primary};
          letter-spacing: 0.5px;
        }
        .day-card-date {
          font-size: 10px;
          color: ${T.muted};
          font-weight: 700;
          margin-left: 6px;
        }
        .day-card-load {
          font-size: 9px;
          font-weight: 900;
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          color: ${T.primary};
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .day-card-focus {
          font-size: 9.5px;
          font-weight: 800;
          background-color: ${T.bg};
          border: 1px solid ${T.border}80;
          padding: 4px 10px;
          border-radius: 8px;
          color: ${T.text};
        }
        .day-card-focus span {
          color: ${T.primary};
          font-weight: 900;
          margin-right: 4px;
        }
        .day-card-drills {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .drill-card {
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .drill-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .drill-index {
          font-size: 9.5px;
          font-weight: 950;
          color: #ffffff;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .drill-title {
          font-size: 12px;
          font-weight: 900;
          color: ${T.text};
          flex-grow: 1;
          word-break: break-word; /* Let name wrap naturally without clipping! */
        }
        .video-link {
          font-size: 9px;
          color: ${T.primary};
          text-decoration: none;
          font-weight: 800;
          border: 1px solid ${T.primary}40;
          padding: 1px 6px;
          border-radius: 4px;
          background-color: ${T.primary}08;
          flex-shrink: 0;
        }
        .video-link:hover {
          background-color: ${T.primary}15;
        }
        .drill-params {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .param-badge {
          font-size: 9.5px;
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          padding: 2px 6px;
          border-radius: 5px;
          color: ${T.text};
          font-weight: 600;
        }
        .param-badge strong {
          color: ${T.accent};
        }
        .drill-notes {
          font-size: 10px;
          font-style: italic;
          color: ${T.muted};
          border-top: 1px dashed ${T.border};
          padding-top: 4px;
          line-height: 1.4;
          white-space: pre-line;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed ${T.border};
          border-radius: 10px;
          padding: 24px;
          background-color: ${T.bg}20;
        }
        .empty-title {
          font-size: 10px;
          font-weight: 900;
          color: ${T.muted};
          text-align: center;
        }

        /* Weekly Summary Card (Page 5 slot 4) */
        .summary-card {
          border: 1.5px dashed ${T.primary}60;
        }
        .summary-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .summary-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          border-bottom: 1px solid ${T.border};
          padding-bottom: 6px;
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
          font-size: 10px;
          line-height: 1.4;
          color: ${T.muted};
          background-color: ${T.bg};
          padding: 10px;
          border-radius: 8px;
          border: 1px solid ${T.border}80;
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

        /* Midjourney Image Generation Info Block */
        .ai-prompt-box {
          background-color: ${T.bg};
          border: 1px dashed ${T.primary};
          border-radius: 12px;
          padding: 15px;
          margin-top: 20px;
          font-family: monospace;
          font-size: 10px;
          color: ${T.muted};
          word-break: break-all;
        }
        .ai-prompt-box strong {
          color: ${T.primary};
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
            height: 297mm;
            padding: 20mm 15mm;
            border-bottom: none;
          }
          .day-card {
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
              <span class="meta-val">Coach MemoB</span>
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
        <div class="page-footer ${coverLang === 'ar' ? 'rtl' : 'ltr'}">
          <span>${coverLang === 'ar' ? 'بييك فورس للأداء الرياضي' : 'Peak Force Performance'}</span>
          <span>Page 1 of 6</span>
        </div>
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

        <div class="page-footer ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <span>${langMode === 'english' ? 'Peak Force Performance' : 'بييك فورس للأداء الرياضي'}</span>
          <span>Page 2 of 6</span>
        </div>
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

        <div class="page-footer ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <span>${langMode === 'english' ? 'Peak Force Performance' : 'بييك فورس للأداء الرياضي'}</span>
          <span>Page 3 of 6</span>
        </div>
      </section>

      <!-- PAGE 4: WEEKLY SCHEDULE - PART I (SATURDAY TO TUESDAY) -->
      <section class="page">
        <header class="page-header ltr">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Weekly Blueprint // Part I</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ltr">${getVal(dict.page4.title, true)}<span class="orange-dot">.</span></h2>
        
        <div class="intro-lead ${langMode === 'english' ? 'ltr' : 'rtl'}">
          ${getVal(dict.page4.lead)}
        </div>

        <!-- 2-Column Spacious Grid for Saturday to Tuesday -->
        <div class="blueprint-grid ltr">
          ${renderDayCardHTML('Saturday', 0)}
          ${renderDayCardHTML('Sunday', 1)}
          ${renderDayCardHTML('Monday', 2)}
          ${renderDayCardHTML('Tuesday', 3)}
        </div>

        <div class="page-footer ltr">
          <span>Peak Force Performance</span>
          <span>Page 4 of 6</span>
        </div>
      </section>

      <!-- PAGE 5: WEEKLY SCHEDULE - PART II (WEDNESDAY TO FRIDAY + WEEK SUMMARY) -->
      <section class="page">
        <header class="page-header ltr">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Weekly Blueprint // Part II</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ltr">${getVal(dict.page4.title2, true)}<span class="orange-dot">.</span></h2>

        <!-- 2-Column Spacious Grid for Wednesday to Friday + Summary Slot -->
        <div class="blueprint-grid ltr">
          ${renderDayCardHTML('Wednesday', 4)}
          ${renderDayCardHTML('Thursday', 5)}
          ${renderDayCardHTML('Friday', 6)}
          
          <!-- Summary Card in Slot 4 -->
          <div class="day-card summary-card">
            <div class="day-card-header">
              <span class="day-card-name">${langMode === 'english' ? 'WEEKLY LOAD PROFILE' : 'ملخص الحمل الأسبوعي'}</span>
            </div>
            <div class="summary-body">
              <div class="summary-stat-row">
                <span>${langMode === 'english' ? 'Scheduled Days' : 'أيام التدريب المبرمجة'}</span>
                <strong>${DAYS_OF_WEEK.filter(d => schedule[d]?.length > 0).length} / 7 Days</strong>
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
                  ? `💡 <strong>Coach Note:</strong> Focus on video cues and auto-regulation. Ensure proper recovery window between explosive plyo blocks and maximum strength sets.`
                  : `💡 <strong>ملاحظة الكوتش:</strong> ركز على أداء التمارين بأقصى قدرة تفجيرية وصور مجموعاتك الفعالة. حافظ على فترات الراحة بين المجموعات لضمان التكيف العصبي الكامل.`}
              </div>
            </div>
          </div>
        </div>

        <div class="page-footer ltr">
          <span>Peak Force Performance</span>
          <span>Page 5 of 6</span>
        </div>
      </section>

      <!-- PAGE 6: CHECK-IN & NUTRITION -->
      <section class="page ${langMode === 'english' ? 'ltr' : 'rtl'}">
        <header class="page-header ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">${langMode === 'english' ? 'Protocols' : 'البروتوكولات والمتابعة'}</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title ${langMode === 'english' ? 'ltr' : 'ltr'}">${getVal(dict.page5.title, true)}<span class="orange-dot">.</span></h2>

        <div class="intro-lead">
          ${getVal(dict.page5.lead)}
        </div>

        <p class="body-p">
          <strong>${getVal(dict.page5.nutritionTitle, true)}:</strong> ${getVal(dict.page5.nutritionDesc)}
        </p>

        <div class="highlight-card">
          <div class="highlight-title">${getVal(dict.page5.macroTitle, true)}</div>
          <p class="body-p" style="margin-bottom: 0; font-size: 11.5px;">
            ${getVal(dict.page5.macroDesc)}
          </p>
        </div>

        <div class="highlight-card" style="border-left: 4px solid ${T.primary};">
          <div class="highlight-title" style="color: ${T.primary};">${getVal(dict.page5.checkinTitle, true)}</div>
          <p class="body-p" style="margin-bottom: 0; font-size: 11.5px; color: ${T.text}; font-weight: 600;">
            ${getVal(dict.page5.checkinDesc)}
          </p>
        </div>

        <!-- AI Image Generation Prompt Box (Page 6 Footer Area, prompt remains in English for Midjourney) -->
        <div class="ai-prompt-box ltr">
          <strong>${dict.page5.aiPromptLabel[langMode === 'english' ? 'en' : 'ar']}</strong><br/>
          A highly professional A4 PDF page design for a sports coaching welcome pack titled "PEAK FORCE", athletic and aggressive style, dark charcoal grey background with vibrant athletic orange accents, bold modern typography, minimal layout, biomechanics and sports performance theme, UI/UX editorial design, 8k resolution, photorealistic --ar 1:1.41
        </div>

        <div class="page-footer ${langMode === 'english' ? 'ltr' : 'rtl'}">
          <span>${langMode === 'english' ? 'Peak Force Performance' : 'بييك فورس للأداء الرياضي'}</span>
          <span>Page 6 of 6</span>
        </div>
      </section>

    </body>
    </html>
  `;

  // Create UTF-8 HTML Blob to ensure perfect character rendering and link behavior
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
