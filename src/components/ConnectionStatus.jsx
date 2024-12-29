import styles from '../styles/components/ConnectionStatus.module.css';
import cardStyles from '../styles/components/shared/Card.module.css';
import layoutStyles from '../styles/components/shared/Layout.module.css';
import typographyStyles from '../styles/components/shared/Typography.module.css';

export function ConnectionStatus({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className={`${layoutStyles.fixed} ${styles.container}`}>
      <div className={`${cardStyles.card} ${cardStyles.glass} ${styles.content}`}>
        <div className={layoutStyles.flexColumn}>
          <h3 className={typographyStyles.heading3}>{error.message}</h3>
          {error.description && (
            <p className={typographyStyles.text}>{error.description}</p>
          )}
          <button 
            className={buttonStyles.button}
            onClick={onRetry}
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
} 