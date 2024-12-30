import { useCallback, useEffect, useState } from 'react';
import { useStore, useDispatch, useSelector } from '../../store/store';
import { gameActions, physicsActions } from '../../store/actions';
import { usePhysics } from '../../hooks/usePhysics';
import { useGameLoop } from '../../hooks/useGameLoop';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import styles from '../../styles/components/game/GameBoard.module.css';
import Logger from '../../utils/logger';
import performanceMonitor from '../../utils/performance';

export function GameBoard() {
  // State selectors
  const gameState = useSelector(state => state.game);
  const physicsState = useSelector(state => state.physics);
  const dispatch = useDispatch();

  const { physics, updatePhysics, resetBall, resetGame: resetPhysics, movePaddle } = usePhysics();
  const playerNickname = localStorage.getItem('nickname') || 'Player 1';
  const [pressedKeys, setPressedKeys] = useState(new Set());

  // Define pause handler
  const handlePause = useCallback(() => {
    // Don't allow pause during countdown, after win, or when game hasn't started
    if (!gameState.isStarted || gameState.countdown || gameState.winner) return;
    
    Logger.info('GameBoard', 'Game paused/resumed');
    dispatch(gameActions.pauseGame());
  }, [gameState.isStarted, gameState.countdown, gameState.winner, dispatch]);

  // Initialize game state and handle countdown
  useEffect(() => {
    if (gameState.isStarted && !gameState.winner) {
      Logger.info('GameBoard', 'Game state initialized', {
        isStarted: gameState.isStarted,
        countdown: gameState.countdown,
        mode: gameState.mode
      });
      
      if (gameState.countdown === 3) {
        Logger.info('GameBoard', 'Initial countdown, resetting physics');
        resetPhysics();
      }
      
      if (gameState.countdown) {
        const timer = setInterval(() => {
          dispatch(gameActions.updateCountdown(gameState.countdown - 1));
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [gameState.isStarted, gameState.countdown, gameState.mode, dispatch]);

  // Game loop
  const gameLoop = useCallback((deltaTime) => {
    performanceMonitor.startMeasure('gameLoop');
    
    if (!gameState.isStarted || gameState.isPaused || gameState.countdown) {
      performanceMonitor.endMeasure('gameLoop', 'game');
      return;
    }

    // Update physics
    updatePhysics(deltaTime);

    // Update ball position in store
    dispatch(physicsActions.updateBallPosition(physics.current.ballPosition));
    dispatch(physicsActions.updateBallVelocity(physics.current.ballVelocity));

    performanceMonitor.endMeasure('gameLoop', 'game');
  }, [gameState.isStarted, gameState.isPaused, gameState.countdown, physics, updatePhysics, dispatch]);

  useGameLoop(gameLoop);

  return (
    <div className={styles.gameBoard}>
      <ScoreBoard score={gameState.score} />
      <GameField
        ballPosition={physicsState.ball.position}
        paddlePositions={physicsState.paddles}
      />
      <GameControls onPause={handlePause} />
      {gameState.isPaused && <PauseOverlay />}
      {gameState.countdown && <CountdownOverlay count={gameState.countdown} />}
    </div>
  );
} 