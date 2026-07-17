import { jsPDF } from 'jspdf';

interface AthleteData {
  name: string;
  gender: 'Male' | 'Female';
  age: number;
}

interface TestScores {
  sjNoArm: number;
  sjArm: number;
  cmjNoArm: number;
  cmjArm: number;
  rsi: number;
  bodyweight: number;
  slCmjLeft: number;
  slCmjRight: number;
  standReach?: number;
  jumpReach?: number;
  vj?: number;
}

interface AnalysisResults {
  eur: number;
  rsi: number;
  eurClassification: 'Force-Dominant' | 'Elastic-Dominant' | 'Balanced';
  rsiRating: 'Poor' | 'Average' | 'Good' | 'Elite';
  lsi: number;
  peakPower: number;
  relativePower: number;
  armSwingBenefit: number;
  recommendations: {
    focus: string;
    goal: string;
    protocols: string[];
    workout: { exercise: string; sets: string; reps: string; note: string }[];
  };
}

interface ProgressRecord {
  date: string;
  cmjNoArm: number;
  cmjArm: number;
  rsi: number;
  lsi: number;
  relativePower: number;
}

export const generatePDF = (
  athlete: AthleteData,
  scores: TestScores,
  analysis: AnalysisResults,
  dateString: string,
  prevTest?: ProgressRecord | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin; // 180mm

  // Colors
  const darkNavy = [11, 15, 25]; // #0b0f19
  const neonBlue = [0, 200, 255]; // #00c8ff
  const bgCard = [248, 250, 252]; // slate-50
  const borderGray = [226, 232, 240]; // slate-200
  const textDark = [15, 23, 42]; // slate-900
  const textMuted = [100, 116, 139]; // slate-500
  const alertRed = [239, 68, 68]; // red-500
  const successGreen = [16, 185, 129]; // emerald-500

  // -------------------------------------------------------------
  // PAGE 1: Branded Header, Demographics, Calculated KPI Panels
  // -------------------------------------------------------------

  // 1. Dark Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, margin, contentWidth, 25, 'F');

  // Neon line at bottom of header
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(1.0);
  doc.line(margin, margin + 25, margin + contentWidth, margin + 25);

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FORCE PEAK', margin + 8, margin + 14);

  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('ELITE SPORTS PERFORMANCE & BIOMECHANICS', margin + 8, margin + 19.5);

  // Report Date / Label on Right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ATHLETE REPORT', margin + contentWidth - 8, margin + 14, { align: 'right' });

  doc.setTextColor(156, 163, 175); // light gray
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Test Date: ${dateString}`, margin + contentWidth - 8, margin + 19.5, { align: 'right' });

  let y = margin + 32;

  // 2. Athlete Information Box
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 18, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ATHLETE:', margin + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(athlete.name, margin + 28, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('GENDER:', margin + 105, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(athlete.gender, margin + 126, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('AGE:', margin + 6, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${athlete.age} yrs`, margin + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', margin + 105, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(athlete.age < 16 ? 'Youth (Thresholds Adjusted -15%)' : 'Adult (Standard Benchmarks)', margin + 126, y + 13);

  y += 24;

  // 3. Calculated KPIs Panel (EUR and RSI)
  const colWidth = (contentWidth - 6) / 2;

  // EUR Card
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, colWidth, 42, 'FD');
  
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 42);
  
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ECCENTRIC UTILIZATION RATIO (EUR)', margin + 6, y + 6);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(analysis.eur.toFixed(2), margin + 6, y + 15);
  
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin + 6, y + 19, colWidth - 12, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(analysis.eurClassification.toUpperCase(), margin + colWidth / 2, y + 23.2, { align: 'center' });

  // EUR text
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const eurExplain = analysis.eurClassification === 'Force-Dominant'
    ? 'Athlete shows high concentric strength but lacks elastic capacity. Focus on reactive stretch reflex.'
    : analysis.eurClassification === 'Elastic-Dominant'
    ? 'Athlete has strong elastic storage but lacks maximum force. Focus on absolute concentric strength.'
    : 'Athlete has optimized force-elastic balance. Maintain profiles and perform contrast training.';
  const splitEurText = doc.splitTextToSize(eurExplain, colWidth - 12);
  doc.text(splitEurText, margin + 6, y + 29);

  // RSI Card
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin + colWidth + 6, y, colWidth, 42, 'FD');
  
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(1.5);
  doc.line(margin + colWidth + 6, y, margin + colWidth + 6, y + 42);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REACTIVE STRENGTH INDEX (RSI)', margin + colWidth + 12, y + 6);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(analysis.rsi.toFixed(2), margin + colWidth + 12, y + 15);

  let rsiColor = [100, 116, 139]; // gray
  if (analysis.rsiRating === 'Elite') rsiColor = successGreen;
  if (analysis.rsiRating === 'Good') rsiColor = [59, 130, 246]; // blue
  if (analysis.rsiRating === 'Average') rsiColor = [245, 158, 11]; // orange
  if (analysis.rsiRating === 'Poor') rsiColor = alertRed;

  doc.setFillColor(rsiColor[0], rsiColor[1], rsiColor[2]);
  doc.rect(margin + colWidth + 12, y + 19, colWidth - 12, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${analysis.rsiRating.toUpperCase()} CLASS`, margin + colWidth + 6 + colWidth / 2, y + 23.2, { align: 'center' });

  // RSI specific recommendation
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RSI TRAINING GUIDANCE:', margin + colWidth + 12, y + 29);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const rsiRecs: Record<string, string> = {
    Poor: 'Extensive low-level plyometrics (pogos, line hops) for tendon tolerance. Avoid high depth jumps.',
    Average: 'Moderate plyometrics. Focus on stiff ankles and short ground contact times.',
    Good: 'Intensive plyometrics. Incorporate depth jumps from moderate heights.',
    Elite: 'Shock method and high depth jumps. Ensure absolute strength matches elastic capability.'
  };
  const rsiExplain = rsiRecs[analysis.rsiRating] || '';
  const splitRsiText = doc.splitTextToSize(rsiExplain, colWidth - 12);
  doc.text(splitRsiText, margin + colWidth + 12, y + 33);

  y += 48;

  // 4. Advanced Metrics Panel: LSI and Peak Power (Sayers)
  // LSI Card
  const lsiDeficit = analysis.lsi < 90;
  const lsiBorder = lsiDeficit ? alertRed : successGreen;

  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, colWidth, 42, 'FD');
  
  doc.setDrawColor(lsiBorder[0], lsiBorder[1], lsiBorder[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 42);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('LIMB SYMMETRY INDEX (LSI)', margin + 6, y + 6);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${analysis.lsi.toFixed(1)}%`, margin + 6, y + 15);

  doc.setFillColor(lsiBorder[0], lsiBorder[1], lsiBorder[2]);
  doc.rect(margin + 6, y + 19, colWidth - 12, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(lsiDeficit ? 'ASYMMETRY ALERT' : 'SYMMETRICAL PROFILE', margin + colWidth / 2, y + 23.2, { align: 'center' });

  // LSI auto recommendation text
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const lsiExplainText = lsiDeficit
    ? 'Red Flag: High Injury Risk - Deficit >10% detected. Prioritize unilateral strength, split squats, and single-leg landing stabilization.'
    : 'LSI within safe limits (<10% deficit). Maintain unilateral training base to preserve bilateral efficiency.';
  const splitLsiText = doc.splitTextToSize(lsiExplainText, colWidth - 12);
  doc.text(splitLsiText, margin + 6, y + 29);

  // Power Profile Card (Sayers PAPw)
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin + colWidth + 6, y, colWidth, 42, 'FD');
  
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(1.5);
  doc.line(margin + colWidth + 6, y, margin + colWidth + 6, y + 42);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PEAK POWER OUTPUT (SAYERS)', margin + colWidth + 12, y + 6);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${analysis.peakPower.toFixed(0)} W`, margin + colWidth + 12, y + 15);

  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin + colWidth + 12, y + 19, colWidth - 12, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`RELATIVE POWER: ${analysis.relativePower.toFixed(1)} W/KG`, margin + colWidth + 6 + colWidth / 2, y + 23.2, { align: 'center' });

  // Power text
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const powerExplain = `Peak power derived using Sayers formula based on ${scores.cmjNoArm.toFixed(1)}cm CMJ (No Arm) height and ${scores.bodyweight.toFixed(1)}kg weight. Helps track relative muscle explosiveness.`;
  const splitPowerText = doc.splitTextToSize(powerExplain, colWidth - 12);
  doc.text(splitPowerText, margin + colWidth + 12, y + 29);

  y += 48;

  // 5. Progress Summary (Historical comparison)
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('HISTORICAL PROGRESS SUMMARY', margin, y);

  y += 4;

  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 22);

  if (prevTest) {
    const cmjDiff = scores.cmjNoArm - prevTest.cmjNoArm;
    const rsiDiff = scores.rsi - prevTest.rsi;
    const lsiDiff = analysis.lsi - prevTest.lsi;
    const powDiff = analysis.relativePower - prevTest.relativePower;

    const formatDiff = (val: number, decimal = 2, suffix = '') => {
      const sign = val >= 0 ? '+' : '';
      return `${sign}${val.toFixed(decimal)}${suffix}`;
    };

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Comparison vs. Previous Test (Date: ${prevTest.date}):`, margin + 6, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    // Grid of trends
    doc.text(`• CMJ (No Arm):`, margin + 8, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cmjDiff >= 0 ? successGreen[0] : alertRed[0], cmjDiff >= 0 ? successGreen[1] : alertRed[1], cmjDiff >= 0 ? successGreen[2] : alertRed[2]);
    doc.text(`${scores.cmjNoArm.toFixed(1)} cm (${formatDiff(cmjDiff, 1, ' cm')})`, margin + 35, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`• Reactive Index (RSI):`, margin + 95, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rsiDiff >= 0 ? successGreen[0] : alertRed[0], rsiDiff >= 0 ? successGreen[1] : alertRed[1], rsiDiff >= 0 ? successGreen[2] : alertRed[2]);
    doc.text(`${scores.rsi.toFixed(2)} (${formatDiff(rsiDiff, 2)})`, margin + 132, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`• Limb Symmetry (LSI):`, margin + 8, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(lsiDiff >= 0 ? successGreen[0] : alertRed[0], lsiDiff >= 0 ? successGreen[1] : alertRed[1], lsiDiff >= 0 ? successGreen[2] : alertRed[2]);
    doc.text(`${analysis.lsi.toFixed(1)}% (${formatDiff(lsiDiff, 1, '%')})`, margin + 35, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`• Relative Power:`, margin + 95, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(powDiff >= 0 ? successGreen[0] : alertRed[0], powDiff >= 0 ? successGreen[1] : alertRed[1], powDiff >= 0 ? successGreen[2] : alertRed[2]);
    doc.text(`${analysis.relativePower.toFixed(1)} W/kg (${formatDiff(powDiff, 1, ' W/kg')})`, margin + 132, y + 17);
  } else {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('No historical test data found for comparison. This assessment serves as the baseline profile.', margin + 6, y + 12);
  }

  // Page 1 Footer
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('FORCE PEAK Systems LLC • Page 1 of 2', margin + contentWidth / 2, pageHeight - 10, { align: 'center' });

  // -------------------------------------------------------------
  // PAGE 2: Raw Data Tables, Deficit Slider, & Training Prescriptions
  // -------------------------------------------------------------
  doc.addPage();

  // Page 2 Mini Header
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, margin, contentWidth, 12, 'F');
  
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 12, margin + contentWidth, margin + 12);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FORCE PEAK BIOMECHANICAL BIOTYPE REPORT', margin + 6, margin + 7.5);

  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Athlete: ${athlete.name} | Date: ${dateString}`, margin + contentWidth - 6, margin + 7.5, { align: 'right' });

  y = margin + 18;

  // 1. Raw Biomechanical Inputs Table
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RAW METRICS PERFORMANCE PROFILE', margin, y);

  y += 4;

  // Table Header
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TEST METRIC', margin + 6, y + 5.5);
  doc.text('VALUE', margin + 80, y + 5.5, { align: 'right' });
  doc.text('PHYSIOLOGICAL DESCRIPTION & TARGETS', margin + 95, y + 5.5);

  const tableData = [
    { name: 'Squat Jump (SJ) - No Arm Swing', val: `${scores.sjNoArm.toFixed(1)} cm (${(scores.sjNoArm / 2.54).toFixed(1)} in)`, desc: 'Concentric force capability without stretch-shortening reflex (NAS).' },
    { name: 'Squat Jump (SJ) - With Arm Swing', val: `${scores.sjArm.toFixed(1)} cm (${(scores.sjArm / 2.54).toFixed(1)} in)`, desc: 'Concentric force capability with arm swing contribution (AS).' },
    { name: 'CMJ Height (No Arm Swing)', val: `${scores.cmjNoArm.toFixed(1)} cm (${(scores.cmjNoArm / 2.54).toFixed(1)} in)`, desc: 'Bilateral vertical jump isolating lower extremity extension (NAS).' },
    { name: 'CMJ Height (With Arm Swing)', val: `${scores.cmjArm.toFixed(1)} cm (${(scores.cmjArm / 2.54).toFixed(1)} in)`, desc: 'Vertical jump incorporating upper body arm swing coordination (AS).' },
    { name: 'Arm Swing Benefit (%)', val: `${analysis.armSwingBenefit.toFixed(1)}%`, desc: `Coordination efficiency. Target: 10% - 15% (AS contribution).` },
    { name: 'Reactive Strength Index (RSI)', val: `${scores.rsi.toFixed(2)}`, desc: 'Reactive strength input directly from OVR Optoelectronic device.' },
    { name: 'Single-Leg CMJ Left', val: `${scores.slCmjLeft.toFixed(1)} cm (${(scores.slCmjLeft / 2.54).toFixed(1)} in)`, desc: 'Unilateral vertical jump height of the left limb.' },
    { name: 'Single-Leg CMJ Right', val: `${scores.slCmjRight.toFixed(1)} cm (${(scores.slCmjRight / 2.54).toFixed(1)} in)`, desc: 'Unilateral vertical jump height of the right limb.' },
    { name: 'Athlete Bodyweight', val: `${scores.bodyweight.toFixed(1)} kg`, desc: 'Athlete mass used for Peak Power Sayers calculations.' }
  ];

  if (scores.standReach !== undefined && scores.jumpReach !== undefined && scores.vj !== undefined && scores.standReach > 0) {
    tableData.push(
      { name: 'Standing Reach', val: `${scores.standReach.toFixed(1)} cm (${(scores.standReach / 2.54).toFixed(1)} in)`, desc: 'Athlete standing vertical reach height.' },
      { name: 'Max Jump Reach', val: `${scores.jumpReach.toFixed(1)} cm (${(scores.jumpReach / 2.54).toFixed(1)} in)`, desc: 'Peak reach height achieved during sargent vertical jump.' },
      { name: 'Sargent Vertical Jump (Delta)', val: `${scores.vj.toFixed(1)} cm (${(scores.vj / 2.54).toFixed(1)} in)`, desc: 'Vertical jump height calculated by reach difference (reach delta).' }
    );
  }

  y += 8;
  tableData.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.rect(margin, y, contentWidth, 8, 'F');
    }
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(row.name, margin + 6, y + 5.5);
    doc.text(row.val, margin + 80, y + 5.5, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row.desc, margin + 95, y + 5.5);

    y += 8;
  });

  y += 10;

  // 2. Visual Deficit Spectrum Slider (Sci-Fi Slider)
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FORCE-ELASTIC DEFICIT SPECTRUM (EUR)', margin, y);

  y += 5;

  const sliderWidth = 140;
  const sliderX = margin + 20;

  // Draw spectrum bar sectors
  doc.setFillColor(239, 68, 68); // Red
  doc.rect(sliderX, y + 2, 50, 3, 'F');
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(sliderX + 50, y + 2, 20, 3, 'F');
  doc.setFillColor(168, 85, 247); // Purple
  doc.rect(sliderX + 70, y + 2, 70, 3, 'F');

  // Labels
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Force-Dominant (Elastic Deficit)', sliderX, y + 9);
  doc.text('Balanced', sliderX + 60, y + 9, { align: 'center' });
  doc.text('Elastic-Dominant (Force Deficit)', sliderX + sliderWidth, y + 9, { align: 'right' });

  // Draw indicators
  doc.setDrawColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setLineWidth(0.3);
  doc.line(sliderX, y, sliderX, y + 5);
  doc.text('0.80', sliderX, y - 1, { align: 'center' });
  
  doc.line(sliderX + 50, y, sliderX + 50, y + 5);
  doc.text('1.10', sliderX + 50, y - 1, { align: 'center' });
  
  doc.line(sliderX + 70, y, sliderX + 70, y + 5);
  doc.text('1.15', sliderX + 70, y - 1, { align: 'center' });

  doc.line(sliderX + sliderWidth, y, sliderX + sliderWidth, y + 5);
  doc.text('1.50+', sliderX + sliderWidth, y - 1, { align: 'center' });

  // Map athlete's EUR to slider position
  const athleteEUR = analysis.eur;
  let ratio = (athleteEUR - 0.8) / (1.5 - 0.8);
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  const dotX = sliderX + ratio * sliderWidth;

  // Draw Athlete Pointer
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setLineWidth(0.8);
  doc.circle(dotX, y + 3.5, 2.5, 'FD'); // Pointer circle

  // Label for current EUR
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.setFontSize(8);
  doc.text(`EUR: ${athleteEUR.toFixed(2)}`, dotX, y + 10, { align: 'center' });

  y += 18;

  // 3. Training Recommendations (Coaching Insights)
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AUTO-REGULATED PERIODIZED COACHING RECOMMENDATIONS', margin, y);

  y += 4;

  // Details Card
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 75, 'FD');

  let profileAccent = neonBlue;
  if (analysis.eurClassification === 'Force-Dominant') profileAccent = alertRed;
  if (analysis.eurClassification === 'Elastic-Dominant') profileAccent = [168, 85, 247]; // Purple

  doc.setDrawColor(profileAccent[0], profileAccent[1], profileAccent[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 75);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`ATHLETIC BIOTYPE: ${analysis.eurClassification.toUpperCase()}`, margin + 6, y + 6);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`PRIMARY FOCUS:`, margin + 6, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(analysis.recommendations.focus, margin + 38, y + 12);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`PHASE GOAL:`, margin + 6, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(analysis.recommendations.goal, margin + 38, y + 17);

  // Recommendations split list
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY PROTOCOLS / DRILLS:', margin + 6, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(8);
  
  // Combine biotype protocols with LSI unilateral recommendations if LSI < 90%
  const finalProtocols = [...analysis.recommendations.protocols];
  if (lsiDeficit) {
    finalProtocols.unshift('Asymmetry Work: Prioritize unilateral strength, split squats, and single-leg landing stabilization.');
  }

  // Include coordination note if arm swing benefit is < 10%
  if (analysis.armSwingBenefit < 10) {
    finalProtocols.push('Arm Coordination: Focus on arm-drive mechanics and timing during Abalakov triple extension jumps.');
  }

  finalProtocols.slice(0, 3).forEach((proto, idx) => {
    doc.text(`• ${proto}`, margin + 8, y + 28 + (idx * 4.5));
  });

  // Workout table inside card
  const tableY = y + 43;
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin + 6, tableY, contentWidth - 12, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SAMPLE PRESCRIPTION EXERCISE', margin + 10, tableY + 3.8);
  doc.text('SETS', margin + 95, tableY + 3.8, { align: 'center' });
  doc.text('REPS', margin + 115, tableY + 3.8, { align: 'center' });
  doc.text('INTENSITY / COACHING NOTE', margin + 130, tableY + 3.8);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  const finalWorkout = [...analysis.recommendations.workout];
  if (lsiDeficit) {
    finalWorkout.unshift({
      exercise: 'RFESS (Rear Foot Elevated Split Squat)',
      sets: '3 Sets',
      reps: '6/side',
      note: 'Focus on eccentric stability and unilateral knee tracking.'
    });
  }

  finalWorkout.slice(0, 3).forEach((item, idx) => {
    const rowY = tableY + 5 + (idx * 7);
    
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin + 6, rowY + 7, margin + contentWidth - 6, rowY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(item.exercise, margin + 10, rowY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(item.sets, margin + 95, rowY + 5, { align: 'center' });
    doc.text(item.reps, margin + 115, rowY + 5, { align: 'center' });
    
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFontSize(7);
    doc.text(item.note, margin + 130, rowY + 5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  });

  // Footer Page 2
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('FORCE PEAK Systems LLC • Page 2 of 2', margin + contentWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const safeName = athlete.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`ForcePeak_Report_${safeName}.pdf`);
};
