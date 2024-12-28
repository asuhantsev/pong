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
  isCreatingRoom,
  isJoiningRoom,
  onBack,
  myNickname,
  isSocketReady,
  playerNicknames
}) {
  // State declarations first
  const [joinRoomId, setJoinRoomId] = useState('');
  const [localError, setLocalError] = useState(null);

  // Debug logging
  console.log('MultiplayerMenu state:', {
    roomId,
    role,
    mySocketId,
    playersReady: Array.from(playersReady.entries())
  });

  // Then memoized values and callbacks
  const areBothPlayersConnected = useCallback(() => {
    return playersReady instanceof Map && playersReady.size === 2;
  }, [playersReady]);

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

  // Add ready button handlers
  const handleToggleReady = () => {
    if (!roomId || !mySocketId) {
      console.error('Cannot toggle ready: missing roomId or socketId');
      return;
    }

    console.log('Toggle ready clicked:', {
      roomId,
      mySocketId,
      currentState: playersReady.get(mySocketId),
      allPlayers: Array.from(playersReady.entries()),
      allNicknames: Array.from(playerNicknames.entries())
    });
    
    onToggleReady(roomId);
  };

  // Add connection status check
  const isConnected = useCallback(() => {
    return isSocketReady && mySocketId;
  }, [isSocketReady, mySocketId]);

  const renderReadyButton = () => {
    if (!mySocketId) return null;
    
    const isReady = playersReady.get(mySocketId) || false;
    const bothConnected = playersReady.size === 2;
    
    console.log('Ready button state:', {
      isReady,
      bothConnected,
      isReconnecting,
      isSocketReady,
      mySocketId,
      playersReady: Array.from(playersReady.entries())
    });
    
    return (
      <button 
        onClick={handleToggleReady}
        disabled={!isConnected() || isReconnecting}
        className={`ready-button ${isReady ? 'ready' : ''}`}
      >
        {isReady ? 'Ready!' : 'Click when Ready'}
      </button>
    );
  };

  const renderReadyStatus = () => {
    return (
      <div className="ready-status">
        {Array.from(playersReady.entries()).map(([id, ready]) => {
          const isMe = id === mySocketId;
          const playerNickname = isMe ? myNickname : playerNicknames.get(id);
          
          console.log('Rendering player:', {
            id,
            isMe,
            nickname: playerNickname,
            ready
          });

          return (
            <div key={id} className={`player-entry ${isMe ? 'my-player' : ''}`}>
              <div className="player-info">
                <span className="player-nickname">
                  {playerNickname || 'Unknown'} {isMe ? '(You)' : ''}
                </span>
                <span className="ready-indicator">
                  {ready ? '✅' : '⏳'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Move styles to a separate CSS file or use useEffect
  useEffect(() => {
    const styles = document.createElement('style');
    styles.textContent = `
      .player-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 8px 16px;
        margin: 4px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .ready-indicator {
        margin-left: 16px;
        font-size: 1.2em;
      }

      .player-nickname {
        font-weight: bold;
        color: #fff;
      }

      .ready-button {
        margin: 16px 0;
        padding: 12px 24px;
        font-size: 1.2em;
        cursor: pointer;
        background: #4CAF50;
        border: none;
        border-radius: 4px;
        color: white;
        transition: all 0.3s;
      }

      .ready-button:not(:disabled):hover {
        background: #45a049;
        transform: scale(1.02);
      }

      .ready-button.ready {
        background: #2196F3;
      }

      .ready-button:disabled {
        background: #cccccc;
        cursor: not-allowed;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(styles);
    
    return () => {
      document.head.removeChild(styles);
    };
  }, []);

  // Add useEffect for debugging
  useEffect(() => {
    console.log('MultiplayerMenu props update:', {
      roomId,
      role,
      mySocketId,
      isReconnecting,
      playersReady: Array.from(playersReady.entries()),
      playerNicknames: Array.from(playerNicknames.entries())
    });
  }, [roomId, role, mySocketId, isReconnecting, playersReady, playerNicknames]);

  // Render initial multiplayer menu if no room or role
  if (!roomId || !role) {
    return (
      <div className="multiplayer-menu">
        <div className="multiplayer-options">
          <button 
            className="start-button" 
            onClick={handleCreateRoom}
            disabled={!isConnected() || isCreatingRoom || isJoiningRoom}
          >
            {!isConnected() ? 'Connecting...' : 
             isCreatingRoom ? 'Creating Room...' : 
             'Create Room'}
          </button>
          <div className="join-room">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={!isConnected() || isCreatingRoom || isJoiningRoom}
            />
            <button 
              className="start-button"
              onClick={() => handleJoinRoom(joinRoomId)}
              disabled={!isConnected() || !joinRoomId || isCreatingRoom || isJoiningRoom}
            >
              {!isConnected() ? 'Connecting...' :
               isJoiningRoom ? 'Joining...' : 
               'Join Room'}
            </button>
          </div>
          <button 
            className="back-button"
            onClick={onBack}
            disabled={isCreatingRoom || isJoiningRoom}
          >
            Back
          </button>
          {localError && <div className="error-message">{localError}</div>}
          {socketError && <div className="error-message">{socketError}</div>}
          {!isConnected() && (
            <div className="connecting-message">
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render room UI once in a room
  return (
    <div className="multiplayer-menu">
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
        <button 
          className="back-button"
          onClick={onBack}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}

export default MultiplayerMenu; 