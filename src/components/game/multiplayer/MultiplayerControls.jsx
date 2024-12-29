import { useCallback, useState } from 'react';

export function MultiplayerControls({ 
  onCreateRoom, 
  onJoinRoom, 
  isConnected,
  isCreatingRoom,
  isJoiningRoom 
}) {
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleJoinRoom = useCallback(() => {
    if (!joinRoomId?.trim()) return;
    onJoinRoom(joinRoomId);
  }, [joinRoomId, onJoinRoom]);

  return (
    <div className="multiplayer-options">
      <button 
        className="start-button" 
        onClick={onCreateRoom}
        disabled={!isConnected || isCreatingRoom || isJoiningRoom}
      >
        {!isConnected ? 'Connecting...' : 
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
          disabled={!isConnected || isCreatingRoom || isJoiningRoom}
        />
        <button 
          className="start-button"
          onClick={handleJoinRoom}
          disabled={!isConnected || !joinRoomId || isCreatingRoom || isJoiningRoom}
        >
          {!isConnected ? 'Connecting...' :
           isJoiningRoom ? 'Joining...' : 
           'Join Room'}
        </button>
      </div>
    </div>
  );
} 