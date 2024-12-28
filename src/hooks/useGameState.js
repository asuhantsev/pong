import { useState, useCallback } from 'react';
import StorageManager from '../utils/StorageManager';

export function useGameState() {
  const [menuState, setMenuState] = useState({
    screen: 'main',
    mode: null
  });

  const handleMenuTransition = useCallback((screen, mode = null) => {
    console.log('Menu transition:', { screen, mode });
    
    let newMode = mode;
    if (screen === 'multiplayer') {
      // Keep mode as null until game actually starts
      newMode = null;
    } else if (screen === 'game') {
      // Set mode only when game starts
      newMode = mode || 'single';
    }
    
    setMenuState({ screen, mode: newMode });
  }, []);

  return {
    menuState,
    handleMenuTransition
  };
} 