import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from '../store/store';
import { physicsActions, systemActions } from '../store/actions';
import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_OFFSET,
  BALL_SIZE,
  INITIAL_BALL_SPEED,
  SPEED_MULTIPLIER,
  MAX_BALL_SPEED,
  MAX_SPIN,
  SPIN_DECAY,
  MIN_DELTA_TIME,
  PHYSICS_THRESHOLD,
  BALL_SPEED,
  PADDLE_SPEED,
  GAME_WIDTH,
  GAME_HEIGHT
} from '../constants/gameConstants';

const getInitialBallVelocity = (speed = INITIAL_BALL_SPEED) => {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: speed * Math.cos(angle) * direction,
    y: speed * Math.sin(angle)
  };
};

const handlePaddleCollision = (ball, paddle, isLeft, currentSpin) => {
  const relativeIntersectY = (paddle.y + (PADDLE_HEIGHT / 2)) - (ball.y + (BALL_SIZE / 2));
  const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
  const bounceAngle = normalizedIntersectY * Math.PI / 3;

  const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
  const newSpeed = Math.min(speed * SPEED_MULTIPLIER, MAX_BALL_SPEED);
  
  const paddleSpeed = paddle.velocity || 0;
  const newSpin = (currentSpin * SPIN_DECAY) + (paddleSpeed * 0.2);
  const clampedSpin = Math.max(Math.min(newSpin, MAX_SPIN), -MAX_SPIN);

  return {
    velocity: {
      x: isLeft ? Math.abs(newSpeed * Math.cos(bounceAngle)) : -Math.abs(newSpeed * Math.cos(bounceAngle)),
      y: newSpeed * Math.sin(bounceAngle) + clampedSpin
    },
    spin: clampedSpin
  };
};

export function usePhysics() {
  const dispatch = useDispatch();
  const physics = useSelector(state => state.physics);
  const gameStatus = useSelector(state => state.game.status);

  const updatePhysics = useCallback((deltaTime) => {
    if (!physics.isActive) return;

    performanceMonitor.startMeasure('physicsUpdate');
    
    const now = performance.now();
    const dt = Math.max(deltaTime, MIN_DELTA_TIME) / 1000;
    
    // Calculate new ball state
    const spinEffect = physics.ball.spin * 100;
    let newVelX = physics.ball.velocity.x;
    let newVelY = physics.ball.velocity.y + spinEffect * dt;
    
    let newX = physics.ball.position.x + newVelX * dt;
    let newY = physics.ball.position.y + newVelY * dt;
    let newSpin = physics.ball.spin * SPIN_DECAY;

    // Wall collisions
    if (newY <= 0) {
      newVelY = Math.abs(newVelY);
      newY = 0;
      newSpin *= 0.8;
    } else if (newY + BALL_SIZE >= BOARD_HEIGHT) {
      newVelY = -Math.abs(newVelY);
      newY = BOARD_HEIGHT - BALL_SIZE;
      newSpin *= 0.8;
    }

    // Paddle collisions
    const leftPaddleCollision = newX <= PADDLE_OFFSET + PADDLE_WIDTH && 
      newY + BALL_SIZE >= physics.paddles.left.y && 
      newY <= physics.paddles.left.y + PADDLE_HEIGHT;

    const rightPaddleCollision = newX + BALL_SIZE >= BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH &&
      newY + BALL_SIZE >= physics.paddles.right.y && 
      newY <= physics.paddles.right.y + PADDLE_HEIGHT;

    if (leftPaddleCollision || rightPaddleCollision) {
      const paddleSide = leftPaddleCollision ? 'left' : 'right';
      const paddle = physics.paddles[paddleSide];
      
      const { velocity, spin } = handlePaddleCollision(
        { position: { x: newX, y: newY }, velocity: { x: newVelX, y: newVelY } },
        paddle,
        leftPaddleCollision,
        newSpin
      );

      newVelX = velocity.x;
      newVelY = velocity.y;
      newSpin = spin;
      newX = leftPaddleCollision ? 
        PADDLE_OFFSET + PADDLE_WIDTH : 
        BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH - BALL_SIZE;
    }

    // Only dispatch if significant changes occurred
    const hasChanged = 
      Math.abs(newX - physics.ball.position.x) > PHYSICS_THRESHOLD || 
      Math.abs(newY - physics.ball.position.y) > PHYSICS_THRESHOLD || 
      Math.abs(newVelX - physics.ball.velocity.x) > PHYSICS_THRESHOLD || 
      Math.abs(newVelY - physics.ball.velocity.y) > PHYSICS_THRESHOLD ||
      Math.abs(newSpin - physics.ball.spin) > PHYSICS_THRESHOLD;

    if (hasChanged) {
      dispatch(physicsActions.batchUpdate({
        time: { lastUpdate: now, deltaTime: dt },
        position: { x: newX, y: newY },
        velocity: { x: newVelX, y: newVelY },
        spin: newSpin
      }));
    }

    performanceMonitor.endMeasure('physicsUpdate', 'physics');
  }, [dispatch, physics]);

  const movePaddle = useCallback((newPosition, side) => {
    if (!physics.isActive) return;
    
    const clampedPosition = Math.max(0, Math.min(newPosition, BOARD_HEIGHT - PADDLE_HEIGHT));
    const now = performance.now();
    const deltaTime = Math.max(now - physics.time.lastPaddleUpdate, MIN_DELTA_TIME);
    const oldPosition = physics.paddles[side].y;
    const velocity = (clampedPosition - oldPosition) / deltaTime;
    
    dispatch(physicsActions.updatePaddlePosition({
      side,
      position: clampedPosition,
      velocity,
      time: now
    }));
  }, [dispatch, physics]);

  return {
    physics,
    updatePhysics,
    movePaddle,
    isActive: physics.isActive
  };
} 