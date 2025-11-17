const peopleService = require('../../src/services/peopleService');

describe('People Service', () => {
  test('should return an array of people', async () => {
    const result = await peopleService.getAllPeople(1, 10);
    const peopleArray = Array.isArray(result) ? result : result.people;
    expect(Array.isArray(peopleArray)).toBe(true);
  });

  test('should throw error for invalid people id', async () => {
    await expect(peopleService.getPersonById('invalid')).rejects.toThrow();
  });
});