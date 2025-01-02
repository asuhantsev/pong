import { useEffect, useRef } from 'react';
import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
const MAX_ACCUMULATED_TIME = 200; // Cap accumulated time to prevent spiral of death
const MIN_FRAME_TIME = 1; // Minimum time between frames

export function useGameLoop(callback) {
  const frameIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const accumulatedTimeRef = useRef(0);
  const callbackRef = useRef(callback);
  const isActiveRef = useRef(true);
  const fpsCounterRef = useRef({ frames: 0, lastCheck: performance.now() });

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Setup and cleanup game loop
  useEffect(() => {
    const updateFPSCounter = (currentTime) => {
      fpsCounterRef.current.frames++;
      if (currentTime - fpsCounterRef.current.lastCheck >= 1000) {
        const fps = Math.round((fpsCounterRef.current.frames * 1000) / (currentTime - fpsCounterRef.current.lastCheck));
        performanceMonitor.recordMetric('fps', fps);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastCheck = currentTime;
      }
    };

    const gameLoop = (currentTime) => {
      if (!isActiveRef.current) return;

      performanceMonitor.startMeasure('gameLoop');

      // Calculate delta time with a minimum to prevent tiny steps
      const deltaTime = Math.max(currentTime - lastTimeRef.current, MIN_FRAME_TIME);
      accumulatedTimeRef.current += deltaTime;

      // Cap accumulated time to prevent spiral of death
      if (accumulatedTimeRef.current > MAX_ACCUMULATED_TIME) {
        Logger.warn('GameLoop', 'Accumulated time exceeded maximum', {
          accumulated: accumulatedTimeRef.current,
          max: MAX_ACCUMULATED_TIME
        });
        accumulatedTimeRef.current = FRAME_TIME;
      }

      // Update game state at fixed time steps
      let updatesThisFrame = 0;
      while (accumulatedTimeRef.current >= FRAME_TIME) {
        try {
          performanceMonitor.startMeasure('update');
          callbackRef.current(FRAME_TIME);
          performanceMonitor.endMeasure('update', 'game');
          
          accumulatedTimeRef.current -= FRAME_TIME;
          updatesThisFrame++;

          // Prevent too many updates in one frame
          if (updatesThisFrame > 5) {
            Logger.warn('GameLoop', 'Too many updates in one frame', {
              updates: updatesThisFrame,
              accumulated: accumulatedTimeRef.current
            });
            accumulatedTimeRef.current = 0;
            break;
          }
        } catch (error) {
          Logger.error('GameLoop', 'Error in game loop callback', { error });
          isActiveRef.current = false;
          throw error;
        }
      }

      // Update FPS counter
      updateFPSCounter(currentTime);

      lastTimeRef.current = currentTime;
      performanceMonitor.endMeasure('gameLoop', 'game');

      if (isActiveRef.current) {
        frameIdRef.current = requestAnimationFrame(gameLoop);
      }
    };

    Logger.info('GameLoop', 'Starting game loop');
    frameIdRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      Logger.info('GameLoop', 'Cleaning up game loop');
      isActiveRef.current = false;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []); // Empty dependency array since we use refs

  // Return control methods
  return {
    stop: () => {
      isActiveRef.current = false;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    },
    resume: () => {
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        lastTimeRef.current = performance.now();
        frameIdRef.current = requestAnimationFrame(gameLoop);
      }
    },
    isActive: () => isActiveRef.current
  };
} 