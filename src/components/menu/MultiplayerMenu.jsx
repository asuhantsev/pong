import { useState } from 'react';
import '../../styles/MultiplayerMenu.css';

export function MultiplayerMenu({ onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    setIsCreating(true);
    // TODO: Implement room creation
    console.log('Creating room...');
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError('Room code is required');
      return;
    }
    setIsJoining(true);
    // TODO: Implement room joining
    console.log('Joining room:', roomCode);
  };

  return (
    <div className="multiplayer-menu">
      <h2>Multiplayer</h2>

      <div className="room-controls">
        <button
          className="create-room-button"
          onClick={handleCreateRoom}
          disabled={isCreating || isJoining}
        >
          {isCreating ? 'Creating Room...' : 'Create Room'}
        </button>

        <div className="join-room-section">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Enter Room Code"
            maxLength={6}
            disabled={isCreating || isJoining}
          />
          <button
            className="join-room-button"
            onClick={handleJoinRoom}
            disabled={!roomCode || isCreating || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <button className="back-button" onClick={onBack}>
        Back
      </button>
    </div>
  );
} 