import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { usePhysics } from '../../hooks/usePhysics';
import { useGameLoop } from '../../hooks/useGameLoop';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import { WINNING_SCORE } from '../../constants/gameConstants';
import styles from '../../styles/components/game/GameBoard.module.css';
import Logger from '../../utils/logger';

export function GameBoard() {
  const { state: { 
    isPaused, 
    score, 
    winner,
    isGameStarted,
    countdown,
    mode
  }, actions } = useGame();

  const { physics, updatePhysics, resetBall, resetGame: resetPhysics, movePaddle } = usePhysics();
  const playerNickname = localStorage.getItem('nickname') || 'Player 1';
  const [pressedKeys, setPressedKeys] = useState(new Set());

  // Define pause handler first
  const handlePause = useCallback(() => {
    // Don't allow pause during countdown, after win, or when game hasn't started
    if (!isGameStarted || countdown || winner) return;
    Logger.info('GameBoard', 'Game paused/resumed');
    actions.togglePause();
  }, [actions, isGameStarted, countdown, winner]);

  // Initialize game state and handle countdown
  useEffect(() => {
    if (isGameStarted && !winner) {
      Logger.info('GameBoard', 'Game state initialized', {
        isGameStarted,
        countdown,
        mode
      });
      
      if (countdown === 3) {
        Logger.info('GameBoard', 'Initial countdown, resetting physics');
        resetPhysics();
      }
      
      if (countdown) {
        const timer = setInterval(() => {
          if (countdown === 1) {
            Logger.info('GameBoard', 'Final countdown tick, initializing ball');
            resetBall(false); // Initialize ball with starting velocity
          }
          actions.updateCountdown(countdown > 1 ? countdown - 1 : null);
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [isGameStarted, winner, countdown, resetPhysics, resetBall, actions, mode]);

  // Log game state changes in a separate effect
  useEffect(() => {
    if (isGameStarted && !countdown && !winner && !isPaused) {
      Logger.info('GameBoard', 'Game state update', {
        physics: {
          ballPosition: physics.ballPosition,
          ballVelocity: physics.ballVelocity
        }
      });
    }
  }, [isGameStarted, countdown, winner, isPaused, physics.ballPosition.x, physics.ballPosition.y, physics.ballVelocity.x, physics.ballVelocity.y]);

  // Log game start separately to avoid dependency cycle
  useEffect(() => {
    if (isGameStarted && !countdown && !winner && !isPaused) {
      Logger.info('GameBoard', 'Game active', {
        ballPosition: physics.ballPosition,
        ballVelocity: physics.ballVelocity
      });
    }
  }, [isGameStarted, countdown, winner, isPaused]);

  // Game loop callback
  const gameLoop = useCallback((deltaTime) => {
    if (!isGameStarted || isPaused || winner || countdown) {
      return;
    }

    updatePhysics(deltaTime);

    // Check for scoring
    if (physics.ballPosition.x <= 0) {
      Logger.info('GameBoard', 'Right player scored');
      
      // Increment score by 1
      const newScore = { ...score, right: score.right + 1 };
      actions.updateScore(newScore);
      
      // Check for winner after score update
      if (newScore.right === WINNING_SCORE) {
        actions.setWinner('right');
      } else {
        setTimeout(() => resetBall(true), 1000);
      }
    } else if (physics.ballPosition.x >= 800 - 15) {
      Logger.info('GameBoard', 'Left player scored');
      
      // Increment score by 1
      const newScore = { ...score, left: score.left + 1 };
      actions.updateScore(newScore);
      
      // Check for winner after score update
      if (newScore.left === WINNING_SCORE) {
        actions.setWinner('left');
      } else {
        setTimeout(() => resetBall(true), 1000);
      }
    }
  }, [isGameStarted, isPaused, winner, countdown, physics.ballPosition, score, actions, updatePhysics, resetBall]);

  // Start game loop
  useGameLoop(gameLoop);

  // Handle continuous paddle movement
  useEffect(() => {
    // Don't allow paddle movement during pause (except during countdown) or after win
    if (!isGameStarted || winner || (isPaused && !countdown)) return;

    const PADDLE_SPEED = 300;
    let lastTime = performance.now();
    let frameId;

    const updatePaddles = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      const moveAmount = PADDLE_SPEED * (deltaTime / 1000);

      // Left paddle (W/S)
      if (pressedKeys.has('w')) {
        movePaddle(physics.leftPaddlePos - moveAmount, 'left');
      }
      if (pressedKeys.has('s')) {
        movePaddle(physics.leftPaddlePos + moveAmount, 'left');
      }

      // Right paddle (Arrow keys)
      if (pressedKeys.has('ArrowUp')) {
        movePaddle(physics.rightPaddlePos - moveAmount, 'right');
      }
      if (pressedKeys.has('ArrowDown')) {
        movePaddle(physics.rightPaddlePos + moveAmount, 'right');
      }

      lastTime = currentTime;
      frameId = requestAnimationFrame(updatePaddles);
    };

    frameId = requestAnimationFrame(updatePaddles);
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isGameStarted, isPaused, winner, countdown, physics.leftPaddlePos, physics.rightPaddlePos, movePaddle, pressedKeys]);

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle paddle keys if game is paused (except during countdown) or after win
      if (!isGameStarted || winner || (isPaused && !countdown)) return;
      
      const key = ['ArrowUp', 'ArrowDown'].includes(e.key) ? e.key : e.key.toLowerCase();
      
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(key)) {
        e.preventDefault();
        setPressedKeys(prev => new Set([...prev, key]));
      }
    };

    const handleKeyUp = (e) => {
      const key = ['ArrowUp', 'ArrowDown'].includes(e.key) ? e.key : e.key.toLowerCase();
      
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(key)) {
        e.preventDefault();
        setPressedKeys(prev => {
          const newKeys = new Set([...prev]);
          newKeys.delete(key);
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameStarted, isPaused, winner, countdown]);

  // Add pause key handler
  useEffect(() => {
    const handlePauseKey = (e) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        handlePause();
      }
    };

    window.addEventListener('keydown', handlePauseKey);
    return () => window.removeEventListener('keydown', handlePauseKey);
  }, [handlePause]);

  const handleExitGame = useCallback(() => {
    Logger.info('GameBoard', 'Exiting game to main menu');
    actions.endGame();
    resetPhysics();
  }, [actions, resetPhysics]);

  const handlePlayAgain = useCallback(() => {
    Logger.info('GameBoard', 'Starting new game', { mode });
    resetPhysics();
    actions.startGame(mode);
  }, [resetPhysics, actions, mode]);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.playerNames}>
        <span className={styles.leftPlayer}>{playerNickname}</span>
        <span className={styles.rightPlayer}>{mode === 'single' ? 'COMPUTER' : 'Player 2'}</span>
      </div>
      <GameControls 
        onPause={handlePause}
        disabled={!isGameStarted || !!winner}
        isPaused={isPaused}
      />
      <ScoreBoard score={score} />
      <GameField
        ballPos={physics.ballPosition}
        leftPaddlePos={physics.leftPaddlePos}
        rightPaddlePos={physics.rightPaddlePos}
      />
      {winner && (
        <div className={styles.winnerOverlay}>
          {winner === 'left' ? playerNickname : (mode === 'single' ? 'COMPUTER' : 'Player 2')} Wins!
          <button className={styles.playAgainButton} onClick={handlePlayAgain}>
            Play Again
          </button>
        </div>
      )}
      {isPaused && (
        <PauseOverlay 
          onResume={handlePause}
          onExit={handleExitGame} 
        />
      )}
      {countdown && <CountdownOverlay count={countdown} />}
    </div>
  );
} 