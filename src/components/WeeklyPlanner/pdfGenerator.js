import { jsPDF } from 'jspdf';

/**
 * Generate a clean, extremely premium, online-coaching style PDF report.
 * Each training day is presented on exactly ONE dedicated A4 page.
 */
export function generateWeeklyPDF({ schedule, dayTitles, weekDatesFull, selectedAthlete, weeklyStats, calculateDayVolume }) {
  const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Modern Harmonious Color Palette
  const C = {
    primary:   [15, 23, 42],      // Slate 900 (Deep/Dominant)
    secondary: [51, 65, 85],     // Slate 700
    orange:    [249, 115, 22],    // Premium Orange (Accent)
    mid:       [100, 116, 139],   // Slate 500
    light:     [148, 163, 184],   // Slate 400
    faint:     [241, 245, 249],   // Slate 100
    border:    [226, 232, 240],   // Slate 200
    white:     [255, 255, 255],
    cardBg:    [248, 250, 252],   // Slate 50
  };

  const catColors = {
    strength:  { border: [100, 116, 139], bg: [248, 250, 252], label: 'STRENGTH' },
    power:     { border: [234, 179, 8],   bg: [254, 252, 232], label: 'POWER' },
    core:      { border: [168, 85, 247],  bg: [250, 245, 255], label: 'CORE' },
    mobility:  { border: [239, 68, 68],   bg: [254, 242, 242], label: 'MOBILITY' },
    isometric: { border: [249, 115, 22],  bg: [255, 247, 237], label: 'ISOMETRIC' },
    physical:  { border: [59, 130, 246],  bg: [239, 246, 255], label: 'PHYSICAL' },
  };

  const safeTxt = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[^\x20-\x7E\n]/g, ' ').trim();
  };

  const athleteName = selectedAthlete ? safeTxt(selectedAthlete.name) : 'Elite Athlete';
  const dateStart = weekDatesFull[0] ? weekDatesFull[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const dateEnd = weekDatesFull[6] ? weekDatesFull[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Generate a page for each day of the week
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    if (dayIndex > 0) {
      doc.addPage();
    }

    let y = margin;
    const dayDrills = schedule[day] || [];
    const dateObj = weekDatesFull[dayIndex];
    const fullDateStr = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const dayTitle = safeTxt(dayTitles[day] || 'Training Protocol');
    const dayStats = calculateDayVolume(dayDrills);

    // ================================================================
    //  1. PREMIUM BRAND HEADER (Top of every single page)
    // ================================================================
    doc.setFillColor(...C.primary);
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 6;

    // Logo & Brand Name
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text('FORCEPEAK PERFORMANCE LAB', margin, y);

    // Athlete Passport label on the right
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.orange);
    doc.text('ATHLETE PASSPORT  //  MESO-BLUEPRINT', pageWidth - margin, y, { align: 'right' });
    y += 5;

    // Small divider
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ================================================================
    //  2. HERO DAY HEADER BLOCK (Clean solid background)
    // ================================================================
    doc.setFillColor(...C.primary);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');

    // Day name (e.g. SATURDAY)
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(day.toUpperCase(), margin + 5, y + 10.5);

    // Full Date
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.light);
    doc.text(fullDateStr, pageWidth - margin - 5, y + 10.5, { align: 'right' });
    y += 21;

    // Workout Focus Banner
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

    // ================================================================
    //  3. SESSION PERFORMANCE METRICS DASHBOARD
    // ================================================================
    // Render 3 stats columns
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

    // ================================================================
    //  4. THE CORE EXERCISE LISTING (TABLE FORMAT)
    // ================================================================
    if (dayDrills.length === 0) {
      // Elegant rest day placeholder
      doc.setFillColor(...C.cardBg);
      doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'F');
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'S');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.mid);
      doc.text('REST & ACTIVE RECOVERY', pageWidth / 2, y + 25, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.light);
      doc.text('No formal drills scheduled. Prioritize sleep, hydration, and gentle mobility.', pageWidth / 2, y + 34, { align: 'center' });
    } else {
      // Table Header Row
      doc.setFillColor(...C.primary);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text('#', margin + 3, y + 4.8);
      doc.text('EXERCISE / INSTRUCTIONS', margin + 10, y + 4.8);
      doc.text('SETS', margin + 104, y + 4.8, { align: 'center' });
      doc.text('REPS/DIST', margin + 124, y + 4.8, { align: 'center' });
      doc.text('INTENSITY', margin + 148, y + 4.8, { align: 'center' });
      doc.text('REST', margin + 168, y + 4.8, { align: 'center' });
      y += 7;

      // Adjust height per exercise to ensure all fit on exactly one page.
      // Maximum exercises is usually around 10. If we scale card height, we can fit perfectly.
      const maxUsableHeight = pageHeight - y - 35; // Save 35mm for footer & coach notes card
      const baseRowHeight = Math.min(14, maxUsableHeight / dayDrills.length);

      dayDrills.forEach((drill, idx) => {
        const type = (drill.type || 'physical').toLowerCase();
        const cat = catColors[type] || catColors.physical;
        const isMeters = drill.unit && drill.unit.toLowerCase() === 'meters';

        // Background alternate row striping
        if (idx % 2 === 0) {
          doc.setFillColor(...C.cardBg);
          doc.rect(margin, y, contentWidth, baseRowHeight, 'F');
        }

        // Left accent category color bar
        doc.setFillColor(...cat.border);
        doc.rect(margin, y, 1.2, baseRowHeight, 'F');

        // Divider line at the bottom
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.line(margin, y + baseRowHeight, pageWidth - margin, y + baseRowHeight);

        // # Number
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.mid);
        doc.text(String(idx + 1), margin + 4, y + baseRowHeight / 2 + 1);

        // Exercise Title (Bold Slate)
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.primary);
        const titleStr = safeTxt(drill.title || 'Unnamed Drill');
        doc.text(titleStr, margin + 10, y + baseRowHeight / 2 - 1);

        // Exercise Notes / Cues (Subtext below title)
        const noteStr = safeTxt(drill.details || '');
        if (noteStr) {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...C.mid);
          // Crop notes if they are too long to prevent row bleeding
          const truncatedNote = noteStr.length > 50 ? noteStr.substring(0, 47) + '...' : noteStr;
          doc.text(truncatedNote, margin + 10, y + baseRowHeight / 2 + 3.2);
        }

        // Table Data Fields
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.secondary);

        // Sets
        doc.text(safeTxt(drill.sets) || '-', margin + 104, y + baseRowHeight / 2 + 1, { align: 'center' });

        // Reps / Distance
        let repVal = isMeters ? safeTxt(drill.distance) : safeTxt(drill.reps);
        let unitStr = '';
        if (drill.unit) {
          const u = drill.unit.toLowerCase();
          if (u === 'meters') unitStr = 'm';
          else if (u === 'sec') unitStr = 's';
          else if (u === 'min') unitStr = 'm';
          else if (u === 'jumps') unitStr = 'j';
        }
        doc.text(repVal ? `${repVal}${unitStr}` : '-', margin + 124, y + baseRowHeight / 2 + 1, { align: 'center' });

        // Intensity %
        const pct = safeTxt(drill.percentage);
        doc.text(pct ? `${pct}%` : '-', margin + 148, y + baseRowHeight / 2 + 1, { align: 'center' });

        // Rest
        const rest = safeTxt(drill.rest);
        doc.text(rest || '-', margin + 168, y + baseRowHeight / 2 + 1, { align: 'center' });

        y += baseRowHeight;
      });
    }

    // ================================================================
    //  5. COACH'S NOTES & ACTION PLAN (Bottom of every page)
    // ================================================================
    const remainingY = pageHeight - y - 18;
    if (remainingY > 15) {
      y += 4;
      doc.setFillColor(...C.primary);
      doc.roundedRect(margin, y, contentWidth, Math.min(18, remainingY), 1.5, 1.5, 'F');

      // Decorative orange indicator
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
      // Select a tip dynamically based on day or exercise length
      const tipIndex = (dayIndex + (dayDrills.length || 0)) % coachTips.length;
      doc.text(coachTips[tipIndex], margin + 8, y + 11.8);
    }

    // Page Footer
    doc.setFontSize(7);
    doc.setTextColor(...C.mid);
    doc.setFont('helvetica', 'normal');
    doc.text('ForcePeak Lab  |  Elite Training Systems', margin, pageHeight - 8);
    doc.text(`Week Cycle: ${dateStart} - ${dateEnd}   |   Page ${dayIndex + 1} of 7`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  });

  // Save PDF
  const fileName = `ForcePeak_Weekly_Blueprint_${athleteName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
