import { am2Years, findAm2Year } from '../data/am2';
import type { Am2Choice } from './am2-session';
import { loadYearSession } from './am2-session';

/** One persistent entry per question; not cleared when a practice run restarts. */
export interface Mistake {
  yearId: string;
  questionNumber: number;
  lastAnswer: Am2Choice;
  wrongCount: number;
  lastWrongAt: number;
  reviewedAt: number | null;
  attemptIds: string[];
}

const STORAGE_KEY = 'sa-am2-mistakes-v1';
const RANDOM_KEY = 'sa-am2-random-v1';
const CHOICES = ['ア', 'イ', 'ウ', 'エ'] as const;

function isChoice(value: unknown): value is Am2Choice {
  return typeof value === 'string' && CHOICES.some(choice => choice === value);
}

function questionKey(yearId: string, questionNumber: number): string {
  return yearId + ':' + questionNumber;
}

function validQuestion(yearId: string, questionNumber: number): boolean {
  return Boolean(findAm2Year(yearId)) && Number.isInteger(questionNumber) && questionNumber >= 1 && questionNumber <= 25;
}

function readStore(): Record<string, Mistake> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const result: Record<string, Mistake> = {};
    for (const [key, raw] of Object.entries(data)) {
      if (!raw || typeof raw !== 'object') continue;
      const value = raw as Partial<Mistake>;
      if (
        typeof value.yearId !== 'string' ||
        !validQuestion(value.yearId, value.questionNumber ?? -1) ||
        key !== questionKey(value.yearId, value.questionNumber!) ||
        !isChoice(value.lastAnswer) ||
        !Number.isInteger(value.wrongCount) || value.wrongCount! < 1 ||
        !Number.isFinite(value.lastWrongAt) ||
        !(value.reviewedAt === null || (typeof value.reviewedAt === 'number' && Number.isFinite(value.reviewedAt))) ||
        !Array.isArray(value.attemptIds) || !value.attemptIds.every(id => typeof id === 'string')
      ) continue;
      result[key] = value as Mistake;
    }
    return result;
  } catch {
    return {};
  }
}

function saveStore(data: Record<string, Mistake>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function recordMistake(
  yearId: string,
  questionNumber: number,
  answer: Am2Choice,
  attemptId: string
): boolean {
  const year = findAm2Year(yearId);
  if (!year || !validQuestion(yearId, questionNumber) || !isChoice(answer) || !attemptId || answer === year.key[questionNumber - 1]) {
    return false;
  }
  const store = readStore();
  const key = questionKey(yearId, questionNumber);
  const previous = store[key];
  if (previous?.attemptIds.includes(attemptId)) return true;
  store[key] = {
    yearId,
    questionNumber,
    lastAnswer: answer,
    wrongCount: (previous?.wrongCount ?? 0) + 1,
    lastWrongAt: Date.now(),
    reviewedAt: null,
    attemptIds: [...(previous?.attemptIds ?? []), attemptId]
  };
  return saveStore(store);
}

export function listMistakes(): Mistake[] {
  return Object.values(readStore()).sort((a, b) => b.lastWrongAt - a.lastWrongAt || a.yearId.localeCompare(b.yearId));
}

export function setMistakeReviewed(yearId: string, questionNumber: number, reviewed: boolean): boolean {
  const store = readStore();
  const mistake = store[questionKey(yearId, questionNumber)];
  if (!mistake) return false;
  mistake.reviewedAt = reviewed ? Date.now() : null;
  return saveStore(store);
}

/** Import already-graded answers from previous app versions without duplicate counts. */
export function syncExistingMistakes(): void {
  try {
    const random: unknown = JSON.parse(localStorage.getItem(RANDOM_KEY) ?? 'null');
    if (random && typeof random === 'object') {
      const run = random as { order?: unknown; results?: unknown; runId?: unknown };
      if (
        Array.isArray(run.order) &&
        run.order.length === 225 &&
        new Set(run.order).size === 225 &&
        run.order.every(index => Number.isInteger(index) && index >= 0 && index < 225) &&
        run.results && typeof run.results === 'object' && !Array.isArray(run.results)
      ) {
        const runId = typeof run.runId === 'string' && run.runId
          ? run.runId
          : 'legacy-' + run.order.slice(0, 12).join('-');
        for (const [rawIndex, answer] of Object.entries(run.results)) {
          const position = Number(rawIndex);
          if (!Number.isInteger(position) || position < 0 || position >= 225 || !isChoice(answer)) continue;
          const year = am2Years[Math.floor(position / 25)];
          recordMistake(year.id, position % 25 + 1, answer, 'random:' + runId + ':' + position);
        }
      }
    }
  } catch {
    // Malformed legacy data must not prevent review.
  }

  for (const year of am2Years) {
    const session = loadYearSession(year.id);
    if (!session || session.finishedAt === null) continue;
    for (let i = 0; i < 25; i++) {
      const answer = session.answers[i];
      if (answer) recordMistake(year.id, i + 1, answer, 'year:' + year.id + ':' + session.startedAt + ':' + i);
    }
  }
}
