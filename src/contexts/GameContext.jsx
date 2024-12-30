import { createContext, useContext, useReducer, useCallback } from 'react';
import Logger from '../utils/logger';

const GameContext = createContext(null);

const initialState = {
  mode: null,
  isGameStarted: false,
  isPaused: false,
  winner: null,
  score: { left: 0, right: 0 },
  countdown: null
};

function gameReducer(state, action) {
  Logger.debug('GameReducer', `Processing action: ${action.type}`, { 
    currentState: state,
    action 
  });

  let newState;
  switch (action.type) {
    case 'START_GAME':
      newState = {
        ...initialState,
        mode: action.payload,
        isGameStarted: true,
        isPaused: false,
        winner: null,
        score: { left: 0, right: 0 },
        countdown: 3
      };
      break;
    case 'UPDATE_COUNTDOWN':
      newState = {
        ...state,
        countdown: action.payload
      };
      break;
    case 'TOGGLE_PAUSE':
      newState = {
        ...state,
        isPaused: !state.isPaused
      };
      break;
    case 'END_GAME':
      newState = {
        ...initialState
      };
      break;
    case 'SET_MODE':
      newState = {
        ...state,
        mode: action.payload
      };
      break;
    case 'UPDATE_SCORE':
      newState = {
        ...state,
        score: action.payload
      };
      break;
    case 'SET_WINNER':
      newState = {
        ...state,
        winner: action.payload,
        isGameStarted: true
      };
      break;
    default:
      Logger.warn('GameReducer', `Unknown action type: ${action.type}`);
      return state;
  }

  Logger.debug('GameReducer', 'State updated', { 
    previousState: state,
    action,
    newState 
  });

  return newState;
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const gameActions = {
    startGame: useCallback((mode) => {
      Logger.info('GameActions', 'Starting game', { mode });
      dispatch({ type: 'START_GAME', payload: mode });
    }, []),

    endGame: useCallback(() => {
      Logger.info('GameActions', 'Ending game');
      dispatch({ type: 'END_GAME' });
    }, []),

    setMode: useCallback((mode) => {
      Logger.info('GameActions', 'Setting game mode', { mode });
      dispatch({ type: 'SET_MODE', payload: mode });
    }, []),

    updateScore: useCallback((score) => {
      Logger.info('GameActions', 'Updating score', { score });
      dispatch({ type: 'UPDATE_SCORE', payload: score });
    }, []),

    setWinner: useCallback((winner) => {
      Logger.info('GameActions', 'Setting winner', { winner });
      dispatch({ type: 'SET_WINNER', payload: winner });
    }, []),

    updateCountdown: useCallback((count) => {
      Logger.info('GameActions', 'Updating countdown', { count });
      dispatch({ type: 'UPDATE_COUNTDOWN', payload: count });
    }, []),

    togglePause: useCallback(() => {
      Logger.info('GameActions', 'Toggling pause');
      dispatch({ type: 'TOGGLE_PAUSE' });
    }, [])
  };

  Logger.debug('GameProvider', 'Current state', { state });

  return (
    <GameContext.Provider value={{ state, actions: gameActions }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    Logger.error('useGame', 'useGame must be used within a GameProvider');
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 