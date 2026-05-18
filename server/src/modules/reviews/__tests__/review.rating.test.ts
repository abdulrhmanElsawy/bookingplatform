import { meanReviewScore, roundedMeanScores } from '../review.rating.js';

describe('review.rating', () => {
  it('meanReviewScore averages five dimensions', () => {
    expect(
      meanReviewScore({
        overall: 5,
        staff: 4,
        cleanliness: 3,
        facilities: 5,
        value: 4,
      }),
    ).toBe(4.2);
  });

  it('roundedMeanScores rounds to one decimal', () => {
    expect(roundedMeanScores([4.2, 3.8])).toBe(4);
    expect(roundedMeanScores([4.24])).toBe(4.2);
  });
});
