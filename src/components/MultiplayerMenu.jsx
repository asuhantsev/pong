import { useState, useEffect, useCallback } from 'react';

// Update helper function to handle Map structure
const getReadyState = (socketId, role, playersReady) => {
  if (!socketId || !playersReady || !(playersReady instanceof Map)) {
    return false;
  }
  return playersReady.get(socketId) || false;
};

function MultiplayerMenu({ 
  onCreateRoom, 
  onJoinRoom, 
  onToggleReady,
  roomId, 
  error: socketError,
  playersReady, 
  role,
  mySocketId,
  isReconnecting,
  isCreatingRoom: isCreatingRoomProp,
  isJoiningRoom: isJoiningRoomProp,
  onBack,
  myNickname
}) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [localError, setLocalError] = useState(null);

  // Helper to check if both players are connected
  const areBothPlayersConnected = useCallback(() => {
    return playersReady instanceof Map && playersReady.size === 2;
  }, [playersReady]);

  // Helper to check if all players are ready
  const areAllPlayersReady = useCallback(() => {
    if (!areBothPlayersConnected()) return false;
    return Array.from(playersReady.values()).every(ready => ready);
  }, [playersReady, areBothPlayersConnected]);

  // Debug logging
  useEffect(() => {
    return () => {
      // console.log('MultiplayerMenu unmounting:', {
      //   role,
      //   mySocketId
      // });
    };
  }, [role, mySocketId, playersReady]);

  // Add debug logging
  useEffect(() => {
    console.log('MultiplayerMenu state:', {
      roomId,
      role,
      mySocketId,
      playersReady: playersReady instanceof Map ? Array.from(playersReady.entries()) : null
    });
  }, [roomId, role, mySocketId, playersReady]);

  const handleCreateRoom = async () => {
    try {
      await onCreateRoom();
    } catch (err) {
      setLocalError(`Failed to create room: ${err.message}`);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      if (!roomId?.trim()) {
        throw new Error('Room code is required');
      }
      await onJoinRoom(roomId);
    } catch (err) {
      setLocalError(`Failed to join room: ${err.message}`);
    }
  };

  const handleToggleReady = () => {
    console.log('Toggle ready clicked:', {
      roomId,
      mySocketId,
      currentState: playersReady.get(mySocketId)
    });
    onToggleReady(roomId);
  };

  const renderReadyButton = () => {
    const isReady = playersReady.get(mySocketId);
    return (
      <button 
        onClick={handleToggleReady}
        disabled={isReconnecting}
        className={isReady ? 'ready-button ready' : 'ready-button'}
      >
        {isReady ? 'Ready' : 'Click when Ready'}
      </button>
    );
  };

  const renderReadyStatus = () => {
    return (
      <div className="ready-status">
        {Array.from(playersReady.entries()).map(([id, ready]) => (
          <div key={id}>
            Player {id === mySocketId ? '(You)' : '(Opponent)'}: {ready ? '✅' : '⏳'}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="multiplayer-menu">
      {!roomId ? (
        <div className="multiplayer-options">
          <button 
            className="start-button" 
            onClick={handleCreateRoom}
            disabled={isCreatingRoomProp || isJoiningRoomProp}
          >
            {isCreatingRoomProp ? 'Creating Room...' : 'Create Room'}
          </button>
          <div className="join-room">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={isCreatingRoomProp || isJoiningRoomProp}
            />
            <button 
              className="start-button"
              onClick={() => handleJoinRoom(joinRoomId)}
              disabled={!joinRoomId || isCreatingRoomProp || isJoiningRoomProp}
            >
              {isJoiningRoomProp ? 'Joining...' : 'Join Room'}
            </button>
          </div>
          <button 
            className="back-button"
            onClick={onBack}
            disabled={isCreatingRoomProp || isJoiningRoomProp}
          >
            Back
          </button>
          {localError && <div className="error-message">{localError}</div>}
        </div>
      ) : (
        // Room info and ready state UI
        <div className="room-info">
          <h3>Room Code: {roomId}</h3>
          
          {areBothPlayersConnected() ? (
            <div className="ready-section">
              <p>Both players connected!</p>
              {renderReadyButton()}
              {renderReadyStatus()}
            </div>
          ) : (
            <p>Waiting for opponent...</p>
          )}
        </div>
      )}
      <div className="players-list">
        {Array.from(playersReady.entries()).map(([id, ready]) => (
          <div key={id} className={`player-entry ${id === mySocketId ? 'my-player' : ''}`}>
            <div className="player-nickname">
              {id === mySocketId ? 
                `${myNickname} (You)` : 
                'Opponent'}
            </div>
            <div className="ready-status">
              {ready ? '✅' : '⏳'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MultiplayerMenu; 