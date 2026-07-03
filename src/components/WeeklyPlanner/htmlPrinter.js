/**
 * HTML Print Engine for ForcePeak Weekly Planner.
 * Generates a high-fidelity print layout in a new tab using native browser printing,
 * ensuring 100% clickable links, perfect Arabic font shaping, and zero PDF character corruption.
 */
export function generateWeeklyHTMLPrint({ 
  schedule, 
  dayTitles, 
  weekDatesFull, 
  selectedAthlete, 
  calculateDayVolume, 
  orientation = 'portrait', 
  theme = 'crimson' 
}) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const athleteName = selectedAthlete ? selectedAthlete.name : 'Elite Athlete';
  const dateStart = weekDatesFull[0] ? new Date(weekDatesFull[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const dateEnd = weekDatesFull[6] ? new Date(weekDatesFull[6]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Theme Styles Config
  const themes = {
    crimson: {
      primary: '#be184a',
      accent: '#e11d48',
      bg: '#ffffff',
      text: '#0f172a',
      cardBg: '#fff1f2',
      border: '#ffe4e6',
      muted: '#64748b'
    },
    navy: {
      primary: '#1e3a8a',
      accent: '#3b82f6',
      bg: '#ffffff',
      text: '#0f172a',
      cardBg: '#f0f9ff',
      border: '#e0f2fe',
      muted: '#64748b'
    },
    green: {
      primary: '#14532d',
      accent: '#10b981',
      bg: '#ffffff',
      text: '#0f172a',
      cardBg: '#f0fdf4',
      border: '#dcfce7',
      muted: '#64748b'
    },
    minimal: {
      primary: '#1e293b',
      accent: '#475569',
      bg: '#ffffff',
      text: '#0f172a',
      cardBg: '#f8fafc',
      border: '#e2e8f0',
      muted: '#64748b'
    },
    dark: {
      primary: '#f1f5f9',
      accent: '#f97316',
      bg: '#0f172a',
      text: '#f1f5f9',
      cardBg: '#1e293b',
      border: '#334155',
      muted: '#94a3b8'
    }
  };

  const T = themes[theme] || themes.crimson;

  // Category border accent colors mapping
  const getCategoryColor = (type) => {
    const types = {
      strength: T.primary,
      power: T.accent,
      core: '#8b5cf6',
      mobility: '#ef4444',
      isometric: '#f97316',
      physical: T.muted,
      speed: '#10b981',
      endurance: '#14b8a6'
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

  // Build Day Cards HTML
  let daysHtml = '';
  DAYS_OF_WEEK.forEach((day, dayIdx) => {
    const drills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIdx] ? new Date(weekDatesFull[dayIdx]) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : day;
    const dayTitle = dayTitles[day] || 'Training Protocol';
    const dayVolume = calculateDayVolume(drills);

    let drillsHtml = '';
    if (drills.length === 0) {
      drillsHtml = `
        <div class="empty-state">
          <div class="empty-title">REST & ACTIVE RECOVERY</div>
          <div class="empty-desc">No formal drills scheduled. Prioritize sleep, hydration, and recovery.</div>
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

        // Extract and clean notes to prevent quotes escaping bugs
        let cleanNotes = drill.details ? drill.details.trim() : '';
        // If notes contain double quotes, clean them for rendering
        if (cleanNotes.startsWith('"') && cleanNotes.endsWith('"')) {
          cleanNotes = cleanNotes.substring(1, cleanNotes.length - 1);
        }

        drillsHtml += `
          <div class="drill-card" style="border-left: 5px solid ${catColor}">
            <div class="drill-header">
              <span class="drill-index" style="background-color: ${catColor}">${index + 1}</span>
              <div class="drill-title-area">
                <span class="drill-title">${drill.title || 'Unnamed Exercise'}</span>
                ${drill.video_url ? `<a href="${drill.video_url.trim()}" target="_blank" class="video-link">🎥 Link</a>` : ''}
              </div>
              <span class="drill-category" style="color: ${catColor}; border: 1px solid ${catColor}40">${catLabel}</span>
            </div>
            
            <div class="drill-params">
              <div class="param-badge"><strong>${drill.sets || '-'}</strong> Sets</div>
              <div class="param-badge"><strong>${repsVal || '-'}${unitStr}</strong> Volume</div>
              <div class="param-badge"><strong>${intensityVal || '-'}</strong> Intensity</div>
              ${drill.rest ? `<div class="param-badge">⏱ <strong>${drill.rest}</strong> Rest</div>` : ''}
              ${drill.tempo ? `<div class="param-badge font-mono text-[10px]">T: <strong>${drill.tempo}</strong></div>` : ''}
              ${drill.focus ? `<div class="param-badge text-rose-500 font-bold">${drill.focus}</div>` : ''}
            </div>

            ${cleanNotes ? `<div class="drill-notes">${cleanNotes}</div>` : ''}
          </div>
        `;
      });
    }

    daysHtml += `
      <div class="day-card">
        <div class="day-header">
          <div>
            <h2 class="day-name">${day.toUpperCase()}</h2>
            <div class="day-date">${formattedDate}</div>
          </div>
          <div class="day-stats">${dayVolume.totalVolumeScore} pts Load</div>
        </div>
        <div class="day-focus"><span>FOCUS:</span> ${dayTitle.toUpperCase()}</div>
        <div class="drills-container">
          ${drillsHtml}
        </div>
      </div>
    `;
  });

  // Prepare full HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>ForcePeak Weekly Plan - ${athleteName}</title>
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
          padding: 30px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Header Styles */
        .brand-header {
          border-bottom: 3px double ${T.primary};
          padding-bottom: 16px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .brand-title-area {
          text-align: left;
        }
        .brand-title {
          font-size: 22px;
          font-weight: 900;
          color: ${T.primary};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          line-height: 1;
        }
        .brand-subtitle {
          font-size: 11px;
          font-weight: 800;
          color: ${T.accent};
          letter-spacing: 2px;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .athlete-info {
          text-align: right;
        }
        .athlete-name {
          font-size: 18px;
          font-weight: 900;
          color: ${T.primary};
          text-transform: uppercase;
        }
        .plan-date {
          font-size: 12px;
          color: ${T.muted};
          font-weight: 700;
          margin-top: 2px;
        }

        /* Layout Grids */
        .print-layout {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .day-card {
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 20px;
          padding: 24px;
          break-inside: avoid;
          page-break-inside: avoid;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.03);
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid ${T.border};
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .day-name {
          font-size: 22px;
          font-weight: 900;
          color: ${T.primary};
          letter-spacing: 0.5px;
        }
        .day-date {
          font-size: 12px;
          color: ${T.muted};
          font-weight: 700;
          margin-top: 2px;
        }
        .day-stats {
          font-size: 11px;
          font-weight: 900;
          background-color: ${T.cardBg};
          color: ${T.primary};
          padding: 5px 12px;
          border-radius: 30px;
          border: 1.5px solid ${T.border};
          text-transform: uppercase;
        }
        .day-focus {
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 20px;
          background: ${T.cardBg};
          padding: 8px 16px;
          border-radius: 12px;
          color: ${T.text};
          border: 1px solid ${T.border}80;
        }
        .day-focus span {
          color: ${T.accent};
          margin-right: 6px;
          font-weight: 900;
        }

        .drills-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Drill Card Styles */
        .drill-card {
          background-color: ${T.cardBg};
          border: 1px solid ${T.border};
          border-radius: 14px;
          padding: 16px;
        }
        .drill-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .drill-index {
          font-size: 11px;
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
        .drill-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-grow: 1;
        }
        .drill-title {
          font-size: 14px;
          font-weight: 900;
          color: ${T.text};
        }
        .video-link {
          font-size: 11px;
          color: #0066cc;
          text-decoration: none;
          font-weight: 800;
          border: 1px solid #0066cc30;
          padding: 2px 8px;
          border-radius: 6px;
          background-color: #0066cc08;
          transition: all 0.2s;
        }
        .video-link:hover {
          background-color: #0066cc15;
        }
        .drill-category {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 8px;
          background-color: ${T.bg};
        }

        .drill-params {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .param-badge {
          font-size: 11px;
          background-color: ${T.bg};
          border: 1px solid ${T.border};
          padding: 4px 10px;
          border-radius: 8px;
          color: ${T.text};
          font-weight: 600;
        }
        .param-badge strong {
          color: ${T.accent};
          font-weight: 800;
        }

        .drill-notes {
          font-size: 12px;
          font-style: italic;
          color: ${T.text};
          background-color: ${T.bg};
          border: 1px solid ${T.border}80;
          padding: 10px 14px;
          border-radius: 10px;
          margin-top: 8px;
          white-space: pre-line;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 30px;
          border: 2px dashed ${T.border};
          border-radius: 16px;
          background-color: ${T.cardBg}40;
        }
        .empty-title {
          font-size: 13px;
          font-weight: 900;
          color: ${T.muted};
        }
        .empty-desc {
          font-size: 11px;
          color: ${T.muted};
          margin-top: 6px;
        }

        /* Landscape Specific CSS Overrides */
        ${orientation === 'landscape' ? `
          body {
            padding: 15px;
          }
          .brand-header {
            margin-bottom: 16px;
            padding-bottom: 8px;
          }
          .print-layout {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 10px;
          }
          .day-card {
            padding: 12px;
            border-radius: 14px;
          }
          .day-header {
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .day-name {
            font-size: 16px;
          }
          .day-date {
            font-size: 9.5px;
          }
          .day-stats {
            font-size: 9px;
            padding: 2px 6px;
          }
          .day-focus {
            font-size: 9.5px;
            padding: 5px 8px;
            margin-bottom: 12px;
          }
          .drills-container {
            gap: 8px;
          }
          .drill-card {
            padding: 10px;
            border-radius: 10px;
          }
          .drill-header {
            gap: 6px;
            margin-bottom: 6px;
          }
          .drill-index {
            width: 16px;
            height: 16px;
            font-size: 9.5px;
          }
          .drill-title {
            font-size: 11.5px;
            line-height: 1.2;
          }
          .video-link {
            font-size: 9.5px;
            padding: 1px 4px;
          }
          .drill-category {
            display: none;
          }
          .drill-params {
            gap: 4px;
            margin-bottom: 4px;
          }
          .param-badge {
            font-size: 9.5px;
            padding: 2px 5px;
            border-radius: 6px;
          }
          .drill-notes {
            font-size: 10.5px;
            padding: 6px 8px;
            border-radius: 8px;
          }
        ` : ''}

        /* Browser Print Setup */
        @media print {
          body {
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .day-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
          }
          .drill-card {
            border: 1px solid #e2e8f0 !important;
          }
          @page {
            size: a4 ${orientation === 'landscape' ? 'landscape' : 'portrait'};
            margin: 8mm;
          }
        }
      </style>
    </head>
    <body>
      <header class="brand-header">
        <div class="brand-title-area">
          <h1 class="brand-title">PEAK FORCE LAB</h1>
          <div class="brand-subtitle">ATHLETE PASS // WEEKLY BLUEPRINT</div>
        </div>
        <div class="athlete-info">
          <div class="athlete-name">${athleteName.toUpperCase()}</div>
          <div class="plan-date">${dateStart} - ${dateEnd}</div>
        </div>
      </header>

      <main class="print-layout">
        ${daysHtml}
      </main>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  // Create UTF-8 HTML Blob to ensure perfect Arabic shaping and character rendering
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
