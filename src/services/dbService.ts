import { supabase } from '../supabaseClient';

export interface AthleteData {
  name: string;
  gender: 'Male' | 'Female';
  age: number;
}

export interface TestScores {
  sjNoArm: number; // Squat Jump without arm swing (cm)
  sjArm: number; // Squat Jump with arm swing (cm)
  cmjNoArm: number; // CMJ without arm swing (Hands on Hips) in cm
  cmjArm: number; // CMJ with arm swing (Abalakov) in cm
  rsi: number; // Manually inputted RSI
  bodyweight: number; // Bodyweight in kg
  slCmjLeft: number; // Single-Leg CMJ Left in cm
  slCmjRight: number; // Single-Leg CMJ Right in cm
  standReach?: number; // Standing Reach in cm
  jumpReach?: number; // Max Jump Reach in cm
  vj?: number; // Calculated Vertical Jump in cm
}

export interface AssessmentRecord {
  id?: string;
  date: string;
  name: string;
  gender: 'Male' | 'Female';
  age: number;
  sjNoArm: number;
  sjArm: number;
  cmjNoArm: number;
  cmjArm: number;
  rsi: number;
  bodyweight: number;
  slCmjLeft: number;
  slCmjRight: number;
  eur: number;
  eurClassification: 'Force-Dominant' | 'Elastic-Dominant' | 'Balanced';
  rsiRating: 'Poor' | 'Average' | 'Good' | 'Elite';
  lsi: number; // Limb Symmetry Index (%)
  peakPower: number; // Sayers PAPw in Watts
  relativePower: number; // PAPw / BW in W/kg
  armSwingBenefit: number; // Arm swing benefit in %
  standReach?: number;
  jumpReach?: number;
  vj?: number;
}

// Progressive mock sessions for Alex Mercer to show progress curves out of the box
const mockHistory: AssessmentRecord[] = [
  {
    id: 'mock-1',
    date: '01/06/2026',
    name: 'Alex Mercer',
    gender: 'Male',
    age: 21,
    sjNoArm: 33.0,
    sjArm: 37.0,
    cmjNoArm: 36.0,
    cmjArm: 40.0,
    rsi: 1.60,
    bodyweight: 80.0,
    slCmjLeft: 14.5,
    slCmjRight: 16.0,
    eur: 1.09,
    eurClassification: 'Force-Dominant',
    rsiRating: 'Average',
    lsi: 90.63,
    peakPower: 3753.20,
    relativePower: 46.92,
    armSwingBenefit: 11.11,
    standReach: 220,
    jumpReach: 275,
    vj: 55
  },
  {
    id: 'mock-2',
    date: '15/06/2026',
    name: 'Alex Mercer',
    gender: 'Male',
    age: 21,
    sjNoArm: 34.0,
    sjArm: 38.5,
    cmjNoArm: 37.5,
    cmjArm: 42.0,
    rsi: 1.82,
    bodyweight: 80.0,
    slCmjLeft: 15.2,
    slCmjRight: 16.2,
    eur: 1.10,
    eurClassification: 'Balanced',
    rsiRating: 'Average',
    lsi: 93.83,
    peakPower: 3844.25,
    relativePower: 48.05,
    armSwingBenefit: 12.00,
    standReach: 220,
    jumpReach: 277,
    vj: 57
  },
  {
    id: 'mock-3',
    date: '01/07/2026',
    name: 'Alex Mercer',
    gender: 'Male',
    age: 21,
    sjNoArm: 35.0,
    sjArm: 39.5,
    cmjNoArm: 38.5,
    cmjArm: 43.5,
    rsi: 2.10,
    bodyweight: 79.5,
    slCmjLeft: 15.8,
    slCmjRight: 16.0,
    eur: 1.10,
    eurClassification: 'Balanced',
    rsiRating: 'Good',
    lsi: 98.75,
    peakPower: 3882.30,
    relativePower: 48.83,
    armSwingBenefit: 12.99,
    standReach: 220,
    jumpReach: 279,
    vj: 59
  },
  {
    id: 'mock-4',
    date: '13/07/2026',
    name: 'Alex Mercer',
    gender: 'Male',
    age: 21,
    sjNoArm: 36.0,
    sjArm: 41.0,
    cmjNoArm: 40.0,
    cmjArm: 46.0,
    rsi: 2.45,
    bodyweight: 79.0,
    slCmjLeft: 16.5,
    slCmjRight: 16.7,
    eur: 1.11,
    eurClassification: 'Balanced',
    rsiRating: 'Good',
    lsi: 98.80,
    peakPower: 3951.70,
    relativePower: 50.02,
    armSwingBenefit: 15.00,
    standReach: 220,
    jumpReach: 281,
    vj: 61
  }
];

export const dbService = {
  // Fetch all assessments (combining database records + progressive mock records)
  fetchAssessments: async (): Promise<AssessmentRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('athletes_assessments')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const dbRecords: AssessmentRecord[] = (data || [])
        .filter((item: any) => item.testScores?.type === 'force_peak')
        .map((item: any) => {
          // Backward compatibility support for older records
          const rawSj = Number(item.testScores?.sj || 0);
          const sjNoArm = Number(item.testScores?.sjNoArm || rawSj || 0);
          const sjArm = Number(item.testScores?.sjArm || rawSj || 0);

          const rawCmj = Number(item.testScores?.cmj || 0);
          const cmjNoArm = Number(item.testScores?.cmjNoArm || item.testScores?.cmjNoNoArm || rawCmj || 0);
          const cmjArm = Number(item.testScores?.cmjArm || rawCmj || 0);
          
          let armSwingBenefit = Number(item.analysisReport?.armSwingBenefit || 0);
          if (armSwingBenefit === 0 && cmjNoArm > 0 && cmjArm > cmjNoArm) {
            armSwingBenefit = ((cmjArm - cmjNoArm) / cmjNoArm) * 100;
          }

          const standReach = item.testScores?.standReach !== undefined ? Number(item.testScores.standReach) : undefined;
          const jumpReach = item.testScores?.jumpReach !== undefined ? Number(item.testScores.jumpReach) : undefined;
          const vj = item.testScores?.vj !== undefined 
            ? Number(item.testScores.vj) 
            : (standReach !== undefined && jumpReach !== undefined && jumpReach > standReach ? jumpReach - standReach : undefined);

          return {
            id: item.id,
            date: item.date || new Date(item.created_at).toLocaleDateString('en-GB'),
            name: item.playerData?.name || '',
            gender: item.playerData?.gender || 'Male',
            age: Number(item.playerData?.age || 20),
            sjNoArm,
            sjArm,
            cmjNoArm,
            cmjArm,
            rsi: Number(item.testScores?.rsi || item.analysisReport?.rsi || 0),
            bodyweight: Number(item.testScores?.bodyweight || 75.0),
            slCmjLeft: Number(item.testScores?.slCmjLeft || 0),
            slCmjRight: Number(item.testScores?.slCmjRight || 0),
            eur: Number(item.analysisReport?.eur || 0),
            eurClassification: item.analysisReport?.classification || 'Balanced',
            rsiRating: (item.analysisReport?.rsiCategory === 'Needs Work' ? 'Poor' : item.analysisReport?.rsiCategory) || 'Average',
            lsi: Number(item.analysisReport?.lsi || 100),
            peakPower: Number(item.analysisReport?.peakPower || 0),
            relativePower: Number(item.analysisReport?.relativePower || 0),
            armSwingBenefit,
            standReach,
            jumpReach,
            vj
          };
        });

      // Combine db records with mock records, preventing duplicates by id/name+date
      const allRecords = [...dbRecords];
      mockHistory.forEach((mock) => {
        const exists = allRecords.some(
          (rec) =>
            rec.id === mock.id ||
            (rec.name.toLowerCase() === mock.name.toLowerCase() && rec.date === mock.date)
        );
        if (!exists) {
          allRecords.push(mock);
        }
      });

      // Sort by date descending
      return allRecords.sort((a, b) => {
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        };
        return parseDate(b.date) - parseDate(a.date);
      });
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to LocalStorage + Mock data', err);
      const local = localStorage.getItem('force_peak_history');
      let localRecords: AssessmentRecord[] = local ? JSON.parse(local) : [];
      
      const allRecords = [...localRecords];
      mockHistory.forEach((mock) => {
        const exists = allRecords.some(
          (rec) =>
            rec.id === mock.id ||
            (rec.name.toLowerCase() === mock.name.toLowerCase() && rec.date === mock.date)
        );
        if (!exists) {
          allRecords.push(mock);
        }
      });

      return allRecords.sort((a, b) => {
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        };
        return parseDate(b.date) - parseDate(a.date);
      });
    }
  },

  // Save assessment record
  saveAssessment: async (
    athlete: AthleteData,
    scores: TestScores,
    analysis: any
  ): Promise<AssessmentRecord> => {
    const dateString = new Date().toLocaleDateString('en-GB');
    const newRecord = {
      date: dateString,
      playerData: {
        name: athlete.name,
        gender: athlete.gender,
        age: athlete.age
      },
      testScores: {
        sjNoArm: scores.sjNoArm,
        sjArm: scores.sjArm,
        cmjNoArm: scores.cmjNoArm,
        cmjArm: scores.cmjArm,
        rsi: scores.rsi,
        bodyweight: scores.bodyweight,
        slCmjLeft: scores.slCmjLeft,
        slCmjRight: scores.slCmjRight,
        standReach: scores.standReach,
        jumpReach: scores.jumpReach,
        vj: scores.vj,
        type: 'force_peak'
      },
      analysisReport: {
        eur: analysis.eur,
        rsi: analysis.rsi,
        classification: analysis.eurClassification,
        rsiCategory: analysis.rsiRating,
        lsi: analysis.lsi,
        peakPower: analysis.peakPower,
        relativePower: analysis.relativePower,
        armSwingBenefit: analysis.armSwingBenefit,
        recommendations: analysis.recommendations
      }
    };

    try {
      const { data, error } = await supabase
        .from('athletes_assessments')
        .insert([newRecord])
        .select();

      if (error) throw error;

      const inserted = data[0];
      return {
        id: inserted.id,
        date: inserted.date,
        name: inserted.playerData?.name || athlete.name,
        gender: inserted.playerData?.gender || athlete.gender,
        age: Number(inserted.playerData?.age || athlete.age),
        sjNoArm: Number(inserted.testScores?.sjNoArm || scores.sjNoArm),
        sjArm: Number(inserted.testScores?.sjArm || scores.sjArm),
        cmjNoArm: Number(inserted.testScores?.cmjNoArm || scores.cmjNoArm),
        cmjArm: Number(inserted.testScores?.cmjArm || scores.cmjArm),
        rsi: Number(inserted.testScores?.rsi || scores.rsi),
        bodyweight: Number(inserted.testScores?.bodyweight || scores.bodyweight),
        slCmjLeft: Number(inserted.testScores?.slCmjLeft || scores.slCmjLeft),
        slCmjRight: Number(inserted.testScores?.slCmjRight || scores.slCmjRight),
        eur: Number(inserted.analysisReport?.eur || analysis.eur),
        eurClassification: inserted.analysisReport?.classification || analysis.eurClassification,
        rsiRating: inserted.analysisReport?.rsiCategory || analysis.rsiRating,
        lsi: Number(inserted.analysisReport?.lsi || analysis.lsi),
        peakPower: Number(inserted.analysisReport?.peakPower || analysis.peakPower),
        relativePower: Number(inserted.analysisReport?.relativePower || analysis.relativePower),
        armSwingBenefit: Number(inserted.analysisReport?.armSwingBenefit || analysis.armSwingBenefit),
        standReach: inserted.testScores?.standReach !== undefined ? Number(inserted.testScores.standReach) : scores.standReach,
        jumpReach: inserted.testScores?.jumpReach !== undefined ? Number(inserted.testScores.jumpReach) : scores.jumpReach,
        vj: inserted.testScores?.vj !== undefined ? Number(inserted.testScores.vj) : scores.vj
      };
    } catch (err) {
      console.warn('Supabase insert failed, saving to LocalStorage fallback', err);
      const local = localStorage.getItem('force_peak_history');
      const existing: AssessmentRecord[] = local ? JSON.parse(local) : [];

      const newLocalRecord: AssessmentRecord = {
        id: 'local-' + Math.random().toString(36).substring(2, 9),
        date: dateString,
        name: athlete.name,
        gender: athlete.gender,
        age: athlete.age,
        sjNoArm: scores.sjNoArm,
        sjArm: scores.sjArm,
        cmjNoArm: scores.cmjNoArm,
        cmjArm: scores.cmjArm,
        rsi: scores.rsi,
        bodyweight: scores.bodyweight,
        slCmjLeft: scores.slCmjLeft,
        slCmjRight: scores.slCmjRight,
        eur: analysis.eur,
        eurClassification: analysis.eurClassification,
        rsiRating: analysis.rsiRating,
        lsi: analysis.lsi,
        peakPower: analysis.peakPower,
        relativePower: analysis.relativePower,
        armSwingBenefit: analysis.armSwingBenefit,
        standReach: scores.standReach,
        jumpReach: scores.jumpReach,
        vj: scores.vj
      };

      const updated = [newLocalRecord, ...existing];
      localStorage.setItem('force_peak_history', JSON.stringify(updated));
      return newLocalRecord;
    }
  },

  // Delete assessment record
  deleteAssessment: async (id: string): Promise<boolean> => {
    if (id.startsWith('mock-')) {
      return true;
    }

    if (id.startsWith('local-')) {
      const local = localStorage.getItem('force_peak_history');
      if (local) {
        const existing: AssessmentRecord[] = JSON.parse(local);
        const updated = existing.filter((r) => r.id !== id);
        localStorage.setItem('force_peak_history', JSON.stringify(updated));
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('athletes_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase delete failed', err);
      const local = localStorage.getItem('force_peak_history');
      if (local) {
        const existing: AssessmentRecord[] = JSON.parse(local);
        const updated = existing.filter((r) => r.id !== id);
        localStorage.setItem('force_peak_history', JSON.stringify(updated));
      }
      return true;
    }
  }
};
