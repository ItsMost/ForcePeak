import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { AthleteData, TestScores, AssessmentRecord } from '../services/dbService';
import { generatePDF } from '../utils/pdfGenerator';
import {
  Activity,
  TrendingUp,
  User,
  Download,
  Trash2,
  Search,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Flame,
  Users,
  ShieldAlert,
  Dumbbell,
  CheckCircle2,
  TrendingDown,
  BookOpen,
  X
} from 'lucide-react';

export default function BiomechanicsDashboard() {
  // --- State Variables ---
  const [athlete, setAthlete] = useState<AthleteData>({
    name: '',
    gender: 'Male',
    age: 22
  });

  const [scores, setScores] = useState<TestScores>({
    sjNoArm: 35.0,
    sjArm: 39.0,
    cmjNoArm: 39.5,
    cmjArm: 44.5,
    rsi: 1.85,
    bodyweight: 80.0,
    slCmjLeft: 16.0,
    slCmjRight: 16.5,
    standReach: 220,
    jumpReach: 280,
    vj: 60
  });

  const [activeAnalysis, setActiveAnalysis] = useState<AssessmentRecord | null>(null);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [benchmarkActiveTab, setBenchmarkActiveTab] = useState<'rsi' | 'eur' | 'lsi' | 'power' | 'armSwing' | 'vjBenchmarks'>('rsi');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);

  // --- Load History on Mount ---
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const allRecords = await dbService.fetchAssessments();
      setHistory(allRecords);

      // If we don't have an active analysis, load the first one if history is populated
      if (allRecords.length > 0 && !activeAnalysis) {
        setActiveAnalysis(allRecords[0]);
        setAthlete({
          name: allRecords[0].name,
          gender: allRecords[0].gender,
          age: allRecords[0].age
        });
        setScores({
          sjNoArm: allRecords[0].sjNoArm,
          sjArm: allRecords[0].sjArm,
          cmjNoArm: allRecords[0].cmjNoArm,
          cmjArm: allRecords[0].cmjArm,
          rsi: allRecords[0].rsi,
          bodyweight: allRecords[0].bodyweight,
          slCmjLeft: allRecords[0].slCmjLeft,
          slCmjRight: allRecords[0].slCmjRight,
          standReach: allRecords[0].standReach || 0,
          jumpReach: allRecords[0].jumpReach || 0,
          vj: allRecords[0].vj || 0
        });
      }
    } catch (err) {
      console.error('Failed to load assessments from dbService', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Biomechanical Calculation Core ---
  const calculateAnalysis = (ath: AthleteData, sc: TestScores): AssessmentRecord => {
    // 1. EUR (Eccentric Utilization Ratio) using isolated SJ No Arm
    const eur = sc.sjNoArm > 0 ? sc.cmjNoArm / sc.sjNoArm : 0;

    let eurClassification: 'Force-Dominant' | 'Elastic-Dominant' | 'Balanced' = 'Balanced';
    if (eur > 1.15) {
      eurClassification = 'Elastic-Dominant';
    } else if (eur < 1.10) {
      eurClassification = 'Force-Dominant';
    }

    // 2. RSI (Reactive Strength Index)
    const rsi = sc.rsi;

    // RSI Benchmarks (Shifted down by 15% if Under 16)
    const isYouth = ath.age < 16;
    const thresholdFactor = isYouth ? 0.85 : 1.0;

    let rsiRating: 'Poor' | 'Average' | 'Good' | 'Elite' = 'Poor';

    if (ath.gender === 'Male') {
      const eliteBoundary = 2.5 * thresholdFactor;
      const goodBoundary = 2.0 * thresholdFactor;
      const avgBoundary = 1.5 * thresholdFactor;

      if (rsi >= eliteBoundary) rsiRating = 'Elite';
      else if (rsi >= goodBoundary) rsiRating = 'Good';
      else if (rsi >= avgBoundary) rsiRating = 'Average';
      else rsiRating = 'Poor';
    } else {
      const eliteBoundary = 2.2 * thresholdFactor;
      const goodBoundary = 1.7 * thresholdFactor;
      const avgBoundary = 1.2 * thresholdFactor;

      if (rsi >= eliteBoundary) rsiRating = 'Elite';
      else if (rsi >= goodBoundary) rsiRating = 'Good';
      else if (rsi >= avgBoundary) rsiRating = 'Average';
      else rsiRating = 'Poor';
    }

    // 3. Limb Symmetry Index (LSI)
    let lsi = 100;
    if (sc.slCmjLeft > 0 || sc.slCmjRight > 0) {
      const maxSL = Math.max(sc.slCmjLeft, sc.slCmjRight);
      const minSL = Math.min(sc.slCmjLeft, sc.slCmjRight);
      lsi = maxSL > 0 ? (minSL / maxSL) * 100 : 100;
    }

    // 4. Peak Power Output (Sayers PAPw based on CMJ No-Arm)
    const peakPower = (60.7 * sc.cmjNoArm) + (45.3 * sc.bodyweight) - 2055;
    
    // 5. Relative Power Output
    const relativePower = sc.bodyweight > 0 ? peakPower / sc.bodyweight : 0;

    // 6. Arm Swing Benefit (%)
    const armSwingBenefit = sc.cmjNoArm > 0 ? ((sc.cmjArm - sc.cmjNoArm) / sc.cmjNoArm) * 100 : 0;

    // 7. Sargent Vertical Jump Reach delta
    const vj = sc.standReach !== undefined && sc.jumpReach !== undefined && sc.jumpReach > sc.standReach 
      ? sc.jumpReach - sc.standReach 
      : 0;

    return {
      date: new Date().toLocaleDateString('en-GB'),
      name: ath.name || 'Anonymous Athlete',
      gender: ath.gender,
      age: ath.age,
      sjNoArm: sc.sjNoArm,
      sjArm: sc.sjArm,
      cmjNoArm: sc.cmjNoArm,
      cmjArm: sc.cmjArm,
      rsi,
      bodyweight: sc.bodyweight,
      slCmjLeft: sc.slCmjLeft,
      slCmjRight: sc.slCmjRight,
      eur,
      eurClassification,
      rsiRating,
      lsi,
      peakPower,
      relativePower,
      armSwingBenefit,
      standReach: sc.standReach,
      jumpReach: sc.jumpReach,
      vj
    };
  };

  // --- Dynamic Coaching Recommendation Selector ---
  const getCoachingRecommendations = (classification: 'Force-Dominant' | 'Elastic-Dominant' | 'Balanced'): any => {
    switch (classification) {
      case 'Force-Dominant':
        return {
          focus: 'Stretch-Shortening Cycle (SSC) Reactivity & Ankle Stiffness',
          goal: 'Reduce Ground Contact Time, improve stiffness, and enhance fast-elastic response.',
          protocols: [
            'Fast SSC Plyometrics (stiff ankle pogo hops, low-box hurdle jumps)',
            'Shock Method: Depth jumps from moderate heights (30-45 cm) with focus on instant rebound',
            'Overspeed/Band-Assisted Jumps to overload takeoff velocities',
            'Dynamic Effort lifting days (submaximal loads moved at maximal speeds)'
          ],
          workout: [
            { exercise: 'Depth Jumps (from 40cm Box)', sets: '4 Sets', reps: '5 Reps', note: 'Ground contact < 150ms. React off floor immediately.' },
            { exercise: 'Stiff Ankle Pogo Hops', sets: '3 Sets', reps: '10 Hops', note: 'Maintain rigid ankle joint; prioritize height & stiffness.' },
            { exercise: 'Trap Bar Speed Jumps', sets: '4 Sets', reps: '4 Reps', note: 'Use 15-20% of 1RM. Explode through hip extension.' }
          ]
        };
      case 'Elastic-Dominant':
        return {
          focus: 'Absolute Force Production & Motor Unit Recruitment',
          goal: 'Develop absolute concentric strength, force output, and heavy bilateral force application.',
          protocols: [
            'Maximum Strength blocks focusing on high tension (80%+ 1RM)',
            'Concentric-Only Overload: Anderson Pin Squats and dead-stop deadlifts',
            'Heavy loaded squat jumps and weighted vertical bounds',
            'Minimize high-impact reactive drop jumps to conserve central nervous system'
          ],
          workout: [
            { exercise: 'Concentric Pin Squats (from 90°)', sets: '4 Sets', reps: '3 Reps', note: '85% 1RM. Start from dead stop; no stretch reflex.' },
            { exercise: 'Trap Bar Deadlift (Dead Stop)', sets: '3 Sets', reps: '5 Reps', note: '80% 1RM. Focus on absolute ground drive.' },
            { exercise: 'Weighted Squat Jumps (Dumbbells)', sets: '4 Sets', reps: '4 Reps', note: '15-20% bodyweight. Complete pause at bottom.' }
          ]
        };
      case 'Balanced':
      default:
        return {
          focus: 'Contrast Training, Concurrent Strength-Speed Profiling',
          goal: 'Enhance both velocity and force qualities concurrently, optimize force-velocity curve.',
          protocols: [
            'Contrast Training: Alternating heavy lifts with biomechanically matching plyometrics',
            'Undulating periodization covering absolute force and reactive power within the week',
            'Olympic Lift variations (Clean pulls, hang power cleans)',
            'Profile maintenance exercises focusing on technical vertical execution'
          ],
          workout: [
            { exercise: 'Back Squat (Contrast A1)', sets: '3 Sets', reps: '4 Reps', note: '80% 1RM. Fast concentric phase. Paired with A2.' },
            { exercise: 'Hurdle Hops (Contrast A2)', sets: '3 Sets', reps: '5 Jumps', note: 'Perform immediately after Squat. Double-contact bounce.' },
            { exercise: 'Hang Power Clean', sets: '4 Sets', reps: '3 Reps', note: '70% 1RM. Triple extension focus; snap under bar.' }
          ]
        };
    }
  };

  const getRsiRecommendation = (rating: 'Poor' | 'Average' | 'Good' | 'Elite'): string => {
    switch (rating) {
      case 'Poor':
        return 'Extensive low-level plyometrics (pogos, line hops) for tendon tolerance. Avoid high-intensity drop jumps.';
      case 'Average':
        return 'Moderate plyometrics. Focus on stiff ankles and short ground contact times.';
      case 'Good':
        return 'Intensive plyometrics. Incorporate depth jumps from moderate heights.';
      case 'Elite':
        return 'Shock method and high-level depth jumps. Ensure absolute strength matches elastic capability.';
    }
  };

  // --- UI Action Handlers ---
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete.name.trim()) {
      alert('Please enter an athlete name.');
      return;
    }

    setSaveStatus('saving');
    const result = calculateAnalysis(athlete, scores);
    
    try {
      const inserted = await dbService.saveAssessment(
        athlete,
        scores,
        {
          ...result,
          recommendations: getCoachingRecommendations(result.eurClassification)
        }
      );

      setActiveAnalysis(inserted);
      setSaveStatus('success');
      await fetchAssessments();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save assessment', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleReachChange = (field: 'standReach' | 'jumpReach', value: number) => {
    setScores((prev) => {
      const updated = { ...prev, [field]: value };
      const stand = updated.standReach || 0;
      const jump = updated.jumpReach || 0;
      updated.vj = jump > stand ? jump - stand : 0;
      return updated;
    });
  };

  const handleSelectHistoryItem = (item: AssessmentRecord) => {
    setActiveAnalysis(item);
    setAthlete({
      name: item.name,
      gender: item.gender,
      age: item.age
    });
    setScores({
      sjNoArm: item.sjNoArm,
      sjArm: item.sjArm,
      cmjNoArm: item.cmjNoArm,
      cmjArm: item.cmjArm,
      rsi: item.rsi,
      bodyweight: item.bodyweight,
      slCmjLeft: item.slCmjLeft,
      slCmjRight: item.slCmjRight,
      standReach: item.standReach || 0,
      jumpReach: item.jumpReach || 0,
      vj: item.vj || 0
    });
  };

  const handleDeleteRecord = async (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this assessment record?')) return;

    try {
      const deleted = await dbService.deleteAssessment(id);
      if (deleted) {
        if (activeAnalysis?.id === id) {
          setActiveAnalysis(null);
        }
        await fetchAssessments();
      }
    } catch (err) {
      console.error('Failed to delete assessment', err);
    }
  };

  // Find previous test record for progression summary deltas
  const getPreviousTest = (currentRecord: AssessmentRecord): AssessmentRecord | null => {
    const athleteRecords = history
      .filter((h) => h.name.toLowerCase() === currentRecord.name.toLowerCase())
      .sort((a, b) => {
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        };
        return parseDate(a.date) - parseDate(b.date); // Oldest first
      });

    const currentIndex = athleteRecords.findIndex(
      (r) =>
        r.id === currentRecord.id ||
        (r.date === currentRecord.date && r.name === currentRecord.name)
    );
    if (currentIndex > 0) {
      return athleteRecords[currentIndex - 1]; // Return the one before it
    }
    return null;
  };

  const handleDownloadPDF = () => {
    if (!activeAnalysis) return;
    const recommendations = getCoachingRecommendations(activeAnalysis.eurClassification);
    const prev = getPreviousTest(activeAnalysis);
    
    // Format prev details into a simplified format for pdfGenerator
    const prevPDFRecord = prev
      ? {
          date: prev.date,
          cmjNoArm: prev.cmjNoArm,
          cmjArm: prev.cmjArm,
          rsi: prev.rsi,
          lsi: prev.lsi,
          relativePower: prev.relativePower
        }
      : null;

    generatePDF(
      { name: activeAnalysis.name, gender: activeAnalysis.gender, age: activeAnalysis.age },
      {
        sjNoArm: activeAnalysis.sjNoArm,
        sjArm: activeAnalysis.sjArm,
        cmjNoArm: activeAnalysis.cmjNoArm,
        cmjArm: activeAnalysis.cmjArm,
        rsi: activeAnalysis.rsi,
        bodyweight: activeAnalysis.bodyweight,
        slCmjLeft: activeAnalysis.slCmjLeft,
        slCmjRight: activeAnalysis.slCmjRight,
        standReach: activeAnalysis.standReach,
        jumpReach: activeAnalysis.jumpReach,
        vj: activeAnalysis.vj
      },
      {
        eur: activeAnalysis.eur,
        rsi: activeAnalysis.rsi,
        eurClassification: activeAnalysis.eurClassification,
        rsiRating: activeAnalysis.rsiRating,
        lsi: activeAnalysis.lsi,
        peakPower: activeAnalysis.peakPower,
        relativePower: activeAnalysis.relativePower,
        armSwingBenefit: activeAnalysis.armSwingBenefit,
        recommendations
      },
      activeAnalysis.date,
      prevPDFRecord
    );
  };

  // --- Filtering History ---
  const filteredHistory = history.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Extract Athlete Progression for Charting ---
  const getProgressHistory = () => {
    if (!activeAnalysis) return [];
    // Get all records of the active athlete sorted chronologically by date
    return history
      .filter((h) => h.name.toLowerCase() === activeAnalysis.name.toLowerCase())
      .sort((a, b) => {
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        };
        return parseDate(a.date) - parseDate(b.date); // Oldest first
      });
  };

  const progressData = getProgressHistory();
  const coachingInsights = activeAnalysis
    ? getCoachingRecommendations(activeAnalysis.eurClassification)
    : null;

  const previousRecord = activeAnalysis ? getPreviousTest(activeAnalysis) : null;
  const lsiDeficit = activeAnalysis ? activeAnalysis.lsi < 90 : false;

  // --- Custom React SVG line chart engine ---
  const renderSVGProgressChart = () => {
    if (progressData.length < 2) {
      return (
        <div className="h-[180px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 bg-slate-950/20">
          More than 1 testing session required for multi-line progress trends.
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Extents
    const cmjNoArmVals = progressData.map((d) => d.cmjNoArm);
    const cmjArmVals = progressData.map((d) => d.cmjArm);
    const cmjVals = [...cmjNoArmVals, ...cmjArmVals];
    const rsiVals = progressData.map((d) => d.rsi);

    const minCmj = Math.min(...cmjVals) - 2;
    const maxCmj = Math.max(...cmjVals) + 2;

    const minRsi = Math.max(0, Math.min(...rsiVals) - 0.2);
    const maxRsi = Math.max(...rsiVals) + 0.2;

    // Grid details
    const pointsCount = progressData.length;
    const xPositions = progressData.map((_, i) => {
      return paddingLeft + (i / (pointsCount - 1)) * chartWidth;
    });

    const cmjNoArmPoints = progressData.map((d, i) => {
      const x = xPositions[i];
      const y = paddingTop + chartHeight - ((d.cmjNoArm - minCmj) / (maxCmj - minCmj)) * chartHeight;
      return { x, y, val: d.cmjNoArm };
    });

    const cmjArmPoints = progressData.map((d, i) => {
      const x = xPositions[i];
      const y = paddingTop + chartHeight - ((d.cmjArm - minCmj) / (maxCmj - minCmj)) * chartHeight;
      return { x, y, val: d.cmjArm };
    });

    const rsiPoints = progressData.map((d, i) => {
      const x = xPositions[i];
      const y = paddingTop + chartHeight - ((d.rsi - minRsi) / (maxRsi - minRsi)) * chartHeight;
      return { x, y, val: d.rsi };
    });

    const cmjNoArmPath = cmjNoArmPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const cmjArmPath = cmjArmPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const rsiPath = rsiPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Chart Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
            const yLine = paddingTop + val * chartHeight;
            return (
              <line
                key={idx}
                x1={paddingLeft}
                y1={yLine}
                x2={width - paddingRight}
                y2={yLine}
                className="stroke-slate-800/80 stroke-1 stroke-dasharray-[3,3]"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Left Y Axis Labels: CMJ (Cyan) */}
          <text x={paddingLeft - 8} y={paddingTop + 3} className="fill-cyan-400 font-bold text-[9px]" textAnchor="end">
            {maxCmj.toFixed(0)}cm
          </text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 3} className="fill-cyan-500/80 text-[8px]" textAnchor="end">
            {((maxCmj + minCmj) / 2).toFixed(0)}cm
          </text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight + 3} className="fill-cyan-600 text-[9px]" textAnchor="end">
            {minCmj.toFixed(0)}cm
          </text>

          {/* Right Y Axis Labels: RSI (Magenta) */}
          <text x={width - paddingRight + 8} y={paddingTop + 3} className="fill-fuchsia-400 font-bold text-[9px]" textAnchor="start">
            {maxRsi.toFixed(1)}
          </text>
          <text x={width - paddingRight + 8} y={paddingTop + chartHeight / 2 + 3} className="fill-fuchsia-500/80 text-[8px]" textAnchor="start">
            {((maxRsi + minRsi) / 2).toFixed(1)}
          </text>
          <text x={width - paddingRight + 8} y={paddingTop + chartHeight + 3} className="fill-fuchsia-600 text-[9px]" textAnchor="start">
            {minRsi.toFixed(1)}
          </text>

          {/* Lines paths with neon glow filters */}
          {/* CMJ No Arm: Solid Cyan */}
          <path
            d={cmjNoArmPath}
            fill="none"
            className="stroke-cyan-400 stroke-2.5 transition-all duration-300"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* CMJ Arm: Dashed Blue */}
          <path
            d={cmjArmPath}
            fill="none"
            className="stroke-blue-500 stroke-2 transition-all duration-300"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* RSI: Solid Fuchsia */}
          <path
            d={rsiPath}
            fill="none"
            className="stroke-fuchsia-500 stroke-2.5 transition-all duration-300"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Draw interactive hovering cursor line */}
          {hoveredChartPoint !== null && (
            <line
              x1={xPositions[hoveredChartPoint]}
              y1={paddingTop - 5}
              x2={xPositions[hoveredChartPoint]}
              y2={paddingTop + chartHeight + 5}
              className="stroke-cyan-400/30 stroke-1"
              strokeDasharray="2 2"
            />
          )}

          {/* CMJ No Arm Nodes */}
          {cmjNoArmPoints.map((p, idx) => (
            <g key={`cmj-noarm-${idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredChartPoint === idx ? 4.5 : 3}
                className="fill-slate-950 stroke-cyan-400 stroke-2 cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredChartPoint(idx)}
                onMouseLeave={() => setHoveredChartPoint(null)}
              />
            </g>
          ))}

          {/* CMJ Arm Nodes */}
          {cmjArmPoints.map((p, idx) => (
            <g key={`cmj-arm-${idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredChartPoint === idx ? 4.5 : 3}
                className="fill-slate-950 stroke-blue-500 stroke-2 cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredChartPoint(idx)}
                onMouseLeave={() => setHoveredChartPoint(null)}
              />
            </g>
          ))}

          {/* RSI Nodes */}
          {rsiPoints.map((p, idx) => (
            <g key={`rsi-${idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredChartPoint === idx ? 4.5 : 3}
                className="fill-slate-950 stroke-fuchsia-500 stroke-2 cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredChartPoint(idx)}
                onMouseLeave={() => setHoveredChartPoint(null)}
              />
            </g>
          ))}

          {/* X Axis Date labels */}
          {progressData.map((d, i) => {
            const x = xPositions[i];
            const dateParts = d.date.split('/');
            const shortDate = `${dateParts[0]}/${dateParts[1]}`;
            return (
              <text
                key={i}
                x={x}
                y={paddingTop + chartHeight + 15}
                className="fill-slate-400 text-[8px] font-medium"
                textAnchor="middle"
              >
                {shortDate}
              </text>
            );
          })}
        </svg>

        {/* Dynamic Legend / Tooltip display block */}
        <div className="absolute -top-3 left-4 right-4 flex items-center justify-between text-[9px] bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-900 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400">CMJ NAS</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded bg-blue-500"></span>
              <span className="text-slate-400">CMJ AS</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500"></span>
              <span className="text-slate-400">RSI</span>
            </span>
          </div>

          {hoveredChartPoint !== null ? (
            <div className="flex items-center space-x-2 text-[9px] text-slate-200">
              <span>Date: <strong>{progressData[hoveredChartPoint].date}</strong></span>
              <span>•</span>
              <span className="text-cyan-450">NAS: <strong>{progressData[hoveredChartPoint].cmjNoArm.toFixed(0)}cm</strong></span>
              <span>•</span>
              <span className="text-blue-450">AS: <strong>{progressData[hoveredChartPoint].cmjArm.toFixed(0)}cm</strong></span>
              <span>•</span>
              <span className="text-fuchsia-450">RSI: <strong>{progressData[hoveredChartPoint].rsi.toFixed(2)}</strong></span>
            </div>
          ) : (
            <div className="text-[8px] text-slate-500 italic">Hover points to trace scores</div>
          )}
        </div>
      </div>
    );
  };

  // --- Filtering History ---
  const filteredHistoryList = filteredHistory;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-12 selection:bg-cyan-500/20">
      {/* Top Glassmorphic Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/60 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
              <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FORCE <span className="text-cyan-400">PEAK</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Elite Biomechanics & Performance Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all duration-200"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>View Benchmarks</span>
            </button>
            <button
              onClick={fetchAssessments}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200"
              title="Sync Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Supabase Engine Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Inputs & Saved History (Span 5) */}
          <section className="lg:col-span-5 space-y-8">
            
            {/* Athlete Data Entry Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:border-slate-700/80">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
              
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-cyan-400" />
                Athlete Assessment Input
              </h2>

              <form onSubmit={handleAnalyze} className="space-y-5">
                {/* Athlete Name */}
                <div>
                  <label htmlFor="athlete-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Athlete Name
                  </label>
                  <input
                    type="text"
                    id="athlete-name"
                    value={athlete.name}
                    onChange={(e) => setAthlete({ ...athlete, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    placeholder="Enter athlete's full name"
                    required
                  />
                </div>

                {/* Gender, Age, and Bodyweight */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="gender" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={athlete.gender}
                      onChange={(e) => setAthlete({ ...athlete, gender: e.target.value as 'Male' | 'Female' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:border-cyan-500 outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      value={athlete.age}
                      onChange={(e) => setAthlete({ ...athlete, age: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:border-cyan-500 outline-none transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="weight" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      value={scores.bodyweight}
                      onChange={(e) => setScores({ ...scores, bodyweight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs focus:border-cyan-500 outline-none transition-all"
                      step="0.1"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-800/80 my-2"></div>

                {/* Squat Jump & CMJ Jumps */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-cyan-400" />
                  Bilateral Jump Heights (cm)
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sj-no-arm" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        SJ - No Arm Swing (NAS)
                      </label>
                      <input
                        type="number"
                        id="sj-no-arm"
                        value={scores.sjNoArm}
                        onChange={(e) => setScores({ ...scores, sjNoArm: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="sj-arm" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        SJ - With Arm Swing (AS)
                      </label>
                      <input
                        type="number"
                        id="sj-arm"
                        value={scores.sjArm}
                        onChange={(e) => setScores({ ...scores, sjArm: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cmj-no-arm" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        CMJ - No Arm Swing (NAS)
                      </label>
                      <input
                        type="number"
                        id="cmj-no-arm"
                        value={scores.cmjNoArm}
                        onChange={(e) => setScores({ ...scores, cmjNoArm: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cmj-arm" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        CMJ - With Arm Swing (AS)
                      </label>
                      <input
                        type="number"
                        id="cmj-arm"
                        value={scores.cmjArm}
                        onChange={(e) => setScores({ ...scores, cmjArm: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Single-Leg CMJ Parameters */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-cyan-400" />
                  Unilateral Jump Heights (SL CMJ)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sl-left" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      SL CMJ Left (cm)
                    </label>
                    <input
                      type="number"
                      id="sl-left"
                      value={scores.slCmjLeft}
                      onChange={(e) => setScores({ ...scores, slCmjLeft: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="sl-right" className="block text-[11px] font-semibold text-slate-400 mb-1">
                      SL CMJ Right (cm)
                    </label>
                    <input
                      type="number"
                      id="sl-right"
                      value={scores.slCmjRight}
                      onChange={(e) => setScores({ ...scores, slCmjRight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Sargent Reach Vertical Jump Test */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Vertical Jump (Sargent Reach Test)
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stand-reach" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Standing Reach (cm)
                      </label>
                      <input
                        type="number"
                        id="stand-reach"
                        value={scores.standReach || ''}
                        onChange={(e) => handleReachChange('standReach', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="jump-reach" className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Jump Reach (cm)
                      </label>
                      <input
                        type="number"
                        id="jump-reach"
                        value={scores.jumpReach || ''}
                        onChange={(e) => handleReachChange('jumpReach', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                  {scores.standReach && scores.jumpReach && scores.jumpReach > scores.standReach ? (
                    <div className="flex items-center justify-between text-[11px] bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850">
                      <span className="text-slate-400">Calculated VJ:</span>
                      <span className="text-cyan-400 font-bold">
                        {scores.vj?.toFixed(1)} cm ({(scores.vj ? scores.vj / 2.54 : 0).toFixed(1)} in)
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Reactive Strength Index Input */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Reactive Strength Index (OVR Device)
                </h3>
                <div>
                  <label htmlFor="rsi-input" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Reactive Strength Index (RSI)
                  </label>
                  <input
                    type="number"
                    id="rsi-input"
                    value={scores.rsi}
                    onChange={(e) => setScores({ ...scores, rsi: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Action Trigger Buttons */}
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 text-sm"
                >
                  <Activity className="h-4.5 w-4.5" />
                  {saveStatus === 'saving' ? 'Saving Assessment...' : 'Analyze Athlete'}
                </button>
              </form>
            </div>

            {/* Athlete Saved History Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-cyan-400" />
                  Athlete Database
                </h2>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700/80">
                  {history.length} Records
                </span>
              </div>

              {/* Search input bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search athletes by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:border-cyan-500 outline-none transition-all"
                />
              </div>

              {/* History scroll list */}
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {isLoading && history.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">Querying database...</div>
                ) : filteredHistoryList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">No records found.</div>
                ) : (
                  filteredHistoryList.map((record) => (
                    <div
                      key={record.id || record.name + record.date}
                      onClick={() => handleSelectHistoryItem(record)}
                      className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        activeAnalysis?.id === record.id || (activeAnalysis?.name === record.name && activeAnalysis?.date === record.date)
                          ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                          : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {record.name}
                          </p>
                          <span className="text-[9px] text-slate-500">• {record.gender[0]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {record.date}
                          </span>
                          <span>•</span>
                          <span>CMJ: <strong className="text-slate-200">{record.cmjNoArm.toFixed(0)}/{record.cmjArm.toFixed(0)}cm</strong></span>
                          <span>•</span>
                          <span>RSI: <strong className="text-slate-200">{record.rsi.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                          record.eurClassification === 'Force-Dominant'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : record.eurClassification === 'Elastic-Dominant'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {record.eurClassification === 'Force-Dominant' ? 'Force' : record.eurClassification === 'Elastic-Dominant' ? 'Elastic' : 'Balanced'}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Delete Assessment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Biomechanical Analysis Dashboard (Span 7) */}
          <section className="lg:col-span-7 space-y-8">
            
            {activeAnalysis ? (
              <div className="space-y-8 animate-fade-in">
                
                {/* Athlete Assessment Hero Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm shadow-xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white leading-tight">{activeAnalysis.name}</h2>
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                          {activeAnalysis.gender} ({activeAnalysis.age} yrs)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Test Date: {activeAnalysis.date}
                        </span>
                        <span>•</span>
                        <span>BW: <strong>{activeAnalysis.bodyweight.toFixed(1)} kg</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-white font-semibold rounded-xl px-4 py-2.5 text-xs transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    Download PDF Report
                  </button>
                </div>

                {/* Primary KPI Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* KPI 1: Eccentric Utilization Ratio (EUR) */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-450"></div>
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Eccentric Utilization Ratio
                        </span>
                        <h3 className="text-3xl font-black text-white">{activeAnalysis.eur.toFixed(2)}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        activeAnalysis.eurClassification === 'Force-Dominant'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : activeAnalysis.eurClassification === 'Elastic-Dominant'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {activeAnalysis.eurClassification}
                      </span>
                    </div>

                    <div className="mt-6 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>EUR Metric Target: 1.10 - 1.15</span>
                        <span>(CMJ / SJ)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            activeAnalysis.eurClassification === 'Force-Dominant'
                              ? 'bg-red-500'
                              : activeAnalysis.eurClassification === 'Elastic-Dominant'
                              ? 'bg-purple-500'
                              : 'bg-blue-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, ((activeAnalysis.eur - 0.7) / (1.5 - 0.7)) * 100))}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-3.5 flex items-center justify-between text-[10px] bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-850">
                        <span className="text-slate-400">Arm Swing Benefit (AS vs NAS):</span>
                        <span className="text-cyan-400 font-bold">{activeAnalysis.armSwingBenefit.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 2: Reactive Strength Index (RSI) */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400"></div>

                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Reactive Strength Index (RSI)
                        </span>
                        <h3 className="text-3xl font-black text-white">{activeAnalysis.rsi.toFixed(2)}</h3>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        activeAnalysis.rsiRating === 'Elite'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : activeAnalysis.rsiRating === 'Good'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : activeAnalysis.rsiRating === 'Average'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {activeAnalysis.rsiRating}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Source: OVR Optoelectric Device</span>
                        <span>Direct Input</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            activeAnalysis.rsiRating === 'Elite'
                              ? 'bg-emerald-400'
                              : activeAnalysis.rsiRating === 'Good'
                              ? 'bg-blue-400'
                              : activeAnalysis.rsiRating === 'Average'
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, (activeAnalysis.rsi / 3.0) * 100))}%` }}
                        ></div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed shadow-inner">
                        <span className="font-bold text-cyan-400 block mb-0.5">RSI Recommendation:</span>
                        {getRsiRecommendation(activeAnalysis.rsiRating)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Advanced Metrics Row: LSI & Sayers Power Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Limb Symmetry Index (LSI) Card */}
                  <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 ${
                    lsiDeficit 
                      ? 'border-red-500/40 bg-red-950/5 shadow-[0_0_15px_rgba(239,68,68,0.06)]' 
                      : 'border-slate-800 bg-slate-900/20'
                  }`}>
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${lsiDeficit ? 'bg-red-500' : 'bg-emerald-400'}`}></div>

                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Limb Symmetry Index (LSI)
                        </span>
                        <h3 className={`text-3xl font-black ${lsiDeficit ? 'text-red-400' : 'text-white'}`}>
                          {activeAnalysis.lsi.toFixed(1)}%
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase flex items-center gap-1 ${
                        lsiDeficit
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {lsiDeficit ? <ShieldAlert className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {lsiDeficit ? 'Alert' : 'Optimal'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Left SL CMJ: {activeAnalysis.slCmjLeft.toFixed(1)} cm</span>
                        <span>Right SL CMJ: {activeAnalysis.slCmjRight.toFixed(1)} cm</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${lsiDeficit ? 'bg-red-500' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, Math.max(10, activeAnalysis.lsi))}%` }}
                        ></div>
                      </div>

                      {lsiDeficit ? (
                        <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/35 text-[11px] text-red-200 leading-relaxed shadow-inner">
                          <span className="font-bold text-red-400 block mb-0.5">Red Flag: Asymmetry Detected</span>
                          Prioritize unilateral strength, split squats, and single-leg landing stabilization.
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                          Symmetrical profile (<span className="text-emerald-400">deficit &lt;10%</span>). Unilateral stability and force distribution are balanced.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sayers Power Profile Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400"></div>

                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Sayers Peak Power (PAPw)
                        </span>
                        <h3 className="text-3xl font-black text-white">
                          {activeAnalysis.peakPower.toFixed(0)} <span className="text-xs font-normal text-slate-400">W</span>
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950 text-slate-300 uppercase">
                        Explosiveness
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Relative Power:</span>
                        <span className="text-cyan-400 font-bold">{activeAnalysis.relativePower.toFixed(1)} W/kg</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        {/* Sayers power limit representation */}
                        <div
                          className="h-full rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                          style={{ width: `${Math.min(100, Math.max(10, (activeAnalysis.relativePower / 65) * 100))}%` }}
                        ></div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed shadow-inner">
                        <span className="font-bold text-cyan-400 block mb-0.5">PAPw Biometrics:</span>
                        Measures absolute peak power relative to body mass. Useful for monitoring vertical load adaptations.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Reach & Sargent Vertical Jump Profile Card */}
                {activeAnalysis.standReach && activeAnalysis.jumpReach && activeAnalysis.vj && activeAnalysis.standReach > 0 ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400"></div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Sargent Vertical Jump (Reach Delta)
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-3xl font-black text-white">
                            {activeAnalysis.vj.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm</span>
                          </h3>
                          <span className="text-xs text-slate-450 font-medium">
                            / {(activeAnalysis.vj / 2.54).toFixed(1)} in
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-850 w-full sm:w-auto">
                        <div>
                          <span className="text-slate-500 block uppercase text-[9px] font-bold">Standing Reach</span>
                          <span className="text-slate-200 font-mono font-bold">
                            {activeAnalysis.standReach.toFixed(1)} cm ({(activeAnalysis.standReach / 2.54).toFixed(1)} in)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[9px] font-bold">Jump Reach</span>
                          <span className="text-slate-200 font-mono font-bold">
                            {activeAnalysis.jumpReach.toFixed(1)} cm ({(activeAnalysis.jumpReach / 2.54).toFixed(1)} in)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Progress Summary comparison block */}
                {previousRecord && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Adaptation Change (vs. Test Date: {previousRecord.date})
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Comparing current performance with the athlete's previous testing session.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                      {/* CMJ Change */}
                      <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] text-slate-500 uppercase">CMJ Height</span>
                        <span className={`text-xs font-extrabold mt-0.5 block ${
                          activeAnalysis.cmjNoArm - previousRecord.cmjNoArm >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {activeAnalysis.cmjNoArm.toFixed(0)}cm ({activeAnalysis.cmjNoArm - previousRecord.cmjNoArm >= 0 ? '+' : ''}
                          {(activeAnalysis.cmjNoArm - previousRecord.cmjNoArm).toFixed(1)})
                        </span>
                      </div>
                      {/* RSI Change */}
                      <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] text-slate-500 uppercase">RSI</span>
                        <span className={`text-xs font-extrabold mt-0.5 block ${
                          activeAnalysis.rsi - previousRecord.rsi >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {activeAnalysis.rsi.toFixed(2)} ({activeAnalysis.rsi - previousRecord.rsi >= 0 ? '+' : ''}
                          {(activeAnalysis.rsi - previousRecord.rsi).toFixed(2)})
                        </span>
                      </div>
                      {/* LSI Change */}
                      <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] text-slate-500 uppercase">Symmetry</span>
                        <span className={`text-xs font-extrabold mt-0.5 block ${
                          activeAnalysis.lsi - previousRecord.lsi >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {activeAnalysis.lsi.toFixed(1)}% ({activeAnalysis.lsi - previousRecord.lsi >= 0 ? '+' : ''}
                          {(activeAnalysis.lsi - previousRecord.lsi).toFixed(1)}%)
                        </span>
                      </div>
                      {/* Relative Power Change */}
                      <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] text-slate-500 uppercase">Rel Power</span>
                        <span className={`text-xs font-extrabold mt-0.5 block ${
                          activeAnalysis.relativePower - previousRecord.relativePower >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {activeAnalysis.relativePower.toFixed(1)} W/kg ({activeAnalysis.relativePower - previousRecord.relativePower >= 0 ? '+' : ''}
                          {(activeAnalysis.relativePower - previousRecord.relativePower).toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SVG Progress Tracking Graph Card */}
                {progressData.length >= 2 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                        Testing Adaptations Over Time
                      </h3>
                      <span className="text-[9px] text-slate-500">
                        Tracks CMJ Height & RSI Progression
                      </span>
                    </div>
                    {renderSVGProgressChart()}
                  </div>
                )}

                {/* Force vs. Elastic Spectrum Deficit Matrix (Linear Slider) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Force-Elastic Deficit Matrix Slider
                  </h3>

                  <div className="relative pt-6 pb-2">
                    <div className="h-3 w-full rounded-full bg-slate-950 relative overflow-hidden flex">
                      <div className="h-full bg-gradient-to-r from-red-600/40 to-red-500/30" style={{ width: '42.8%' }}></div>
                      <div className="h-full bg-blue-500/30" style={{ width: '7.2%' }}></div>
                      <div className="h-full bg-gradient-to-r from-purple-500/30 to-purple-600/40" style={{ width: '50%' }}></div>
                    </div>

                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                      <div className="absolute left-[42.8%] top-3 bottom-1 border-l border-slate-700/80">
                        <span className="absolute -top-6 -left-4 text-[9px] text-slate-500 font-bold">1.10</span>
                      </div>
                      <div className="absolute left-[50%] top-3 bottom-1 border-l border-slate-700/80">
                        <span className="absolute -top-6 -left-4 text-[9px] text-slate-500 font-bold">1.15</span>
                      </div>
                      <div className="absolute left-0 top-3 bottom-1">
                        <span className="absolute -top-6 left-0 text-[9px] text-slate-500 font-bold">0.80</span>
                      </div>
                      <div className="absolute right-0 top-3 bottom-1">
                        <span className="absolute -top-6 right-0 text-[9px] text-slate-500 font-bold">1.50+</span>
                      </div>
                    </div>

                    {(() => {
                      const value = activeAnalysis.eur;
                      let percent = ((value - 0.8) / (1.5 - 0.8)) * 100;
                      if (percent < 0) percent = 0;
                      if (percent > 100) percent = 100;
                      
                      return (
                        <div
                          className="absolute top-[21px] -ml-2.5 transition-all duration-500 ease-out"
                          style={{ left: `${percent}%` }}
                        >
                          <div className="relative">
                            <div className="absolute -inset-2 bg-cyan-400/35 rounded-full blur-sm animate-ping"></div>
                            <div className="h-5 w-5 rounded-full bg-slate-950 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] flex items-center justify-center relative z-10">
                              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400"></div>
                            </div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                              {value.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-8 text-center text-[10px] font-semibold text-slate-400">
                    <div className="p-2.5 rounded-lg bg-red-950/5 border border-red-900/10">
                      <p className="text-red-400 font-bold">Force-Dominant</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">EUR &lt; 1.10 (Elastic Deficit)</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-950/5 border border-blue-900/10">
                      <p className="text-blue-400 font-bold">Balanced Profile</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">EUR 1.10 - 1.15 (Optimized)</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-950/5 border border-purple-900/10">
                      <p className="text-purple-400 font-bold">Elastic-Dominant</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">EUR &gt; 1.15 (Force Deficit)</p>
                    </div>
                  </div>
                </div>

                {/* Coaching Insights & Training Prescriptions */}
                {coachingInsights && (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Auto-Regulated Coaching Insights (THP Style)
                    </h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Primary Biomechanical Focus</p>
                          <p className="text-xs text-white font-semibold mt-1">{coachingInsights.focus}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Phase Training Goal</p>
                          <p className="text-xs text-cyan-400 font-semibold mt-1">{coachingInsights.goal}</p>
                        </div>
                      </div>

                      {/* Periodization Protocols */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Key Periodization Protocols</p>
                        <ul className="space-y-2">
                          {/* Inject unilateral protocols if LSI deficit is present */}
                          {lsiDeficit && (
                            <li className="flex items-start gap-2.5 text-xs text-red-300 font-bold border border-red-950 bg-red-950/10 p-2.5 rounded-lg">
                              <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <span>Asymmetry Work: Prioritize unilateral strength, split squats, and single-leg landing stabilization.</span>
                            </li>
                          )}
                          {coachingInsights.protocols.map((proto: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                              <span>{proto}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample prescription workout */}
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Target Workout Session Block</p>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                          <table className="min-w-full divide-y divide-slate-850 text-left">
                            <thead className="bg-slate-900/60">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exercise</th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Sets</th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Reps</th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coaching Guidance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {/* Inject RFESS split squats if LSI deficit is present */}
                              {lsiDeficit && (
                                <tr className="bg-red-950/5 hover:bg-red-950/10 border-b border-red-950/20">
                                  <td className="px-4 py-3 text-xs font-black text-red-400 whitespace-nowrap">RFESS (Split Squats)</td>
                                  <td className="px-4 py-3 text-xs text-red-300 text-center whitespace-nowrap">3 Sets</td>
                                  <td className="px-4 py-3 text-xs text-red-300 text-center whitespace-nowrap">6 / side</td>
                                  <td className="px-4 py-3 text-[10px] text-red-400">Focus on eccentric stability and unilateral knee tracking.</td>
                                </tr>
                              )}
                              {coachingInsights.workout.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-900/20">
                                  <td className="px-4 py-3 text-xs font-bold text-white whitespace-nowrap">{item.exercise}</td>
                                  <td className="px-4 py-3 text-xs text-slate-300 text-center whitespace-nowrap">{item.sets}</td>
                                  <td className="px-4 py-3 text-xs text-slate-300 text-center whitespace-nowrap">{item.reps}</td>
                                  <td className="px-4 py-3 text-[10px] text-slate-400">{item.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/5 p-12 text-center flex flex-col items-center justify-center h-full min-h-[450px]">
                <Activity className="h-12 w-12 text-slate-700 animate-pulse mb-4" />
                <h3 className="text-md font-bold text-white">No Active Analysis</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  Select an athlete from the database sidebar, or enter metrics in the entry form and click 'Analyze Athlete' to calculate athletic biotype.
                </p>
              </div>
            )}

          </section>

        </div>
      </main>

      {/* Scientific Benchmarks & Reference Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-600"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 mt-1">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white tracking-wide uppercase">
                  FORCE PEAK: Biomechanical Standards & Formulas
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive Tabs */}
            <div className="flex border-b border-slate-900 bg-slate-900/10 px-4 overflow-x-auto whitespace-nowrap">
              {[
                { id: 'rsi', label: 'RSI Standards' },
                { id: 'eur', label: 'EUR Profile' },
                { id: 'armSwing', label: 'Arm Swing Benefit' },
                { id: 'vjBenchmarks', label: 'VJ Benchmarks' },
                { id: 'lsi', label: 'Limb Symmetry' },
                { id: 'power', label: 'Sayers Power' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBenchmarkActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold transition-all relative flex-shrink-0 ${
                    benchmarkActiveTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Tab 1: RSI */}
              {benchmarkActiveTab === 'rsi' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-905 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Scientific Formula</span>
                    <p className="text-xs text-white font-mono mt-1">RSI = Jump Height (m) / Contact Time (s)</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Calculates the athlete's capacity to utilize dynamic elastic energy under fast ground-contact conditions (&lt;250ms).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adult Males Benchmarks (16+)</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">RSI Range</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Suggested Training Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 1.50</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Poor</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Low-level plyometrics, tendon conditioning. Avoid drop jumps.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">1.50 - 2.00</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-900/20">Average</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Stiffness pogos, low box bounds. Improve contact velocity.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">2.00 - 2.50</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-blue-950/30 text-blue-400 border border-blue-900/20">Good</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Intensive plyometrics, depth jumps from moderate heights.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 2.50</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/20">Elite</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Shock method training, extreme depth bounds, high velocity loads.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adult Females Benchmarks (16+)</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">RSI Range</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Suggested Training Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 1.20</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Poor</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Low-level plyometrics, tendon conditioning. Avoid drop jumps.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">1.20 - 1.70</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-900/20">Average</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Stiffness pogos, low box bounds. Improve contact velocity.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">1.70 - 2.20</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-blue-950/30 text-blue-400 border border-blue-900/20">Good</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Intensive plyometrics, depth jumps from moderate heights.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 2.20</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/20">Elite</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Shock method training, extreme depth bounds, high velocity loads.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic mt-2">
                    * Youth athletes (Under 16 years of age) have their benchmark boundaries automatically scaled down by 15% to compensate for developmental maturation changes.
                  </p>
                </div>
              )}
              {/* Tab 2: EUR */}
              {benchmarkActiveTab === 'eur' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Scientific Formula</span>
                    <p className="text-xs text-white font-mono mt-1">EUR = CMJ NAS / SJ</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Compares jump performance using stretch-shortening reflex (CMJ NAS) vs concentric force (SJ) to identify specific muscular power deficits.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Classification & Deficit Profiles</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">EUR Range</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Primary deficit & focus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 1.10</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Force-Dominant</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Elastic Deficit. Athlete needs tendon reactivity, pogo jumps, and fast SSC plyos.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-cyan-400 font-mono">1.10 - 1.15</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-900/20">Balanced Profile</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Optimal ratio. Perform contrast training and maintain balanced stimulus.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-purple-400 font-mono">&gt; 1.15</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-purple-950/30 text-purple-400 border border-purple-900/20">Elastic-Dominant</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Force Deficit. Athlete needs max strength loading (80%+ 1RM) and concentric drive.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Arm Swing Benefit */}
              {benchmarkActiveTab === 'armSwing' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Scientific Formula</span>
                    <p className="text-xs text-white font-mono mt-1">
                      Arm Swing Benefit (%) = ((CMJ Arm - CMJ No-Arm) / CMJ No-Arm) * 100
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Measures the coordination benefit of the upper body momentum transfer to the lower body triple extension velocity.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Coordination Classifications</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">Benefit Range</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Physiological Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 10%</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Poor AS Contribution</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Coordination deficit. Athlete does not transfer upper body velocity efficiently.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-cyan-400 font-mono">10% - 15%</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-900/20">Normal Coordination</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Typical athletic transfer of arm momentum to increase vertical impulse.</td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 15%</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/20">High Coordination</span></td>
                            <td className="px-4 py-2.5 text-slate-400">Excellent timing. Efficient use of arms to maximize jump takeoff velocity.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: VJ Benchmarks (cm/in) */}
              {benchmarkActiveTab === 'vjBenchmarks' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Vertical Jump Metrics</span>
                    <p className="text-xs text-white font-medium mt-1">Bilateral Vertical Jump Height Benchmarks</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Covers both CMJ With Arm Swing and Sargent reach-delta vertical jump testing. Evaluated in both centimeters (cm) and inches (in).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Male Vertical Jump Benchmarks (16+)</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">Height (cm)</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Height (in)</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 45 cm</td>
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 17.7 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Poor</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">45 - 60 cm</td>
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">17.7 - 23.6 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-900/20">Average</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">60 - 75 cm</td>
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">23.6 - 29.5 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-blue-950/30 text-blue-400 border border-blue-900/20">Good</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 75 cm</td>
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 29.5 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/20">Elite</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Female Vertical Jump Benchmarks (16+)</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-400">Height (cm)</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Height (in)</th>
                            <th className="px-4 py-2 font-semibold text-slate-400">Classification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 38 cm</td>
                            <td className="px-4 py-2.5 font-bold text-red-400 font-mono">&lt; 15.0 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/20">Poor</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">38 - 50 cm</td>
                            <td className="px-4 py-2.5 font-bold text-amber-400 font-mono">15.0 - 19.7 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-900/20">Average</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">50 - 60 cm</td>
                            <td className="px-4 py-2.5 font-bold text-blue-400 font-mono">19.7 - 23.6 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-blue-950/30 text-blue-400 border border-blue-900/20">Good</span></td>
                          </tr>
                          <tr className="hover:bg-slate-900/10">
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 60 cm</td>
                            <td className="px-4 py-2.5 font-bold text-emerald-400 font-mono">&gt; 23.6 in</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/20">Elite</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: LSI */}
              {benchmarkActiveTab === 'lsi' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Scientific Formula</span>
                    <p className="text-xs text-white font-mono mt-1">LSI = (Lower Limb Score / Higher Limb Score) * 100</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Compares the performance of the left vs right leg to assess mechanical balance and unilateral deficits.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Unilateral Safety Zones</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Optimal Zone */}
                      <div className="p-4 rounded-xl border border-emerald-950 bg-emerald-950/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-450">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Safe / Symmetrical Zone</span>
                          </div>
                          <p className="text-xs font-bold text-white font-mono mt-2">&ge; 90% LSI</p>
                          <p className="text-[10px] text-slate-450 mt-1">
                            Minimal deficit (&lt;10%). Normal force distribution. Preserves standard bilateral jump efficiency and safety.
                          </p>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="p-4 rounded-xl border border-red-950 bg-red-950/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <ShieldAlert className="h-4 w-4" />
                            <span>Danger / Red Flag Zone</span>
                          </div>
                          <p className="text-xs font-bold text-red-400 font-mono mt-2">&lt; 90% LSI</p>
                          <p className="text-[10px] text-slate-450 mt-1">
                            High asymmetry (&gt;10%). Implies compensation patterns, motor deficits, and elevated injury risk. Unilateral work is advised.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Sayers Power */}
              {benchmarkActiveTab === 'power' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Scientific Formula</span>
                    <p className="text-xs text-white font-mono mt-1">
                      Peak Power (W) = (60.7 * CMJ NAS in cm) + (45.3 * Bodyweight in kg) - 2055
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      The Sayers Equation estimate is based on the CMJ Without Arm Swing (NAS) vertical jump height and bodyweight to isolate lower extremity peak concentric power.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 bg-slate-950/80">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Relative Power Scale</span>
                    <p className="text-xs text-white font-mono">Relative Power (W/kg) = Peak Power (W) / Bodyweight (kg)</p>
                    <p className="text-[10px] text-slate-400">
                      Standard performance relative metrics tracking:
                    </p>
                    <ul className="text-[10px] text-slate-400 space-y-1 pl-4 list-disc mt-1">
                      <li>&lt; 35 W/kg: Low absolute relative explosive power.</li>
                      <li>35 - 48 W/kg: Moderate-to-good explosive capacity (normal athletic base).</li>
                      <li>&gt; 48 W/kg: High-to-elite power output (typical of top-tier vertical power athletes).</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-t border-slate-900">
              <span className="text-[9px] text-slate-500">
                FORCE PEAK Sports Biomechanics Lab Standards
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl px-4 py-2 transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
