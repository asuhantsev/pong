import { useGameState } from '../../hooks/useGameState';
import { useMenuState } from '../../hooks/useMenuState';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import { MultiplayerGame } from './multiplayer/MultiplayerGame';

export function GameBoard() {
  const { 
    isPaused, 
    score, 
    winner,
    isGameStarted,
    updateGameState 
  } = useGameState();
  
  const { menuState } = useMenuState();

  const handlePause = useCallback(() => {
    if (!socket?.connected || !roomId) return;
    
    const newPauseState = !isPaused;
    updateGameState({ isPaused: newPauseState });
    
    socket.emit('pauseGame', {
      roomId,
      isPaused: newPauseState,
      countdownValue: newPauseState ? 3 : null
    });
  }, [socket, roomId, isPaused, updateGameState]);

  const renderMultiplayerContent = () => {
    if (menuState.screen !== 'multiplayer') return null;

    return (
      <MultiplayerGame
        socket={socket}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onToggleReady={toggleReady}
        networkStats={networkStats}
        isConnected={isConnected}
        isCreatingRoom={isCreatingRoom}
        isJoiningRoom={isJoiningRoom}
        roomId={roomId}
        playersReady={playersReady}
        mySocketId={mySocketId}
        playerNicknames={playerNicknames}
        isReconnecting={isReconnecting}
        error={error}
      />
    );
  };

  return (
    <div className="game-container">
      {isGameStarted ? (
        <>
          <GameControls 
            onPause={handlePause}
            disabled={!!winner}
            isPaused={isPaused}
          />
          <ScoreBoard 
            score={score}
            playerNames={playerNames}
          />
          <GameField
            ballPos={ballPos}
            leftPaddlePos={leftPaddlePos}
            rightPaddlePos={rightPaddlePos}
          />
        </>
      ) : (
        renderMultiplayerContent()
      )}
      {isPaused && <PauseOverlay onResume={handlePause} />}
      <CountdownOverlay count={countdown} />
    </div>
  );
} 