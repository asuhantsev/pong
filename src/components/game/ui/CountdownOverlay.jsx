import PropTypes from 'prop-types';
import { GameOverlay } from '../../shared/GameOverlay';
import styles from '../../../styles/components/game/ui/CountdownOverlay.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export function CountdownOverlay({ count }) {
  if (count === null || count === undefined) return null;

  return (
    <GameOverlay 
      type="countdown"
      animation="scaleIn"
    >
      <div className={`
        ${styles.countdown}
        ${typographyStyles.heading1}
        ${animationStyles.bounce}
      `}>
        {count}
      </div>
    </GameOverlay>
  );
}

CountdownOverlay.propTypes = {
  count: PropTypes.number
}; 