import { jsPDF } from 'jspdf';

/**
 * Generate a clean, organized PDF report of the weekly training plan.
 * Exercises listed vertically under each day - simple, big, and readable.
 */
export function generateWeeklyPDF({ schedule, dayTitles, weekDatesFull, selectedAthlete, weeklyStats, calculateDayVolume }) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNum = 1;

  // Colors
  const C = {
    black:  [15, 23, 42],
    dark:   [51, 65, 85],
    mid:    [100, 116, 139],
    light:  [148, 163, 184],
    faint:  [226, 232, 240],
    orange: [249, 115, 22],
    white:  [255, 255, 255],
    bg:     [248, 250, 252],
  };

  const catColors = {
    strength:  { border: [100, 116, 139], bg: [248, 250, 252], label: 'STRENGTH' },
    power:     { border: [234, 179, 8],   bg: [254, 252, 232], label: 'POWER' },
    core:      { border: [168, 85, 247],  bg: [250, 245, 255], label: 'CORE' },
    mobility:  { border: [239, 68, 68],   bg: [254, 242, 242], label: 'MOBILITY' },
    isometric: { border: [249, 115, 22],  bg: [255, 247, 237], label: 'ISOMETRIC' },
    physical:  { border: [59, 130, 246],  bg: [239, 246, 255], label: 'PHYSICAL' },
  };

  // Helpers
  const needsNewPage = (h) => {
    if (y + h > pageHeight - 18) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = margin;
      return true;
    }
    return false;
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.setFont('helvetica', 'normal');
    doc.text('ForcePeak Lab - Training Performance Report', margin, pageHeight - 7);
    doc.text('Page ' + pageNum, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const safeTxt = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[^\x20-\x7E\n]/g, ' ').trim();
  };

  // ================================================================
  //  HEADER
  // ================================================================
  doc.setFillColor(...C.orange);
  doc.rect(margin, y, contentWidth, 2, 'F');
  y += 8;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.black);
  doc.text('WEEKLY TRAINING PLAN', margin, y);
  y += 8;

  // Date range
  const dateStart = weekDatesFull[0] ? weekDatesFull[0].toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : '';
  const dateEnd = weekDatesFull[6] ? weekDatesFull[6].toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.mid);
  doc.text(dateStart + '  -  ' + dateEnd, margin, y);
  y += 7;

  // Athlete
  const athleteName = selectedAthlete ? safeTxt(selectedAthlete.name) : 'Unknown Athlete';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  doc.text('Athlete: ' + athleteName, margin, y);

  // Weekly stats on the right
  if (weeklyStats) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.mid);
    const statsStr = 'Load: ' + weeklyStats.load + '  |  Intensity: ' + weeklyStats.intensity + '%  |  ' + safeTxt(weeklyStats.loadLabel);
    doc.text(statsStr, pageWidth - margin, y, { align: 'right' });
  }
  y += 5;

  // Separator
  doc.setDrawColor(...C.faint);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ================================================================
  //  DAYS
  // ================================================================
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    const dayDrills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIndex];
    const fullDateStr = dateObj ? dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const dayTitle = safeTxt(dayTitles[day] || '');
    const dayStats = calculateDayVolume(dayDrills);

    // Estimate minimum height
    const minH = 18 + (dayDrills.length > 0 ? 20 : 10);
    needsNewPage(minH);

    // -- Day Header Bar --
    doc.setFillColor(...C.bg);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.black);
    doc.text(day.toUpperCase(), margin + 5, y + 7.5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.mid);
    doc.text(fullDateStr, pageWidth - margin - 5, y + 7.5, { align: 'right' });
    y += 13;

    // Day workout title
    if (dayTitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.orange);
      doc.text(dayTitle, margin + 5, y);
      y += 6;
    }

    // -- Exercises --
    if (dayDrills.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.light);
      doc.text('-- Rest Day --', margin + 5, y + 2);
      y += 10;
    } else {
      dayDrills.forEach((drill, idx) => {
        // Calculate card height based on content
        const hasDetails = drill.details && safeTxt(drill.details).length > 0;
        const detailsText = hasDetails ? safeTxt(drill.details) : '';
        
        // Split long details into lines
        let detailLines = [];
        if (hasDetails) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          detailLines = doc.splitTextToSize(detailsText, contentWidth - 25);
        }
        
        const cardHeight = 14 + (hasDetails ? (detailLines.length * 4.5 + 2) : 0);
        needsNewPage(cardHeight + 4);

        const type = (drill.type || 'physical').toLowerCase();
        const cat = catColors[type] || catColors.physical;
        const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';

        // Card background
        doc.setFillColor(...cat.bg);
        doc.roundedRect(margin + 4, y, contentWidth - 6, cardHeight, 2, 2, 'F');

        // Left accent bar
        doc.setFillColor(...cat.border);
        doc.rect(margin + 4, y, 2, cardHeight, 'F');

        // Exercise number
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.light);
        doc.text(String(idx + 1), margin + 10, y + 6);

        // Exercise title - BIG and BOLD
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.black);
        doc.text(safeTxt(drill.title || 'Unnamed'), margin + 18, y + 6);

        // Prescription line - clear readable format
        const sets = safeTxt(drill.sets);
        const reps = isMeters ? safeTxt(drill.distance) : safeTxt(drill.reps);
        const pct = safeTxt(drill.percentage);
        const rest = safeTxt(drill.rest);

        let unitStr = '';
        if (drill.unit) {
          const u = drill.unit.toLowerCase();
          if (u === 'meters') unitStr = 'm';
          else if (u === 'sec') unitStr = 's';
          else if (u === 'min') unitStr = 'min';
          else if (u === 'jumps') unitStr = ' jumps';
          else if (u === 'reps') unitStr = ' reps';
          else unitStr = '';
        }

        const parts = [];
        if (sets && reps) {
          parts.push(sets + ' x ' + reps + unitStr);
        } else if (sets) {
          parts.push(sets + ' sets');
        } else if (reps) {
          parts.push(reps + unitStr);
        }
        if (pct) parts.push('@ ' + pct + '%');
        if (rest) parts.push('Rest: ' + rest);

        if (parts.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.dark);
          doc.text(parts.join('    |    '), margin + 18, y + 11.5);
        }

        // Category badge on right
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...cat.border);
        doc.text(cat.label, pageWidth - margin - 8, y + 6, { align: 'right' });

        // Notes / Details - clearly visible below the prescription
        if (hasDetails && detailLines.length > 0) {
          let noteY = y + 15;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...C.mid);
          detailLines.forEach((line) => {
            doc.text(line, margin + 18, noteY);
            noteY += 4.5;
          });
        }

        y += cardHeight + 3;
      });
    }

    // -- Day Summary --
    if (dayDrills.length > 0) {
      needsNewPage(10);

      const sumParts = [];
      sumParts.push(dayStats.totalExercises + ' exercises');
      if (dayStats.avgIntensity > 0) sumParts.push('Intensity: ' + dayStats.avgIntensity + '%');
      sumParts.push('Load: ' + dayStats.totalVolumeScore);
      if (dayStats.jumpsVolume > 0) sumParts.push('Jumps: ' + dayStats.jumpsVolume);
      if (dayStats.totalMeters > 0) sumParts.push('Run: ' + dayStats.totalMeters + 'm');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text(sumParts.join('   |   '), margin + 5, y + 1);
      y += 5;
    }

    // Day separator
    doc.setDrawColor(...C.faint);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  });

  // Final footer
  addFooter();

  // Save
  const fileName = 'Training_Plan_' + athleteName.replace(/\s+/g, '_') + '.pdf';
  doc.save(fileName);
}
