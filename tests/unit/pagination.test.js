describe('Pagination Business Logic', () => {
  test('should calculate correct pagination metadata', () => {
    const totalItems = 100;
    const itemsPerPage = 10;
    const currentPage = 3;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const offset = (currentPage - 1) * itemsPerPage;
    
    expect(totalPages).toBe(10);
    expect(offset).toBe(20);
  });

  test('should validate page number is positive', () => {
    const isValidPage = (page) => page > 0 && Number.isInteger(page);
    
    expect(isValidPage(1)).toBe(true);
    expect(isValidPage(5)).toBe(true);
    expect(isValidPage(0)).toBe(false);
    expect(isValidPage(-1)).toBe(false);
    expect(isValidPage(1.5)).toBe(false);
  });
});
