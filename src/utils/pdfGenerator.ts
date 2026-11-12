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
  doc.text('PEAK FORCE', margin + 8, margin + 14);

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
  doc.text('PEAK FORCE Performance Lab • Page 1 of 2', margin + contentWidth / 2, pageHeight - 10, { align: 'center' });

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
  doc.text('PEAK FORCE BIOMECHANICAL BIOTYPE REPORT', margin + 6, margin + 7.5);

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
  doc.text('PEAK FORCE Performance Lab • Page 2 of 2', margin + contentWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const safeName = athlete.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`PeakForce_Report_${safeName}.pdf`);
};

export interface WeeklyPDFOptions {
  schedule: Record<string, any[]>;
  dayTitles: Record<string, string>;
  weekDatesFull: (Date | null | undefined)[];
  selectedAthlete?: any;
  weeklyStats?: any;
  calculateDayVolume: (drills: any[]) => any;
  orientation?: 'portrait' | 'landscape';
  theme?: 'crimson' | 'navy' | 'green' | 'minimal' | 'dark';
}

/**
 * Generate a clean, extremely premium, online-coaching style PDF report.
 */
export async function generateWeeklyPDF({ 
  schedule, 
  dayTitles, 
  weekDatesFull, 
  selectedAthlete, 
  weeklyStats = { load: 0, intensity: 0, cnsPercentage: 0 }, 
  calculateDayVolume, 
  orientation = 'portrait', 
  theme = 'crimson' 
}: WeeklyPDFOptions): Promise<jsPDF> {
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
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal', 'Identity-H');
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'bold', 'Identity-H');
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'italic', 'Identity-H');
      fName = 'Cairo';
    }
  } catch (err) {
    console.error('Failed to load Arabic font Cairo:', err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Harmonious Visual Print Themes (matched to mockup specifications)
  const THEME_COLORS: Record<string, {
    primary: [number, number, number];
    secondary: [number, number, number];
    orange: [number, number, number];
    mid: [number, number, number];
    light: [number, number, number];
    faint: [number, number, number];
    border: [number, number, number];
    white: [number, number, number];
    cardBg: [number, number, number];
  }> = {
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

  const catColors: Record<string, { border: [number, number, number]; bg: [number, number, number]; label: string }> = {
    strength:  { border: C.primary, bg: C.cardBg, label: 'STRENGTH' },
    power:     { border: C.orange,  bg: C.faint,  label: 'PLYOS' },
    core:      { border: [168, 85, 247], bg: [250, 245, 255], label: 'CORE' },
    mobility:  { border: [239, 68, 68],  bg: [254, 242, 242], label: 'MOBILITY' },
    isometric: { border: [249, 115, 22], bg: [255, 247, 237], label: 'ISOMETRIC' },
    physical:  { border: C.mid, bg: C.faint, label: 'PHYSICAL' },
    speed:     { border: [16, 185, 129], bg: [240, 253, 244], label: 'SPEED' },
    endurance: { border: [20, 184, 166], bg: [240, 253, 250], label: 'ENDURANCE' }
  };

  const safeTxt = (val: any) => {
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
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.primary);
      doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

      doc.setFontSize(8.5);
      doc.setFont(fName, 'normal');
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
      doc.setFont(fName, 'bold');
      doc.setTextColor(C.white[0], C.white[1], C.white[2]);
      doc.text(day.toUpperCase(), margin + 5, y + 9.5);

      doc.setFontSize(8.5);
      doc.setFont(fName, 'normal');
      doc.setTextColor(...C.light);
      doc.text(fullDateStr, pageWidth - margin - 5, y + 9.5, { align: 'right' });
      y += 20;

      // Session Focus Focus Bar
      doc.setFillColor(...C.cardBg);
      doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'F');
      
      doc.setFontSize(8.5);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.orange);
      doc.text('SESSION FOCUS:', margin + 4, y + 6);

      doc.setFontSize(9.5);
      doc.setFont(fName, 'bold');
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
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.mid);
      doc.text('TOTAL EXERCISES', margin + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.primary);
      doc.text(`${dayDrills.length} Drills`, margin + 6, y + 9.5);

      // Col 2: Load
      doc.setFontSize(7.5);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.mid);
      doc.text('CALCULATED LOAD', margin + colWidth + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.primary);
      doc.text(`${dayStats.totalVolumeScore} pts`, margin + colWidth + 6, y + 9.5);

      // Col 3: Details
      doc.setFontSize(7.5);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.mid);
      doc.text('ATHLETIC PROFILE', margin + colWidth * 2 + 6, y + 4.5);
      doc.setFontSize(9.5);
      doc.setFont(fName, 'bold');
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
        doc.setFont(fName, 'bold');
        doc.setTextColor(...C.mid);
        doc.text('REST & ACTIVE RECOVERY', pageWidth / 2, y + 22, { align: 'center' });

        doc.setFontSize(9.5);
        doc.setFont(fName, 'normal');
        doc.setTextColor(...C.light);
        doc.text('No formal drills scheduled. Prioritize sleep, hydration, and gentle mobility.', pageWidth / 2, y + 31, { align: 'center' });
      } else {
        // Table Header
        doc.setFillColor(...C.primary);
        doc.rect(margin, y, contentWidth, 7, 'F');

        doc.setFontSize(7.5);
        doc.setFont(fName, 'bold');
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
          const hasVideo = !!(drill.video_url && drill.video_url.trim());
          const videoHeight = hasVideo ? 4 : 0;
          const titleHeight = titleLines.length * 4 + videoHeight;
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
            doc.setFont(fName, 'bold');
            doc.setTextColor(...C.primary);
            doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

            doc.setFontSize(8.5);
            doc.setFont(fName, 'normal');
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
            doc.setFont(fName, 'bold');
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
          doc.setFont(fName, 'bold');
          doc.setTextColor(...C.mid);
          doc.text(String(idx + 1), margin + 4, y + 5);

          // Draw Title Lines
          doc.setFontSize(9.5);
          doc.setFont(fName, 'bold');
          doc.setTextColor(...C.primary);
          titleLines.forEach((tLine: string, tIdx: number) => {
            doc.text(tLine, margin + 10, y + 5 + (tIdx * 4));
          });

          if (hasVideo) {
            doc.setFontSize(8);
            doc.setFont(fName, 'bold');
            doc.setTextColor(0, 102, 204);
            const linkText = 'Watch Video';
            const linkTextWidth = doc.getTextWidth(linkText);
            const linkY = y + 5 + (titleLines.length * 4);
            doc.text(linkText, margin + 10, linkY);
            doc.link(margin + 10, linkY - 2.5, linkTextWidth, 3.5, { url: drill.video_url.trim() });
            
            // Draw underline
            doc.setDrawColor(0, 102, 204);
            doc.setLineWidth(0.15);
            doc.line(margin + 10, linkY + 0.5, margin + 10 + linkTextWidth, linkY + 0.5);
            doc.setFont(fName, 'bold');
          }

          // Draw VBT speed indicators if present
          const meanVel = drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity;
          const peakVel = drill.peakVelocity || drill.peak_velocity || drill.rpe;
          let vbtStr = '';
          if (meanVel || peakVel) {
            vbtStr = [meanVel ? `MV: ${meanVel} m/s` : '', peakVel ? `PV: ${peakVel} m/s` : '', drill.velocityLoss ? `Loss: ${drill.velocityLoss}` : ''].filter(Boolean).join(' | ');
          }

          let currentNoteY = y + 5 + titleHeight + 1;
          if (vbtStr) {
            doc.setFontSize(7.5);
            doc.setFont(fName, 'bold');
            doc.setTextColor(0, 150, 214);
            doc.text(vbtStr, margin + 10, currentNoteY);
            currentNoteY += 3.5;
          }

          // Draw FULL Exercise Notes (wrap cleanly)
          if (noteStr) {
            doc.setFontSize(7.5);
            doc.setFont(fName, 'italic');
            doc.setTextColor(...C.mid);
            noteLines.forEach((nLine: string, nIdx: number) => {
              doc.text(nLine, margin + 10, currentNoteY + (nIdx * 3.2));
            });
          }

          // Draw Workout parameters (Sets, volume, reps, rest) centered in the middle of card
          doc.setFontSize(9.5);
          doc.setFont(fName, 'bold');
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
          const hasW = drill.weight !== undefined && drill.weight !== null && drill.weight !== '';
          const wStr = hasW ? `${drill.weight}${(drill.weightUnit || drill.weight_unit || 'kg').toUpperCase()}` : '';
          const loadDisplay = (pct && wStr) ? `${wStr} (${pct}%)` : (wStr || (pct ? `${pct}%` : '-'));
          doc.text(loadDisplay, margin + 148, dataY, { align: 'center' });

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
        doc.setFont(fName, 'bold');
        doc.setTextColor(...C.orange);
        doc.text('COACH PERFORMANCE BRIEF & TIPS', margin + 8, y + 6.8);

        doc.setFontSize(8);
        doc.setFont(fName, 'normal');
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
      doc.setFont(fName, 'normal');
      doc.text('PEAK FORCE Performance Lab', margin, pageHeight - 8);
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
    doc.setFont(fName, 'bold');
    doc.setTextColor(...C.primary);
    doc.text('PEAK FORCE PERFORMANCE LAB', margin, y);

    doc.setFontSize(9);
    doc.setFont(fName, 'normal');
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
    doc.setFont(fName, 'bold');
    doc.setTextColor(...C.orange);
    doc.text('WEEKLY CYCLE:', margin + 4, y + 6.5);
    
    doc.setFontSize(9);
    doc.setFont(fName, 'bold');
    doc.setTextColor(...C.primary);
    doc.text(`${dateStart.toUpperCase()} - ${dateEnd.toUpperCase()}`, margin + 30, y + 6.5);

    // Total stats summary on the right
    doc.setFontSize(8);
    doc.setFont(fName, 'bold');
    doc.setTextColor(...C.mid);
    doc.text(`WEEK VOLUME SCORE:  ${weeklyStats.load} pts   |   AVG INTENSITY:  ${weeklyStats.intensity}%   |   CNS SPLIT:  ${weeklyStats.cnsPercentage}% CNS`, pageWidth - margin - 4, y + 6.5, { align: 'right' });
    y += 15;

    // 2. Render 7 Columns Side-by-Side (One for each day)
    const totalGap = 2; 
    const colCount = 7;
    const colWidth = (contentWidth - (totalGap * (colCount - 1))) / colCount;
    const gridHeight = pageHeight - y - 16;

    // Calculate maximum number of drills dynamically to scale cards to fit in one A4 sheet
    let maxDrillsInAnyDay = 0;
    DAYS_OF_WEEK.forEach(day => {
      maxDrillsInAnyDay = Math.max(maxDrillsInAnyDay, (schedule[day] || []).length);
    });

    const maxColDrills = Math.max(8, maxDrillsInAnyDay);
    const cardGap = maxColDrills > 12 ? 0.35 : (maxColDrills > 10 ? 0.5 : (maxColDrills > 8 ? 0.6 : 1.2));
    const cardHeight = Math.max(7.5, Math.min(15, (gridHeight - 22 - (cardGap * (maxColDrills - 1))) / maxColDrills));

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
      doc.setFont(fName, 'bold');
      doc.setTextColor(C.white[0], C.white[1], C.white[2]);
      doc.text(day.toUpperCase().substring(0, 3), colX + 3, y + 6.5);

      // Date number
      doc.setFontSize(9);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.orange);
      doc.text(String(dateDay), colX + colWidth - 7, y + 6.5);

      // Divider
      doc.setDrawColor(...C.orange);
      doc.setLineWidth(0.8);
      doc.line(colX, y + 10, colX + colWidth, y + 10);

      // Focus label
      doc.setFontSize(7);
      doc.setFont(fName, 'bold');
      doc.setTextColor(...C.mid);
      doc.text(dayTitle.substring(0, 22).toUpperCase(), colX + 3, y + 14);

      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.line(colX + 2, y + 16, colX + colWidth - 2, y + 16);

      // Render Drills in this column
      let drillY = y + 19;

      if (dayDrills.length === 0) {
        doc.setFontSize(8.5);
        doc.setFont(fName, 'bold');
        doc.setTextColor(...C.mid);
        doc.text('REST DAY', colX + colWidth / 2, y + 45, { align: 'center' });
      } else {
        dayDrills.forEach((drill, drillIdx) => {
          if (drillIdx >= maxColDrills) return; // Prevent card overflow

          const type = (drill.type || 'physical').toLowerCase();
          const cat = catColors[type] || catColors.physical;

          // Background card for exercise
          doc.setFillColor(...(theme === 'dark' ? C.white : [255, 255, 255]));
          doc.roundedRect(colX + 2, drillY, colWidth - 4, cardHeight, 1, 1, 'F');
          
          doc.setDrawColor(...C.border);
          doc.setLineWidth(0.15);
          doc.roundedRect(colX + 2, drillY, colWidth - 4, cardHeight, 1, 1, 'S');

          // Accent bar left
          doc.setFillColor(...cat.border);
          doc.rect(colX + 2, drillY, 1, cardHeight, 'F');

          // Dynamic Text Sizes based on scaled card height
          const titleFontSize = cardHeight < 10 ? 6.2 : (cardHeight < 12 ? 6.8 : 7.5);
          const titleOffset = cardHeight < 10 ? 3 : (cardHeight < 12 ? 3.5 : 4);
          
          const paramFontSize = cardHeight < 10 ? 5.8 : (cardHeight < 12 ? 6.5 : 7.5);
          const paramOffset = cardHeight < 10 ? 6.2 : (cardHeight < 12 ? 7.5 : 8.5);
          
          const footerFontSize = cardHeight < 10 ? 5.2 : (cardHeight < 12 ? 5.8 : 6.5);
          const footerOffset = cardHeight < 10 ? 9.2 : (cardHeight < 12 ? 11 : 12.5);

          // Exercise Title
          doc.setFontSize(titleFontSize);
          doc.setFont(fName, 'bold');
          doc.setTextColor(...C.primary);
          const drillTitle = safeTxt(drill.title || 'Drill');
          const hasVideo = !!(drill.video_url && drill.video_url.trim());
          if (hasVideo) {
            doc.text(drillTitle.substring(0, 14), colX + 4.5, drillY + titleOffset);
            doc.setFontSize(titleFontSize - 0.5);
            doc.setTextColor(0, 102, 204);
            const linkText = 'Link';
            const linkTextWidth = doc.getTextWidth(linkText);
            const linkY = drillY + titleOffset;
            const linkX = colX + colWidth - 3 - linkTextWidth;
            doc.text(linkText, colX + colWidth - 3, linkY, { align: 'right' });
            doc.link(linkX, linkY - 2.2, linkTextWidth, 3, { url: drill.video_url.trim() });
            doc.setFont(fName, 'bold');
          } else {
            doc.text(drillTitle.substring(0, 21), colX + 4.5, drillY + titleOffset);
          }

          // Workout Prescription Parameters (Sets x Reps)
          doc.setFontSize(paramFontSize);
          doc.setFont(fName, 'bold');
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
          const weightStr = (drill.weight !== undefined && drill.weight !== null && drill.weight !== '') ? `${drill.weight}${(drill.weightUnit || drill.weight_unit || 'kg').toUpperCase()}` : '';
          const intensityStr = drill.percentage ? `@${drill.percentage}%` : '';
          const loadStr = [weightStr, intensityStr].filter(Boolean).join(' ');
          doc.text(`${setsStr} x ${repsStr} ${loadStr}`.trim(), colX + 4.5, drillY + paramOffset);

          // Rest interval, VBT and notes combined
          let footerTxt = '';
          const meanVelL = drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity;
          const peakVelL = drill.peakVelocity || drill.peak_velocity || drill.rpe;
          if (meanVelL) footerTxt += `MV:${meanVelL}`;
          if (peakVelL) {
            if (footerTxt) footerTxt += ' ';
            footerTxt += `PV:${peakVelL}`;
          }
          if (drill.rest) {
            if (footerTxt) footerTxt += ' | ';
            footerTxt += `R:${drill.rest}`;
          }
          if (drill.details) {
            const cleanNote = safeTxt(drill.details);
            if (cleanNote) {
              if (footerTxt) footerTxt += ' | ';
              footerTxt += cleanNote;
            }
          }
          if (footerTxt && cardHeight >= 9.2) {
            doc.setFontSize(footerFontSize);
            doc.setFont(fName, 'normal');
            doc.setTextColor(...C.mid);
            // Truncate to fit column card safely
            const colLimit = cardHeight < 11 ? 32 : 26;
            const truncatedFooter = footerTxt.length > colLimit ? footerTxt.substring(0, colLimit - 3) + '...' : footerTxt;
            doc.text(truncatedFooter, colX + 4.5, drillY + footerOffset);
          }

          drillY += cardHeight + cardGap;
        });
        
        // Show count indicator if exercises are compressed
        if (dayDrills.length > maxColDrills) {
          doc.setFontSize(6.5);
          doc.setFont(fName, 'bold');
          doc.setTextColor(...C.orange);
          doc.text(`+ ${dayDrills.length - maxColDrills} more drills`, colX + colWidth / 2, drillY + 2, { align: 'center' });
        }
      }
    });

    // Page Footer
    doc.setFontSize(7.5);
    doc.setTextColor(...C.mid);
    doc.setFont(fName, 'normal');
    doc.text('PEAK FORCE Performance Lab  |  Landscape Grid Blueprint', margin, pageHeight - 6);
    doc.text(`Generated for Athlete: ${athleteName}   |   Page 1 of 1`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save PDF file safely using only ASCII characters for the filename to prevent browser download crashes
  const asciiAthleteName = athleteName.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_').trim() || 'Athlete';
  const fileName = `PeakForce_${orientation === 'landscape' ? 'Weekly_Grid' : 'Vertical_Plan'}_${asciiAthleteName}.pdf`;

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 1000);
    } catch (e) {
      console.error('Mobile blob error, falling back to doc.save:', e);
      doc.save(fileName);
    }
  } else {
    doc.save(fileName);
  }
  return doc;
}
