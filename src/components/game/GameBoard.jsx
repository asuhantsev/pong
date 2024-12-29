import { useEffect, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePhysics } from '../../hooks/usePhysics';
import { useGameState } from '../../hooks/useGameState';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import { MultiplayerGame } from './multiplayer/MultiplayerGame';
import styles from '../../styles/components/game/GameBoard.module.css';

export function GameBoard({ mode = 'single' }) {
  const { 
    isPaused, 
    score, 
    winner,
    isGameStarted,
    updateGameState,
    startGame,
    resetGame: resetGameState 
  } = useGameState();

  const { physics, updatePhysics, resetBall, resetGame: resetPhysics, movePaddle } = usePhysics();

  // Get player nickname from localStorage
  const playerNickname = localStorage.getItem('nickname') || 'Player 1';

  // Game loop callback
  const gameLoop = useCallback((deltaTime) => {
    if (!isPaused && !winner) {
      updatePhysics(deltaTime);

      // Check for scoring
      if (physics.ballPosition.x <= 0) {
        // Right player/computer scores
        updateGameState({
          score: { ...score, right: score.right + 1 }
        });
        resetBall();
      } else if (physics.ballPosition.x >= 800 - 15) { // BOARD_WIDTH - BALL_SIZE
        // Left player scores
        updateGameState({
          score: { ...score, left: score.left + 1 }
        });
        resetBall();
      }

      // Check for winner
      if (score.left >= 11 || score.right >= 11) {
        updateGameState({
          winner: score.left > score.right ? 'left' : 'right'
        });
      }
    }
  }, [isPaused, winner, physics.ballPosition, score, updateGameState, updatePhysics, resetBall]);

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
    updateGameState({ isPaused: !isPaused });
  }, [isPaused, updateGameState]);

  const handleStartSinglePlayer = useCallback(() => {
    resetGameState();
    resetPhysics();
    startGame();
  }, [resetGameState, resetPhysics, startGame]);

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
          <button className={styles.startButton} onClick={handleStartSinglePlayer}>
            Start Single Player
          </button>
        ) : (
          <MultiplayerGame />
        )
      )}
      {isPaused && <PauseOverlay onResume={handlePause} />}
      <CountdownOverlay count={3} />
    </div>
  );
} 