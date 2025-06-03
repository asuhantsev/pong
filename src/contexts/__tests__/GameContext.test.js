import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext.jsx';
import { WINNING_SCORE } from '../../constants/gameConstants.js';
import '@testing-library/jest-dom';

describe('GameContext', () => {
  const wrapper = ({ children }) => React.createElement(GameProvider, null, children);

  test('startGame sets mode and isGameStarted', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.actions.startGame('single');
    });

    expect(result.current.state.isGameStarted).toBe(true);
    expect(result.current.state.mode).toBe('single');
  });

  test('togglePause toggles isPaused', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.actions.togglePause();
    });
    expect(result.current.state.isPaused).toBe(true);

    act(() => {
      result.current.actions.togglePause();
    });
    expect(result.current.state.isPaused).toBe(false);
  });

  test('updateScore and winner', () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.actions.updateScore({ left: WINNING_SCORE, right: 0 });
      result.current.actions.setWinner('left');
    });

    expect(result.current.state.score.left).toBe(WINNING_SCORE);
    expect(result.current.state.winner).toBe('left');
  });
});
