import styles from '../styles/components/Paddle.module.css';
import animationStyles from '../styles/components/shared/Animations.module.css';

export function Paddle({ position, top }) {
  return (
    <div 
      className={`${styles.paddle} ${styles[position]} ${animationStyles.fadeIn}`}
      style={{ top }}
    />
  );
}

export default Paddle 