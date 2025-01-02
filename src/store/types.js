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
  BATCH_PHYSICS_UPDATE: 'physics/batchUpdate',
  UPDATE_BALL_POSITION: 'physics/updateBallPosition',
  UPDATE_BALL_VELOCITY: 'physics/updateBallVelocity',
  UPDATE_BALL_SPIN: 'physics/updateBallSpin',
  UPDATE_PADDLE_POSITION: 'physics/updatePaddlePosition',
  RESET_BALL: 'physics/resetBall',
  UPDATE_SPEED_MULTIPLIER: 'physics/updateSpeedMultiplier',
  UPDATE_PHYSICS_TIME: 'physics/updateTime',
  RESET_PHYSICS_STATE: 'physics/resetState',
  
  // System Actions
  INIT: 'system/init',
  RESET_STATE: 'system/resetState'
};

// State shape definition
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
    countdown: 'number | null',
    status: 'idle | starting | playing | paused | ended'
  },
  physics: {
    ball: {
      position: { x: 'number', y: 'number' },
      velocity: { x: 'number', y: 'number' },
      spin: 'number'
    },
    paddles: {
      left: { y: 'number', velocity: 'number' },
      right: { y: 'number', velocity: 'number' }
    },
    speedMultiplier: 'number',
    currentSpeed: 'number',
    time: {
      lastUpdate: 'number',
      lastPaddleUpdate: 'number',
      deltaTime: 'number'
    },
    isActive: 'boolean'
  }
}; 