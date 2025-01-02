import { createContext, useContext, useReducer, useCallback } from 'react';
import Logger from '../utils/logger';

const GameContext = createContext(null);

// Only UI-specific state
const initialState = {
  isMenuOpen: false,
  activeDialog: null,
  uiSettings: {
    showFPS: false,
    showControls: true
  }
};

function gameReducer(state, action) {
  Logger.debug('GameUIReducer', `Processing action: ${action.type}`, action);

  switch (action.type) {
    case 'TOGGLE_MENU':
      return {
        ...state,
        isMenuOpen: !state.isMenuOpen
      };
    case 'SET_DIALOG':
      return {
        ...state,
        activeDialog: action.payload
      };
    case 'UPDATE_UI_SETTINGS':
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          ...action.payload
        }
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value = {
    ...state,
    toggleMenu: () => dispatch({ type: 'TOGGLE_MENU' }),
    setDialog: (dialog) => dispatch({ type: 'SET_DIALOG', payload: dialog }),
    updateUISettings: (settings) => dispatch({ type: 'UPDATE_UI_SETTINGS', payload: settings })
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 