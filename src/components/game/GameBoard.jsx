import { useEffect, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePhysics } from '../../hooks/usePhysics';
import { useGame } from '../../contexts/GameContext';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import { MultiplayerGame } from './multiplayer/MultiplayerGame';
import styles from '../../styles/components/game/GameBoard.module.css';
import Logger from '../../utils/logger';

export function GameBoard({ mode = 'single' }) {
  Logger.debug('GameBoard', 'Component rendered', { mode });

  const { state: { 
    isPaused, 
    score, 
    winner,
    isGameStarted,
    countdown,
    mode: gameMode
  }, actions } = useGame();

  const { physics, updatePhysics, resetBall, resetGame: resetPhysics, movePaddle } = usePhysics();

  // Get player nickname from localStorage
  const playerNickname = localStorage.getItem('nickname') || 'Player 1';

  // Game loop callback
  const gameLoop = useCallback((deltaTime) => {
    if (!isPaused && !winner && isGameStarted) {
      Logger.debug('GameLoop', 'Updating game state', { 
        deltaTime,
        ballPosition: physics.ballPosition,
        score
      });

      updatePhysics(deltaTime);

      // Check for scoring
      if (physics.ballPosition.x <= 0) {
        Logger.info('GameLoop', 'Right player scored', { 
          ballPosition: physics.ballPosition,
          newScore: { ...score, right: score.right + 1 }
        });
        actions.updateScore({ ...score, right: score.right + 1 });
        resetBall();
      } else if (physics.ballPosition.x >= 800 - 15) { // BOARD_WIDTH - BALL_SIZE
        Logger.info('GameLoop', 'Left player scored', {
          ballPosition: physics.ballPosition,
          newScore: { ...score, left: score.left + 1 }
        });
        actions.updateScore({ ...score, left: score.left + 1 });
        resetBall();
      }

      // Check for winner
      if (score.left >= 11 || score.right >= 11) {
        const winner = score.left > score.right ? 'left' : 'right';
        Logger.info('GameLoop', 'Game won', { winner, finalScore: score });
        actions.setWinner(winner);
      }
    }
  }, [isPaused, winner, isGameStarted, physics.ballPosition, score, actions, updatePhysics, resetBall]);

  // Start game loop
  useGameLoop(gameLoop);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isGameStarted || isPaused || winner) return;

      // In single player mode, only control left paddle
      if (mode === 'single' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        return;
      }

      Logger.debug('GameBoard', 'Key pressed', { 
        key: e.key,
        leftPaddlePos: physics.leftPaddlePos,
        rightPaddlePos: physics.rightPaddlePos
      });

      switch (e.key) {
        case 'w':
          movePaddle(physics.leftPaddlePos - 10, 'left');
          break;
        case 's':
          movePaddle(physics.leftPaddlePos + 10, 'left');
          break;
        case 'ArrowUp':
          movePaddle(physics.rightPaddlePos - 10, 'right');
          break;
        case 'ArrowDown':
          movePaddle(physics.rightPaddlePos + 10, 'right');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, isPaused, winner, physics.leftPaddlePos, physics.rightPaddlePos, movePaddle, mode]);

  const handlePause = useCallback(() => {
    Logger.info('GameBoard', 'Game paused/resumed');
    actions.togglePause(3); // 3 second countdown
  }, [actions]);

  const handleStartSinglePlayer = useCallback(() => {
    Logger.info('GameBoard', 'Starting single player game');
    resetPhysics();
    actions.setMode('single');
    actions.startGame('single');
  }, [resetPhysics, actions]);

  // Log state changes
  useEffect(() => {
    Logger.debug('GameBoard', 'State updated', { 
      isGameStarted,
      isPaused,
      winner,
      score,
      countdown,
      mode
    });
  }, [isGameStarted, isPaused, winner, score, countdown, mode]);

  return (
    <div className={styles.gameContainer}>
      {isGameStarted ? (
        <>
          <div className={styles.playerNames}>
            <span className={styles.leftPlayer}>{playerNickname}</span>
            <span className={styles.rightPlayer}>{mode === 'single' ? 'COMPUTER' : 'Player 2'}</span>
          </div>
          <GameControls 
            onPause={handlePause}
            disabled={!!winner}
            isPaused={isPaused}
          />
          <ScoreBoard 
            score={score}
            playerNames={{ 
              left: playerNickname, 
              right: mode === 'single' ? 'COMPUTER' : 'Player 2' 
            }}
          />
          <GameField
            ballPos={physics.ballPosition}
            leftPaddlePos={physics.leftPaddlePos}
            rightPaddlePos={physics.rightPaddlePos}
          />
          {winner && (
            <div className={styles.winnerOverlay}>
              {winner === 'left' ? playerNickname : (mode === 'single' ? 'COMPUTER' : 'Player 2')} Wins!
            </div>
          )}
          {winner && (
            <button className={styles.playAgainButton} onClick={handleStartSinglePlayer}>
              Play Again
            </button>
          )}
        </>
      ) : (
        mode === 'single' ? (
          <button 
            className={styles.startButton} 
            onClick={handleStartSinglePlayer}
            style={{ cursor: 'pointer' }}
          >
            Start Single Player
          </button>
        ) : (
          <MultiplayerGame />
        )
      )}
      {isPaused && <PauseOverlay onResume={handlePause} />}
      {countdown && <CountdownOverlay count={countdown} />}
    </div>
  );
} 