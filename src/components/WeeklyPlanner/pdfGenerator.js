import { jsPDF } from 'jspdf';

/**
 * Generate a clean, organized PDF report of the weekly training plan.
 * Exercises are listed vertically under each day — simple and beautiful.
 */
export function generateWeeklyPDF({ schedule, dayTitles, weekDatesFull, selectedAthlete, weeklyStats, calculateDayVolume }) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const DAYS_AR = { Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة' };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const COLORS = {
    black: [15, 23, 42],
    dark: [51, 65, 85],
    medium: [100, 116, 139],
    light: [148, 163, 184],
    faint: [226, 232, 240],
    orange: [249, 115, 22],
    blue: [59, 130, 246],
    white: [255, 255, 255],
    bgLight: [248, 250, 252],
  };

  const categoryColors = {
    strength: { border: [100, 116, 139], bg: [248, 250, 252] },
    power:    { border: [234, 179, 8],   bg: [254, 252, 232] },
    core:     { border: [168, 85, 247],  bg: [250, 245, 255] },
    mobility: { border: [239, 68, 68],   bg: [254, 242, 242] },
    isometric:{ border: [249, 115, 22],  bg: [255, 247, 237] },
    physical: { border: [59, 130, 246],  bg: [239, 246, 255] },
  };

  // Helper: check if we need a new page
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      // Footer before page break
      drawFooter();
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Footer
  const drawFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.light);
    doc.text('ForcePeak Lab — Training Performance Report', margin, pageHeight - 8);
    doc.text(`${selectedAthlete?.name || 'Athlete'}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // ─────────────────────────────────────────────
  // HEADER SECTION
  // ─────────────────────────────────────────────
  // Top accent line
  doc.setFillColor(...COLORS.orange);
  doc.rect(margin, y, contentWidth, 1.5, 'F');
  y += 6;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAINING PLAN', margin, y);

  // Date range on the right
  const dateStart = weekDatesFull[0]?.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) || '';
  const dateEnd = weekDatesFull[6]?.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) || '';
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.medium);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStart}  —  ${dateEnd}`, pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Athlete info line
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  const athleteName = selectedAthlete?.name || 'Unknown Athlete';
  doc.text(`Athlete: ${athleteName}`, margin, y);

  if (weeklyStats) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(`Weekly Load: ${weeklyStats.load}  |  Avg Intensity: ${weeklyStats.intensity}%  |  ${weeklyStats.loadLabel}`, pageWidth - margin, y, { align: 'right' });
  }
  y += 4;

  // Separator line
  doc.setDrawColor(...COLORS.faint);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─────────────────────────────────────────────
  // DAYS LOOP
  // ─────────────────────────────────────────────
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    const dayDrills = schedule[day] || [];
    const fullDateStr = weekDatesFull[dayIndex]?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) || '';
    const dayTitle = dayTitles[day] || '';
    const dayStats = calculateDayVolume(dayDrills);

    // Estimate height needed for this day block
    const headerHeight = 12;
    const exerciseHeight = dayDrills.length * 14;
    const summaryHeight = dayDrills.length > 0 ? 10 : 0;
    const totalDayHeight = headerHeight + exerciseHeight + summaryHeight + 10;

    // Check for page break before starting a new day
    checkPageBreak(Math.min(totalDayHeight, 50));

    // ── Day Header ──
    doc.setFillColor(...COLORS.bgLight);
    doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.black);
    doc.text(`${day}`, margin + 4, y + 6.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(fullDateStr, pageWidth - margin - 4, y + 6.5, { align: 'right' });

    y += 11;

    // Day title if exists
    if (dayTitle) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.orange);
      doc.text(dayTitle, margin + 4, y + 1);
      y += 5;
    }

    // ── Exercises List ──
    if (dayDrills.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.light);
      doc.text('— Rest Day —', margin + 4, y + 2);
      y += 8;
    } else {
      dayDrills.forEach((drill, drillIndex) => {
        checkPageBreak(16);

        const type = (drill.type || 'physical').toLowerCase();
        const catColor = categoryColors[type] || categoryColors.physical;
        const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';

        // Left accent line
        doc.setFillColor(...catColor.border);
        doc.rect(margin + 2, y, 1.2, 10, 'F');

        // Light background
        doc.setFillColor(...catColor.bg);
        doc.roundedRect(margin + 5, y, contentWidth - 7, 10, 1.5, 1.5, 'F');

        // Exercise number
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.light);
        doc.text(`${drillIndex + 1}`, margin + 7, y + 6);

        // Exercise title
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.black);
        const title = drill.title || 'Unnamed';
        doc.text(title, margin + 14, y + 4.5);

        // Prescription string
        const parts = [];
        const sets = drill.sets || '';
        const reps = isMeters ? (drill.distance || '') : (drill.reps || '');
        const unitLabel = isMeters ? 'm' : (drill.unit === 'sec' ? 's' : (drill.unit === 'min' ? 'min' : (drill.unit === 'jumps' ? 'j' : '')));

        if (sets && reps) {
          parts.push(`${sets}×${reps}${unitLabel}`);
        } else if (sets) {
          parts.push(`${sets} sets`);
        } else if (reps) {
          parts.push(`${reps}${unitLabel}`);
        }

        if (drill.percentage) parts.push(`@${drill.percentage}%`);
        if (drill.rest) parts.push(`⏱ ${drill.rest}`);

        const prescriptionStr = parts.join('  ·  ');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.dark);
        doc.text(prescriptionStr, margin + 14, y + 8.5);

        // Type badge on the right
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...catColor.border);
        doc.text(type.toUpperCase(), pageWidth - margin - 5, y + 6, { align: 'right' });

        y += 12;
      });
    }

    // ── Day Summary ──
    if (dayDrills.length > 0) {
      checkPageBreak(10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.medium);

      const summaryParts = [];
      summaryParts.push(`${dayStats.totalExercises} exercises`);
      if (dayStats.avgIntensity > 0) summaryParts.push(`Intensity: ${dayStats.avgIntensity}%`);
      summaryParts.push(`Load: ${dayStats.totalVolumeScore}`);
      if (dayStats.jumpsVolume > 0) summaryParts.push(`Jumps: ${dayStats.jumpsVolume}`);
      if (dayStats.totalMeters > 0) summaryParts.push(`Run: ${dayStats.totalMeters}m`);

      doc.text(summaryParts.join('   |   '), margin + 4, y + 1);
      y += 5;
    }

    // Day separator line
    doc.setDrawColor(...COLORS.faint);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  // ─────────────────────────────────────────────
  // FINAL FOOTER
  // ─────────────────────────────────────────────
  drawFooter();

  // ─────────────────────────────────────────────
  // SAVE / DOWNLOAD
  // ─────────────────────────────────────────────
  const fileName = `Training_Plan_${athleteName.replace(/\s+/g, '_')}_${dateStart.replace(/\s+/g, '')}-${dateEnd.replace(/\s+/g, '')}.pdf`;
  doc.save(fileName);
}
