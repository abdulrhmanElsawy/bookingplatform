import i18n from '../index';

describe('reviews i18n (TASK-017)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ar');
  });

  it('exposes Arabic review form labels', () => {
    expect(i18n.t('reviews:writeReview')).toBe('كتابة تقييم');
    expect(i18n.t('reviews:staff')).toBe('الكادر والموظفون');
    expect(i18n.t('reviews:visitIndividual')).toBe('فردي');
  });

  it('exposes English review form labels', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('reviews:writeReview')).toBe('Write a review');
    expect(i18n.t('reviews:staff')).toBe('Staff');
    expect(i18n.t('reviews:visitIndividual')).toBe('Individual');
  });
});
