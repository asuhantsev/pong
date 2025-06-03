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

});
