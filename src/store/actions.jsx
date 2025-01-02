import { ActionTypes } from './types';
import Logger from '../utils/logger';
import stateTracker from '../utils/stateTracker';

// Action Creator Helper
const createAction = (type, payload = null) => {
  const action = { type, payload };
  Logger.debug('ActionCreator', `Creating action: ${type}`, payload);
  return action;
};

// Game Actions
export const gameActions = {
  startGame: (mode) => createAction(ActionTypes.START_GAME, mode),
  endGame: () => createAction(ActionTypes.END_GAME),
  pauseGame: () => createAction(ActionTypes.PAUSE_GAME),
  resumeGame: () => createAction(ActionTypes.RESUME_GAME),
  updateCountdown: (count) => createAction(ActionTypes.UPDATE_COUNTDOWN, count),
  updateScore: (side, value) => createAction(ActionTypes.UPDATE_SCORE, { side, value }),
  setWinner: (winner) => createAction(ActionTypes.SET_WINNER, winner)
};

// Physics Actions
export const physicsActions = {
  batchUpdate: (updates) => createAction(ActionTypes.BATCH_PHYSICS_UPDATE, updates),
  updatePaddlePosition: ({ side, position, velocity, time }) => 
    createAction(ActionTypes.UPDATE_PADDLE_POSITION, { side, position, velocity, time }),
  resetBall: () => createAction(ActionTypes.RESET_BALL),
  resetState: () => createAction(ActionTypes.RESET_PHYSICS_STATE)
};

// System Actions
export const systemActions = {
  init: () => createAction(ActionTypes.INIT),
  resetState: () => createAction(ActionTypes.RESET_STATE)
};

// Action Middleware
export const createActionMiddleware = (store) => (next) => (action) => {
  // Track state changes
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();
  
  stateTracker.trackChange(
    'Store',
    prevState,
    nextState,
    action.type
  );
  
  return result;
}; 