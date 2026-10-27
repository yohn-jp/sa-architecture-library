import sources from './pm1-sources.json';

export const PM1_DURATION_MINUTES = 90;
export const PM1_SELECTION_COUNT = 2;
export const pm1Years = sources;
export type Pm1Year = (typeof pm1Years)[number];

export function findPm1Year(id: string | null | undefined): Pm1Year | undefined {
  return pm1Years.find(year => year.id === id);
}

export function questionNumbers(year: Pm1Year): number[] {
  return Array.from({ length: year.questionCount }, (_, index) => index + 1);
}

export function pm1PdfPath(yearId: string): string {
  if (!findPm1Year(yearId)) throw new Error('Unknown PM1 year');
  return 'practice/pm1/pdfs/' + yearId + '.pdf';
}

if (pm1Years.some(year =>
  year.questionCount < PM1_SELECTION_COUNT || year.pages < 2 ||
  !year.pdfUrl.startsWith('https://www.ipa.go.jp/') ||
  !/^20\d{2}[rh]\d{2}[ah]$/.test(year.id)
)) throw new Error('Invalid PM1 official source catalog');
