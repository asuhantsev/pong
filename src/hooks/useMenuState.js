import { useState, useCallback } from 'react';

export function useMenuState() {
  const [menuState, setMenuState] = useState({
    screen: 'main',
    mode: null
  });

  const handleMenuTransition = useCallback((screen, mode = null) => {
    console.log('Menu transition:', { screen, mode });
    
    let newMode = mode;
    if (screen === 'multiplayer') {
      newMode = null;
    } else if (screen === 'game') {
      newMode = mode || 'single';
    }
    
    setMenuState({ screen, mode: newMode });
  }, []);

  return {
    menuState,
    handleMenuTransition
  };
} 