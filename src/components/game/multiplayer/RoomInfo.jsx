import { memo } from 'react';
import PropTypes from 'prop-types';
import styles from '../../../styles/components/game/multiplayer/RoomInfo.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../../styles/components/shared/Button.module.css';
import themeStyles from '../../../styles/components/shared/Theme.module.css';

export const RoomInfo = memo(function RoomInfo({
  roomId,
  playerNicknames,
  role,
  onLeaveRoom
}) {
  const isHost = role === 'host';
  const players = Array.from(playerNicknames.entries());

  return (
    <div className={`
      ${styles.container}
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${themeStyles.glass}
    `}>
      <div className={`
        ${styles.header}
        ${layoutStyles.flexRow}
        ${layoutStyles.justifyBetween}
        ${layoutStyles.itemsCenter}
      `}>
        <h3 className={typographyStyles.heading3}>
          Room Code: {roomId}
        </h3>
        <button
          onClick={onLeaveRoom}
          className={`
            ${buttonStyles.button}
            ${buttonStyles.small}
            ${styles.leaveButton}
          `}
          aria-label="Leave Room"
        >
          Leave
        </button>
      </div>

      <div className={`
        ${styles.playerList}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsStart}
      `}>
        {players.map(([id, nickname]) => (
          <div 
            key={id}
            className={`
              ${styles.player}
              ${layoutStyles.flexRow}
              ${layoutStyles.itemsCenter}
            `}
          >
            <span className={styles.playerRole}>
              {isHost ? '👑 Host' : '👤 Guest'}:
            </span>
            <span className={typographyStyles.text}>
              {nickname}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

RoomInfo.propTypes = {
  roomId: PropTypes.string.isRequired,
  playerNicknames: PropTypes.instanceOf(Map).isRequired,
  role: PropTypes.oneOf(['host', 'guest']),
  onLeaveRoom: PropTypes.func.isRequired
};

RoomInfo.defaultProps = {
  role: null
}; 