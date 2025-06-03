import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from '../../contexts/GameContext.jsx';
import { GameBoard } from '../game/GameBoard.jsx';
import { WINNING_SCORE } from '../../constants/gameConstants.js';
import '@testing-library/jest-dom';

describe('GameBoard display', () => {
  function renderWithProvider(ui) {
    let context;
    function Consumer() {
      context = useGame();
      return null;
    }
    const result = render(
      React.createElement(GameProvider, null, React.createElement(React.Fragment, null, React.createElement(Consumer), ui))
    );
    return { ...result, context };
  }

  test('shows updated score', () => {
    const { context } = renderWithProvider(React.createElement(GameBoard));

    act(() => {
      context.actions.startGame('single');
      context.actions.updateScore({ left: 2, right: 5 });
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows winner overlay', () => {
    const { context } = renderWithProvider(React.createElement(GameBoard));

    act(() => {
      context.actions.startGame('single');
      context.actions.updateScore({ left: WINNING_SCORE, right: 0 });
      context.actions.setWinner('left');
    });

    expect(screen.getByText(String(WINNING_SCORE))).toBeInTheDocument();
    expect(screen.getByText(/Wins!/i)).toBeInTheDocument();
  });

  test('displays computer as right player in single mode', () => {
    const { context } = renderWithProvider(React.createElement(GameBoard));

    act(() => {
      context.actions.startGame('single');
      context.actions.updateCountdown(null);
    });

    expect(screen.getByText('COMPUTER')).toBeInTheDocument();
  });

  test('pause overlay appears when paused', () => {
    const { context } = renderWithProvider(React.createElement(GameBoard));

    act(() => {
      context.actions.startGame('single');
      context.actions.updateCountdown(null);
      context.actions.togglePause();
    });

    expect(screen.getByText('Game Paused')).toBeInTheDocument();

    act(() => {
      context.actions.togglePause();
    });

    expect(screen.queryByText('Game Paused')).not.toBeInTheDocument();
  });

  test('play again resets score', () => {
    const { context } = renderWithProvider(React.createElement(GameBoard));

    act(() => {
      context.actions.startGame('single');
      context.actions.updateScore({ left: WINNING_SCORE, right: 0 });
      context.actions.setWinner('left');
    });

    const button = screen.getByText('Play Again');
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(context.state.score.left).toBe(0);
    expect(context.state.score.right).toBe(0);
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });
});
