import styles from '../styles/components/Ball.module.css';
import animationStyles from '../styles/components/shared/Animations.module.css';

function Ball({ position }) {
  return (
    <div 
      className={`${styles.ball} ${animationStyles.fadeIn}`}
      style={{
        left: position.x,
        top: position.y
      }}
    />
  );
}

export default Ball; 