import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  isPaused: false,
  isGameStarted: false,
  score: { left: 0, right: 0 },
  winner: null
};

export function useGameState() {
  const [gameState, setGameState] = useState(INITIAL_STATE);

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isGameStarted: true,
      isPaused: false,
      winner: null,
      score: { left: 0, right: 0 }
    }));
  }, []);

  return {
    ...gameState,
    updateGameState,
    resetGame,
    startGame
  };
} 