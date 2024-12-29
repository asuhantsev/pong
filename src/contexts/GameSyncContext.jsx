import { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { usePhysics } from './PhysicsContext';
import { useGame } from './GameContext';
import { 
  INTERPOLATION_STEP, 
  PREDICTION_BUFFER_SIZE,
  LAG_COMPENSATION_TIME,
  MAX_PREDICTION_TIME,
  INPUT_BUFFER_SIZE,
  JITTER_BUFFER_TIME,
  SMOOTHING_FACTOR 
} from '../constants/gameConstants';

const GameSyncContext = createContext(null);

export function GameSyncProvider({ children }) {
  const syncRef = useRef({
    lastServerUpdate: 0,
    serverState: null,
    pendingInputs: [],
    serverTimeOffset: 0,
    inputSequence: 0,
    predictionBuffer: [],
    lastPredictionTime: 0,
    reconciliationThreshold: 0.1,
    lagCompensationBuffer: [],
    lastInputTime: 0,
    averageInputDelay: 0,
    inputDelayBuffer: [],
    maxPredictionError: 0.2,
    inputBuffer: [],
    jitterBuffer: [],
    lastSmoothUpdate: 0,
    smoothedState: null,
    jitterWindow: JITTER_BUFFER_TIME,
    adaptiveJitterWindow: JITTER_BUFFER_TIME,
  });

  const { socket, emit } = useSocket();
  const { physics, updatePhysics, resetPhysics } = usePhysics();
  const { state: gameState, actions: gameActions } = useGame();

  const compensateForLag = useCallback((input) => {
    const inputTime = input.timestamp - LAG_COMPENSATION_TIME;
    
    let compensatedState = null;
    for (let i = 0; i < syncRef.current.lagCompensationBuffer.length - 1; i++) {
      const state1 = syncRef.current.lagCompensationBuffer[i];
      const state2 = syncRef.current.lagCompensationBuffer[i + 1];
      
      if (state1.timestamp <= inputTime && state2.timestamp >= inputTime) {
        const alpha = (inputTime - state1.timestamp) / (state2.timestamp - state1.timestamp);
        compensatedState = interpolateStates(state1, state2, alpha);
        break;
      }
    }

    return compensatedState || syncRef.current.serverState;
  }, []);

  const predictNextState = useCallback((currentState, input) => {
    const baseState = compensateForLag(input);
    const predictedState = JSON.parse(JSON.stringify(baseState));
    
    const predictionTime = input.timestamp - syncRef.current.lastServerUpdate;
    if (predictionTime > MAX_PREDICTION_TIME) {
      console.warn('Long prediction time:', predictionTime);
    }

    switch (input.type) {
      case 'paddle':
        const paddleKey = input.role === 'left' ? 'leftPaddlePos' : 'rightPaddlePos';
        predictedState[paddleKey] = input.position;
        
        if (syncRef.current.predictionBuffer.length > 0) {
          const lastPrediction = syncRef.current.predictionBuffer[0];
          const velocity = (input.position - lastPrediction[paddleKey]) / 
                         (input.timestamp - syncRef.current.lastPredictionTime);
          predictedState.paddleVelocities = {
            ...predictedState.paddleVelocities,
            [paddleKey]: velocity
          };
        }
        break;
    }

    const physicsResult = updatePhysics(input.timestamp, predictedState);
    syncRef.current.lastPredictionTime = input.timestamp;

    return {
      ...physicsResult,
      predictionError: 0,
      timestamp: input.timestamp
    };
  }, [compensateForLag, updatePhysics]);

  const updateJitterBuffer = useCallback((state) => {
    const now = performance.now();
    
    syncRef.current.jitterBuffer.push({
      state,
      timestamp: now
    });

    while (syncRef.current.jitterBuffer.length > 0 && 
           now - syncRef.current.jitterBuffer[0].timestamp > syncRef.current.adaptiveJitterWindow) {
      syncRef.current.jitterBuffer.shift();
    }

    if (syncRef.current.jitterBuffer.length > 1) {
      const intervals = [];
      for (let i = 1; i < syncRef.current.jitterBuffer.length; i++) {
        intervals.push(
          syncRef.current.jitterBuffer[i].timestamp - 
          syncRef.current.jitterBuffer[i-1].timestamp
        );
      }
      
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
      const jitter = Math.sqrt(variance);

      syncRef.current.adaptiveJitterWindow = 
        syncRef.current.adaptiveJitterWindow * 0.8 + 
        (JITTER_BUFFER_TIME + jitter * 2) * 0.2;
    }
  }, []);

  const smoothInputs = useCallback((inputs) => {
    if (inputs.length === 0) return null;
    
    const now = performance.now();
    const dt = now - syncRef.current.lastSmoothUpdate;
    syncRef.current.lastSmoothUpdate = now;

    const smoothedInput = inputs.reduce((acc, input, index) => {
      const weight = Math.exp(-index * SMOOTHING_FACTOR);
      return {
        position: acc.position + input.position * weight,
        velocity: acc.velocity + (input.velocity || 0) * weight,
        weight: acc.weight + weight
      };
    }, { position: 0, velocity: 0, weight: 0 });

    return {
      position: smoothedInput.position / smoothedInput.weight,
      velocity: smoothedInput.velocity / smoothedInput.weight
    };
  }, []);

  const sendInput = useCallback((input) => {
    if (!socket?.connected) return;

    const inputData = {
      sequence: ++syncRef.current.inputSequence,
      timestamp: Date.now() + syncRef.current.serverTimeOffset,
      ...input
    };

    syncRef.current.inputBuffer.push(inputData);
    if (syncRef.current.inputBuffer.length > INPUT_BUFFER_SIZE) {
      syncRef.current.inputBuffer.shift();
    }

    const smoothedInput = smoothInputs(syncRef.current.inputBuffer);
    if (smoothedInput) {
      inputData.position = smoothedInput.position;
      inputData.velocity = smoothedInput.velocity;
    }

    syncRef.current.pendingInputs.push(inputData);

    const currentState = syncRef.current.predictionBuffer[0] || syncRef.current.serverState;
    if (currentState) {
      const predictedState = predictNextState(currentState, inputData);
      
      syncRef.current.predictionBuffer.unshift(predictedState);
      if (syncRef.current.predictionBuffer.length > PREDICTION_BUFFER_SIZE) {
        syncRef.current.predictionBuffer.pop();
      }
    }

    emit('playerInput', inputData);
  }, [socket, emit, predictNextState, smoothInputs]);

  const calculateDeviation = (predicted, actual) => {
    let totalDeviation = 0;
    
    totalDeviation += Math.abs(predicted.leftPaddlePos - actual.paddles.left);
    totalDeviation += Math.abs(predicted.rightPaddlePos - actual.paddles.right);
    
    totalDeviation += Math.abs(predicted.ballPosition.x - actual.ball.x);
    totalDeviation += Math.abs(predicted.ballPosition.y - actual.ball.y);
    
    return totalDeviation / 4;
  };

  const interpolate = useCallback((currentTime) => {
    if (!syncRef.current.serverState && !syncRef.current.predictionBuffer.length) {
      return null;
    }

    if (syncRef.current.predictionBuffer.length) {
      return syncRef.current.predictionBuffer[0];
    }

    const serverTime = currentTime + syncRef.current.serverTimeOffset - INTERPOLATION_STEP;
    
    const states = syncRef.current.serverState.history;
    let previousState = null;
    let nextState = null;

    for (let i = 0; i < states.length - 1; i++) {
      if (states[i].timestamp <= serverTime && states[i + 1].timestamp >= serverTime) {
        previousState = states[i];
        nextState = states[i + 1];
        break;
      }
    }

    if (!previousState || !nextState) {
      return syncRef.current.serverState.current;
    }

    const alpha = (serverTime - previousState.timestamp) / 
                 (nextState.timestamp - previousState.timestamp);

    return {
      ballPosition: {
        x: previousState.ball.x + (nextState.ball.x - previousState.ball.x) * alpha,
        y: previousState.ball.y + (nextState.ball.y - previousState.ball.y) * alpha
      },
      leftPaddlePos: previousState.paddles.left + 
                     (nextState.paddles.left - previousState.paddles.left) * alpha,
      rightPaddlePos: previousState.paddles.right + 
                      (nextState.paddles.right - previousState.paddles.right) * alpha
    };
  }, []);

  const handleGameState = useCallback((state) => {
    updateJitterBuffer(state);
    
    if (syncRef.current.jitterBuffer.length > 0) {
      const processableStates = syncRef.current.jitterBuffer.filter(
        item => item.timestamp <= performance.now() - syncRef.current.adaptiveJitterWindow
      );

      if (processableStates.length > 0) {
        const latestState = processableStates[processableStates.length - 1].state;
        processGameState(latestState);
      }
    }
  }, [updateJitterBuffer]);

  const processGameState = useCallback((state) => {
    syncRef.current.serverState = state;
    const now = performance.now();
    syncRef.current.lastServerUpdate = now;

    syncRef.current.lagCompensationBuffer.unshift(state);
    if (syncRef.current.lagCompensationBuffer.length > 60) {
      syncRef.current.lagCompensationBuffer.pop();
    }

    if (syncRef.current.predictionBuffer.length > 0) {
      const currentPrediction = syncRef.current.predictionBuffer[0];
      const error = calculateDeviation(currentPrediction, state);
      
      currentPrediction.predictionError = error;
      
      if (error > syncRef.current.maxPredictionError) {
        console.warn('High prediction error:', error);
        
        resetPhysics(state);
        syncRef.current.predictionBuffer = [];
        
        let currentState = state;
        syncRef.current.pendingInputs.forEach(input => {
          const newState = predictNextState(currentState, input);
          if (calculateDeviation(newState, currentState) < syncRef.current.maxPredictionError) {
            syncRef.current.predictionBuffer.push(newState);
            currentState = newState;
          } else {
            console.warn('Skipping suspicious input:', input);
          }
        });
      }
    }

    if (state.lastProcessedInput) {
      const inputDelay = now - syncRef.current.pendingInputs[0]?.timestamp;
      syncRef.current.inputDelayBuffer.push(inputDelay);
      if (syncRef.current.inputDelayBuffer.length > 60) {
        syncRef.current.inputDelayBuffer.shift();
      }
      syncRef.current.averageInputDelay = 
        syncRef.current.inputDelayBuffer.reduce((a, b) => a + b, 0) / 
        syncRef.current.inputDelayBuffer.length;
    }

    syncRef.current.pendingInputs = syncRef.current.pendingInputs.filter(
      input => input.sequence > state.lastProcessedInput
    );
  }, [predictNextState, resetPhysics]);

  return (
    <GameSyncContext.Provider value={{
      sendInput,
      interpolate,
      serverState: syncRef.current.serverState,
      predictedState: syncRef.current.predictionBuffer[0] || null,
      averageInputDelay: syncRef.current.averageInputDelay,
      predictionError: syncRef.current.predictionBuffer[0]?.predictionError || 0,
      jitterWindow: syncRef.current.adaptiveJitterWindow,
      inputBufferSize: syncRef.current.inputBuffer.length
    }}>
      {children}
    </GameSyncContext.Provider>
  );
}

export const useGameSync = () => useContext(GameSyncContext); 