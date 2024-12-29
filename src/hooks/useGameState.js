import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  isPaused: false,
  isGameStarted: false,
  score: { left: 0, right: 0 },
  winner: null,
  countdown: null
};

export function useGameState() {
  const [gameState, setGameState] = useState(INITIAL_STATE);

  const updateGameState = useCallback((updates) => {
    console.log('Updating game state:', updates);
    setGameState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetGame = useCallback(() => {
    console.log('Resetting game state');
    setGameState(INITIAL_STATE);
  }, []);

  const startGame = useCallback(() => {
    console.log('Starting game');
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