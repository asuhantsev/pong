import styles from '../../styles/components/multiplayer/MultiplayerMenu.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import inputStyles from '../../styles/components/shared/Input.module.css';
import spacingStyles from '../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';
import { layout, buttons, status } from '../../styles/shared';

export function MultiplayerMenu({
  roomId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  isConnected,
  isCreatingRoom,
  isJoiningRoom,
  error
}) {
  const [joinRoomId, setJoinRoomId] = React.useState('');

  if (roomId) {
    return (
      <div className={`
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${spacingStyles.gap4}
        ${animationStyles.fadeIn}
      `}>
        <div className={`
          ${styles.menuContainer}
          ${themeStyles.glass}
          ${spacingStyles.p6}
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${spacingStyles.gap4}
        `}>
          <div className={`
            ${styles.roomInfo}
            ${layoutStyles.flexColumn}
            ${layoutStyles.itemsCenter}
            ${spacingStyles.gap2}
          `}>
            <span className={typographyStyles.label}>Room Code:</span>
            <span className={`
              ${typographyStyles.heading2}
              ${styles.roomCode}
            `}>
              {roomId}
            </span>
          </div>

          <button
            onClick={onLeaveRoom}
            className={`
              ${buttonStyles.large}
              ${buttonStyles.secondary}
              ${styles.menuButton}
            `}
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${spacingStyles.gap4}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${styles.menuContainer}
        ${themeStyles.glass}
        ${spacingStyles.p6}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${spacingStyles.gap4}
      `}>
        <button
          onClick={onCreateRoom}
          disabled={!isConnected || isCreatingRoom || isJoiningRoom}
          className={`
            ${buttonStyles.large}
            ${styles.menuButton}
          `}
        >
          {!isConnected ? 'Connecting...' : 
           isCreatingRoom ? 'Creating Room...' : 
           'Create Room'}
        </button>

        <div className={`
          ${styles.joinSection}
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${spacingStyles.gap3}
        `}>
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder="Enter Room Code"
            maxLength={6}
            disabled={!isConnected || isCreatingRoom || isJoiningRoom}
            className={`
              ${inputStyles.input}
              ${styles.roomInput}
            `}
          />

          <button
            onClick={() => onJoinRoom(joinRoomId)}
            disabled={!isConnected || !joinRoomId || isCreatingRoom || isJoiningRoom}
            className={`
              ${buttonStyles.large}
              ${buttonStyles.secondary}
              ${styles.menuButton}
            `}
          >
            {!isConnected ? 'Connecting...' :
             isJoiningRoom ? 'Joining...' : 
             'Join Room'}
          </button>
        </div>

        {error && (
          <div className={`
            ${status.error}
            ${layout.mt3}
          `}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 