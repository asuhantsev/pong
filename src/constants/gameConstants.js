// Player Settings
export const NICKNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 14,
  PATTERN: /^[a-zA-Z0-9]+$/,
  ERROR_MESSAGES: {
    TOO_SHORT: 'Nickname must be at least 3 characters long',
    TOO_LONG: 'Nickname cannot be longer than 14 characters',
    INVALID_CHARS: 'Nickname can only contain letters and numbers'
  }
};

export const NICKNAME_ERRORS = {
  REQUIRED: 'Nickname is required',
  TOO_SHORT: NICKNAME_RULES.ERROR_MESSAGES.TOO_SHORT,
  TOO_LONG: NICKNAME_RULES.ERROR_MESSAGES.TOO_LONG,
  INVALID_CHARS: NICKNAME_RULES.ERROR_MESSAGES.INVALID_CHARS
};

// Game Physics
export const PHYSICS_STEP = 1000 / 60; // 60 FPS
export const MIN_DELTA_TIME = 1; // Minimum time step for physics calculations
export const PHYSICS_THRESHOLD = 0.001; // Threshold for physics updates
export const MAX_SPIN = 0.5; // Maximum ball spin effect
export const SPIN_DECAY = 0.98; // Rate at which spin effect decays
export const SPEED_MULTIPLIER = 1.2; // Speed increase multiplier

export const INITIAL_BALL_SPEED = 0.4; // Initial ball speed
export const BALL_SPEED = 0.4; // Base ball speed
export const MAX_BALL_SPEED = 2.0; // Maximum ball speed
export const PADDLE_SPEED = 0.6;
export const SPEED_INCREASE = 1.1;
export const MAX_SPEED = 2.0;

// Game Dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const BOARD_WIDTH = GAME_WIDTH;
export const BOARD_HEIGHT = GAME_HEIGHT;
export const PADDLE_WIDTH = 20;
export const PADDLE_HEIGHT = 100;
export const BALL_SIZE = 15;
export const PADDLE_OFFSET = 40;

// Scoring
export const WIN_SCORE = 5;
export const POINTS_PER_HIT = 1;

// Network & Sync
export const INTERPOLATION_STEP = 100; // ms
export const PREDICTION_BUFFER_SIZE = 60;
export const LAG_COMPENSATION_TIME = 100; // ms
export const MAX_PREDICTION_TIME = 200; // ms
export const INPUT_BUFFER_SIZE = 10;
export const JITTER_BUFFER_TIME = 50; // ms
export const SMOOTHING_FACTOR = 0.3;

// Game States
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver'
};

// Game Modes
export const GAME_MODES = {
  SINGLE_PLAYER: 'singlePlayer',
  MULTIPLAYER: 'multiplayer',
  AI: 'ai'
};

// AI Difficulty Levels
export const AI_DIFFICULTY = {
  EASY: {
    reactionTime: 300,
    accuracy: 0.7,
    prediction: 0.5
  },
  MEDIUM: {
    reactionTime: 200,
    accuracy: 0.8,
    prediction: 0.7
  },
  HARD: {
    reactionTime: 100,
    accuracy: 0.9,
    prediction: 0.9
  }
};

// Network Configuration
export const NETWORK = {
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000,
  PING_INTERVAL: 2000,
  TIMEOUT: 5000
};

// Animation Timings
export const ANIMATION = {
  COUNTDOWN_DURATION: 3000,
  SCORE_FLASH_DURATION: 500,
  TRANSITION_DURATION: 300
}; 