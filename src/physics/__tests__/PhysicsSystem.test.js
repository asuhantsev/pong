import { 
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  BALL_SPEED,
  PADDLE_SPEED,
  GAME_WIDTH,
  GAME_HEIGHT
} from '../../constants/gameConstants';

describe('PhysicsSystem', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsSystem();
  });

  describe('getInitialBallVelocity', () => {
    it('should return a velocity vector with correct magnitude', () => {
      const velocity = physics.getInitialBallVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      expect(speed).toBeCloseTo(INITIAL_BALL_SPEED);
      expect(Math.abs(velocity.x)).toBeLessThan(INITIAL_BALL_SPEED);
      expect(Math.abs(velocity.y)).toBeLessThan(INITIAL_BALL_SPEED);
    });
  });

  // ... rest of test cases ...
}); 