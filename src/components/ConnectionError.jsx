import styles from '../styles/components/error/Error.module.css';
import cardStyles from '../styles/components/shared/Card.module.css';
import typographyStyles from '../styles/components/shared/Typography.module.css';
import buttonStyles from '../styles/components/shared/Button.module.css';
import animationStyles from '../styles/components/shared/Animations.module.css';

export function ConnectionError({ error, onRetry, onRecovery }) {
  if (!error) return null;

  return (
    <div className={`${styles.container} ${animationStyles.slideIn}`}>
      <div className={`${cardStyles.glass} ${animationStyles.fadeIn}`}>
        <div className={styles.message}>
          <h3 className={typographyStyles.heading3}>{error.message}</h3>
          {error.description && (
            <p className={typographyStyles.text}>{error.description}</p>
          )}
        </div>

        {error.type === 'RETRY' ? (
          <>
            <p className={styles.retryMessage}>
              Attempting to reconnect...
            </p>
            <div className={styles.actions}>
              <button 
                className={buttonStyles.secondary}
                onClick={onRecovery}
              >
                Try Different Server
              </button>
            </div>
          </>
        ) : (
          <div className={styles.actions}>
            <button 
              className={buttonStyles.button}
              onClick={onRetry}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 