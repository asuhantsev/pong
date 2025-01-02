import PropTypes from 'prop-types';
import { memo } from 'react';
import styles from '../../styles/components/game/GameField.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';

const BALL_SIZE = 15;
const PADDLE_HEIGHT = 100;

export const GameField = memo(function GameField({ 
  ballPosition, 
  paddlePositions,
  className 
}) {
  // Early return for loading state with proper type checking
  if (!ballPosition?.x || !ballPosition?.y || !paddlePositions?.left?.y || !paddlePositions?.right?.y) {
    return (
      <div className={`
        ${styles.gameField}
        ${layoutStyles.flexCenter}
        ${className}
      `}>
        <div className={animationStyles.pulse}>Loading game field...</div>
      </div>
    );
  }

  return (
    <div className={`
      ${styles.gameField}
      ${className}
      ${animationStyles.fadeIn}
    `}>
      {/* Center line */}
      <div className={styles.centerLine} />
      
      {/* Ball */}
      <div 
        className={`${styles.ball} ${animationStyles.bounce}`}
        style={{
          transform: `translate(${ballPosition.x}px, ${ballPosition.y}px)`,
          width: `${BALL_SIZE}px`,
          height: `${BALL_SIZE}px`
        }}
      />
      
      {/* Paddles */}
      <div 
        className={`${styles.paddle} ${styles.left} ${animationStyles.slide}`}
        style={{
          top: paddlePositions.left.y,
          height: `${PADDLE_HEIGHT}px`
        }}
      />
      <div 
        className={`${styles.paddle} ${styles.right} ${animationStyles.slide}`}
        style={{
          top: paddlePositions.right.y,
          height: `${PADDLE_HEIGHT}px`
        }}
      />
    </div>
  );
});

// Prop types validation with more specific requirements
GameField.propTypes = {
  ballPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  paddlePositions: PropTypes.shape({
    left: PropTypes.shape({
      y: PropTypes.number.isRequired
    }).isRequired,
    right: PropTypes.shape({
      y: PropTypes.number.isRequired
    }).isRequired
  }),
  className: PropTypes.string
};

// Default props
GameField.defaultProps = {
  className: ''
}; 