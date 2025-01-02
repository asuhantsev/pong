import { useCallback } from 'react';
import { useDispatch, useSelector } from '../store/store';
import { gameActions } from '../store/actions';
import Logger from '../utils/logger';

export function useGameState() {
  const dispatch = useDispatch();
  const gameState = useSelector(state => state.game);

  const updateGameState = useCallback((updates) => {
    Logger.debug('GameState', 'Updating game state', updates);
    
    // Dispatch appropriate actions based on updates
    if ('isPaused' in updates) {
      dispatch(gameActions.pauseGame(updates.isPaused));
    }
    if ('isGameStarted' in updates) {
      dispatch(updates.isGameStarted ? gameActions.startGame() : gameActions.endGame());
    }
    if ('score' in updates) {
      dispatch(gameActions.updateScore(updates.score));
    }
    if ('winner' in updates) {
      dispatch(gameActions.setWinner(updates.winner));
    }
    if ('countdown' in updates) {
      dispatch(gameActions.updateCountdown(updates.countdown));
    }
  }, [dispatch]);

  const resetGame = useCallback(() => {
    Logger.debug('GameState', 'Resetting game state');
    dispatch(gameActions.resetState());
  }, [dispatch]);

  const startGame = useCallback(() => {
    Logger.debug('GameState', 'Starting game');
    dispatch(gameActions.startGame());
  }, [dispatch]);

  return {
    ...gameState,
    updateGameState,
    resetGame,
    startGame
  };
} 