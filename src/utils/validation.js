import { NICKNAME_RULES, NICKNAME_ERRORS } from '../constants/gameConstants';

export const isValidNickname = (nickname) => {
  if (!nickname) return false;
  if (nickname.length < NICKNAME_RULES.MIN_LENGTH) return false;
  if (nickname.length > NICKNAME_RULES.MAX_LENGTH) return false;
  return NICKNAME_RULES.PATTERN.test(nickname);
};

export const getNicknameError = (nickname) => {
  if (!nickname) return NICKNAME_ERRORS.REQUIRED;
  if (nickname.length < NICKNAME_RULES.MIN_LENGTH) return NICKNAME_ERRORS.TOO_SHORT;
  if (nickname.length > NICKNAME_RULES.MAX_LENGTH) return NICKNAME_ERRORS.TOO_LONG;
  if (!NICKNAME_RULES.PATTERN.test(nickname)) return NICKNAME_ERRORS.INVALID_CHARS;
  return '';
}; 