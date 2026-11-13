/**
 * Pure helpers shared by the weekly planner (no React, no Supabase).
 */

export const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getSupersetProps = (drills, index) => {
  const drill = drills[index];
  if (!drill || !drill.superset) {
    return {
      isSuperset: false,
      isSupersetStart: false,
      isSupersetMiddle: false,
      isSupersetEnd: false,
      supersetLabel: '',
      supersetGroup: ''
    };
  }

  const group = drill.superset; // "A", "B", "C", "D"
  const prevDrill = drills[index - 1];
  const isPrevSame = prevDrill && prevDrill.superset === group;
  const nextDrill = drills[index + 1];
  const isNextSame = nextDrill && nextDrill.superset === group;

  let startIndex = index;
  while (startIndex > 0 && drills[startIndex - 1].superset === group) {
    startIndex--;
  }
  
  const position = index - startIndex + 1;
  const label = `${group}${position}`;
  const hasAdjacentSame = isPrevSame || isNextSame;

  return {
    isSuperset: hasAdjacentSame,
    isSupersetStart: hasAdjacentSame && !isPrevSame,
    isSupersetMiddle: hasAdjacentSame && isPrevSame && isNextSame,
    isSupersetEnd: hasAdjacentSame && isPrevSame && !isNextSame,
    supersetLabel: label,
    supersetGroup: group
  };
};

export const getBezierPath = (points) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return path;
};

export const distributeWeeksToPhases = (numWeeks) => {
  if (numWeeks <= 4) {
    return [
      Math.max(0, numWeeks >= 1 ? 1 : 0),
      Math.max(0, numWeeks >= 2 ? 1 : 0),
      Math.max(0, numWeeks >= 3 ? 1 : 0),
      Math.max(0, numWeeks >= 4 ? 1 : 0)
    ];
  }
  let base = Math.round(numWeeks * 0.40);
  let strength = Math.round(numWeeks * 0.27);
  let power = Math.round(numWeeks * 0.20);
  let peak = numWeeks - (base + strength + power);
  
  if (base <= 0) base = 1;
  if (strength <= 0) strength = 1;
  if (power <= 0) power = 1;
  if (peak <= 0) peak = 1;
  
  let currentSum = base + strength + power + peak;
  while (currentSum !== numWeeks) {
    if (currentSum < numWeeks) {
      base++;
      currentSum++;
    } else {
      if (base > 1) base--;
      else if (strength > 1) strength--;
      else if (power > 1) power--;
      else if (peak > 1) peak--;
      currentSum--;
    }
  }
  return [base, strength, power, peak];
};
