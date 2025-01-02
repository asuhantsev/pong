import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import styles from '../../styles/components/menu/MultiplayerMenu.module.css';
import { buttons } from '../../styles/shared';

export function MultiplayerMenu() {
  const [roomCode, setRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useMultiplayer();

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const roomId = await createRoom();
      navigate(`/game/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError('Please enter a room code');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await joinRoom(roomCode);
      navigate(`/game/${roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          className={`${buttons.primaryLarge} ${isConnecting ? buttons.loading : ''}`}
          onClick={handleCreateRoom}
          disabled={isConnecting}
        >
          {isConnecting ? '' : 'Create Room'}
        </button>

        <div className={styles.joinSection}>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter Room Code"
            className={styles.input}
            disabled={isConnecting}
            maxLength={6}
          />
          <button
            className={`${buttons.secondary} ${isConnecting ? buttons.loading : ''}`}
            onClick={handleJoinRoom}
            disabled={isConnecting || !roomCode}
          >
            {isConnecting ? '' : 'Join Room'}
          </button>
        </div>

        <button
          className={buttons.secondary}
          onClick={() => navigate('/')}
          disabled={isConnecting}
        >
          Back
        </button>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
} 