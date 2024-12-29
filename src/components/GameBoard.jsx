import { useState, useEffect, useRef, useCallback } from 'react'
import styles from '../styles/components/GameBoard.module.css'
import containerStyles from '../styles/components/shared/Container.module.css'
import cardStyles from '../styles/components/shared/Card.module.css'
import typographyStyles from '../styles/components/shared/Typography.module.css'
import errorStyles from '../styles/components/shared/ErrorMessage.module.css'
import animationStyles from '../styles/components/shared/Animations.module.css'
import buttonStyles from '../styles/components/shared/Button.module.css'
import gameAnimations from '../styles/components/game/animations.module.css'
import gridStyles from '../styles/components/shared/Grid.module.css'

// Core components first
import Ball from './Ball'
import Paddle from './Paddle'

// Menu components
import { MainMenu } from './menu/MainMenu'
import { OptionsMenu } from './menu/OptionsMenu'
import { MultiplayerMenu } from './multiplayer/MultiplayerMenu'

// Utility components
import { ConnectionError } from './error/ConnectionError'
import NetworkStatus from './NetworkStatus'

// Hooks and utils
import { useGameState } from '../hooks/useGameState'
import { useMultiplayer } from '../hooks/useMultiplayer'
import StorageManager from '../utils/StorageManager'
import { isValidNickname, getNicknameError } from '../utils/validation'

// Constants last
import { 
  PADDLE_SPEED,
  BALL_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_OFFSET,
  WINNING_SCORE,
  PHYSICS_STEP,
  INTERPOLATION_STEP,
  BALL_SPEED,
  SPEED_INCREASE,
  NICKNAME_RULES
} from '../constants/gameConstants'

// Group all constants at the top
const PADDLE_BOUNDARIES = {
  top: 0,
  bottom: BOARD_HEIGHT - PADDLE_HEIGHT
};

// Add imports at the top
import { PauseOverlay } from './game/ui/overlays/PauseOverlay';
import { CountdownOverlay } from './game/ui/overlays/CountdownOverlay';
import { ScoreBoard } from './game/ui/ScoreBoard';
import { GameControls } from './game/controls/GameControls';

export function GameBoard() {
  // Replace individual state with context hooks
  const { state: gameState, actions: gameActions } = useGame();
  const { 
    nickname, 
    isReady, 
    role, 
    paddlePosition,
    updatePaddlePosition 
  } = usePlayer();
  const {
    roomId,
    playersReady,
    playerNicknames,
    isReconnecting,
    createRoom,
    joinRoom
  } = useRoom();
  const { physics, updatePhysics, resetBall } = usePhysics();
  const { socket, isConnected } = useSocket();
  const { errors, setError } = useError();

  // Game loop using physics context
  useEffect(() => {
    let frameId;
    const gameLoop = (timestamp) => {
      updatePhysics(timestamp);
      frameId = requestAnimationFrame(gameLoop);
    };

    if (gameState.isGameStarted && !gameState.isPaused) {
      frameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gameState.isGameStarted, gameState.isPaused, updatePhysics]);

  // Handle pause
  const handlePause = useCallback(() => {
    if (!isConnected || !roomId) return;
    
    gameActions.togglePause(3); // Start 3 second countdown
  }, [isConnected, roomId, gameActions]);

  // Handle game reset
  const handleReset = useCallback(() => {
    resetBall();
    gameActions.startGame();
  }, [resetBall, gameActions]);

  return (
    <div className={`${containerStyles.container} ${containerStyles.game} ${animationStyles.fadeIn}`}>
      {gameState.isGameStarted ? (
        <>
          <div className={styles.gameField}>
            <div className={styles.centerLine} />
            <Ball 
              position={physics.ballPosition} 
              className={gameAnimations.bounce}
            />
            <Paddle 
              position="left" 
              top={role === 'left' ? paddlePosition : physics.leftPaddlePos}
              className={gameAnimations.slide}
            />
            <Paddle 
              position="right" 
              top={role === 'right' ? paddlePosition : physics.rightPaddlePos} 
              className={gameAnimations.slide}
            />
          </div>
          <div className={`${styles.controls} ${gridStyles.grid} ${gridStyles.gap3}`}>
            <GameControls 
              onPause={handlePause}
              disabled={!!gameState.winner}
              isPaused={gameState.isPaused}
            />
          </div>
          <div className={styles.score}>
            <ScoreBoard 
              score={gameState.score}
              playerNames={gameState.playerNames}
            />
          </div>
          {gameState.isPaused && <PauseOverlay onResume={handlePause} />}
          {gameState.countdown && <CountdownOverlay count={gameState.countdown} />}
        </>
      ) : (
        <MultiplayerGame
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          roomId={roomId}
          playersReady={playersReady}
          playerNicknames={playerNicknames}
          isReconnecting={isReconnecting}
          nickname={nickname}
          isReady={isReady}
          role={role}
          error={errors.room}
          onReset={handleReset}
        />
      )}
      {errors.socket && (
        <ConnectionError 
          error={errors.socket}
          onRetry={() => socket.connect()}
          onRecovery={handleServerChange}
        />
      )}
      <NetworkStatus />
    </div>
  );
}

export default GameBoard 