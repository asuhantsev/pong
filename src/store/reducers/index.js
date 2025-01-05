import { combineReducers } from 'redux';
import { ActionTypes, StateShape } from '../types';

const networkReducer = (state = StateShape.network, action) => {
  switch (action.type) {
    case ActionTypes.NETWORK_CONNECT:
      return { ...state, isConnected: true };
    case ActionTypes.NETWORK_DISCONNECT:
      return { ...state, isConnected: false, socket: null };
    case ActionTypes.NETWORK_JOIN_ROOM:
      return { ...state, currentRoom: action.payload };
    case ActionTypes.NETWORK_LEAVE_ROOM:
      return { ...state, currentRoom: null };
    case ActionTypes.NETWORK_UPDATE_STATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const gameReducer = (state = StateShape.game, action) => {
  switch (action.type) {
    case ActionTypes.GAME_START:
      return { 
        ...state, 
        mode: action.payload,
        status: 'playing',
        score: { left: 0, right: 0 },
        winner: null 
      };
    case ActionTypes.GAME_END:
      return { ...state, status: 'ended' };
    case ActionTypes.GAME_PAUSE:
      return { ...state, status: 'paused' };
    case ActionTypes.GAME_RESUME:
      return { ...state, status: 'playing' };
    case ActionTypes.GAME_UPDATE_STATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const playerReducer = (state = StateShape.player, action) => {
  switch (action.type) {
    case ActionTypes.PLAYER_UPDATE:
      return { ...state, ...action.payload };
    case ActionTypes.PLAYER_READY:
      return { ...state, isReady: action.payload };
    default:
      return state;
  }
};

const physicsReducer = (state = StateShape.physics, action) => {
  switch (action.type) {
    case ActionTypes.PHYSICS_UPDATE:
      return {
        ...state,
        ball: {
          ...state.ball,
          ...action.payload.ball
        },
        paddles: {
          ...state.paddles,
          ...action.payload.paddles
        }
      };
    case ActionTypes.PHYSICS_RESET:
      return {
        ...StateShape.physics,
        paddles: state.paddles // Keep paddle positions on reset
      };
    default:
      return state;
  }
};

export const rootReducer = combineReducers({
  network: networkReducer,
  game: gameReducer,
  player: playerReducer,
  physics: physicsReducer
}); 