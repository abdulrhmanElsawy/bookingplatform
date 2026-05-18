/** Maps a 0–5 average to Booking-style 0–10 score. */
export function ratingToScore10(rating: number): number {
  return Math.round(rating * 2 * 10) / 10;
}

export type ScoreLabelKey = 'scoreExceptional' | 'scoreVeryGood' | 'scoreGood';

export function getScoreLabelKey(score10: number): ScoreLabelKey {
  if (score10 >= 9) return 'scoreExceptional';
  if (score10 >= 8) return 'scoreVeryGood';
  return 'scoreGood';
}
