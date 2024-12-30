import { useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { NewGameBoard } from './NewGameBoard';
import { featureFlags, FeatureFlags } from '../../utils/featureFlags';
import Logger from '../../utils/logger';

export function GameBoardWrapper() {
  useEffect(() => {
    Logger.info('GameBoardWrapper', 'Rendering game board', {
      useNewGameLoop: featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP),
      useNewPhysics: featureFlags.isEnabled(FeatureFlags.USE_NEW_PHYSICS)
    });
  }, []);

  if (featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) {
    return <NewGameBoard />;
  }

  return <GameBoard />;
} 