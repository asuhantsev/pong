import { useState, useEffect, useCallback } from 'react';

// Update helper function to handle Map structure
const getReadyState = (socketId, role, playersReady) => {
  if (!socketId || !playersReady || !(playersReady instanceof Map)) {
    return false;
  }
  return playersReady.get(socketId) || false;
};

function MultiplayerMenu(props) {
  // State declarations first
  const [joinRoomId, setJoinRoomId] = useState('');
  const [localError, setLocalError] = useState(null);

  // Then memoized values and callbacks
  const areBothPlayersConnected = useCallback(() => {
    return props.playersReady instanceof Map && props.playersReady.size === 2;
  }, [props.playersReady]);

  // Helper to check if all players are ready
  const areAllPlayersReady = useCallback(() => {
    if (!areBothPlayersConnected()) return false;
    return Array.from(props.playersReady.values()).every(ready => ready);
  }, [props.playersReady, areBothPlayersConnected]);

  // Debug logging
  useEffect(() => {
    return () => {
      // console.log('MultiplayerMenu unmounting:', {
      //   role,
      //   mySocketId
      // });
    };
  }, [props.role, props.mySocketId, props.playersReady]);

  // Add debug logging
  useEffect(() => {
    console.log('MultiplayerMenu state:', {
      roomId: props.roomId,
      role: props.role,
      mySocketId: props.mySocketId,
      playersReady: props.playersReady instanceof Map ? Array.from(props.playersReady.entries()) : null
    });
  }, [props.roomId, props.role, props.mySocketId, props.playersReady]);

  const handleCreateRoom = async () => {
    try {
      await props.onCreateRoom();
    } catch (err) {
      setLocalError(`Failed to create room: ${err.message}`);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      if (!roomId?.trim()) {
        throw new Error('Room code is required');
      }
      await props.onJoinRoom(roomId);
    } catch (err) {
      setLocalError(`Failed to join room: ${err.message}`);
    }
  };

  const handleToggleReady = () => {
    console.log('Toggle ready clicked:', {
      roomId: props.roomId,
      mySocketId: props.mySocketId,
      currentState: props.playersReady.get(props.mySocketId)
    });
    props.onToggleReady(props.roomId);
  };

  const renderReadyButton = () => {
    const isReady = props.playersReady.get(props.mySocketId);
    return (
      <button 
        onClick={handleToggleReady}
        disabled={props.isReconnecting}
        className={isReady ? 'ready-button ready' : 'ready-button'}
      >
        {isReady ? 'Ready' : 'Click when Ready'}
      </button>
    );
  };

  const renderReadyStatus = () => {
    return (
      <div className="ready-status">
        {Array.from(props.playersReady.entries()).map(([id, ready]) => (
          <div key={id}>
            Player {id === props.mySocketId ? '(You)' : '(Opponent)'}: {ready ? '✅' : '⏳'}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="multiplayer-menu">
      {!props.roomId ? (
        <div className="multiplayer-options">
          <button 
            className="start-button" 
            onClick={handleCreateRoom}
            disabled={props.isCreatingRoom || props.isJoiningRoom}
          >
            {props.isCreatingRoom ? 'Creating Room...' : 'Create Room'}
          </button>
          <div className="join-room">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={props.isCreatingRoom || props.isJoiningRoom}
            />
            <button 
              className="start-button"
              onClick={() => handleJoinRoom(joinRoomId)}
              disabled={!joinRoomId || props.isCreatingRoom || props.isJoiningRoom}
            >
              {props.isJoiningRoom ? 'Joining...' : 'Join Room'}
            </button>
          </div>
          <button 
            className="back-button"
            onClick={props.onBack}
            disabled={props.isCreatingRoom || props.isJoiningRoom}
          >
            Back
          </button>
          {localError && <div className="error-message">{localError}</div>}
        </div>
      ) : (
        // Room info and ready state UI
        <div className="room-info">
          <h3>Room Code: {props.roomId}</h3>
          
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
        {Array.from(props.playersReady.entries()).map(([id, ready]) => (
          <div key={id} className={`player-entry ${id === props.mySocketId ? 'my-player' : ''}`}>
            <div className="player-nickname">
              {id === props.mySocketId ? 
                `${props.myNickname} (You)` : 
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