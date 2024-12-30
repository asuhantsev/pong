import { useEffect, useCallback, useState } from 'react';
import gameLoopSystem, { GameLoopConstants } from '../gameLoop/GameLoopSystem';
import { featureFlags, FeatureFlags } from '../utils/featureFlags';
import Logger from '../utils/logger';

export function useNewGameLoop() {
  const [loopState, setLoopState] = useState(gameLoopSystem.getState());

  // Update callback - for game state updates
  const addUpdateCallback = useCallback((callback) => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return () => {};
    return gameLoopSystem.addUpdateCallback(callback);
  }, []);

  // Render callback - for visual updates with interpolation
  const addRenderCallback = useCallback((callback) => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return () => {};
    return gameLoopSystem.addRenderCallback(callback);
  }, []);

  // Control methods
  const startLoop = useCallback(() => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return;
    Logger.info('GameLoop', 'Starting game loop');
    gameLoopSystem.start();
  }, []);

  const stopLoop = useCallback(() => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return;
    Logger.info('GameLoop', 'Stopping game loop');
    gameLoopSystem.stop();
  }, []);

  const pauseLoop = useCallback(() => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return;
    Logger.info('GameLoop', 'Pausing game loop');
    gameLoopSystem.pause();
  }, []);

  const resumeLoop = useCallback(() => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) return;
    Logger.info('GameLoop', 'Resuming game loop');
    gameLoopSystem.resume();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) {
        gameLoopSystem.cleanup();
      }
    };
  }, []);

  return {
    state: loopState,
    addUpdateCallback,
    addRenderCallback,
    startLoop,
    stopLoop,
    pauseLoop,
    resumeLoop,
    constants: GameLoopConstants
  };
} 