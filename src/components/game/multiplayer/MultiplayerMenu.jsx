import { useState, useCallback } from 'react';
import { useRoom } from '../../../contexts/RoomContext';
import { usePlayer } from '../../../contexts/PlayerContext';
import { useSocket } from '../../../contexts/SocketContext';
import { useError } from '../../../contexts/ErrorContext';
import { useGame } from '../../../contexts/GameContext';
import { isValidNickname } from '../../../utils/validation';

export function MultiplayerMenu() {
  const [joinRoomId, setJoinRoomId] = useState('');
  
  const {
    roomId,
    playersReady,
    playerNicknames,
    isReconnecting,
    createRoom,
    joinRoom,
    isCreatingRoom,
    isJoiningRoom
  } = useRoom();

  const {
    nickname,
    isReady,
    role,
    toggleReady,
    updateNickname
  } = usePlayer();

  const { isConnected } = useSocket();
  const { errors, setError, clearError } = useError();
  const { actions: gameActions } = useGame();

  // Handle room creation
  const handleCreateRoom = useCallback(async () => {
    try {
      clearError('room');
      await createRoom();
    } catch (err) {
      setError('room', 'Failed to create room');
    }
  }, [createRoom, setError, clearError]);

  // Handle room joining
  const handleJoinRoom = useCallback(async () => {
    try {
      if (!joinRoomId?.trim()) {
        throw new Error('Room code is required');
      }
      clearError('room');
      await joinRoom(joinRoomId.toUpperCase());
    } catch (err) {
      setError('room', err.message);
    }
  }, [joinRoomId, joinRoom, setError, clearError]);

  // Handle nickname update
  const handleNicknameChange = useCallback((newNickname) => {
    if (!isValidNickname(newNickname)) {
      setError('nickname', 'Invalid nickname format');
      return;
    }
    clearError('nickname');
    updateNickname(newNickname);
  }, [updateNickname, setError, clearError]);

  // Handle ready toggle
  const handleReadyToggle = useCallback(() => {
    if (!roomId) return;
    toggleReady(roomId);
  }, [roomId, toggleReady]);

  // Handle game start
  const handleGameStart = useCallback(() => {
    if (!roomId || !isReady) return;
    gameActions.startGame();
  }, [roomId, isReady, gameActions]);

  // Render initial menu if not in a room
  if (!roomId) {
    return (
      <div className="multiplayer-menu">
        <div className="nickname-section">
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={15}
          />
          {errors.nickname && (
            <div className="error-message">{errors.nickname}</div>
          )}
        </div>

        <div className="room-controls">
          <button
            className="create-room"
            onClick={handleCreateRoom}
            disabled={!isConnected || isCreatingRoom || isJoiningRoom}
          >
            {isCreatingRoom ? 'Creating...' : 'Create Room'}
          </button>

          <div className="join-room">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              disabled={!isConnected || isCreatingRoom || isJoiningRoom}
            />
            <button
              onClick={handleJoinRoom}
              disabled={!isConnected || !joinRoomId || isCreatingRoom || isJoiningRoom}
            >
              {isJoiningRoom ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>

        {errors.room && (
          <div className="error-message">{errors.room}</div>
        )}
      </div>
    );
  }

  // Render room UI when in a room
  return (
    <div className="multiplayer-room">
      <h2>Room: {roomId}</h2>
      
      <div className="players-list">
        {Array.from(playersReady.entries()).map(([id, ready]) => {
          const isCurrentPlayer = id === role;
          const playerNickname = playerNicknames.get(id) || 'Unknown';
          
          return (
            <div key={id} className={`player-entry ${isCurrentPlayer ? 'current' : ''}`}>
              <span className="player-nickname">
                {playerNickname} {isCurrentPlayer ? '(You)' : ''}
              </span>
              <span className="ready-status">
                {ready ? '✅ Ready' : '⏳ Waiting'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="room-actions">
        <button
          className={`ready-button ${isReady ? 'ready' : ''}`}
          onClick={handleReadyToggle}
          disabled={isReconnecting}
        >
          {isReady ? 'Ready!' : 'Click when Ready'}
        </button>

        {playersReady.size === 2 && Array.from(playersReady.values()).every(ready => ready) && (
          <button
            className="start-button"
            onClick={handleGameStart}
          >
            Start Game
          </button>
        )}
      </div>

      {isReconnecting && (
        <div className="reconnecting-message">
          Reconnecting...
        </div>
      )}
    </div>
  );
} 