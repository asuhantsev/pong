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
    setGameState(prev => {
      const newState = {
        ...prev,
        ...updates
      };
      console.log('New game state will be:', newState);
      return newState;
    });
  }, []);

  const resetGame = useCallback(() => {
    console.log('Resetting game state to:', INITIAL_STATE);
    setGameState(INITIAL_STATE);
  }, []);

  const startGame = useCallback(() => {
    console.log('Starting game, current state:', gameState);
    setGameState(prev => {
      const newState = {
        ...prev,
        isGameStarted: true,
        isPaused: false,
        winner: null,
        score: { left: 0, right: 0 }
      };
      console.log('New game state after start:', newState);
      return newState;
    });
  }, [gameState]);

  // Debug log for state changes
  console.log('Current game state:', gameState);

  return {
    ...gameState,
    updateGameState,
    resetGame,
    startGame
  };
} 