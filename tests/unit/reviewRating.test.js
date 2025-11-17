describe('Review Rating Business Logic', () => {
  test('should calculate average rating correctly', () => {
    const ratings = [8, 9, 7, 10, 6];
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    expect(average).toBe(8);
  });

  test('should handle empty ratings array', () => {
    const ratings = [];
    const average = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;
    expect(average).toBe(0);
  });
});
