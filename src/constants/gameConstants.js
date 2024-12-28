export const PADDLE_SPEED = 10;
export const BALL_SIZE = 15;
export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 600;
export const PADDLE_WIDTH = 20;
export const PADDLE_HEIGHT = 100;
export const PADDLE_OFFSET = 20;
export const WINNING_SCORE = 10;
export const PHYSICS_STEP = 1000 / 60;
export const INTERPOLATION_STEP = 1000 / 120;
export const BALL_SPEED = {
  initial: {
    x: 3,
    y: 3
  },
  max: 10
};
export const SPEED_INCREASE = 1.5;

export const NICKNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 14,
  PATTERN: /^[a-zA-Z0-9]+$/,
  DEFAULT: 'Player'
};

export const NICKNAME_ERRORS = {
  TOO_SHORT: 'Nickname must be at least 3 characters',
  TOO_LONG: 'Nickname cannot exceed 14 characters',
  INVALID_CHARS: 'Only letters and numbers are allowed',
  REQUIRED: 'Nickname is required'
}; 