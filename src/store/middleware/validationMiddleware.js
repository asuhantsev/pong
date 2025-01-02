import { ActionTypes } from '../types';
import Logger from '../../utils/logger';

// Validation schemas for payloads
const validationSchemas = {
  [ActionTypes.START_GAME]: (payload) => {
    if (typeof payload !== 'string' || !['single', 'multiplayer'].includes(payload)) {
      return 'mode must be "single" or "multiplayer"';
    }
  },
  
  [ActionTypes.UPDATE_COUNTDOWN]: (payload) => {
    if (typeof payload !== 'number' || payload < 0) {
      return 'countdown must be a non-negative number';
    }
  },
  
  [ActionTypes.UPDATE_SCORE]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (typeof payload.left !== 'number' || typeof payload.right !== 'number') {
      return 'score must have numeric left and right values';
    }
    if (payload.left < 0 || payload.right < 0) {
      return 'score values must be non-negative';
    }
  },
  
  [ActionTypes.UPDATE_BALL_POSITION]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (typeof payload.x !== 'number') return 'position.x must be a number';
    if (typeof payload.y !== 'number') return 'position.y must be a number';
  },
  
  [ActionTypes.UPDATE_BALL_VELOCITY]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (typeof payload.x !== 'number') return 'velocity.x must be a number';
    if (typeof payload.y !== 'number') return 'velocity.y must be a number';
  },
  
  [ActionTypes.UPDATE_BALL_SPIN]: (payload) => {
    if (typeof payload !== 'number') return 'spin must be a number';
  },
  
  [ActionTypes.UPDATE_PADDLE_POSITION]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (!['left', 'right'].includes(payload.side)) return 'side must be "left" or "right"';
    if (typeof payload.position !== 'number') return 'position must be a number';
    if (payload.velocity !== undefined && typeof payload.velocity !== 'number') {
      return 'velocity must be a number if provided';
    }
  },
  
  [ActionTypes.UPDATE_SPEED_MULTIPLIER]: (payload) => {
    if (typeof payload !== 'number' || payload <= 0) {
      return 'speedMultiplier must be a positive number';
    }
  },

  [ActionTypes.BATCH_PHYSICS_UPDATE]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (payload.time && typeof payload.time !== 'object') return 'time must be an object';
    if (payload.position && typeof payload.position !== 'object') return 'position must be an object';
    if (payload.velocity && typeof payload.velocity !== 'object') return 'velocity must be an object';
    if (payload.spin !== undefined && typeof payload.spin !== 'number') return 'spin must be a number';
  }
};

// State validation schemas
const validateStateShape = (state) => {
  const errors = [];
  
  // Game state validation
  if (!state.game || typeof state.game !== 'object') {
    errors.push('game state must be an object');
    return errors;
  }

  if (typeof state.game.isStarted !== 'boolean') {
    errors.push('game.isStarted must be a boolean');
  }
  if (typeof state.game.isPaused !== 'boolean') {
    errors.push('game.isPaused must be a boolean');
  }
  if (state.game.mode !== null && !['single', 'multiplayer'].includes(state.game.mode)) {
    errors.push('game.mode must be null, "single", or "multiplayer"');
  }
  if (!['idle', 'starting', 'playing', 'paused', 'ended'].includes(state.game.status)) {
    errors.push('game.status must be one of: idle, starting, playing, paused, ended');
  }
  if (state.game.countdown !== null && (typeof state.game.countdown !== 'number' || state.game.countdown < 0)) {
    errors.push('game.countdown must be null or a non-negative number');
  }
  
  // Physics state validation
  const { physics } = state;
  if (!physics || typeof physics !== 'object') {
    errors.push('physics state must be an object');
    return errors;
  }

  if (!physics.ball || typeof physics.ball !== 'object') {
    errors.push('physics.ball must be an object');
  } else {
    if (typeof physics.ball.position?.x !== 'number') errors.push('physics.ball.position.x must be a number');
    if (typeof physics.ball.position?.y !== 'number') errors.push('physics.ball.position.y must be a number');
    if (typeof physics.ball.velocity?.x !== 'number') errors.push('physics.ball.velocity.x must be a number');
    if (typeof physics.ball.velocity?.y !== 'number') errors.push('physics.ball.velocity.y must be a number');
    if (typeof physics.ball.spin !== 'number') errors.push('physics.ball.spin must be a number');
  }

  if (!physics.paddles || typeof physics.paddles !== 'object') {
    errors.push('physics.paddles must be an object');
  } else {
    ['left', 'right'].forEach(side => {
      if (!physics.paddles[side] || typeof physics.paddles[side] !== 'object') {
        errors.push(`physics.paddles.${side} must be an object`);
      } else {
        if (typeof physics.paddles[side].y !== 'number') {
          errors.push(`physics.paddles.${side}.y must be a number`);
        }
        if (typeof physics.paddles[side].velocity !== 'number') {
          errors.push(`physics.paddles.${side}.velocity must be a number`);
        }
      }
    });
  }
  
  return errors;
};

export const createValidationMiddleware = () => (store) => (next) => (action) => {
  // Validate action payload
  if (validationSchemas[action.type]) {
    const error = validationSchemas[action.type](action.payload);
    if (error) {
      Logger.error('ValidationMiddleware', `Invalid action payload: ${error}`, {
        action,
        error
      });
      throw new Error(`Validation Error: ${error}`);
    }
  }
  
  // Let the action through
  const result = next(action);
  
  // Validate resulting state
  const newState = store.getState();
  const stateErrors = validateStateShape(newState);
  
  if (stateErrors.length > 0) {
    Logger.error('ValidationMiddleware', 'Invalid state shape after action', {
      action,
      errors: stateErrors,
      state: newState
    });
    throw new Error(`State Validation Error: ${stateErrors.join(', ')}`);
  }
  
  return result;
}; 