import { ActionTypes } from './types';
import { 
  BOARD_HEIGHT, 
  BOARD_WIDTH, 
  BALL_SIZE, 
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_OFFSET,
  INITIAL_BALL_SPEED, 
  MAX_BALL_SPEED, 
  SPEED_INCREASE,
  SPEED_MULTIPLIER,
  MAX_SPIN,
  SPIN_DECAY,
  MIN_DELTA_TIME,
  PHYSICS_THRESHOLD
} from '../constants/gameConstants';
import Logger from '../utils/logger';

const getInitialBallVelocity = (speed = INITIAL_BALL_SPEED) => {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: speed * Math.cos(angle) * direction,
    y: speed * Math.sin(angle)
  };
};

const now = performance.now();

const initialState = {
  game: {
    mode: null,
    isStarted: false,
    isPaused: false,
    winner: null,
    score: { left: 0, right: 0 },
    countdown: null,
    status: 'idle'
  },
  physics: {
    ball: {
      position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
      velocity: getInitialBallVelocity(),
      spin: 0
    },
    paddles: {
      left: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
      right: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 }
    },
    speedMultiplier: 1,
    currentSpeed: INITIAL_BALL_SPEED,
    time: {
      lastUpdate: now,
      lastPaddleUpdate: now,
      deltaTime: 0
    },
    isActive: false
  }
};

// Helper function to ensure immutability
const updateState = (state, path, value) => {
  const newState = { ...state };
  let current = newState;
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  keys.forEach(key => {
    current[key] = { ...current[key] };
    current = current[key];
  });
  
  current[lastKey] = value;
  return newState;
};

const handlePaddleCollision = (ball, paddle, isLeft, currentSpin) => {
  const relativeIntersectY = (paddle.y + (PADDLE_HEIGHT / 2)) - (ball.position.y + (BALL_SIZE / 2));
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

export function rootReducer(state = initialState, action) {
  Logger.debug('Reducer', 'Processing action:', { currentState: state, action });
  
  switch (action.type) {
    case ActionTypes.INIT:
      return initialState;
      
    case ActionTypes.RESET_STATE:
      return initialState;
      
    case ActionTypes.RESET_PHYSICS_STATE:
      return {
        ...state,
        physics: {
          ...initialState.physics,
          ball: {
            position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
            velocity: getInitialBallVelocity(),
            spin: 0
          },
          paddles: {
            left: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
            right: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 }
          },
          time: {
            lastUpdate: performance.now(),
            lastPaddleUpdate: performance.now(),
            deltaTime: 0
          },
          isActive: false
        }
      };

    case ActionTypes.START_GAME:
      Logger.info('Reducer', 'Starting game', { mode: action.payload });
      return {
        ...state,
        game: {
          ...state.game,
          mode: action.payload,
          isStarted: true,
          isPaused: false,
          winner: null,
          score: { left: 0, right: 0 },
          countdown: 3,
          status: 'starting'
        },
        physics: {
          ...initialState.physics,
          ball: {
            position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
            velocity: getInitialBallVelocity(),
            spin: 0
          },
          paddles: {
            left: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 },
            right: { y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2, velocity: 0 }
          },
          time: {
            lastUpdate: performance.now(),
            lastPaddleUpdate: performance.now(),
            deltaTime: 0
          },
          isActive: true
        }
      };

    case ActionTypes.END_GAME:
      Logger.info('Reducer', 'Ending game');
      return {
        ...state,
        game: {
          ...initialState.game,
          mode: null
        },
        physics: initialState.physics
      };

    case ActionTypes.PAUSE_GAME:
      return updateState(state, 'game.isPaused', action.payload);

    case ActionTypes.RESUME_GAME:
      return updateState(state, 'game.isPaused', false);

    case ActionTypes.UPDATE_COUNTDOWN:
      const newCountdown = action.payload;
      const newStatus = newCountdown === 0 ? 'playing' : 'starting';
      Logger.info('Reducer', 'Updating countdown', { countdown: newCountdown, newStatus });
      
      return {
        ...state,
        game: {
          ...state.game,
          countdown: newCountdown,
          status: newStatus
        },
        physics: {
          ...state.physics,
          isActive: newCountdown === 0
        }
      };

    case ActionTypes.UPDATE_SCORE:
      return updateState(state, 'game.score', action.payload);

    case ActionTypes.SET_WINNER:
      return updateState(state, 'game.winner', action.payload);

    // Physics Actions
    case ActionTypes.UPDATE_BALL_POSITION:
      return updateState(state, 'physics.ball.position', action.payload);

    case ActionTypes.UPDATE_BALL_VELOCITY:
      return updateState(state, 'physics.ball.velocity', action.payload);

    case ActionTypes.UPDATE_BALL_SPIN:
      return updateState(state, 'physics.ball.spin', action.payload);

    case ActionTypes.UPDATE_PADDLE_POSITION:
      const { side, position: paddlePosition, velocity: paddleVelocity, time: paddleTime } = action.payload;
      return {
        ...state,
        physics: {
          ...state.physics,
          paddles: {
            ...state.physics.paddles,
            [side]: {
              y: paddlePosition,
              velocity: paddleVelocity || 0
            }
          },
          time: paddleTime ? {
            ...state.physics.time,
            lastPaddleUpdate: paddleTime
          } : state.physics.time
        }
      };

    case ActionTypes.RESET_BALL:
      return {
        ...state,
        physics: {
          ...state.physics,
          ball: {
            position: { x: BOARD_WIDTH / 2 - BALL_SIZE / 2, y: BOARD_HEIGHT / 2 - BALL_SIZE / 2 },
            velocity: getInitialBallVelocity(state.physics.currentSpeed),
            spin: 0
          }
        }
      };

    case ActionTypes.UPDATE_SPEED_MULTIPLIER:
      return {
        ...state,
        physics: {
          ...state.physics,
          speedMultiplier: action.payload,
          currentSpeed: Math.min(state.physics.currentSpeed * action.payload, INITIAL_BALL_SPEED * 8)
        }
      };

    case 'INCREASE_BALL_SPEED':
      return {
        ...state,
        physics: {
          ...state.physics,
          currentSpeed: Math.min(state.physics.currentSpeed * SPEED_INCREASE, MAX_BALL_SPEED)
        }
      };

    case ActionTypes.UPDATE_PHYSICS_TIME:
      return updateState(state, 'physics.time', {
        ...state.physics.time,
        ...action.payload
      });

    // System Actions
    case ActionTypes.BATCH_PHYSICS_UPDATE:
      const { time, position: ballPosition, velocity: ballVelocity, spin } = action.payload;
      let newPhysicsState = { ...state.physics };
      
      if (time) {
        newPhysicsState.time = { ...newPhysicsState.time, ...time };
      }
      if (ballPosition) {
        newPhysicsState.ball.position = ballPosition;
      }
      if (ballVelocity) {
        newPhysicsState.ball.velocity = ballVelocity;
      }
      if (spin) {
        newPhysicsState.ball.spin = spin;
      }
      
      return {
        ...state,
        physics: newPhysicsState
      };

    case ActionTypes.UPDATE_PHYSICS:
      if (!state.physics.isActive) return state;

      const deltaTime = action.payload;
      const dt = Math.max(deltaTime, MIN_DELTA_TIME) / 1000;
      const now = performance.now();
      
      // Calculate new ball state
      const spinEffect = state.physics.ball.spin * 100;
      let newVelX = state.physics.ball.velocity.x;
      let newVelY = state.physics.ball.velocity.y + spinEffect * dt;
      
      let newX = state.physics.ball.position.x + newVelX * dt;
      let newY = state.physics.ball.position.y + newVelY * dt;
      let newSpin = state.physics.ball.spin * SPIN_DECAY;

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
        newY + BALL_SIZE >= state.physics.paddles.left.y && 
        newY <= state.physics.paddles.left.y + PADDLE_HEIGHT;

      const rightPaddleCollision = newX + BALL_SIZE >= BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH &&
        newY + BALL_SIZE >= state.physics.paddles.right.y && 
        newY <= state.physics.paddles.right.y + PADDLE_HEIGHT;

      if (leftPaddleCollision || rightPaddleCollision) {
        const paddleSide = leftPaddleCollision ? 'left' : 'right';
        const paddle = state.physics.paddles[paddleSide];
        
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

      // Only update if significant changes occurred
      const hasChanged = 
        Math.abs(newX - state.physics.ball.position.x) > PHYSICS_THRESHOLD || 
        Math.abs(newY - state.physics.ball.position.y) > PHYSICS_THRESHOLD || 
        Math.abs(newVelX - state.physics.ball.velocity.x) > PHYSICS_THRESHOLD || 
        Math.abs(newVelY - state.physics.ball.velocity.y) > PHYSICS_THRESHOLD ||
        Math.abs(newSpin - state.physics.ball.spin) > PHYSICS_THRESHOLD;

      if (!hasChanged) return state;

      return {
        ...state,
        physics: {
          ...state.physics,
          ball: {
            position: { x: newX, y: newY },
            velocity: { x: newVelX, y: newVelY },
            spin: newSpin
          },
          time: {
            lastUpdate: now,
            deltaTime: dt,
            lastPaddleUpdate: state.physics.time.lastPaddleUpdate
          }
        }
      };

    default:
      return state;
  }
} 