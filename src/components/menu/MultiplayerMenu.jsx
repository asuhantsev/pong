import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from '../../styles/components/menu/MultiplayerMenu.module.css';
import Logger from '../../utils/logger';

export function MultiplayerMenu() {
  const [roomCode, setRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { createRoom, joinRoom } = useMultiplayerContext();

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      Logger.info('MultiplayerMenu', 'Creating room');
      const roomId = await createRoom();
      navigate(`/game/${roomId}`);
    } catch (err) {
      Logger.error('MultiplayerMenu', 'Failed to create room', err);
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
      Logger.info('MultiplayerMenu', 'Joining room', { roomCode });
      await joinRoom(roomCode);
      navigate(`/game/${roomCode}`);
    } catch (err) {
      Logger.error('MultiplayerMenu', 'Failed to join room', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.menuContainer} ${styles[theme]}`}>
        <h1 className={styles.title}>Multiplayer</h1>
        
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleCreateRoom}
            disabled={isConnecting}
          >
            Create Room
          </button>
          
          <div className={styles.joinSection}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter Room Code"
              className={styles.input}
              disabled={isConnecting}
            />
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={handleJoinRoom}
              disabled={isConnecting || !roomCode}
            >
              Join Room
            </button>
          </div>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleBack}
            disabled={isConnecting}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
} 