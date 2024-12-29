import { useCallback, useRef } from 'react';

// Constants
const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const BALL_SIZE = 15;
const INITIAL_BALL_SPEED = 300; // Initial speed of 3 * 100 (for better control)
const BALL_SPEED_MULTIPLIER = 1.5;
const PADDLE_SPEED = 400;

const INITIAL_STATE = {
  ballPosition: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
  ballVelocity: { x: INITIAL_BALL_SPEED, y: 0 },
  leftPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  rightPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  currentBallSpeed: INITIAL_BALL_SPEED
};

export function usePhysics() {
  const physicsState = useRef({ ...INITIAL_STATE });

  const resetBall = useCallback((shouldIncreaseBallSpeed = true) => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() - 0.5) * Math.PI / 4; // Random angle between -45 and 45 degrees

    // Update ball speed if needed
    if (shouldIncreaseBallSpeed) {
      physicsState.current.currentBallSpeed *= BALL_SPEED_MULTIPLIER;
    }

    physicsState.current.ballPosition = { 
      x: BOARD_WIDTH / 2, 
      y: BOARD_HEIGHT / 2 
    };
    physicsState.current.ballVelocity = {
      x: Math.cos(angle) * physicsState.current.currentBallSpeed * direction,
      y: Math.sin(angle) * physicsState.current.currentBallSpeed
    };
  }, []);

  const resetGame = useCallback(() => {
    physicsState.current = { ...INITIAL_STATE };
    resetBall(false);
  }, [resetBall]);

  const movePaddle = useCallback((newPosition, side) => {
    // Clamp paddle position to board boundaries
    const clampedPosition = Math.max(0, Math.min(newPosition, BOARD_HEIGHT - PADDLE_HEIGHT));
    
    if (side === 'left') {
      physicsState.current.leftPaddlePos = clampedPosition;
    } else {
      physicsState.current.rightPaddlePos = clampedPosition;
    }
  }, []);

  const checkPaddleCollision = useCallback((ballPos, ballVel) => {
    const { leftPaddlePos, rightPaddlePos, currentBallSpeed } = physicsState.current;

    // Left paddle collision
    if (ballPos.x <= PADDLE_WIDTH && 
        ballPos.y >= leftPaddlePos && 
        ballPos.y <= leftPaddlePos + PADDLE_HEIGHT) {
      return {
        x: Math.abs(ballVel.x),
        y: 0 // Classic Pong has no angle on bounce
      };
    }

    // Right paddle collision
    if (ballPos.x >= BOARD_WIDTH - PADDLE_WIDTH - BALL_SIZE && 
        ballPos.y >= rightPaddlePos && 
        ballPos.y <= rightPaddlePos + PADDLE_HEIGHT) {
      return {
        x: -Math.abs(ballVel.x),
        y: 0 // Classic Pong has no angle on bounce
      };
    }

    return null;
  }, []);

  const updatePhysics = useCallback((deltaTime) => {
    const state = physicsState.current;
    
    // Update ball position
    const newBallPos = {
      x: state.ballPosition.x + state.ballVelocity.x * deltaTime,
      y: state.ballPosition.y + state.ballVelocity.y * deltaTime
    };

    // Check wall collisions
    if (newBallPos.y <= 0 || newBallPos.y >= BOARD_HEIGHT - BALL_SIZE) {
      state.ballVelocity.y = -state.ballVelocity.y;
      newBallPos.y = Math.max(0, Math.min(newBallPos.y, BOARD_HEIGHT - BALL_SIZE));
    }

    // Check paddle collisions
    const newVelocity = checkPaddleCollision(newBallPos, state.ballVelocity);
    if (newVelocity) {
      state.ballVelocity = newVelocity;
    }

    state.ballPosition = newBallPos;
  }, [checkPaddleCollision]);

  return {
    physics: physicsState.current,
    updatePhysics,
    resetBall,
    resetGame,
    movePaddle
  };
} 