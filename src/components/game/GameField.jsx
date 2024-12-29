import { Ball } from '../Ball';
import { Paddle } from '../Paddle';
import styles from '../../styles/components/GameBoard.module.css';

export function GameField({ 
  ballPos, 
  leftPaddlePos, 
  rightPaddlePos 
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.gameBoard}>
        <Paddle position="left" top={leftPaddlePos} />
        <Paddle position="right" top={rightPaddlePos} />
        <Ball position={ballPos} />
      </div>
    </div>
  );
} 