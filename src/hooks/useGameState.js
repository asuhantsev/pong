import { useState, useCallback, useEffect } from 'react';
import StorageManager from '../utils/StorageManager';

export function useGameState() {
  const [gameState, setGameState] = useState(() => {
    // Try to load saved state
    const saved = localStorage.getItem('gameState');
    return saved ? JSON.parse(saved) : {
      winner: null,
      playerNames: {
        left: 'Player 1',
        right: 'Player 2'
      },
      isPaused: false,
      countdown: null,
      score: { left: 0, right: 0 },
      isGameStarted: false
    };
  });

  // Save state changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  return {
    ...gameState,
    updateGameState
  };
} 