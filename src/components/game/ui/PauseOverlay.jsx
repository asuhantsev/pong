import PropTypes from 'prop-types';
import { GameOverlay } from '../../shared/GameOverlay';
import styles from '../../../styles/components/game/ui/PauseOverlay.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../../styles/components/shared/Button.module.css';

export function PauseOverlay({ onResume }) {
  return (
    <GameOverlay 
      type="pause"
      animation="fadeIn"
      showCloseButton={false}
    >
      <h2 className={`
        ${typographyStyles.heading2}
        ${styles.title}
      `}>
        Game Paused
      </h2>
      
      <button
        onClick={onResume}
        className={`
          ${buttonStyles.large}
          ${styles.resumeButton}
        `}
      >
        Resume Game
      </button>
    </GameOverlay>
  );
}

PauseOverlay.propTypes = {
  onResume: PropTypes.func.isRequired
}; 