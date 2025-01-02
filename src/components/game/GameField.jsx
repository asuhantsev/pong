import PropTypes from 'prop-types';
import { memo } from 'react';
import { useSelector } from '../../store/store';
import styles from '../../styles/components/game/GameField.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';

const BALL_SIZE = 15;
const PADDLE_HEIGHT = 100;

export const GameField = memo(function GameField() {
  // Get game state from Redux
  const ballPosition = useSelector(state => state.physics.ball.position);
  const paddlePositions = useSelector(state => state.physics.paddles);
  const isStarted = useSelector(state => state.game.isStarted);
  const status = useSelector(state => state.game.status);
  const mode = useSelector(state => state.game.mode);
  const countdown = useSelector(state => state.game.countdown);
  const isActive = useSelector(state => state.physics.isActive);

  // Early return for loading state
  if (!isStarted || !ballPosition || !paddlePositions) {
    return (
      <div className={`
        ${styles.gameField}
        ${layoutStyles.flexCenter}
      `}>
        <div className={animationStyles.pulse}>Loading game field...</div>
      </div>
    );
  }

  return (
    <div className={`
      ${styles.gameField}
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
          height: `${BALL_SIZE}px`,
          opacity: isActive ? 1 : 0
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

      {/* Player Names */}
      <div className={styles.playerNames}>
        <div className={styles.playerLeft}>
          Player 1
        </div>
        <div className={styles.playerRight}>
          {mode === 'single' ? 'Computer' : 'Player 2'}
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && countdown >= 0 && (
        <div className={styles.countdown}>
          {countdown === 0 ? 'GO!' : countdown}
        </div>
      )}
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