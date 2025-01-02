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
  togglePause: () => createAction(ActionTypes.TOGGLE_PAUSE),
  setPaused: (isPaused) => createAction(ActionTypes.SET_PAUSED, isPaused),
  updateCountdown: (count) => createAction(ActionTypes.UPDATE_COUNTDOWN, count),
  updateScore: (score) => createAction(ActionTypes.UPDATE_SCORE, score),
  setWinner: (winner) => createAction(ActionTypes.SET_WINNER, winner),
  setGameStarted: (started) => createAction(ActionTypes.SET_GAME_STARTED, started),
  updateGameState: (state) => createAction(ActionTypes.UPDATE_GAME_STATE, state),
  updateBallPosition: (pos) => createAction(ActionTypes.UPDATE_BALL_POSITION, pos),
  updateBallVelocity: (vel) => createAction(ActionTypes.UPDATE_BALL_VELOCITY, vel),
  updateLeftPaddlePosition: (pos) => createAction(ActionTypes.UPDATE_LEFT_PADDLE_POSITION, pos),
  updateRightPaddlePosition: (pos) => createAction(ActionTypes.UPDATE_RIGHT_PADDLE_POSITION, pos)
};

// Physics Actions
export const physicsActions = {
  batchUpdate: (updates) => createAction(ActionTypes.BATCH_PHYSICS_UPDATE, updates),
  updatePhysics: (deltaTime) => createAction(ActionTypes.UPDATE_PHYSICS, deltaTime),
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
    action
  );
  
  return result;
}; 