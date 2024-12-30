import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';
import { featureFlags, FeatureFlags } from '../utils/featureFlags';

// Constants
export const GameLoopConstants = {
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60, // ms
  MAX_FRAME_TIME: 1000 / 30, // Don't allow updates slower than 30 FPS
  MAX_UPDATES_PER_FRAME: 5, // Prevent spiral of death
  INTERPOLATION_ENABLED: true
};

class GameLoopSystem {
  constructor() {
    this.state = {
      isRunning: false,
      isPaused: false,
      frameId: null,
      lastTime: 0,
      accumulatedTime: 0,
      frameCount: 0,
      alpha: 0 // Interpolation factor
    };

    this.subscribers = new Set();
    this.updateCallbacks = new Set();
    this.renderCallbacks = new Set();
  }

  // Start the game loop
  start() {
    if (this.state.isRunning) return;

    Logger.info('GameLoop', 'Starting game loop');
    this.state.isRunning = true;
    this.state.lastTime = performance.now();
    this.state.frameId = requestAnimationFrame(this.loop.bind(this));
  }

  // Stop the game loop
  stop() {
    if (!this.state.isRunning) return;

    Logger.info('GameLoop', 'Stopping game loop');
    this.state.isRunning = false;
    if (this.state.frameId) {
      cancelAnimationFrame(this.state.frameId);
      this.state.frameId = null;
    }
  }

  // Pause/Resume
  pause() {
    this.state.isPaused = true;
    Logger.info('GameLoop', 'Game loop paused');
  }

  resume() {
    this.state.isPaused = false;
    this.state.lastTime = performance.now();
    Logger.info('GameLoop', 'Game loop resumed');
  }

  // Main loop
  loop(currentTime) {
    performanceMonitor.startMeasure('game_loop');

    // Calculate time since last frame
    const deltaTime = currentTime - this.state.lastTime;
    this.state.accumulatedTime += deltaTime;

    // Cap accumulated time to prevent spiral of death
    if (this.state.accumulatedTime > GameLoopConstants.MAX_FRAME_TIME) {
      this.state.accumulatedTime = GameLoopConstants.FRAME_TIME;
    }

    let updateCount = 0;
    
    // Update game state at fixed time steps
    while (this.state.accumulatedTime >= GameLoopConstants.FRAME_TIME && 
           updateCount < GameLoopConstants.MAX_UPDATES_PER_FRAME && 
           !this.state.isPaused) {
      
      performanceMonitor.startMeasure('game_update');
      
      try {
        this.updateCallbacks.forEach(callback => callback(GameLoopConstants.FRAME_TIME));
      } catch (error) {
        Logger.error('GameLoop', 'Error in update callback', error);
      }
      
      performanceMonitor.endMeasure('game_update', 'gameLoop');
      
      this.state.accumulatedTime -= GameLoopConstants.FRAME_TIME;
      updateCount++;
    }

    // Calculate interpolation factor
    this.state.alpha = this.state.accumulatedTime / GameLoopConstants.FRAME_TIME;

    // Render frame
    if (!this.state.isPaused) {
      performanceMonitor.startMeasure('game_render');
      
      try {
        this.renderCallbacks.forEach(callback => 
          callback(this.state.alpha, currentTime - this.state.lastTime));
      } catch (error) {
        Logger.error('GameLoop', 'Error in render callback', error);
      }
      
      performanceMonitor.endMeasure('game_render', 'gameLoop');
    }

    // Update frame stats
    this.state.frameCount++;
    this.state.lastTime = currentTime;

    // Update performance metrics
    performanceMonitor.updateFrameMetrics();
    performanceMonitor.endMeasure('game_loop', 'gameLoop');

    // Schedule next frame
    if (this.state.isRunning) {
      this.state.frameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  // Subscription methods
  addUpdateCallback(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  addRenderCallback(callback) {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }

  // State access
  getState() {
    return { ...this.state };
  }

  // Cleanup
  cleanup() {
    this.stop();
    this.updateCallbacks.clear();
    this.renderCallbacks.clear();
    this.subscribers.clear();
  }
}

// Create and export singleton instance
const gameLoopSystem = new GameLoopSystem();
export default gameLoopSystem; 