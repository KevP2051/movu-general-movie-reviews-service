const reviewService = require('../../src/services/reviewService');

describe('Review Service', () => {
  test('should return an object with reviews array', async () => {
    const result = await reviewService.getAllReviews(1, 10, {});
    expect(Array.isArray(result.reviews)).toBe(true);
  });

  test('should throw error for invalid review id', async () => {
    await expect(reviewService.getReviewById('invalid')).rejects.toThrow();
  });
});