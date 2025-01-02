import { useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { featureFlags } from '../../utils/featureFlags';
import Logger from '../../utils/logger';

export function GameBoardWrapper() {
  useEffect(() => {
    Logger.info('GameBoardWrapper', 'Rendering game board');
  }, []);

  return <GameBoard />;
} 