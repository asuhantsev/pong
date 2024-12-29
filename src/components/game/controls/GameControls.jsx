import styles from '../../../styles/components/game/controls/GameControls.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import buttonStyles from '../../../styles/components/shared/Button.module.css';
import themeStyles from '../../../styles/components/shared/Theme.module.css';
import spacingStyles from '../../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export function GameControls({ onPause, isPaused }) {
  return (
    <div className={`
      ${layoutStyles.flexRow} 
      ${layoutStyles.justifyEnd}
      ${spacingStyles.mt3}
      ${animationStyles.fadeIn}
    `}>
      <button
        onClick={onPause}
        className={`
          ${buttonStyles.button}
          ${themeStyles.glass}
          ${styles.controlButton}
          ${animationStyles.scaleIn}
        `}
        aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
} 