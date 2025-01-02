import PropTypes from 'prop-types';
import { memo } from 'react';
import styles from '../../../styles/components/game/ui/CountdownOverlay.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export const CountdownOverlay = memo(function CountdownOverlay({ countdown }) {
  if (countdown === null || countdown < 0) return null;

  return (
    <div className={`
      ${styles.overlay}
      ${layoutStyles.flexCenter}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${styles.countdown}
        ${animationStyles.scaleIn}
      `}>
        {countdown === 0 ? 'GO!' : countdown}
      </div>
    </div>
  );
});

CountdownOverlay.propTypes = {
  countdown: PropTypes.number
}; 