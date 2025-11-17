describe('Rating Validation Business Logic', () => {
  const isValidRating = (rating) => {
    const ratingNum = parseFloat(rating);
    return !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 10;
  };

  test('should validate rating is between 1 and 10', () => {
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(10)).toBe(true);
  });

  test('should reject rating below 1 or above 10', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(11)).toBe(false);
    expect(isValidRating(-1)).toBe(false);
  });
});
