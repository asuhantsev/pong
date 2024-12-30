import physicsSystem, { PhysicsConstants } from '../PhysicsSystem';

describe('PhysicsSystem', () => {
  beforeEach(() => {
    physicsSystem.resetState();
  });

  describe('Initialization', () => {
    it('should initialize with correct state', () => {
      const state = physicsSystem.getState();
      
      expect(state.ball.position.x).toBe(PhysicsConstants.BOARD_WIDTH / 2 - PhysicsConstants.BALL_SIZE / 2);
      expect(state.ball.position.y).toBe(PhysicsConstants.BOARD_HEIGHT / 2 - PhysicsConstants.BALL_SIZE / 2);
      expect(state.ball.size).toBe(PhysicsConstants.BALL_SIZE);
      
      expect(state.paddles.left.y).toBe(PhysicsConstants.BOARD_HEIGHT / 2 - PhysicsConstants.PADDLE_HEIGHT / 2);
      expect(state.paddles.right.y).toBe(PhysicsConstants.BOARD_HEIGHT / 2 - PhysicsConstants.PADDLE_HEIGHT / 2);
    });

    it('should generate valid initial ball velocity', () => {
      const velocity = physicsSystem.getInitialBallVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      expect(speed).toBeCloseTo(PhysicsConstants.INITIAL_BALL_SPEED);
      expect(Math.abs(velocity.x)).toBeLessThan(PhysicsConstants.INITIAL_BALL_SPEED);
      expect(Math.abs(velocity.y)).toBeLessThan(PhysicsConstants.INITIAL_BALL_SPEED);
    });
  });

  describe('Update Loop', () => {
    it('should not update if delta is too small', () => {
      const initialState = physicsSystem.getState();
      const updated = physicsSystem.update(initialState.lastUpdate + PhysicsConstants.PHYSICS_STEP / 2);
      
      expect(updated).toBe(false);
      expect(physicsSystem.getState().ball.position).toEqual(initialState.ball.position);
    });

    it('should update positions based on velocity', () => {
      const state = physicsSystem.getState();
      const timestamp = state.lastUpdate + PhysicsConstants.PHYSICS_STEP;
      
      // Set known velocity
      state.ball.velocity = { x: 100, y: 50 };
      physicsSystem.update(timestamp);
      
      const newState = physicsSystem.getState();
      const delta = PhysicsConstants.PHYSICS_STEP / 1000;
      
      expect(newState.ball.position.x).toBeCloseTo(state.ball.position.x + 100 * delta);
      expect(newState.ball.position.y).toBeCloseTo(state.ball.position.y + 50 * delta);
    });
  });

  describe('Collision Detection', () => {
    it('should detect AABB collisions correctly', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 5, y: 5, width: 10, height: 10 };
      const rect3 = { x: 20, y: 20, width: 10, height: 10 };
      
      expect(physicsSystem.detectCollision(rect1, rect2)).toBe(true);
      expect(physicsSystem.detectCollision(rect1, rect3)).toBe(false);
    });

    it('should bounce ball off paddles', () => {
      const state = physicsSystem.getState();
      
      // Position ball for left paddle collision
      state.ball.position = {
        x: PhysicsConstants.PADDLE_OFFSET,
        y: state.paddles.left.y + PhysicsConstants.PADDLE_HEIGHT / 2
      };
      state.ball.velocity = { x: -100, y: 0 };
      
      physicsSystem.update(state.lastUpdate + PhysicsConstants.PHYSICS_STEP);
      const newState = physicsSystem.getState();
      
      expect(newState.ball.velocity.x).toBeGreaterThan(0); // Ball should bounce right
    });

    it('should bounce ball off walls', () => {
      const state = physicsSystem.getState();
      
      // Position ball at top edge
      state.ball.position = { x: PhysicsConstants.BOARD_WIDTH / 2, y: 0 };
      state.ball.velocity = { x: 0, y: -100 };
      
      physicsSystem.update(state.lastUpdate + PhysicsConstants.PHYSICS_STEP);
      const newState = physicsSystem.getState();
      
      expect(newState.ball.velocity.y).toBeGreaterThan(0); // Ball should bounce down
    });
  });

  describe('Paddle Movement', () => {
    it('should update paddle position based on velocity', () => {
      const state = physicsSystem.getState();
      const initialY = state.paddles.left.y;
      
      physicsSystem.setPaddleVelocity('left', 100);
      physicsSystem.update(state.lastUpdate + PhysicsConstants.PHYSICS_STEP);
      
      expect(physicsSystem.getState().paddles.left.y).toBeGreaterThan(initialY);
    });

    it('should constrain paddle movement to board bounds', () => {
      const state = physicsSystem.getState();
      
      // Try to move paddle above board
      physicsSystem.setPaddleVelocity('left', -1000);
      for (let i = 0; i < 10; i++) {
        physicsSystem.update(state.lastUpdate + (i + 1) * PhysicsConstants.PHYSICS_STEP);
      }
      
      expect(physicsSystem.getState().paddles.left.y).toBe(0);
    });
  });

  describe('Subscription System', () => {
    it('should notify subscribers of state changes', () => {
      const callback = jest.fn();
      const unsubscribe = physicsSystem.subscribe(callback);
      
      physicsSystem.update(physicsSystem.getState().lastUpdate + PhysicsConstants.PHYSICS_STEP);
      
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
      physicsSystem.update(physicsSystem.getState().lastUpdate + PhysicsConstants.PHYSICS_STEP);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
}); 