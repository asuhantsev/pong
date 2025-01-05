// Action Types
export const ActionTypes = {
  // Network actions
  NETWORK_CONNECT: 'network/connect',
  NETWORK_DISCONNECT: 'network/disconnect',
  NETWORK_JOIN_ROOM: 'network/joinRoom',
  NETWORK_LEAVE_ROOM: 'network/leaveRoom',
  NETWORK_UPDATE_STATE: 'network/updateState',
  
  // Game actions
  GAME_START: 'game/start',
  GAME_END: 'game/end',
  GAME_PAUSE: 'game/pause',
  GAME_RESUME: 'game/resume',
  GAME_UPDATE_STATE: 'game/updateState',
  
  // Player actions
  PLAYER_UPDATE: 'player/update',
  PLAYER_READY: 'player/ready',
  
  // Physics actions
  PHYSICS_UPDATE: 'physics/update',
  PHYSICS_RESET: 'physics/reset'
};

// State shape definition
export const StateShape = {
  network: {
    isConnected: false,
    socket: null,
    currentRoom: null,
    error: null
  },
  game: {
    mode: null,
    status: 'idle',
    score: { left: 0, right: 0 },
    countdown: null,
    winner: null
  },
  player: {
    nickname: '',
    isReady: false,
    role: null
  },
  physics: {
    ball: {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      spin: 0
    },
    paddles: {
      left: { y: 0, velocity: 0 },
      right: { y: 0, velocity: 0 }
    }
  }
}; 