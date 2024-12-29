import styles from '../../../styles/components/game/multiplayer/MultiplayerGame.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import themeStyles from '../../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../../styles/components/shared/Button.module.css';
import spacingStyles from '../../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';
import errorStyles from '../../../styles/components/shared/Error.module.css';

export function MultiplayerGame({
  roomId,
  isHost,
  isReady,
  opponentReady,
  onReady,
  error,
  children
}) {
  const showReadyState = isHost || (!isHost && opponentReady);

  return (
    <div className={`
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${spacingStyles.gap4}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${themeStyles.glass}
        ${spacingStyles.p4}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${styles.container}
      `}>
        <h3 className={`
          ${typographyStyles.heading3}
          ${spacingStyles.mb3}
        `}>
          Room Code: {roomId}
        </h3>

        <div className={`
          ${styles.readySection}
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${spacingStyles.gap3}
        `}>
          {showReadyState ? (
            <>
              <p className={typographyStyles.text}>
                Both players connected!
              </p>
              <button
                onClick={onReady}
                className={`
                  ${buttonStyles.large}
                  ${isReady ? buttonStyles.secondary : ''}
                  ${styles.readyButton}
                `}
              >
                {isReady ? 'Not Ready' : 'Ready'}
              </button>
            </>
          ) : (
            <p className={typographyStyles.text}>
              Waiting for opponent...
            </p>
          )}
        </div>

        {error && (
          <div className={`
            ${errorStyles.error}
            ${spacingStyles.mt3}
          `}>
            {error}
          </div>
        )}
      </div>

      {children}
    </div>
  );
} 