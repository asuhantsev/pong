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
  myNickname
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

  // Render initial multiplayer menu if no room
  if (!roomId) {
    return (
      <div className="multiplayer-menu">
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
              onClick={() => handleJoinRoom(joinRoomId)}
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
          {localError && <div className="error-message">{localError}</div>}
          {socketError && <div className="error-message">{socketError}</div>}
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