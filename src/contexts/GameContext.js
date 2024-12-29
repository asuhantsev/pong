import { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  mode: null,
  screen: 'main',
  isGameStarted: false,
  isPaused: false,
  winner: null,
  score: { left: 0, right: 0 },
  playerNames: { left: 'Player 1', right: 'Player 2' },
  countdown: null
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        isGameStarted: true,
        winner: null,
        score: { left: 0, right: 0 }
      };
    case 'END_GAME':
      return {
        ...state,
        isGameStarted: false,
        isPaused: false
      };
    case 'UPDATE_SCORE':
      return {
        ...state,
        score: action.payload
      };
    case 'SET_WINNER':
      return {
        ...state,
        winner: action.payload,
        isGameStarted: false
      };
    case 'TOGGLE_PAUSE':
      return {
        ...state,
        isPaused: !state.isPaused,
        countdown: action.payload
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const gameActions = {
    startGame: () => dispatch({ type: 'START_GAME' }),
    endGame: () => dispatch({ type: 'END_GAME' }),
    updateScore: (score) => dispatch({ type: 'UPDATE_SCORE', payload: score }),
    setWinner: (winner) => dispatch({ type: 'SET_WINNER', payload: winner }),
    togglePause: (countdown) => dispatch({ type: 'TOGGLE_PAUSE', payload: countdown })
  };

  return (
    <GameContext.Provider value={{ state, actions: gameActions }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext); 