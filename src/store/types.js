// Action Types
export const ActionTypes = {
  // Game Actions
  START_GAME: 'game/start',
  END_GAME: 'game/end',
  PAUSE_GAME: 'game/pause',
  RESUME_GAME: 'game/resume',
  TOGGLE_PAUSE: 'game/togglePause',
  SET_PAUSED: 'game/setPaused',
  UPDATE_COUNTDOWN: 'game/updateCountdown',
  UPDATE_SCORE: 'game/updateScore',
  SET_WINNER: 'game/setWinner',
  SET_GAME_STARTED: 'game/setGameStarted',
  UPDATE_GAME_STATE: 'game/updateGameState',
  UPDATE_LEFT_PADDLE_POSITION: 'game/updateLeftPaddlePosition',
  UPDATE_RIGHT_PADDLE_POSITION: 'game/updateRightPaddlePosition',
  
  // Physics Actions
  UPDATE_PHYSICS: 'physics/update',
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
      left: {
        position: 'number',
        velocity: 'number'
      },
      right: {
        position: 'number',
        velocity: 'number'
      }
    },
    speedMultiplier: 'number',
    time: 'number'
  }
}; 