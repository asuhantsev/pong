import { ActionTypes } from '../types';
import Logger from '../../utils/logger';

// Validation schemas for payloads
const validationSchemas = {
  [ActionTypes.START_GAME]: (payload) => {
    if (typeof payload !== 'string' || !['singleplayer', 'multiplayer'].includes(payload)) {
      return 'mode must be "singleplayer" or "multiplayer"';
    }
  },
  
  [ActionTypes.UPDATE_COUNTDOWN]: (payload) => {
    if (typeof payload !== 'number' || payload < 0) {
      return 'countdown must be a non-negative number';
    }
  },
  
  [ActionTypes.UPDATE_SCORE]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (!['left', 'right'].includes(payload.side)) return 'side must be "left" or "right"';
    if (typeof payload.value !== 'number' || payload.value < 0) {
      return 'value must be a non-negative number';
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
  
  [ActionTypes.UPDATE_PADDLE_POSITION]: (payload) => {
    if (!payload || typeof payload !== 'object') return 'payload must be an object';
    if (!['left', 'right'].includes(payload.side)) return 'side must be "left" or "right"';
    if (typeof payload.position !== 'number') return 'position must be a number';
  },
  
  [ActionTypes.UPDATE_SPEED_MULTIPLIER]: (payload) => {
    if (typeof payload !== 'number' || payload <= 0) {
      return 'speedMultiplier must be a positive number';
    }
  }
};

// State validation schemas
const validateStateShape = (state) => {
  const errors = [];
  
  // Game state validation
  if (typeof state.game.isStarted !== 'boolean') {
    errors.push('game.isStarted must be a boolean');
  }
  if (typeof state.game.isPaused !== 'boolean') {
    errors.push('game.isPaused must be a boolean');
  }
  if (state.game.mode !== null && !['singleplayer', 'multiplayer'].includes(state.game.mode)) {
    errors.push('game.mode must be null, "singleplayer", or "multiplayer"');
  }
  
  // Physics state validation
  const { physics } = state;
  if (!physics.ball || typeof physics.ball.position.x !== 'number') {
    errors.push('physics.ball.position.x must be a number');
  }
  if (!physics.ball || typeof physics.ball.position.y !== 'number') {
    errors.push('physics.ball.position.y must be a number');
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