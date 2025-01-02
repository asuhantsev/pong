import { ActionTypes } from './types';
import { BOARD_HEIGHT, BOARD_WIDTH, BALL_SIZE, PADDLE_HEIGHT, INITIAL_BALL_SPEED, MAX_BALL_SPEED, SPEED_INCREASE } from '../constants/gameConstants';
import Logger from '../utils/logger';

const getInitialBallVelocity = (speed = INITIAL_BALL_SPEED) => {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: speed * Math.cos(angle) * direction,
    y: speed * Math.sin(angle)
  };
};

const now = performance.now();

const initialState = {
  game: {
    mode: null,
    isStarted: false,
    isPaused: false,
    winner: null,
    score: { left: 0, right: 0 },
    countdown: null,
    status: 'idle'
  },
  physics: {
    ball: {
      position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
      velocity: getInitialBallVelocity(),
      spin: 0
    },
    paddles: {
      left: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
      right: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 }
    },
    speedMultiplier: 1,
    currentSpeed: INITIAL_BALL_SPEED,
    time: {
      lastUpdate: now,
      lastPaddleUpdate: now,
      deltaTime: 0
    },
    isActive: false
  }
};

// Helper function to ensure immutability
const updateState = (state, path, value) => {
  const newState = { ...state };
  let current = newState;
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  keys.forEach(key => {
    current[key] = { ...current[key] };
    current = current[key];
  });
  
  current[lastKey] = value;
  return newState;
};

export function rootReducer(state = initialState, action) {
  Logger.debug('Reducer', 'Processing action:', { currentState: state, action });
  
  switch (action.type) {
    case ActionTypes.INIT:
      return initialState;
      
    case ActionTypes.RESET_STATE:
      return initialState;
      
    case ActionTypes.RESET_PHYSICS_STATE:
      return {
        ...state,
        physics: {
          ...initialState.physics,
          ball: {
            position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
            velocity: getInitialBallVelocity(),
            spin: 0
          },
          paddles: {
            left: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
            right: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 }
          },
          time: {
            lastUpdate: performance.now(),
            lastPaddleUpdate: performance.now(),
            deltaTime: 0
          },
          isActive: false
        }
      };

    case ActionTypes.START_GAME:
      if (state.game.status === 'playing' || state.game.status === 'starting') {
        return state;
      }
      return {
        ...state,
        game: {
          ...state.game,
          mode: action.payload,
          isStarted: true,
          isPaused: false,
          winner: null,
          score: { left: 0, right: 0 },
          countdown: 3,
          status: 'starting'
        },
        physics: {
          ...initialState.physics,
          time: {
            lastUpdate: performance.now(),
            lastPaddleUpdate: performance.now(),
            deltaTime: 0
          }
        }
      };

    case ActionTypes.END_GAME:
      if (state.game.status === 'idle') {
        return state;
      }
      return {
        ...state,
        game: {
          ...initialState.game,
          mode: null,
          isStarted: false,
          isPaused: false,
          winner: null,
          score: { left: 0, right: 0 },
          countdown: null,
          status: 'idle'
        },
        physics: {
          ...initialState.physics,
          time: {
            lastUpdate: performance.now(),
            lastPaddleUpdate: performance.now(),
            deltaTime: 0
          },
          isActive: false
        }
      };

    case ActionTypes.PAUSE_GAME:
      return updateState(state, 'game.isPaused', action.payload);

    case ActionTypes.RESUME_GAME:
      return updateState(state, 'game.isPaused', false);

    case ActionTypes.UPDATE_COUNTDOWN:
      const newCountdown = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          countdown: newCountdown,
          status: newCountdown === 0 ? 'playing' : 'starting'
        },
        physics: {
          ...state.physics,
          isActive: newCountdown === 0
        }
      };

    case ActionTypes.UPDATE_SCORE:
      return updateState(state, 'game.score', action.payload);

    case ActionTypes.SET_WINNER:
      return updateState(state, 'game.winner', action.payload);

    // Physics Actions
    case ActionTypes.UPDATE_BALL_POSITION:
      return updateState(state, 'physics.ball.position', action.payload);

    case ActionTypes.UPDATE_BALL_VELOCITY:
      return updateState(state, 'physics.ball.velocity', action.payload);

    case ActionTypes.UPDATE_BALL_SPIN:
      return updateState(state, 'physics.ball.spin', action.payload);

    case ActionTypes.UPDATE_PADDLE_POSITION:
      const { side, position: paddlePosition, velocity: paddleVelocity, time: paddleTime } = action.payload;
      return {
        ...state,
        physics: {
          ...state.physics,
          paddles: {
            ...state.physics.paddles,
            [side]: {
              y: paddlePosition,
              velocity: paddleVelocity || 0
            }
          },
          time: paddleTime ? {
            ...state.physics.time,
            lastPaddleUpdate: paddleTime
          } : state.physics.time
        }
      };

    case ActionTypes.RESET_BALL:
      return {
        ...state,
        physics: {
          ...state.physics,
          ball: {
            position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
            velocity: getInitialBallVelocity(state.physics.currentSpeed),
            spin: 0
          }
        }
      };

    case ActionTypes.UPDATE_SPEED_MULTIPLIER:
      return {
        ...state,
        physics: {
          ...state.physics,
          speedMultiplier: action.payload,
          currentSpeed: Math.min(state.physics.currentSpeed * action.payload, INITIAL_BALL_SPEED * 8)
        }
      };

    case 'INCREASE_BALL_SPEED':
      return {
        ...state,
        physics: {
          ...state.physics,
          currentSpeed: Math.min(state.physics.currentSpeed * SPEED_INCREASE, MAX_BALL_SPEED)
        }
      };

    case ActionTypes.UPDATE_PHYSICS_TIME:
      return updateState(state, 'physics.time', {
        ...state.physics.time,
        ...action.payload
      });

    // System Actions
    case ActionTypes.BATCH_PHYSICS_UPDATE:
      const { time, position: ballPosition, velocity: ballVelocity, spin } = action.payload;
      let newPhysicsState = { ...state.physics };
      
      if (time) {
        newPhysicsState.time = { ...newPhysicsState.time, ...time };
      }
      if (ballPosition) {
        newPhysicsState.ball.position = ballPosition;
      }
      if (ballVelocity) {
        newPhysicsState.ball.velocity = ballVelocity;
      }
      if (spin) {
        newPhysicsState.ball.spin = spin;
      }
      
      return {
        ...state,
        physics: newPhysicsState
      };

    default:
      return state;
  }
} 