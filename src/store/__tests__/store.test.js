import { rootReducer } from '../reducer.jsx';
import { ActionTypes } from '../types';
import { gameActions, physicsActions } from '../actions.jsx';

describe('Store', () => {
  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = rootReducer(undefined, { type: '@INIT' });
      expect(state.game.isStarted).toBe(false);
      expect(state.game.isPaused).toBe(false);
      expect(state.game.mode).toBeNull();
    });

    it('should handle START_GAME', () => {
      const state = rootReducer(undefined, gameActions.startGame('singleplayer'));
      expect(state.game.isStarted).toBe(true);
      expect(state.game.mode).toBe('singleplayer');
      expect(state.game.countdown).toBe(3);
    });

    it('should handle PAUSE_GAME', () => {
      const initialState = rootReducer(undefined, gameActions.startGame('singleplayer'));
      const state = rootReducer(initialState, gameActions.pauseGame());
      expect(state.game.isPaused).toBe(true);
    });

    it('should handle UPDATE_SCORE', () => {
      const state = rootReducer(undefined, gameActions.updateScore('left', 1));
      expect(state.game.score.left).toBe(1);
    });
  });

  describe('Physics Actions', () => {
    it('should handle UPDATE_BALL_POSITION', () => {
      const position = { x: 100, y: 200 };
      const state = rootReducer(undefined, physicsActions.updateBallPosition(position));
      expect(state.physics.ball.position).toEqual(position);
    });

    it('should handle UPDATE_BALL_VELOCITY', () => {
      const velocity = { x: 5, y: -3 };
      const state = rootReducer(undefined, physicsActions.updateBallVelocity(velocity));
      expect(state.physics.ball.velocity).toEqual(velocity);
    });

    it('should handle RESET_BALL', () => {
      const initialState = rootReducer(undefined, physicsActions.updateBallPosition({ x: 100, y: 100 }));
      const state = rootReducer(initialState, physicsActions.resetBall());
      expect(state.physics.ball.position).toEqual({ x: 0, y: 0 });
      expect(state.physics.speedMultiplier).toBe(1);
    });
  });

  describe('State Updates', () => {
    it('should maintain immutability', () => {
      const initialState = rootReducer(undefined, { type: '@INIT' });
      const newState = rootReducer(initialState, gameActions.startGame('singleplayer'));
      expect(newState).not.toBe(initialState);
      expect(newState.game).not.toBe(initialState.game);
    });

    it('should handle nested updates correctly', () => {
      const state1 = rootReducer(undefined, gameActions.updateScore('left', 1));
      const state2 = rootReducer(state1, gameActions.updateScore('right', 2));
      expect(state2.game.score).toEqual({ left: 1, right: 2 });
      expect(state2.game.score).not.toBe(state1.game.score);
    });
  });

  describe('Error Cases', () => {
    it('should return same state for unknown action', () => {
      const initialState = rootReducer(undefined, { type: '@INIT' });
      const state = rootReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(state).toBe(initialState);
    });

    it('should handle missing payload gracefully', () => {
      const state = rootReducer(undefined, { type: ActionTypes.UPDATE_SCORE });
      expect(state.game.score).toEqual({ left: 0, right: 0 });
    });
  });
}); 