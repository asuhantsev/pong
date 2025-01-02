import PropTypes from 'prop-types';
import { memo } from 'react';
import styles from '../../../styles/components/game/ui/ScoreBoard.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export const ScoreBoard = memo(function ScoreBoard({ 
  score,
  playerName = 'Player 1',
  className = ''
}) {
  if (!score?.left || !score?.right) {
    return (
      <div className={`
        ${styles.scoreBoard}
        ${layoutStyles.flexCenter}
        ${className}
      `}>
        <div className={animationStyles.pulse}>Loading scores...</div>
      </div>
    );
  }

  return (
    <div 
      className={`
        ${styles.scoreBoard}
        ${layoutStyles.flexRow}
        ${layoutStyles.justifyCenter}
        ${layoutStyles.itemsCenter}
        ${animationStyles.fadeIn}
        ${className}
      `}
      role="region"
      aria-label="Game Score"
    >
      <div 
        className={`
          ${styles.score}
          ${typographyStyles.heading2}
        `}
        aria-label={`${playerName} Score`}
      >
        <span className={styles.scoreValue}>{score.left}</span>
      </div>
      <div className={`
        ${styles.divider}
        ${typographyStyles.heading3}
      `}>
        -
      </div>
      <div 
        className={`
          ${styles.score}
          ${typographyStyles.heading2}
        `}
        aria-label="Opponent Score"
      >
        <span className={styles.scoreValue}>{score.right}</span>
      </div>
    </div>
  );
});

ScoreBoard.propTypes = {
  score: PropTypes.shape({
    left: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired
  }).isRequired,
  playerName: PropTypes.string,
  className: PropTypes.string
}; 