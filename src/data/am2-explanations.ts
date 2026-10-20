/** Verified explanation material is keyed by "<year id>:<question number>".
 * A missing entry is displayed explicitly as unpublished, never synthesized.
 */
export interface Am2Explanation {
  text: string;
  sources?: ReadonlyArray<{ title: string; url: string }>;
}

export const am2Explanations: Readonly<Record<string, Am2Explanation>> = {};

export function findAm2Explanation(yearId: string, questionNumber: number): Am2Explanation | undefined {
  return am2Explanations[yearId + ':' + questionNumber];
}
