import { isValidNickname, getNicknameError } from '../validation.js';

describe('nickname validation', () => {
  test('valid nickname', () => {
    expect(isValidNickname('Player1')).toBe(true);
    expect(getNicknameError('Player1')).toBe('');
  });

  test('too short', () => {
    expect(isValidNickname('ab')).toBe(false);
    expect(getNicknameError('ab')).toBe('Nickname must be at least 3 characters');
  });

  test('too long', () => {
    const name = 'a'.repeat(15);
    expect(isValidNickname(name)).toBe(false);
    expect(getNicknameError(name)).toBe('Nickname cannot exceed 14 characters');
  });

  test('invalid characters', () => {
    expect(isValidNickname('bad!')).toBe(false);
    expect(getNicknameError('bad!')).toBe('Only letters and numbers are allowed');
  });
});
