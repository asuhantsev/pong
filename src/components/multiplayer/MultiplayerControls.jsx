import styles from '../../styles/components/multiplayer/MultiplayerControls.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import inputStyles from '../../styles/components/shared/Input.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import gridStyles from '../../styles/components/shared/Grid.module.css';

export function MultiplayerControls({
  onCreateRoom,
  onJoinRoom,
  isConnected,
  isCreatingRoom,
  isJoiningRoom,
  roomCode,
  onRoomCodeChange
}) {
  return (
    <div className={`${layoutStyles.flexColumn} ${gridStyles.gap3}`}>
      <button 
        className={buttonStyles.large}
        onClick={onCreateRoom}
        disabled={!isConnected || isCreatingRoom || isJoiningRoom}
      >
        {!isConnected ? 'Connecting...' : 
         isCreatingRoom ? 'Creating Room...' : 
         'Create Room'}
      </button>

      <div className={`${layoutStyles.flexRow} ${gridStyles.gap2}`}>
        <input
          className={`${inputStyles.input} ${styles.roomCodeInput}`}
          type="text"
          value={roomCode}
          onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
          placeholder="Enter Room Code"
          maxLength={6}
          disabled={!isConnected || isCreatingRoom || isJoiningRoom}
        />
        <button 
          className={buttonStyles.button}
          onClick={() => onJoinRoom(roomCode)}
          disabled={!isConnected || !roomCode || isCreatingRoom || isJoiningRoom}
        >
          {!isConnected ? 'Connecting...' :
           isJoiningRoom ? 'Joining...' : 
           'Join Room'}
        </button>
      </div>
    </div>
  );
} 