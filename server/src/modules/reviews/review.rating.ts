export type ReviewRatingDimensions = {
  overall: number;
  staff: number;
  cleanliness: number;
  facilities: number;
  value: number;
};

/** Arithmetic mean of the five rating dimensions (1–5 scale). */
export function meanReviewScore(rating: ReviewRatingDimensions): number {
  return (
    rating.overall +
    rating.staff +
    rating.cleanliness +
    rating.facilities +
    rating.value
  ) / 5;
}

/** Mean rounded to one decimal, used for listing `averageRating`. */
export function roundedMeanScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
