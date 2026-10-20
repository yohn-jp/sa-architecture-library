import { AM2_QUESTION_COUNT, findAm2Year } from '../data/am2';

export type Am2Choice = 'ア' | 'イ' | 'ウ' | 'エ';
export type YearSession = {
  version: 2;
  yearId: string;
  answers: Array<Am2Choice | null>;
  index: number;
  startedAt: number;
  finishedAt: number | null;
};

const OPTIONS = ['ア', 'イ', 'ウ', 'エ'];
const prefix = 'sa-am2-year-v2:';
const previousPrefix = 'sa-am2-practice:';

function validChoice(value: unknown): value is Am2Choice {
  return typeof value === 'string' && OPTIONS.includes(value);
}

export function loadYearSession(yearId: string): YearSession | null {
  if (!findAm2Year(yearId)) return null;
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(prefix + yearId) ?? 'null');
    if (!raw || typeof raw !== 'object') return null;
    const session = raw as Partial<YearSession>;
    if (
      session.version !== 2 ||
      session.yearId !== yearId ||
      !Array.isArray(session.answers) ||
      session.answers.length !== AM2_QUESTION_COUNT ||
      !session.answers.every(answer => answer === null || validChoice(answer)) ||
      !Number.isInteger(session.index) || session.index! < 0 || session.index! >= AM2_QUESTION_COUNT ||
      !Number.isFinite(session.startedAt) || session.startedAt! <= 0 ||
      session.startedAt! > Date.now() + 60_000 ||
      !(session.finishedAt === null ||
        (Number.isFinite(session.finishedAt) && session.finishedAt! >= session.startedAt!))
    ) return null;
    return session as YearSession;
  } catch {
    return null;
  }
}

export function loadPreviousYearProgress(yearId: string): { answers: Array<Am2Choice | null>; index: number; seconds: number } | null {
  if (!findAm2Year(yearId) || loadYearSession(yearId)) return null;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(previousPrefix + yearId) ?? 'null');
    if (!saved || typeof saved !== 'object') return null;
    const progress = saved as { answers?: unknown[]; index?: number; seconds?: number };
    if (!Array.isArray(progress.answers)) return null;
    const answers = Array.from({ length: AM2_QUESTION_COUNT }, (_, i) => validChoice(progress.answers![i]) ? progress.answers![i] as Am2Choice : null);
    if (!answers.some(Boolean)) return null;
    return {
      answers,
      index: Number.isInteger(progress.index) && progress.index! >= 0 && progress.index! < AM2_QUESTION_COUNT ? progress.index! : 0,
      seconds: Number.isFinite(progress.seconds) && progress.seconds! >= 0 ? Math.floor(progress.seconds!) : 0
    };
  } catch {
    return null;
  }
}

export function saveYearSession(session: YearSession): boolean {
  try {
    localStorage.setItem(prefix + session.yearId, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function startYearSession(yearId: string, fromPrevious = false): YearSession | null {
  if (!findAm2Year(yearId)) return null;
  const previous = fromPrevious ? loadPreviousYearProgress(yearId) : null;
  if (fromPrevious && !previous) return null;
  const now = Date.now();
  const session: YearSession = {
    version: 2,
    yearId,
    answers: previous?.answers ?? Array(AM2_QUESTION_COUNT).fill(null),
    index: previous?.index ?? 0,
    startedAt: now - (previous?.seconds ?? 0) * 1000,
    finishedAt: null
  };
  return saveYearSession(session) ? session : null;
}

export function setYearAnswer(yearId: string, index: number, choice: Am2Choice): YearSession | null {
  const session = loadYearSession(yearId);
  if (!session || session.finishedAt !== null || !Number.isInteger(index) || index < 0 || index >= AM2_QUESTION_COUNT || !validChoice(choice)) return null;
  session.answers[index] = choice;
  session.index = index;
  return saveYearSession(session) ? session : null;
}

export function setYearIndex(yearId: string, index: number): YearSession | null {
  const session = loadYearSession(yearId);
  if (!session || session.finishedAt !== null || !Number.isInteger(index) || index < 0 || index >= AM2_QUESTION_COUNT) return null;
  session.index = index;
  return saveYearSession(session) ? session : null;
}

export function finishYearSession(yearId: string): YearSession | null {
  const session = loadYearSession(yearId);
  if (!session) return null;
  if (session.finishedAt !== null) return session;
  session.finishedAt = Math.max(Date.now(), session.startedAt);
  return saveYearSession(session) ? session : null;
}

export function elapsedYearSeconds(session: YearSession, now = Date.now()): number {
  return Math.floor(Math.max(0, (session.finishedAt ?? now) - session.startedAt) / 1000);
}

export function formatYearElapsed(seconds: number): string {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}
