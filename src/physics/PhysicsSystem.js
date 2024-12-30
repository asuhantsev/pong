import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';
import { featureFlags, FeatureFlags } from '../utils/featureFlags';

// Constants
export const PhysicsConstants = {
  BOARD_WIDTH: 800,
  BOARD_HEIGHT: 600,
  PADDLE_HEIGHT: 100,
  PADDLE_WIDTH: 15,
  PADDLE_OFFSET: 50,
  BALL_SIZE: 15,
  INITIAL_BALL_SPEED: 300,
  SPEED_MULTIPLIER: 1.2,
  MAX_BALL_SPEED: 300 * 8,
  PHYSICS_STEP: 1000 / 60, // 60 FPS
};

class PhysicsSystem {
  constructor() {
    this.state = {
      ball: {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        size: PhysicsConstants.BALL_SIZE
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
    const centerY = PhysicsConstants.BOARD_HEIGHT / 2;
    
    this.state = {
      ball: {
        position: {
          x: PhysicsConstants.BOARD_WIDTH / 2 - PhysicsConstants.BALL_SIZE / 2,
          y: PhysicsConstants.BOARD_HEIGHT / 2 - PhysicsConstants.BALL_SIZE / 2
        },
        velocity: this.getInitialBallVelocity(),
        size: PhysicsConstants.BALL_SIZE
      },
      paddles: {
        left: { y: centerY - PhysicsConstants.PADDLE_HEIGHT / 2, velocity: 0 },
        right: { y: centerY - PhysicsConstants.PADDLE_HEIGHT / 2, velocity: 0 }
      },
      speedMultiplier: 1,
      lastUpdate: performance.now()
    };

    this.notifySubscribers();
  }

  // Ball Velocity Initialization
  getInitialBallVelocity(speed = PhysicsConstants.INITIAL_BALL_SPEED) {
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
    if (delta < PhysicsConstants.PHYSICS_STEP) {
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
    if (ball.position.y <= 0 || ball.position.y >= PhysicsConstants.BOARD_HEIGHT - ball.size) {
      ball.velocity.y = -ball.velocity.y;
      ball.position.y = Math.max(0, Math.min(ball.position.y, PhysicsConstants.BOARD_HEIGHT - ball.size));
    }
  }

  updatePaddlePositions(delta) {
    const deltaSeconds = delta / 1000;
    const { paddles } = this.state;

    // Update left paddle
    paddles.left.y += paddles.left.velocity * deltaSeconds;
    paddles.left.y = Math.max(0, Math.min(paddles.left.y, 
      PhysicsConstants.BOARD_HEIGHT - PhysicsConstants.PADDLE_HEIGHT));

    // Update right paddle
    paddles.right.y += paddles.right.velocity * deltaSeconds;
    paddles.right.y = Math.max(0, Math.min(paddles.right.y, 
      PhysicsConstants.BOARD_HEIGHT - PhysicsConstants.PADDLE_HEIGHT));
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
    const paddleX = side === 'left' ? PhysicsConstants.PADDLE_OFFSET : 
      PhysicsConstants.BOARD_WIDTH - PhysicsConstants.PADDLE_OFFSET - PhysicsConstants.PADDLE_WIDTH;

    if (this.detectCollision(
      { x: ball.position.x, y: ball.position.y, width: ball.size, height: ball.size },
      { x: paddleX, y: paddleY, width: PhysicsConstants.PADDLE_WIDTH, height: PhysicsConstants.PADDLE_HEIGHT }
    )) {
      // Calculate reflection angle based on hit position
      const hitPosition = (ball.position.y - paddleY) / PhysicsConstants.PADDLE_HEIGHT;
      const angle = (hitPosition - 0.5) * Math.PI / 2;

      // Update velocity
      const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
      const newSpeed = Math.min(speed * PhysicsConstants.SPEED_MULTIPLIER, PhysicsConstants.MAX_BALL_SPEED);

      ball.velocity.x = side === 'left' ? Math.abs(newSpeed * Math.cos(angle)) : -Math.abs(newSpeed * Math.cos(angle));
      ball.velocity.y = newSpeed * Math.sin(angle);

      // Adjust position to prevent sticking
      ball.position.x = side === 'left' ? 
        paddleX + PhysicsConstants.PADDLE_WIDTH : 
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