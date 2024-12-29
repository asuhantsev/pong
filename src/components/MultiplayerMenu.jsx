import { useState, useEffect, useCallback, useContext } from 'react';
import { ErrorContext } from '../contexts/ErrorContext';
import styles from '../styles/components/multiplayer/MultiplayerMenu.module.css';
import layoutStyles from '../styles/components/shared/Layout.module.css';
import buttonStyles from '../styles/components/shared/Button.module.css';
import errorStyles from '../styles/components/shared/ErrorMessage.module.css';
import playerStyles from '../styles/components/multiplayer/PlayerInfo.module.css';
import inputStyles from '../styles/components/shared/Input.module.css';
import statusStyles from '../styles/components/shared/Status.module.css';

// Update helper function to handle Map structure
const getReadyState = (socketId, role, playersReady) => {
  if (!socketId || !playersReady || !(playersReady instanceof Map)) {
    return false;
  }
  return playersReady.get(socketId) || false;
};

export function MultiplayerMenu({
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  roomId,
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
  const { errors, setError, clearError } = useContext(ErrorContext);

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
      setError('local', err.message);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      if (!roomId?.trim()) {
        throw new Error('Room code is required');
      }
      await onJoinRoom(roomId);
    } catch (err) {
      setError('local', err.message);
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
    
    return (
      <button 
        onClick={handleToggleReady}
        disabled={!isConnected() || isReconnecting}
        className={`${playerStyles.readyButton} ${isReady ? playerStyles.ready : ''}`}
      >
        {isReady ? 'Ready!' : 'Click when Ready'}
      </button>
    );
  };

  const renderReadyStatus = () => {
    return (
      <div className={styles.playersList}>
        {Array.from(playersReady.entries()).map(([id, ready]) => {
          const isMe = id === mySocketId;
          const playerNickname = isMe ? myNickname : playerNicknames.get(id);

          return (
            <div key={id} className={isMe ? styles.current : styles.playerEntry}>
              <div className={playerStyles.playerInfo}>
                <span className={playerStyles.playerNickname}>
                  {playerNickname || 'Unknown'} {isMe ? '(You)' : ''}
                </span>
                <span className={playerStyles.readyIndicator}>
                  {ready ? '✅' : '⏳'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
      <div className={layoutStyles.container}>
        <div className={layoutStyles.flexColumn}>
          <button 
            className={buttonStyles.button}
            onClick={handleCreateRoom}
            disabled={!isConnected() || isCreatingRoom || isJoiningRoom}
          >
            {!isConnected() ? 'Connecting...' : 
             isCreatingRoom ? 'Creating Room...' : 
             'Create Room'}
          </button>
          <div className={styles.joinRoom}>
            <input
              className={inputStyles.roomCode}
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={!isConnected() || isCreatingRoom || isJoiningRoom}
            />
            <button 
              className={buttonStyles.button}
              onClick={() => handleJoinRoom(joinRoomId)}
              disabled={!isConnected() || !joinRoomId || isCreatingRoom || isJoiningRoom}
            >
              {!isConnected() ? 'Connecting...' :
               isJoiningRoom ? 'Joining...' : 
               'Join Room'}
            </button>
          </div>
          <button 
            className={buttonStyles.button}
            onClick={onBack}
            disabled={isCreatingRoom || isJoiningRoom}
          >
            Back
          </button>
          {localError && <div className={errorStyles.error}>{localError}</div>}
          {errors.local && <div className={errorStyles.error}>{errors.local}</div>}
          {errors.socket && <div className={errorStyles.error}>{errors.socket}</div>}
          {errors.network && <div className={errorStyles.error}>{errors.network}</div>}
          {!isConnected() && (
            <div className={statusStyles.connecting}>
              Connecting to server...
            </div>
          )}
        </div>
        <div className={styles.roomControls}>
          {/* ... */}
        </div>
      </div>
    );
  }

  // Render room UI once in a room
  return (
    <div className={layoutStyles.container}>
      <div className={layoutStyles.flexColumn}>
        {/* ... */}
      </div>
      <div className={styles.roomControls}>
        {/* ... */}
      </div>
    </div>
  );
}

export default MultiplayerMenu; 