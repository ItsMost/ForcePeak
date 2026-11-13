/**
 * Day type (High / Low / Rest) lives inside the day title, e.g.
 * "WEEK 1 - FOUNDATION | HIGH: Braking + Strength". We only READ it from the title;
 * setDayType() returns a new title string and is used only when the coach clicks a button.
 */
const TAG_RE = /\b(HIGH|LOW|REST)\b\s*:?\s*/i;

export const DAY_TYPES = ['HIGH', 'LOW', 'REST'];

export function parseDayType(title) {
  const m = (title || '').match(TAG_RE);
  return m ? m[1].toUpperCase() : null;
}

export function setDayType(title, type) {
  const t = title || '';
  if (!type) return t.replace(TAG_RE, '').replace(/\|\s*$/, '').trim();
  if (TAG_RE.test(t)) return t.replace(TAG_RE, `${type}: `).replace(/:\s+$/, ':').trim();
  // No tag yet: put it after the last "|" block if there is one, else at the start.
  const bar = t.lastIndexOf('|');
  if (bar >= 0) return `${t.slice(0, bar + 1).trimEnd()} ${type}: ${t.slice(bar + 1).trim()}`.trim();
  return t ? `${type}: ${t}` : `${type}:`;
}

/** Warnings for the week: back-to-back HIGH days (day order Sat..Fri). */
export function weekDayTypeWarnings(daysOrdered, typesByDay) {
  const out = [];
  for (let i = 1; i < daysOrdered.length; i++) {
    const a = daysOrdered[i - 1], b = daysOrdered[i];
    if (typesByDay[a] === 'HIGH' && typesByDay[b] === 'HIGH') out.push(`${a} و ${b}: يومين High ورا بعض`);
  }
  return out;
}
