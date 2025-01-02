import PropTypes from 'prop-types';
import { memo } from 'react';
import styles from '../../../styles/components/game/controls/GameControls.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import buttonStyles from '../../../styles/components/shared/Button.module.css';
import themeStyles from '../../../styles/components/shared/Theme.module.css';
import spacingStyles from '../../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export const GameControls = memo(function GameControls({ 
  onPause, 
  isPaused = false,
  disabled = false
}) {
  return (
    <div className={`
      ${layoutStyles.flexRow} 
      ${layoutStyles.justifyEnd}
      ${spacingStyles.mt3}
      ${animationStyles.fadeIn}
    `}>
      <button
        onClick={onPause}
        disabled={disabled}
        className={`
          ${buttonStyles.button}
          ${themeStyles.glass}
          ${styles.controlButton}
          ${animationStyles.scaleIn}
          ${disabled ? styles.disabled : ''}
        `}
        aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
        aria-pressed={isPaused}
        role="switch"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
});

GameControls.propTypes = {
  onPause: PropTypes.func.isRequired,
  isPaused: PropTypes.bool,
  disabled: PropTypes.bool
}; 