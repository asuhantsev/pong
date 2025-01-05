import { useCallback } from 'react';
import { useDispatch, useSelector } from '../store/store';
import { gameActions } from '../store/actions';
import Logger from '../utils/logger';

export function useGame() {
  const dispatch = useDispatch();
  const gameState = useSelector(state => state.game);

  const actions = {
    initialize: useCallback((mode) => {
      Logger.info('useGame', 'Initializing game', { mode });
      dispatch(gameActions.updateGameState({ 
        mode,
        isStarted: false,
        isPaused: false,
        winner: null,
        score: { left: 0, right: 0 },
        countdown: null,
        status: 'initializing'
      }));
    }, [dispatch]),

    setMode: useCallback((mode) => {
      Logger.info('useGame', 'Setting game mode', { mode });
      dispatch(gameActions.updateGameState({ mode }));
    }, [dispatch]),

    startGame: useCallback((mode) => {
      Logger.info('useGame', 'Starting game', { mode });
      dispatch(gameActions.startGame(mode));
    }, [dispatch]),

    togglePause: useCallback((countdown) => {
      Logger.info('useGame', 'Toggling pause');
      dispatch(gameActions.togglePause());
      if (countdown) {
        dispatch(gameActions.updateCountdown(countdown));
      }
    }, [dispatch])
  };

  return {
    state: gameState,
    actions
  };
} 