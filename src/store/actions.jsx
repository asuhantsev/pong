import { ActionTypes } from './types';
import Logger from '../utils/logger';

const createAction = (type, payload = null) => {
  const action = { type, payload };
  Logger.debug('ActionCreator', `Creating action: ${type}`, payload);
  return action;
};

// Network Actions
export const networkActions = {
  connect: (config) => createAction(ActionTypes.NETWORK_CONNECT, config),
  disconnect: () => createAction(ActionTypes.NETWORK_DISCONNECT),
  joinRoom: (roomId) => createAction(ActionTypes.NETWORK_JOIN_ROOM, roomId),
  leaveRoom: () => createAction(ActionTypes.NETWORK_LEAVE_ROOM),
  updateState: (state) => createAction(ActionTypes.NETWORK_UPDATE_STATE, state)
};

// Game Actions
export const gameActions = {
  start: (mode) => createAction(ActionTypes.GAME_START, mode),
  end: () => createAction(ActionTypes.GAME_END),
  pause: () => createAction(ActionTypes.GAME_PAUSE),
  resume: () => createAction(ActionTypes.GAME_RESUME),
  updateState: (state) => createAction(ActionTypes.GAME_UPDATE_STATE, state)
};

// Player Actions
export const playerActions = {
  update: (data) => createAction(ActionTypes.PLAYER_UPDATE, data),
  ready: (isReady) => createAction(ActionTypes.PLAYER_READY, isReady)
};

// Physics Actions
export const physicsActions = {
  update: (data) => createAction(ActionTypes.PHYSICS_UPDATE, data),
  reset: () => createAction(ActionTypes.PHYSICS_RESET)
}; 