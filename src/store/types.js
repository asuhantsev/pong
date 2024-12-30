// Action Types
export const ActionTypes = {
  // Game Actions
  START_GAME: 'game/start',
  END_GAME: 'game/end',
  PAUSE_GAME: 'game/pause',
  RESUME_GAME: 'game/resume',
  UPDATE_COUNTDOWN: 'game/updateCountdown',
  UPDATE_SCORE: 'game/updateScore',
  SET_WINNER: 'game/setWinner',
  
  // Physics Actions
  UPDATE_BALL_POSITION: 'physics/updateBallPosition',
  UPDATE_BALL_VELOCITY: 'physics/updateBallVelocity',
  UPDATE_PADDLE_POSITION: 'physics/updatePaddlePosition',
  RESET_BALL: 'physics/resetBall',
  UPDATE_SPEED_MULTIPLIER: 'physics/updateSpeedMultiplier',
  
  // System Actions
  INIT: 'system/init',
  RESET_STATE: 'system/resetState'
};

// State shape definition (for documentation)
export const StateShape = {
  game: {
    mode: 'singleplayer | multiplayer | null',
    isStarted: 'boolean',
    isPaused: 'boolean',
    winner: 'string | null',
    score: {
      left: 'number',
      right: 'number'
    },
    countdown: 'number | null'
  },
  physics: {
    ball: {
      position: { x: 'number', y: 'number' },
      velocity: { x: 'number', y: 'number' }
    },
    paddles: {
      left: { y: 'number' },
      right: { y: 'number' }
    },
    speedMultiplier: 'number',
    lastUpdate: 'number'
  }
}; 