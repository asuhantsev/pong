import { useState, useCallback, useEffect } from 'react';
import Logger from '../utils/logger';

const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;
const BALL_SIZE = 15;
const PADDLE_HEIGHT = 100;
const INITIAL_BALL_SPEED = 3;
const SPEED_MULTIPLIER = 1.5;

const INITIAL_STATE = {
  ballPosition: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
  ballVelocity: { x: INITIAL_BALL_SPEED, y: 0 },
  leftPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  rightPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  currentSpeed: INITIAL_BALL_SPEED
};

export function usePhysics() {
  const [physics, setPhysics] = useState(INITIAL_STATE);

  // Log state changes
  useEffect(() => {
    Logger.debug('Physics', 'State updated', physics);
  }, [physics]);

  const resetBall = useCallback(() => {
    Logger.info('Physics', 'Resetting ball');
    setPhysics(prev => ({
      ...prev,
      ballPosition: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
      ballVelocity: { 
        x: prev.currentSpeed * (Math.random() > 0.5 ? 1 : -1),
        y: (Math.random() - 0.5) * 2
      },
      currentSpeed: prev.currentSpeed * SPEED_MULTIPLIER
    }));
  }, []);

  const resetGame = useCallback(() => {
    Logger.info('Physics', 'Resetting game');
    setPhysics(INITIAL_STATE);
  }, []);

  const movePaddle = useCallback((newPos, side) => {
    Logger.debug('Physics', 'Moving paddle', { side, newPos });
    // Clamp paddle position
    const clampedPos = Math.max(0, Math.min(BOARD_HEIGHT - PADDLE_HEIGHT, newPos));
    
    setPhysics(prev => ({
      ...prev,
      [side === 'left' ? 'leftPaddlePos' : 'rightPaddlePos']: clampedPos
    }));
  }, []);

  const updatePhysics = useCallback((deltaTime) => {
    Logger.debug('Physics', 'Updating physics', { deltaTime });
    
    setPhysics(prev => {
      // Update ball position
      const newX = prev.ballPosition.x + prev.ballVelocity.x;
      const newY = prev.ballPosition.y + prev.ballVelocity.y;

      // Ball collision with top and bottom walls
      let newVelY = prev.ballVelocity.y;
      if (newY <= 0 || newY >= BOARD_HEIGHT - BALL_SIZE) {
        newVelY = -prev.ballVelocity.y;
      }

      // Ball collision with paddles
      let newVelX = prev.ballVelocity.x;
      const ballCenterY = newY + BALL_SIZE / 2;

      // Left paddle collision
      if (newX <= 15 && // Paddle width
          ballCenterY >= prev.leftPaddlePos &&
          ballCenterY <= prev.leftPaddlePos + PADDLE_HEIGHT) {
        newVelX = Math.abs(prev.ballVelocity.x);
        newVelY = ((ballCenterY - (prev.leftPaddlePos + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 5;
      }

      // Right paddle collision
      if (newX >= BOARD_WIDTH - BALL_SIZE - 15 &&
          ballCenterY >= prev.rightPaddlePos &&
          ballCenterY <= prev.rightPaddlePos + PADDLE_HEIGHT) {
        newVelX = -Math.abs(prev.ballVelocity.x);
        newVelY = ((ballCenterY - (prev.rightPaddlePos + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)) * 5;
      }

      const newState = {
        ...prev,
        ballPosition: { x: newX, y: newY },
        ballVelocity: { x: newVelX, y: newVelY }
      };

      Logger.debug('Physics', 'New state calculated', newState);
      return newState;
    });
  }, []);

  return {
    physics,
    updatePhysics,
    resetBall,
    resetGame,
    movePaddle
  };
} 