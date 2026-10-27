import { findPm1Year, PM1_DURATION_MINUTES, PM1_SELECTION_COUNT } from '../data/pm1';
import pm1Fields from '../data/pm1-fields.json';

export type Pm1Answer = { id: string; label: string; text: string; limit: number | null };
export type Pm1Session = {
  version: 1;
  yearId: string;
  selected: number[];
  startedAt: number;
  finishedAt: number | null;
  activeQuestion: number;
  answers: Record<string, Pm1Answer[]>;
};

const KEY_PREFIX = 'sa-pm1-session-v1:';
const MAX_FIELDS = 60;
const MAX_TEXT = 10000;

export function sessionKey(yearId: string): string {
  return KEY_PREFIX + yearId;
}

export function validAnswer(entry: unknown): entry is Pm1Answer {
  if (!entry || typeof entry !== 'object') return false;
  const value = entry as Partial<Pm1Answer>;
  return typeof value.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(value.id) &&
    typeof value.label === 'string' && value.label.length > 0 && value.label.length <= 80 &&
    typeof value.text === 'string' && value.text.length <= MAX_TEXT &&
    (value.limit === null || (Number.isInteger(value.limit) && value.limit! >= 1 && value.limit! <= 10000));
}

export function validSession(value: unknown, yearId: string): value is Pm1Session {
  const year = findPm1Year(yearId);
  if (!year || !value || typeof value !== 'object') return false;
  const session = value as Partial<Pm1Session>;
  if (session.version !== 1 || session.yearId !== yearId ||
    !Array.isArray(session.selected) || session.selected.length !== PM1_SELECTION_COUNT ||
    new Set(session.selected).size !== PM1_SELECTION_COUNT ||
    !session.selected.every(n => Number.isInteger(n) && n >= 1 && n <= year.questionCount) ||
    !Number.isInteger(session.activeQuestion) || !session.selected.includes(session.activeQuestion!) ||
    !Number.isFinite(session.startedAt) || session.startedAt! <= 0 ||
    session.startedAt! > Date.now() + 60000 ||
    !(session.finishedAt === null || (Number.isFinite(session.finishedAt) &&
      session.finishedAt! >= session.startedAt! && session.finishedAt! <= Date.now() + 60000)) ||
    !session.answers || typeof session.answers !== 'object' || Array.isArray(session.answers)) return false;
  const answers = session.answers as Record<string, unknown>;
  if (Object.keys(answers).some(key => !session.selected!.some(n => String(n) === key))) return false;
  return session.selected.every(n => {
    const rows = answers[String(n)];
    return Array.isArray(rows) && rows.length <= MAX_FIELDS &&
      rows.every(validAnswer) && new Set(rows.map(row => row.id)).size === rows.length;
  });
}

export function loadPm1Session(yearId: string): Pm1Session | null {
  if (!findPm1Year(yearId)) return null;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(sessionKey(yearId)) ?? 'null');
    if (!validSession(value, yearId)) return null;
    return reconcileOfficialFields(value);
  } catch {
    return null;
  }
}

export function savePm1Session(session: Pm1Session): boolean {
  if (!validSession(session, session.yearId)) return false;
  try {
    localStorage.setItem(sessionKey(session.yearId), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function startPm1Session(yearId: string, selected: number[]): Pm1Session | null {
  const year = findPm1Year(yearId);
  if (!year || selected.length !== PM1_SELECTION_COUNT ||
    new Set(selected).size !== PM1_SELECTION_COUNT ||
    !selected.every(n => Number.isInteger(n) && n >= 1 && n <= year.questionCount)) return null;
  const now = Date.now();
  const answers: Record<string, Pm1Answer[]> = {};
  const templates = pm1Fields as Record<string, Record<string, Array<{ id: string; label: string; limit: number | null }>>>;
  for (const number of selected) {
    const fields = templates[yearId]?.[String(number)];
    if (!fields || fields.length === 0 || fields.length > MAX_FIELDS) return null;
    answers[String(number)] = fields.map(field => ({
      id: field.id, label: field.label, text: '', limit: field.limit
    }));
  }
  const session: Pm1Session = {
    version: 1, yearId, selected: [...selected].sort((a, b) => a - b),
    startedAt: now, finishedAt: null, activeQuestion: Math.min(...selected), answers
  };
  return savePm1Session(session) ? session : null;
}

/**
 * Upgrade only an active legacy session. Keep the previous free-form answers,
 * their text and clock. New canonical fields use independent IDs (f001 etc.).
 * Completed sessions remain immutable; the result view displays their original
 * answers and pairs canonical fields with the official key without rewriting data.
 */
export function reconcileOfficialFields(session: Pm1Session): Pm1Session {
  if (session.finishedAt !== null) return session;
  const templates = pm1Fields as Record<string, Record<string,
    Array<{ id: string; label: string; limit: number | null }>>>;
  const answers: Record<string, Pm1Answer[]> = {};
  let changed = false;
  for (const question of session.selected) {
    const official = templates[session.yearId]?.[String(question)] ?? [];
    const saved = session.answers[String(question)] ?? [];
    const matched = new Set(official.map(field => field.id));
    const standardized = official.map(field => {
      const previous = saved.find(item => item.id === field.id);
      if (!previous || previous.label !== field.label || previous.limit !== field.limit) changed = true;
      return { id: field.id, label: field.label, limit: field.limit, text: previous?.text ?? '' };
    });
    const legacy = saved.filter(row => !matched.has(row.id));
    // Legacy/extra rows are preserved in their original order and contents.
    const next = [...standardized, ...legacy];
    if (next.length > MAX_FIELDS) return session;
    answers[String(question)] = next;
    if (saved.length !== next.length) changed = true;
  }
  if (!changed) return session;
  const migrated = { ...session, answers };
  return savePm1Session(migrated) ? migrated : session;
}

export function remainingPm1Seconds(session: Pm1Session, now = Date.now()): number {
  const end = Math.min(session.finishedAt ?? now, session.startedAt + PM1_DURATION_MINUTES * 60000);
  return Math.max(0, Math.ceil((session.startedAt + PM1_DURATION_MINUTES * 60000 - end) / 1000));
}

export function pm1Expired(session: Pm1Session, now = Date.now()): boolean {
  return session.startedAt + PM1_DURATION_MINUTES * 60000 <= now;
}

export function formatPm1Clock(seconds: number): string {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

export function finishPm1Session(session: Pm1Session): Pm1Session | null {
  if (session.finishedAt !== null) return session;
  const next = { ...session, finishedAt: Date.now() };
  return savePm1Session(next) ? next : null;
}

export function countPm1Answers(session: Pm1Session): number {
  return Object.values(session.answers).flat().filter(row => row.text.trim()).length;
}
