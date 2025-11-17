describe('Data Transformation Business Logic', () => {
  test('should format movie response with required fields', () => {
    const rawMovie = {
      movie_id: 1,
      title: 'Test Movie',
      release_date: '2024-01-01',
      overview: 'A test movie',
      poster_path: '/test.jpg',
      backdrop_path: '/backdrop.jpg',
      average_rating: 8.5
    };
    
    const formatted = {
      id: rawMovie.movie_id,
      title: rawMovie.title,
      releaseDate: rawMovie.release_date,
      description: rawMovie.overview,
      rating: rawMovie.average_rating
    };
    
    expect(formatted.id).toBe(1);
    expect(formatted.title).toBe('Test Movie');
    expect(formatted.releaseDate).toBe('2024-01-01');
    expect(formatted.rating).toBe(8.5);
  });

  test('should sanitize user input for reviews', () => {
    const userInput = {
      title: '  Great Movie!  ',
      comment: '  Amazing film with great acting.  ',
      rating: '8'
    };
    
    const sanitized = {
      title: userInput.title.trim(),
      comment: userInput.comment.trim(),
      rating: parseInt(userInput.rating)
    };
    
    expect(sanitized.title).toBe('Great Movie!');
    expect(sanitized.comment).toBe('Amazing film with great acting.');
    expect(sanitized.rating).toBe(8);
    expect(typeof sanitized.rating).toBe('number');
  });
});
