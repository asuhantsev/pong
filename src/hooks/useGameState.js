import { useState, useCallback } from 'react';
import StorageManager from '../utils/StorageManager';

export function useGameState() {
  const [menuState, setMenuState] = useState({
    screen: 'main',
    mode: null
  });

  const handleMenuTransition = useCallback((screen, mode = null) => {
    let newMode = mode;
    if (screen === 'multiplayer') {
      newMode = 'multi';
    } else if (screen === 'game' && !mode) {
      newMode = 'single';
    }
    setMenuState({ screen, mode: newMode });
  }, []);

  return {
    menuState,
    handleMenuTransition
  };
} 