describe('Movie Filtering Business Logic', () => {
  test('should filter movies by minimum rating', () => {
    const movies = [
      { id: 1, title: 'Movie A', average_rating: 8.5 },
      { id: 2, title: 'Movie B', average_rating: 6.0 },
      { id: 3, title: 'Movie C', average_rating: 9.2 }
    ];
    
    const minRating = 7.0;
    const filtered = movies.filter(m => m.average_rating >= minRating);
    
    expect(filtered.length).toBe(2);
    expect(filtered[0].title).toBe('Movie A');
    expect(filtered[1].title).toBe('Movie C');
  });

  test('should filter movies by genre', () => {
    const movies = [
      { id: 1, title: 'Action Movie', genres: ['Action', 'Thriller'] },
      { id: 2, title: 'Comedy Movie', genres: ['Comedy'] },
      { id: 3, title: 'Action Comedy', genres: ['Action', 'Comedy'] }
    ];
    
    const targetGenre = 'Action';
    const filtered = movies.filter(m => m.genres.includes(targetGenre));
    
    expect(filtered.length).toBe(2);
    expect(filtered.map(m => m.id)).toEqual([1, 3]);
  });
});
