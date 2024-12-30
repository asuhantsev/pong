import { ActionTypes } from './types';
import { BOARD_HEIGHT, BALL_SPEED } from '../constants/gameConstants';
import Logger from '../utils/logger';

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
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 }
    },
    paddles: {
      left: { y: BOARD_HEIGHT / 2 },
      right: { y: BOARD_HEIGHT / 2 }
    },
    speedMultiplier: 1,
    lastUpdate: 0
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
      return updateState(state, 'game.isPaused', true);

    case ActionTypes.RESUME_GAME:
      return updateState(state, 'game.isPaused', false);

    case ActionTypes.UPDATE_COUNTDOWN:
      return updateState(state, 'game.countdown', action.payload);

    case ActionTypes.UPDATE_SCORE:
      return updateState(
        state,
        `game.score.${action.payload.side}`,
        action.payload.value
      );

    case ActionTypes.SET_WINNER:
      return updateState(state, 'game.winner', action.payload);

    // Physics Actions
    case ActionTypes.UPDATE_BALL_POSITION:
      return updateState(state, 'physics.ball.position', action.payload);

    case ActionTypes.UPDATE_BALL_VELOCITY:
      return updateState(state, 'physics.ball.velocity', action.payload);

    case ActionTypes.UPDATE_PADDLE_POSITION:
      return updateState(
        state,
        `physics.paddles.${action.payload.side}`,
        { y: action.payload.position }
      );

    case ActionTypes.RESET_BALL:
      return {
        ...state,
        physics: {
          ...state.physics,
          ball: {
            position: { x: 0, y: 0 },
            velocity: {
              x: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
              y: BALL_SPEED * (Math.random() * 2 - 1)
            }
          },
          speedMultiplier: 1
        }
      };

    case ActionTypes.UPDATE_SPEED_MULTIPLIER:
      return updateState(state, 'physics.speedMultiplier', action.payload);

    // System Actions
    case ActionTypes.INIT:
      return { ...initialState };

    case ActionTypes.RESET_STATE:
      return { ...initialState };

    default:
      return state;
  }
} 