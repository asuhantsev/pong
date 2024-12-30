import { useState, useCallback, useRef, useEffect } from 'react';
import Logger from '../utils/logger';

const BOARD_HEIGHT = 600;
const BOARD_WIDTH = 800;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const PADDLE_OFFSET = 50;
const BALL_SIZE = 15;
const INITIAL_BALL_SPEED = 300;
const SPEED_MULTIPLIER = 1.2;
const MAX_BALL_SPEED = INITIAL_BALL_SPEED * 8;

const getInitialBallVelocity = (speed = INITIAL_BALL_SPEED) => {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // Random angle between -45 and 45 degrees
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: speed * Math.cos(angle) * direction,
    y: speed * Math.sin(angle)
  };
};

const INITIAL_STATE = {
  ballPosition: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
  ballVelocity: getInitialBallVelocity(),
  leftPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  rightPaddlePos: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  currentSpeed: INITIAL_BALL_SPEED
};

// Helper function for AABB collision detection
const checkAABBCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

export function usePhysics() {
  const [physics, setPhysics] = useState(INITIAL_STATE);
  
  // Use useRef for values that shouldn't trigger re-renders
  const physicsRef = useRef(physics);
  useEffect(() => {
    physicsRef.current = physics;
  }, [physics]);

  const resetBall = useCallback((speedIncrease = true) => {
    setPhysics(prev => {
      const newSpeed = speedIncrease ? 
        Math.min(prev.currentSpeed * SPEED_MULTIPLIER, MAX_BALL_SPEED) : 
        INITIAL_BALL_SPEED;
      
      const newVelocity = getInitialBallVelocity(newSpeed);
      
      Logger.info('Physics', 'Ball reset', { 
        newSpeed, 
        velocity: newVelocity,
        speedIncrease,
        maxSpeed: MAX_BALL_SPEED
      });
      
      const newState = {
        ...prev,
        ballPosition: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
        ballVelocity: newVelocity,
        currentSpeed: newSpeed
      };

      Logger.debug('Physics', 'New physics state after ball reset', {
        position: newState.ballPosition,
        velocity: newState.ballVelocity,
        speed: newState.currentSpeed
      });
      return newState;
    });
  }, []); // Remove physics.currentSpeed dependency

  const resetGame = useCallback(() => {
    const initialVelocity = getInitialBallVelocity(INITIAL_BALL_SPEED);
    Logger.debug('Physics', 'Game reset', { 
      initialVelocity,
      initialSpeed: INITIAL_BALL_SPEED
    });
    
    setPhysics({
      ...INITIAL_STATE,
      ballVelocity: initialVelocity
    });
  }, []);

  const movePaddle = useCallback((newPosition, side) => {
    setPhysics(prev => {
      const clampedPosition = Math.max(PADDLE_HEIGHT/2, Math.min(newPosition, BOARD_HEIGHT - PADDLE_HEIGHT/2));
      return {
        ...prev,
        [side === 'left' ? 'leftPaddlePos' : 'rightPaddlePos']: clampedPosition
      };
    });
  }, []);

  const updatePhysics = useCallback((deltaTime) => {
    setPhysics(prev => {
      // Ensure idempotent updates for Strict Mode
      const dt = deltaTime / 1000;
      
      // Calculate next position
      let newX = prev.ballPosition.x + prev.ballVelocity.x * dt;
      let newY = prev.ballPosition.y + prev.ballVelocity.y * dt;
      let newVelX = prev.ballVelocity.x;
      let newVelY = prev.ballVelocity.y;

      // Create ball bounding box
      const ballBox = {
        x: newX,
        y: newY,
        width: BALL_SIZE,
        height: BALL_SIZE
      };

      // Wall collisions - deterministic behavior
      if (newY <= 0) {
        newVelY = Math.abs(prev.ballVelocity.y); // Use prev state for deterministic behavior
        newY = 0;
      } else if (newY + BALL_SIZE >= BOARD_HEIGHT) {
        newVelY = -Math.abs(prev.ballVelocity.y); // Use prev state for deterministic behavior
        newY = BOARD_HEIGHT - BALL_SIZE;
      }

      // Create paddle bounding boxes - use prev state
      const leftPaddleBox = {
        x: PADDLE_OFFSET,
        y: prev.leftPaddlePos - PADDLE_HEIGHT/2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      };

      const rightPaddleBox = {
        x: BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH,
        y: prev.rightPaddlePos - PADDLE_HEIGHT/2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      };

      // Check paddle collisions using AABB
      const leftPaddleCollision = checkAABBCollision(ballBox, leftPaddleBox);
      const rightPaddleCollision = checkAABBCollision(ballBox, rightPaddleBox);

      if (leftPaddleCollision || rightPaddleCollision) {
        // Use prev state for deterministic behavior
        newVelX = -prev.ballVelocity.x;
        
        const paddle = leftPaddleCollision ? prev.leftPaddlePos : prev.rightPaddlePos;
        const relativeIntersectY = (newY + BALL_SIZE/2 - paddle) / (PADDLE_HEIGHT/2);
        
        const maxVerticalSpeed = prev.currentSpeed * 0.75;
        newVelY = relativeIntersectY * maxVerticalSpeed;

        if (leftPaddleCollision) {
          newX = PADDLE_OFFSET + PADDLE_WIDTH;
        } else {
          newX = BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH - BALL_SIZE;
        }
      }

      // Ensure ball stays within bounds
      newX = Math.max(0, Math.min(newX, BOARD_WIDTH - BALL_SIZE));
      newY = Math.max(0, Math.min(newY, BOARD_HEIGHT - BALL_SIZE));

      // Only update if position or velocity changed
      const hasChanged = 
        Math.abs(newX - prev.ballPosition.x) > 0.01 || 
        Math.abs(newY - prev.ballPosition.y) > 0.01 || 
        newVelX !== prev.ballVelocity.x || 
        newVelY !== prev.ballVelocity.y;

      if (hasChanged) {
        return {
          ...prev,
          ballPosition: { x: newX, y: newY },
          ballVelocity: { x: newVelX, y: newVelY }
        };
      }
      return prev;
    });
  }, []); // No dependencies needed since we use prev state

  return {
    physics,
    updatePhysics,
    resetBall,
    resetGame,
    movePaddle
  };
} 