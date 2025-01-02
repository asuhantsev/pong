import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';
import { featureFlags, FeatureFlags } from '../utils/featureFlags';
import {
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  BALL_SPEED,
  PADDLE_SPEED,
  GAME_WIDTH,
  GAME_HEIGHT,
  BALL_SIZE,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_OFFSET,
  PHYSICS_STEP,
  SPEED_MULTIPLIER,
  MIN_DELTA_TIME,
  PHYSICS_THRESHOLD
} from '../constants/gameConstants';

export class PhysicsSystem {
  constructor() {
    this.constants = {
      INITIAL_BALL_SPEED,
      MAX_BALL_SPEED,
      BALL_SPEED,
      PADDLE_SPEED,
      GAME_WIDTH,
      GAME_HEIGHT,
      BALL_SIZE,
      PADDLE_HEIGHT,
      PADDLE_WIDTH,
      PADDLE_OFFSET,
      PHYSICS_STEP,
      SPEED_MULTIPLIER,
      MIN_DELTA_TIME,
      PHYSICS_THRESHOLD
    };

    this.state = {
      ball: {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        size: BALL_SIZE
      },
      paddles: {
        left: { y: 0, velocity: 0 },
        right: { y: 0, velocity: 0 }
      },
      speedMultiplier: 1,
      lastUpdate: 0
    };

    this.subscribers = new Set();
    this.resetState();
  }

  // State Management
  resetState() {
    const centerY = GAME_HEIGHT / 2;
    
    // Clear any pending updates
    if (this._updateLoop) {
      cancelAnimationFrame(this._updateLoop);
      this._updateLoop = null;
    }
    
    this.state = {
      ball: {
        position: {
          x: GAME_WIDTH / 2 - BALL_SIZE / 2,
          y: GAME_HEIGHT / 2 - BALL_SIZE / 2
        },
        velocity: this.getInitialBallVelocity(),
        size: BALL_SIZE
      },
      paddles: {
        left: { y: centerY - PADDLE_HEIGHT / 2, velocity: 0 },
        right: { y: centerY - PADDLE_HEIGHT / 2, velocity: 0 }
      },
      speedMultiplier: 1,
      lastUpdate: performance.now(),
      isActive: false
    };

    Logger.debug('PhysicsSystem', 'State reset', this.state);
    this.notifySubscribers();
  }

  // Ball Velocity Initialization
  getInitialBallVelocity(speed = this.constants.INITIAL_BALL_SPEED) {
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // Random angle between -45 and 45 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      x: speed * Math.cos(angle) * direction,
      y: speed * Math.sin(angle)
    };
  }

  // Update Loop
  update(timestamp) {
    performanceMonitor.startMeasure('physics_update');

    const delta = timestamp - this.state.lastUpdate;
    if (delta < PHYSICS_STEP) {
      performanceMonitor.endMeasure('physics_update', 'physics');
      return false;
    }

    // Update positions
    this.updateBallPosition(delta);
    this.updatePaddlePositions(delta);

    // Check collisions
    this.checkCollisions();

    // Update timestamp
    this.state.lastUpdate = timestamp;

    this.notifySubscribers();
    performanceMonitor.endMeasure('physics_update', 'physics');
    return true;
  }

  // Position Updates
  updateBallPosition(delta) {
    const { ball, speedMultiplier } = this.state;
    const deltaSeconds = delta / 1000;

    ball.position.x += ball.velocity.x * deltaSeconds * speedMultiplier;
    ball.position.y += ball.velocity.y * deltaSeconds * speedMultiplier;

    // Bounce off top and bottom walls
    if (ball.position.y <= 0 || ball.position.y >= GAME_HEIGHT - ball.size) {
      ball.velocity.y = -ball.velocity.y;
      ball.position.y = Math.max(0, Math.min(ball.position.y, GAME_HEIGHT - ball.size));
    }
  }

  updatePaddlePositions(delta) {
    const deltaSeconds = delta / 1000;
    const { paddles } = this.state;

    // Update left paddle
    paddles.left.y += paddles.left.velocity * deltaSeconds;
    paddles.left.y = Math.max(0, Math.min(paddles.left.y, 
      GAME_HEIGHT - PADDLE_HEIGHT));

    // Update right paddle
    paddles.right.y += paddles.right.velocity * deltaSeconds;
    paddles.right.y = Math.max(0, Math.min(paddles.right.y, 
      GAME_HEIGHT - PADDLE_HEIGHT));
  }

  // Collision Detection
  checkCollisions() {
    performanceMonitor.startMeasure('collision_check');
    
    const { ball, paddles } = this.state;
    
    // Check paddle collisions
    this.checkPaddleCollision('left', paddles.left.y);
    this.checkPaddleCollision('right', paddles.right.y);
    
    performanceMonitor.endMeasure('collision_check', 'physics');
  }

  checkPaddleCollision(side, paddleY) {
    const { ball } = this.state;
    const paddleX = side === 'left' ? PADDLE_OFFSET : 
      GAME_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH;

    if (this.detectCollision(
      { x: ball.position.x, y: ball.position.y, width: ball.size, height: ball.size },
      { x: paddleX, y: paddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
    )) {
      // Calculate reflection angle based on hit position
      const hitPosition = (ball.position.y - paddleY) / PADDLE_HEIGHT;
      const angle = (hitPosition - 0.5) * Math.PI / 2;

      // Update velocity
      const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
      const newSpeed = Math.min(speed * SPEED_MULTIPLIER, MAX_BALL_SPEED);

      ball.velocity.x = side === 'left' ? Math.abs(newSpeed * Math.cos(angle)) : -Math.abs(newSpeed * Math.cos(angle));
      ball.velocity.y = newSpeed * Math.sin(angle);

      // Adjust position to prevent sticking
      ball.position.x = side === 'left' ? 
        paddleX + PADDLE_WIDTH : 
        paddleX - ball.size;
    }
  }

  detectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  // Paddle Control
  setPaddleVelocity(side, velocity) {
    this.state.paddles[side].velocity = velocity;
  }

  // Subscription System
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // State Access
  getState() {
    return this.state;
  }
}

// Create and export singleton instance
const physicsSystem = new PhysicsSystem();
export default physicsSystem; 