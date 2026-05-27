import { jsPDF } from 'jspdf';

/**
 * Generate a clean, extremely premium, online-coaching style PDF report.
 */
export async function generateWeeklyPDF({ schedule, dayTitles, weekDatesFull, selectedAthlete, weeklyStats, calculateDayVolume, orientation = 'portrait', theme = 'crimson' }) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const doc = new jsPDF({ 
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait', 
    unit: 'mm', 
    format: 'a4' 
  });
  
  // Dynamic Cairo font loader to support Arabic unicode rendering
  let fName = 'helvetica';
  try {
    const fontUrl = 'https://fonts.gstatic.com/s/cairo/v28/SLXJ1OupThJ5Jwbfr4tU.ttf';
    const response = await fetch(fontUrl);
    if (response.ok) {
      const fontBuffer = await response.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(fontBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = window.btoa(binary);
      doc.addFileToVFS('Cairo-Regular.ttf', base64Font);
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'bold');
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'italic');
      fName = 'Cairo';
    }
  } catch (err) {
    console.error('Failed to load Arabic font Cairo:', err);
  }

  // Intercept setFont calls to transparently swap helvetica for Cairo
  const originalSetFont = doc.setFont.bind(doc);
  doc.setFont = function(fontName, fontStyle) {
    const targetFont = fontName === 'helvetica' ? fName : fontName;
    return originalSetFont(targetFont, fontStyle);
  };
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Harmonious Visual Print Themes (matched to mockup specifications)
  const THEME_COLORS = {
    crimson: {
      primary:   [190, 24, 74],      // Classic Crimson Red
      secondary: [51, 65, 85],       // Slate 700
      orange:    [225, 29, 72],       // Crimson Accent
      mid:       [100, 116, 139],     // Slate 500
      light:     [148, 163, 184],     // Slate 400
      faint:     [253, 242, 248],     // Pink/Faint
      border:    [251, 207, 232],     // Pink Border
      white:     [255, 255, 255],
      cardBg:    [255, 241, 242],     // Rose 50 Card
    },
    navy: {
      primary:   [30, 58, 138],      // Professional Navy
      secondary: [51, 65, 85],
      orange:    [59, 130, 246],     // Sky Blue Accent
      mid:       [100, 116, 139],
      light:     [148, 163, 184],
      faint:     [239, 246, 255],
      border:    [191, 219, 254],
      white:     [255, 255, 255],
      cardBg:    [240, 249, 255],
    },
    green: {
      primary:   [20, 83, 45],       // Athletic Green
      secondary: [51, 65, 85],
      orange:    [16, 185, 129],     // Emerald Accent
      mid:       [100, 116, 139],
      light:     [148, 163, 184],
      faint:     [240, 253, 244],
      border:    [187, 247, 208],
      white:     [255, 255, 255],
      cardBg:    [240, 253, 250],
    },
    minimal: {
      primary:   [30, 41, 59],       // Minimal Ink Saver (Deep slate)
      secondary: [71, 85, 105],
      orange:    [100, 116, 139],    // Ink Grey
      mid:       [100, 116, 139],
      light:     [148, 163, 184],
      faint:     [255, 255, 255],    // Plain White
      border:    [226, 232, 240],    // Slate 200 thin border
      white:     [255, 255, 255],
      cardBg:    [255, 255, 255],    // White Cards
    },
    dark: {
      primary:   [241, 245, 249],    // Elite Dark (Silver)
      secondary: [226, 232, 240],    // Slate 200
      orange:    [249, 115, 22],     // Vibrant Orange Accent
      mid:       [148, 163, 184],     // Slate 400
      light:     [100, 116, 139],     // Slate 500
      faint:     [15, 23, 42],       // Slate 900 Base Background
      border:    [51, 65, 85],       // Slate 700 Borders
      white:     [15, 23, 42],       // Slate 900
      cardBg:    [30, 41, 59],       // Slate 800 Card
    }
  };

  const C = THEME_COLORS[theme] || THEME_COLORS.crimson;

  const catColors = {
    strength:  { border: C.primary, bg: C.cardBg, label: 'STRENGTH' },
    power:     { border: C.orange,  bg: C.faint,  label: 'PLYOS' },
    core:      { border: [168, 85, 247], bg: [250, 245, 255], label: 'CORE' },
    mobility:  { border: [239, 68, 68],  bg: [254, 242, 242], label: 'MOBILITY' },
    isometric: { border: [249, 115, 22], bg: [255, 247, 237], label: 'ISOMETRIC' },
    physical:  { border: C.mid, bg: C.faint, label: 'PHYSICAL' },
    speed:     { border: [16, 185, 129], bg: [240, 253, 244], label: 'SPEED' },
    endurance: { border: [20, 184, 166], bg: [240, 253, 250], label: 'ENDURANCE' }
  };

  const safeTxt = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  const athleteName = selectedAthlete ? safeTxt(selectedAthlete.name) : 'Elite Athlete';
  const dateStart = weekDatesFull[0] ? weekDatesFull[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const dateEnd = weekDatesFull[6] ? weekDatesFull[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Apply pitch-black base if Dark mode is active
  const applyDarkBg = () => {
    if (theme === 'dark') {
      doc.setFillColor(...C.white);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
  };

  // ==================================================================
  //  A. PORTRAIT ORIENTATION: MULTI-PAGE CHRONOLOGICAL DAY CARDS
  // ==================================================================
  if (orientation === 'portrait') {
    DAYS_OF_WEEK.forEach((day, dayIndex) => {
      if (dayIndex > 0) {
        doc.addPage();
      }
      applyDarkBg();

      let y = margin;
      const dayDrills = schedule[day] || [];
      const dateObj = weekDatesFull[dayIndex];
      const fullDateStr = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
      const dayTitle = safeTxt(dayTitles[day] || 'Training Protocol');
      const dayStats = calculateDayVolume(dayDrills);

      // 1. Premium Brand Header
      doc.setFillColor(...C.primary);
      doc.rect(margin, y, contentWidth, 1.5, 'F');
      y += 6;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.primary);
      doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.orange);
      doc.text('ATHLETE PASSPORT  //  MESO-BLUEPRINT', pageWidth - margin, y, { align: 'right' });
      y += 5;

      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // 2. Day Header Block
      doc.setFillColor(...C.primary);
      doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C.white[0], C.white[1], C.white[2]);
      doc.text(day.toUpperCase(), margin + 5, y + 9.5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.light);
      doc.text(fullDateStr, pageWidth - margin - 5, y + 9.5, { align: 'right' });
      y += 20;

      // Session Focus Focus Bar
      doc.setFillColor(...C.cardBg);
      doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'F');
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.orange);
      doc.text('SESSION FOCUS:', margin + 4, y + 6);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.secondary);
      doc.text(dayTitle.toUpperCase(), margin + 34, y + 6);
      y += 14;

      // 3. Stats Dashboard
      const colWidth = contentWidth / 3;
      doc.setFillColor(...C.cardBg);
      doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'S');

      // Col 1: Volume / Drills
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text('TOTAL EXERCISES', margin + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.primary);
      doc.text(`${dayDrills.length} Drills`, margin + 6, y + 9.5);

      // Col 2: Load
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text('CALCULATED LOAD', margin + colWidth + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.primary);
      doc.text(`${dayStats.totalVolumeScore} pts`, margin + colWidth + 6, y + 9.5);

      // Col 3: Details
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text('ATHLETIC PROFILE', margin + colWidth * 2 + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.primary);
      doc.text(athleteName, margin + colWidth * 2 + 6, y + 9.5);
      y += 18;

      // 4. Drill Listing Table
      if (dayDrills.length === 0) {
        doc.setFillColor(...C.cardBg);
        doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'S');

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.mid);
        doc.text('REST & ACTIVE RECOVERY', pageWidth / 2, y + 22, { align: 'center' });

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.light);
        doc.text('No formal drills scheduled. Prioritize sleep, hydration, and gentle mobility.', pageWidth / 2, y + 31, { align: 'center' });
      } else {
        // Table Header
        doc.setFillColor(...C.primary);
        doc.rect(margin, y, contentWidth, 7, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(C.white[0], C.white[1], C.white[2]);
        doc.text('#', margin + 3, y + 4.8);
        doc.text('EXERCISE / INSTRUCTIONS', margin + 10, y + 4.8);
        doc.text('SETS', margin + 104, y + 4.8, { align: 'center' });
        doc.text('REPS/DIST', margin + 124, y + 4.8, { align: 'center' });
        doc.text('INTENSITY', margin + 148, y + 4.8, { align: 'center' });
        doc.text('REST', margin + 168, y + 4.8, { align: 'center' });
        y += 7;

        dayDrills.forEach((drill, idx) => {
          const type = (drill.type || 'physical').toLowerCase();
          const cat = catColors[type] || catColors.physical;
          const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';
          
          const titleStr = safeTxt(drill.title || 'Unnamed Drill');
          const noteStr = safeTxt(drill.details || '');

          // Wrap text parameters to prevent overlap and support full notes printing!
          const colTextWidth = 85;
          const titleLines = doc.splitTextToSize(titleStr, colTextWidth);
          const noteLines = noteStr ? doc.splitTextToSize(noteStr, colTextWidth) : [];
          
          // Calculate exact height needed for this exercise card dynamically!
          const titleHeight = titleLines.length * 4;
          const noteHeight = noteLines.length * 3.2;
          const paddingY = 6;
          const rowHeight = Math.max(12, titleHeight + (noteStr ? (noteHeight + 2) : 0) + paddingY);

          // Dynamic multi-page overflow handler per training day!
          if (y + rowHeight > pageHeight - 20) {
            doc.addPage();
            applyDarkBg();
            y = margin;

            // Re-render Brand header inside continued page
            doc.setFillColor(...C.primary);
            doc.rect(margin, y, contentWidth, 1.5, 'F');
            y += 6;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.primary);
            doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.orange);
            doc.text(`ATHLETE PASSPORT  //  ${day.toUpperCase()} CONTINUED`, pageWidth - margin, y, { align: 'right' });
            y += 5;

            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;

            // Re-render table headers
            doc.setFillColor(...C.primary);
            doc.rect(margin, y, contentWidth, 7, 'F');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(C.white[0], C.white[1], C.white[2]);
            doc.text('#', margin + 3, y + 4.8);
            doc.text('EXERCISE / INSTRUCTIONS', margin + 10, y + 4.8);
            doc.text('SETS', margin + 104, y + 4.8, { align: 'center' });
            doc.text('REPS/DIST', margin + 124, y + 4.8, { align: 'center' });
            doc.text('INTENSITY', margin + 148, y + 4.8, { align: 'center' });
            doc.text('REST', margin + 168, y + 4.8, { align: 'center' });
            y += 7;
          }

          // Render alternate zebra row background
          if (idx % 2 === 0) {
            doc.setFillColor(...C.cardBg);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
          }

          // Category border accent
          doc.setFillColor(...cat.border);
          doc.rect(margin, y, 1.2, rowHeight, 'F');

          doc.setDrawColor(...C.border);
          doc.setLineWidth(0.15);
          doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

          // Index Number
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.mid);
          doc.text(String(idx + 1), margin + 4, y + 5);

          // Draw Title Lines
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.primary);
          titleLines.forEach((tLine, tIdx) => {
            doc.text(tLine, margin + 10, y + 5 + (tIdx * 4));
          });

          // Draw FULL Exercise Notes (Absolutely no truncation, wraps perfectly!)
          if (noteStr) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...C.mid);
            noteLines.forEach((nLine, nIdx) => {
              doc.text(nLine, margin + 10, y + 5 + titleHeight + 1 + (nIdx * 3.2));
            });
          }

          // Draw Workout parameters (Sets, volume, reps, rest) centered in the middle of card
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.secondary);

          const dataY = y + (rowHeight / 2) + 1;
          doc.text(safeTxt(drill.sets) || '-', margin + 104, dataY, { align: 'center' });

          // Reps / Distance formatting
          let repVal = isMeters ? safeTxt(drill.distance) : safeTxt(drill.reps);
          let unitStr = '';
          if (drill.unit) {
            const u = drill.unit.toLowerCase();
            if (u === 'meters') unitStr = 'm';
            else if (u === 'sec') unitStr = 's';
            else if (u === 'min') unitStr = 'm';
            else if (u === 'jumps') unitStr = 'j';
          }
          doc.text(repVal ? `${repVal}${unitStr}` : '-', margin + 124, dataY, { align: 'center' });

          const pct = safeTxt(drill.percentage);
          doc.text(pct ? `${pct}%` : '-', margin + 148, dataY, { align: 'center' });

          const rest = safeTxt(drill.rest);
          doc.text(rest || '-', margin + 168, dataY, { align: 'center' });

          y += rowHeight;
        });
      }

      // 5. Coach briefs & performance tips
      const remainingY = pageHeight - y - 18;
      if (remainingY > 15) {
        y += 4;
        doc.setFillColor(...C.primary);
        doc.roundedRect(margin, y, contentWidth, Math.min(18, remainingY), 1.5, 1.5, 'F');

        doc.setFillColor(...C.orange);
        doc.rect(margin + 4, y + 4, 1.2, 10, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.orange);
        doc.text('COACH PERFORMANCE BRIEF & TIPS', margin + 8, y + 6.8);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.light);
        const coachTips = [
          'Maintain impeccable posture and structural stiffness during landing phases.',
          'Hydrate appropriately: Consume at least 500ml water with electrolytes pre-workout.',
          'Prioritize sleep hygiene: Target 8+ hours for optimal central nervous system recovery.'
        ];
        const tipIndex = (dayIndex + (dayDrills.length || 0)) % coachTips.length;
        doc.text(coachTips[tipIndex], margin + 8, y + 11.8);
      }

      // Page Footer
      doc.setFontSize(7);
      doc.setTextColor(...C.mid);
      doc.setFont('helvetica', 'normal');
      doc.text('Peak Force Lab  |  Elite Training Systems', margin, pageHeight - 8);
      doc.text(`Week Cycle: ${dateStart} - ${dateEnd}   |   Page ${dayIndex + 1} of 7`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    });
  }

  // ==================================================================
  //  B. LANDSCAPE ORIENTATION: BEAUTIFUL 7-DAY SINGLE-PAGE WEEKLY GRID
  // ==================================================================
  else {
    applyDarkBg();

    let y = margin;

    // 1. Premium Brand Header
    doc.setFillColor(...C.primary);
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.orange);
    doc.text(`ATHLETE WEEKLY BLUEPRINT  //  ${athleteName.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
    y += 5;

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Date range details bar
    doc.setFillColor(...C.cardBg);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.15);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.orange);
    doc.text('WEEKLY CYCLE:', margin + 4, y + 6.5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(`${dateStart.toUpperCase()} - ${dateEnd.toUpperCase()}`, margin + 30, y + 6.5);

    // Total stats summary on the right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.mid);
    doc.text(`WEEK VOLUME SCORE:  ${weeklyStats.load} pts   |   AVG INTENSITY:  ${weeklyStats.intensity}%   |   CNS SPLIT:  ${weeklyStats.cnsPercentage}% CNS`, pageWidth - margin - 4, y + 6.5, { align: 'right' });
    y += 15;

    // 2. Render 7 Columns Side-by-Side (One for each day)
    const totalGap = 2; 
    const colCount = 7;
    const colWidth = (contentWidth - (totalGap * (colCount - 1))) / colCount;
    const gridHeight = pageHeight - y - 16;

    DAYS_OF_WEEK.forEach((day, colIdx) => {
      const colX = margin + colIdx * (colWidth + totalGap);
      const dayDrills = schedule[day] || [];
      const dayTitle = safeTxt(dayTitles[day] || 'Rest/Off');
      const dateObj = weekDatesFull[colIdx];
      const dateDay = dateObj ? dateObj.getDate() : '';

      // Column card background container
      doc.setFillColor(...C.cardBg);
      doc.roundedRect(colX, y, colWidth, gridHeight, 2, 2, 'F');
      
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(colX, y, colWidth, gridHeight, 2, 2, 'S');

      // Card Header
      doc.setFillColor(...C.primary);
      doc.roundedRect(colX, y, colWidth, 10, 2, 2, 'F');
      // Cover the bottom rounded corners of headers
      doc.rect(colX, y + 8, colWidth, 2, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(C.white[0], C.white[1], C.white[2]);
      doc.text(day.toUpperCase().substring(0, 3), colX + 3, y + 6.5);

      // Date number
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.orange);
      doc.text(String(dateDay), colX + colWidth - 7, y + 6.5);

      // Divider
      doc.setDrawColor(...C.orange);
      doc.setLineWidth(0.8);
      doc.line(colX, y + 10, colX + colWidth, y + 10);

      // Focus label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text(dayTitle.substring(0, 22).toUpperCase(), colX + 3, y + 14);

      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.line(colX + 2, y + 16, colX + colWidth - 2, y + 16);

      // Render Drills in this column
      let drillY = y + 19;
      const maxColDrills = 8;

      if (dayDrills.length === 0) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.mid);
        doc.text('REST DAY', colX + colWidth / 2, y + 45, { align: 'center' });
      } else {
        dayDrills.forEach((drill, drillIdx) => {
          if (drillIdx >= maxColDrills) return; // Prevent card overflow

          const type = (drill.type || 'physical').toLowerCase();
          const cat = catColors[type] || catColors.physical;

          // Background card for exercise
          doc.setFillColor(theme === 'dark' ? C.white : [255, 255, 255]);
          doc.roundedRect(colX + 2, drillY, colWidth - 4, 15, 1, 1, 'F');
          
          doc.setDrawColor(...C.border);
          doc.setLineWidth(0.15);
          doc.roundedRect(colX + 2, drillY, colWidth - 4, 15, 1, 1, 'S');

          // Accent bar left
          doc.setFillColor(...cat.border);
          doc.rect(colX + 2, drillY, 1, 15, 'F');

          // Exercise Title
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.primary);
          const drillTitle = safeTxt(drill.title || 'Drill');
          doc.text(drillTitle.substring(0, 21), colX + 4.5, drillY + 4);

          // Workout Prescription Parameters (Sets x Reps)
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.orange);
          const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';
          const setsStr = drill.sets ? `${drill.sets}s` : '';
          let repsStr = isMeters ? (drill.distance ? `${drill.distance}m` : '') : (drill.reps ? `${drill.reps}r` : '');
          if (drill.unit && !isMeters) {
            const u = drill.unit.toLowerCase();
            if (u === 'sec') repsStr += 's';
            else if (u === 'min') repsStr += 'm';
            else if (u === 'jumps') repsStr += 'j';
          }
          const intensityStr = drill.percentage ? `@${drill.percentage}%` : '';
          doc.text(`${setsStr} x ${repsStr} ${intensityStr}`.trim(), colX + 4.5, drillY + 8.5);

          // Rest interval and notes combined
          let footerTxt = '';
          if (drill.rest) footerTxt += `Rest: ${drill.rest}`;
          if (drill.details) {
            const cleanNote = safeTxt(drill.details);
            if (cleanNote) {
              if (footerTxt) footerTxt += ' | ';
              footerTxt += cleanNote;
            }
          }
          if (footerTxt) {
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.mid);
            // Truncate to fit column card safely
            const colLimit = 26;
            const truncatedFooter = footerTxt.length > colLimit ? footerTxt.substring(0, colLimit - 3) + '...' : footerTxt;
            doc.text(truncatedFooter, colX + 4.5, drillY + 12.5);
          }

          drillY += 16.5;
        });
        
        // Show count indicator if exercises are compressed
        if (dayDrills.length > maxColDrills) {
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.orange);
          doc.text(`+ ${dayDrills.length - maxColDrills} more drills`, colX + colWidth / 2, drillY + 2, { align: 'center' });
        }
      }
    });

    // Page Footer
    doc.setFontSize(7.5);
    doc.setTextColor(...C.mid);
    doc.setFont('helvetica', 'normal');
    doc.text('Peak Force Lab  |  Elite Training Systems  |  Landscape Grid Blueprint', margin, pageHeight - 6);
    doc.text(`Generated for Athlete: ${athleteName}   |   Page 1 of 1`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save PDF file
  const fileName = `PeakForce_${orientation === 'landscape' ? 'Weekly_Grid' : 'Vertical_Plan'}_${athleteName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
