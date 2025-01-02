import { ActionTypes } from './types';
import { BOARD_HEIGHT, BOARD_WIDTH, BALL_SIZE, PADDLE_HEIGHT, INITIAL_BALL_SPEED } from '../constants/gameConstants';
import Logger from '../utils/logger';

const getInitialBallVelocity = (speed = INITIAL_BALL_SPEED) => {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: speed * Math.cos(angle) * direction,
    y: speed * Math.sin(angle)
  };
};

const initialState = {
  game: {
    mode: null,
    isStarted: false,
    isPaused: false,
    winner: null,
    score: { left: 0, right: 0 },
    countdown: null
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
    lastUpdate: performance.now()
  }
};

// Helper function to ensure immutability
const updateState = (state, path, value) => {
  const newState = { ...state };
  let current = newState;
  const parts = path.split('.');
  
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...current[parts[i]] };
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  return newState;
};

export function rootReducer(state = initialState, action) {
  Logger.debug('Reducer', `Processing action: ${action.type}`, { 
    currentState: state,
    action 
  });

  switch (action.type) {
    // Game Actions
    case ActionTypes.START_GAME:
      return {
        ...state,
        game: {
          ...initialState.game,
          mode: action.payload,
          isStarted: true,
          countdown: 3
        }
      };

    case ActionTypes.END_GAME:
      return {
        ...state,
        game: { ...initialState.game },
        physics: { ...initialState.physics }
      };

    case ActionTypes.PAUSE_GAME:
      return updateState(state, 'game.isPaused', action.payload);

    case ActionTypes.RESUME_GAME:
      return updateState(state, 'game.isPaused', false);

    case ActionTypes.UPDATE_COUNTDOWN:
      return updateState(state, 'game.countdown', action.payload);

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
      return updateState(
        state,
        `physics.paddles.${action.payload.side}`,
        { 
          ...state.physics.paddles[action.payload.side],
          y: action.payload.position,
          velocity: action.payload.velocity || 0
        }
      );

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

    // System Actions
    case ActionTypes.INIT:
    case ActionTypes.RESET_STATE:
      return { ...initialState };

    default:
      return state;
  }
} 