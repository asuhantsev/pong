import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import styles from '../../styles/components/menu/MultiplayerMenu.module.css';
import { buttonBase, buttonSuccess, buttonDisabled } from '../../styles/shared';

export function MultiplayerMenu() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnecting, error } = useMultiplayer();
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = async () => {
    await createRoom();
  };

  const handleJoinRoom = async () => {
    if (roomId.trim()) {
      await joinRoom(roomId);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Multiplayer</h2>
      <div className={styles.controls}>
        <button
          className={`${buttonBase} ${buttonSuccess} ${isConnecting ? buttonDisabled : ''}`}
          onClick={handleCreateRoom}
          disabled={isConnecting}
        >
          Create Room
        </button>

        <div className={styles.joinSection}>
          <input
            type="text"
            className={styles.input}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            disabled={isConnecting}
          />
          <button
            className={`${buttonBase} ${buttonSuccess} ${(!roomId.trim() || isConnecting) ? buttonDisabled : ''}`}
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || isConnecting}
          >
            Join Room
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button 
          className={`${buttonBase} ${styles.backButton}`}
          onClick={handleBack}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
} 