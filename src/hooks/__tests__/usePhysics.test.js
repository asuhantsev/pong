import { renderHook, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { usePhysics } from '../usePhysics.js';
import '@testing-library/jest-dom';

describe('usePhysics', () => {
  const BOARD_HEIGHT = 600;
  const BOARD_WIDTH = 800;
  const BALL_SIZE = 15;
  const INITIAL_BALL_SPEED = 300;

  test('initial ball state', () => {
    const { result } = renderHook(() => usePhysics());
    const { ballPosition, ballVelocity } = result.current.physics;
    expect(ballPosition).toEqual({
      x: BOARD_WIDTH / 2 - BALL_SIZE / 2,
      y: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
    });
    expect(ballVelocity.x).not.toBe(0);
    expect(ballVelocity.y).not.toBe(0);
  });

  test('resetBall(false) resets speed', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
    const { result } = renderHook(() => usePhysics());
    act(() => {
      result.current.resetBall(false);
    });
    const { x, y } = result.current.physics.ballVelocity;
    const speed = Math.hypot(x, y);
    expect(speed).toBeCloseTo(INITIAL_BALL_SPEED, 1);
    Math.random.mockRestore();
  });

  test('updatePhysics bounces off top wall', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
    const { result } = renderHook(() => usePhysics());
    act(() => {
      result.current.resetBall(false);
      result.current.updatePhysics(1500);
    });
    expect(result.current.physics.ballPosition.y).toBe(0);
    expect(result.current.physics.ballVelocity.y).toBeGreaterThan(0);
    Math.random.mockRestore();
  });

  test('updatePhysics bounces off bottom wall', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(1).mockReturnValueOnce(1);
    const { result } = renderHook(() => usePhysics());
    act(() => {
      result.current.resetBall(false);
      result.current.updatePhysics(3000);
    });
    const bottom = BOARD_HEIGHT - BALL_SIZE;
    expect(result.current.physics.ballPosition.y).toBe(bottom);
    expect(result.current.physics.ballVelocity.y).toBeLessThan(0);
    Math.random.mockRestore();
  });
});
