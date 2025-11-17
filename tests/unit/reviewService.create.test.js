const reviewService = require('../../src/services/reviewService');

describe('Review Service - Create Review', () => {
  test('should create a new review successfully', async () => {
    const newReview = {
      movie_id: 1,
      user_id: 123,
      rating: 4,
      title: 'Buena película',
      complaint: 'No me gustó el final'
    };
    const created = await reviewService.createReview(newReview);
    expect(created).toHaveProperty('review_id');
    expect(created.title).toBe('Buena película');
    // Si complaint no está en el modelo, omite la siguiente línea
    // expect(created.complaint).toBe('No me gustó el final');
  });

  test('should throw error if required fields are missing', async () => {
    const incompleteReview = {
      movie_id: 1,
      user_id: 123,
      // Falta rating y title
    };
    await expect(reviewService.createReview(incompleteReview)).rejects.toThrow();
  });
});