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
  error, 
  playersReady, 
  role,
  mySocketId,
  isReconnecting,
  isCreatingRoom,
  isJoiningRoom,
  onBack
}) {
  const [joinRoomId, setJoinRoomId] = useState('');

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

  const handleCreateRoom = () => {
    console.log('Create room button clicked', {
      isCreatingRoom,
      socketId: mySocketId,
      currentRoomId: roomId
    });
    onCreateRoom();
  };

  const handleToggleReady = () => {
    console.log('Toggle ready clicked:', {
      roomId,
      mySocketId,
      currentState: playersReady.get(mySocketId)
    });
    onToggleReady(roomId);
  };

  return (
    <div className="multiplayer-menu">
      {!roomId ? (
        <div className="multiplayer-options">
          <button 
            className="start-button" 
            onClick={handleCreateRoom}
            disabled={isCreatingRoom || isJoiningRoom}
          >
            {isCreatingRoom ? 'Creating Room...' : 'Create Room'}
          </button>
          <div className="join-room">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={isCreatingRoom || isJoiningRoom}
            />
            <button 
              className="start-button"
              onClick={() => onJoinRoom(joinRoomId)}
              disabled={!joinRoomId || isCreatingRoom || isJoiningRoom}
            >
              {isJoiningRoom ? 'Joining...' : 'Join Room'}
            </button>
          </div>
          <button 
            className="back-button"
            onClick={onBack}
            disabled={isCreatingRoom || isJoiningRoom}
          >
            Back
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        // Room info and ready state UI
        <div className="room-info">
          <h3>Room Code: {roomId}</h3>
          
          {areBothPlayersConnected() ? (
            <div className="ready-section">
              <p>Both players connected!</p>
              <button 
                onClick={handleToggleReady}
                disabled={isReconnecting}
                className={playersReady.get(mySocketId) ? 'ready' : ''}
              >
                {playersReady.get(mySocketId) ? 'Ready' : 'Click when Ready'}
              </button>
              <div className="ready-status">
                {Array.from(playersReady.entries()).map(([id, ready]) => (
                  <div key={id}>
                    Player {id === mySocketId ? '(You)' : '(Opponent)'}: {ready ? '✅' : '⏳'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>Waiting for opponent...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiplayerMenu; 