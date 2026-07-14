/**
 * Welcome Pack HTML Print Engine for ForcePeak Weekly Planner.
 * Generates a premium 5-page athletic coaching welcome pack using a gritty, modern dark-mode style
 * with athletic orange accents, 100% clickable links, and perfect font rendering.
 */
export function generateWelcomePackHTML({ 
  schedule, 
  dayTitles, 
  weekDatesFull, 
  selectedAthlete, 
  calculateDayVolume 
}) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const athleteName = selectedAthlete ? selectedAthlete.name : 'Elite Athlete';
  const dateStart = weekDatesFull[0] ? new Date(weekDatesFull[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const dateEnd = weekDatesFull[6] ? new Date(weekDatesFull[6]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Theme configuration (Gritty dark slate & energetic athletic orange)
  const T = {
    bg: '#1a1a1a',          // Dark charcoal grey
    cardBg: '#222222',      // Slightly lighter charcoal for cards
    border: '#333333',
    primary: '#ff6b00',     // Athletic Orange
    accent: '#f97316',
    text: '#ffffff',        // High contrast white
    muted: '#94a3b8',       // Slate 400
    gridBorder: '#444444'
  };

  // Category border colors mapping
  const getCategoryColor = (type) => {
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
    return types[type.toLowerCase()] || T.muted;
  };

  const getCategoryLabel = (type) => {
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
    return labels[type.toLowerCase()] || 'DRILL';
  };

  // Build Page 4 (Weekly Workout Blueprint Grid)
  let daysHtml = '';
  DAYS_OF_WEEK.forEach((day, dayIdx) => {
    const drills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIdx] ? new Date(weekDatesFull[dayIdx]) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) : day;
    const dayTitle = dayTitles[day] || 'Training Protocol';

    let drillsHtml = '';
    if (drills.length === 0) {
      drillsHtml = `
        <div class="empty-state">
          <div class="empty-title">REST & RECOVERY</div>
        </div>
      `;
    } else {
      drills.forEach((drill, index) => {
        const catColor = getCategoryColor(drill.type || 'physical');
        const catLabel = getCategoryLabel(drill.type || 'physical');
        const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';
        const repsVal = isMeters ? drill.distance : drill.reps;
        
        let unitStr = '';
        if (drill.unit) {
          const u = drill.unit.toLowerCase();
          if (u === 'meters') unitStr = 'm';
          else if (u === 'sec') unitStr = 's';
          else if (u === 'min') unitStr = 'm';
          else if (u === 'jumps') unitStr = 'j';
        }

        const intensityVal = drill.percentage ? `@${drill.percentage}%` : '';

        // Clean double quotes
        let cleanNotes = drill.details ? drill.details.trim() : '';
        if (cleanNotes.startsWith('"') && cleanNotes.endsWith('"')) {
          cleanNotes = cleanNotes.substring(1, cleanNotes.length - 1);
        }

        drillsHtml += `
          <div class="drill-card" style="border-left: 3px solid ${catColor}">
            <div class="drill-header">
              <span class="drill-title">${drill.title || 'Unnamed Exercise'}</span>
              ${drill.video_url ? `<a href="${drill.video_url.trim()}" target="_blank" class="video-link">Link</a>` : ''}
            </div>
            <div class="drill-params">
              ${drill.sets ? `<span>${drill.sets}s x </span>` : ''}
              ${repsVal ? `<span>${repsVal}${unitStr} </span>` : ''}
              ${intensityVal ? `<span class="text-orange">${intensityVal}</span>` : ''}
            </div>
            ${cleanNotes ? `<div class="drill-notes">${cleanNotes}</div>` : ''}
          </div>
        `;
      });
    }

    daysHtml += `
      <div class="day-column">
        <div class="day-col-header">
          <div class="day-col-name">${day.substring(0, 3).toUpperCase()}</div>
          <div class="day-col-date">${formattedDate}</div>
        </div>
        <div class="day-col-focus">${dayTitle.toUpperCase()}</div>
        <div class="day-col-drills">
          ${drillsHtml}
        </div>
      </div>
    `;
  });

  // Prepare full 5-page HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>PEAK FORCE Welcome Pack - ${athleteName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
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

        /* 5-Page Grid Layout */
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
          font-weight: 600;
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

        /* Schedule Layout Grid (Page 4) */
        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          flex: 1;
        }
        .day-column {
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .day-col-header {
          border-bottom: 1.5px solid ${T.border};
          padding-bottom: 4px;
          text-align: center;
        }
        .day-col-name {
          font-size: 12px;
          font-weight: 900;
          color: ${T.primary};
        }
        .day-col-date {
          font-size: 9px;
          color: ${T.muted};
          font-weight: 600;
        }
        .day-col-focus {
          font-size: 8px;
          font-weight: 800;
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          padding: 3px 4px;
          border-radius: 6px;
          text-align: center;
          text-transform: uppercase;
          color: ${T.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .day-col-drills {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .drill-card {
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 8px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .drill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
        }
        .drill-title {
          font-size: 10px;
          font-weight: 900;
          color: ${T.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .video-link {
          font-size: 8px;
          color: ${T.primary};
          text-decoration: underline;
          font-weight: 800;
          flex-shrink: 0;
        }
        .drill-params {
          font-size: 8.5px;
          font-weight: 700;
          color: ${T.muted};
        }
        .drill-params .text-orange {
          color: ${T.primary};
        }
        .drill-notes {
          font-size: 8px;
          font-style: italic;
          color: ${T.muted};
          border-top: 1px dashed ${T.border};
          padding-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed ${T.border};
          border-radius: 8px;
          padding: 20px 4px;
        }
        .empty-title {
          font-size: 8.5px;
          font-weight: 900;
          color: ${T.muted};
          text-align: center;
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
            background-color: #1a1a1a !important;
            color: #ffffff !important;
            padding: 0;
          }
          .page {
            width: 210mm;
            height: 297mm;
            padding: 20mm 15mm;
            border-bottom: none;
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
      <section class="page">
        <div class="cover-container">
          <div class="cover-tagline">Athletic Performance Lab</div>
          <h1 class="cover-title">PEAK FORCE</h1>
          <div class="cover-subtitle">Elite Athletic Performance & Strength Guide</div>
          
          <div class="cover-meta">
            <div class="meta-row">
              <span class="meta-label">Prepared For</span>
              <span class="meta-val orange">${athleteName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Head Coach</span>
              <span class="meta-val">Coach MemoB</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">System Blueprint</span>
              <span class="meta-val">V1.0 (Active)</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date Start</span>
              <span class="meta-val">${dateStart}</span>
            </div>
          </div>
        </div>
        <div class="page-footer">
          <span>Peak Force Performance</span>
          <span>Page 1 of 5</span>
        </div>
      </section>

      <!-- PAGE 2: ABOUT THE PROGRAM -->
      <section class="page">
        <header class="page-header">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Program Overview</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title">Who Am I & Why Are You Here<span class="orange-dot">?</span></h2>
        
        <div class="intro-lead">
          This is not a recreational gym plan. This is a biomechanically-optimized sports performance system built for elite results.
        </div>

        <p class="body-p">
          Most training regimens focus purely on vanity or basic hypertrophy. The <strong>PEAK FORCE</strong> system targets the central nervous system, muscle-tendon architecture, and raw athletic output. If you want to jump higher, sprint faster, and apply force instantly, you must train the qualities that govern those adaptations.
        </p>

        <div class="highlight-card">
          <div class="highlight-title">1. Biomechanics & Joint Integrity</div>
          <p class="body-p" style="margin-bottom: 0;">
            We align movement vectors with your specific anatomy. By training structural integrity through full range of motion and loaded mobility, we maximize force transfer while bulletproofing your joints.
          </p>
        </div>

        <div class="highlight-card">
          <div class="highlight-title">2. Rate of Force Development (RFD)</div>
          <p class="body-p" style="margin-bottom: 0;">
            Strength is useless if you cannot apply it in milliseconds. RFD dictates your explosiveness off the ground and sprint acceleration. We train the neuromuscular system to fire all motor units instantly.
          </p>
        </div>

        <div class="highlight-card">
          <div class="highlight-title">3. Measurable Performance Output</div>
          <p class="body-p" style="margin-bottom: 0;">
            We track progress using hard metrics: vertical jump height, sprint velocity, reactive strength index, and relative strength ratios. Numbers do not lie.
          </p>
        </div>

        <div class="page-footer">
          <span>Peak Force Performance</span>
          <span>Page 2 of 5</span>
        </div>
      </section>

      <!-- PAGE 3: TRAINING PHILOSOPHY -->
      <section class="page">
        <header class="page-header">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Training Philosophy</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title">The Rules of the Game<span class="orange-dot">.</span></h2>

        <div class="intro-lead">
          To achieve elite adaptations, we must follow a strict, non-negotiable set of training rules.
        </div>

        <div class="rules-list">
          <div class="rule-item">
            <div class="rule-number">01</div>
            <div class="rule-content">
              <h3 class="rule-title">Auto-regulation (RPE & RIR)</h3>
              <p class="rule-desc">
                Your body fluctuates daily based on sleep, stress, and recovery. Instead of chasing fixed numbers, we use Rate of Perceived Exertion (RPE). If you are feeling 100%, push the load. If you are fatigued, regulate the load downward. This prevents overtraining and guarantees consistent long-term progress.
              </p>
            </div>
          </div>

          <div class="rule-item">
            <div class="rule-number">02</div>
            <div class="rule-content">
              <h3 class="rule-title">Video Analysis & Cues</h3>
              <p class="rule-desc">
                You must record your working sets for primary compound movements. Form dictates muscle recruitment. Send these videos to the coach weekly. We will analyze bar speed, joint angles, and mechanical deficits to adjust your cues and program parameters.
              </p>
            </div>
          </div>

          <div class="rule-item">
            <div class="rule-number">03</div>
            <div class="rule-content">
              <h3 class="rule-title">Strict Consistency & Effort</h3>
              <p class="rule-desc">
                Missed sessions break the adaptive chain. Every session, set, and rep must be executed with maximal intent. Moving a light weight with explosive velocity trains the nervous system; moving it slowly does not. Consistency is the foundation of peak physical performance.
              </p>
            </div>
          </div>
        </div>

        <div class="page-footer">
          <span>Peak Force Performance</span>
          <span>Page 3 of 5</span>
        </div>
      </section>

      <!-- PAGE 4: WEEKLY SCHEDULE -->
      <section class="page">
        <header class="page-header">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Weekly Blueprint</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title">Weekly Workout Blueprint<span class="orange-dot">.</span></h2>
        
        <div class="intro-lead">
          Your current customized schedule and training layout. Check the video links for demonstrations.
        </div>

        <!-- Landscape grid in A4 portrait columns -->
        <div class="schedule-grid">
          ${daysHtml}
        </div>

        <div class="highlight-card" style="margin-top: 20px; padding: 12px 16px; border-radius: 12px; margin-bottom: 0;">
          <div class="highlight-title" style="font-size: 11px; margin-bottom: 4px;">Weekly Schedule Breakdown</div>
          <p class="body-p" style="font-size: 10px; margin-bottom: 0; line-height: 1.3;">
            <strong>Days 1-2:</strong> Explosive Power & Max Strength (Neuromuscular development).<br/>
            <strong>Day 3:</strong> Active Recovery & Mobility (Tissue adaptation).<br/>
            <strong>Days 4-5:</strong> Vertical Jump Development & Accessory Work (Reactive strength).
          </p>
        </div>

        <div class="page-footer">
          <span>Peak Force Performance</span>
          <span>Page 4 of 5</span>
        </div>
      </section>

      <!-- PAGE 5: CHECK-IN & NUTRITION -->
      <section class="page">
        <header class="page-header">
          <div class="header-left">
            <div class="brand">Peak Force</div>
            <div class="tag">Protocols</div>
          </div>
          <div class="header-right">${athleteName} // V1.0</div>
        </header>

        <h2 class="page-title">Nutrition & Check-In Protocol<span class="orange-dot">.</span></h2>

        <div class="intro-lead">
          Adaptation does not happen in the gym; it happens during recovery, fueled by your nutrition.
        </div>

        <p class="body-p">
          <strong>Fueling for Performance:</strong> You must treat food as fuel. To build explosive power, your muscles require carbohydrates for rapid ATP synthesis and proteins for muscle fiber repair. Maintain a clean, whole-foods diet high in micronutrients and clean hydration.
        </p>

        <div class="highlight-card">
          <div class="highlight-title">Macronutrient Guidelines</div>
          <p class="body-p" style="margin-bottom: 0; font-size: 11.5px;">
            * <strong>Protein:</strong> 2.0g per kg of bodyweight daily (essential for muscle repair).<br/>
            * <strong>Carbohydrates:</strong> 4.0g - 6.0g per kg of bodyweight (essential for glycolytic energy).<br/>
            * <strong>Fats:</strong> 1.0g per kg of bodyweight (essential for hormonal health and joint recovery).
          </p>
        </div>

        <div class="highlight-card" style="border-left: 4px solid ${T.primary};">
          <div class="highlight-title" style="color: ${T.primary};">Mandatory Friday Check-In</div>
          <p class="body-p" style="margin-bottom: 0; font-size: 11.5px; color: ${T.text}; font-weight: 600;">
            Every Friday, you must submit your weekly logs. Send video clips of your primary sets, record your bodyweight, and note your fatigue scores (1-10 CNS fatigue). Feedback and adjustments will be pushed before your Saturday workout.
          </p>
        </div>

        <!-- AI Image Generation Prompt Box (Page 5 Footer Area) -->
        <div class="ai-prompt-box">
          <strong>Visual Design Prompt (Midjourney / DALL-E):</strong><br/>
          A highly professional A4 PDF page design for a sports coaching welcome pack titled "PEAK FORCE", athletic and aggressive style, dark charcoal grey background with vibrant athletic orange accents, bold modern typography, minimal layout, biomechanics and sports performance theme, UI/UX editorial design, 8k resolution, photorealistic --ar 1:1.41
        </div>

        <div class="page-footer">
          <span>Peak Force Performance</span>
          <span>Page 5 of 5</span>
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
