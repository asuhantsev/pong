import gameLoopSystem, { GameLoopConstants } from '../GameLoopSystem';

// Mock performance.now() for consistent testing
const mockNow = jest.spyOn(performance, 'now');
let currentTime = 0;
mockNow.mockImplementation(() => currentTime);

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  setTimeout(() => {
    currentTime += GameLoopConstants.FRAME_TIME;
    callback(currentTime);
  }, 0);
  return Math.random(); // Return a unique ID
});

global.cancelAnimationFrame = jest.fn();

describe('GameLoopSystem', () => {
  beforeEach(() => {
    gameLoopSystem.cleanup();
    currentTime = 0;
    jest.clearAllMocks();
  });

  describe('Lifecycle', () => {
    it('should start and stop correctly', () => {
      expect(gameLoopSystem.getState().isRunning).toBe(false);
      
      gameLoopSystem.start();
      expect(gameLoopSystem.getState().isRunning).toBe(true);
      expect(requestAnimationFrame).toHaveBeenCalled();
      
      gameLoopSystem.stop();
      expect(gameLoopSystem.getState().isRunning).toBe(false);
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle pause and resume', () => {
      gameLoopSystem.start();
      gameLoopSystem.pause();
      expect(gameLoopSystem.getState().isPaused).toBe(true);
      
      gameLoopSystem.resume();
      expect(gameLoopSystem.getState().isPaused).toBe(false);
    });

    it('should not start multiple times', () => {
      gameLoopSystem.start();
      const frameId = gameLoopSystem.getState().frameId;
      
      gameLoopSystem.start();
      expect(gameLoopSystem.getState().frameId).toBe(frameId);
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('should handle update callbacks', (done) => {
      const updateCallback = jest.fn();
      gameLoopSystem.addUpdateCallback(updateCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        expect(updateCallback).toHaveBeenCalled();
        expect(updateCallback).toHaveBeenCalledWith(GameLoopConstants.FRAME_TIME);
        done();
      }, GameLoopConstants.FRAME_TIME * 2);
    });

    it('should handle render callbacks with interpolation', (done) => {
      const renderCallback = jest.fn();
      gameLoopSystem.addRenderCallback(renderCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        expect(renderCallback).toHaveBeenCalled();
        const [alpha, deltaTime] = renderCallback.mock.calls[0];
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
        expect(deltaTime).toBe(GameLoopConstants.FRAME_TIME);
        done();
      }, GameLoopConstants.FRAME_TIME * 2);
    });

    it('should remove callbacks correctly', (done) => {
      const callback = jest.fn();
      const removeUpdate = gameLoopSystem.addUpdateCallback(callback);
      const removeRender = gameLoopSystem.addRenderCallback(callback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        removeUpdate();
        removeRender();
        callback.mockClear();
        
        setTimeout(() => {
          expect(callback).not.toHaveBeenCalled();
          done();
        }, GameLoopConstants.FRAME_TIME);
      }, GameLoopConstants.FRAME_TIME);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in update callbacks', (done) => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();
      
      gameLoopSystem.addUpdateCallback(errorCallback);
      gameLoopSystem.addUpdateCallback(normalCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        expect(normalCallback).toHaveBeenCalled();
        done();
      }, GameLoopConstants.FRAME_TIME * 2);
    });

    it('should handle errors in render callbacks', (done) => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();
      
      gameLoopSystem.addRenderCallback(errorCallback);
      gameLoopSystem.addRenderCallback(normalCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        expect(normalCallback).toHaveBeenCalled();
        done();
      }, GameLoopConstants.FRAME_TIME * 2);
    });
  });

  describe('Performance', () => {
    it('should cap accumulated time', (done) => {
      currentTime = 10000; // Simulate a long pause
      
      const updateCallback = jest.fn();
      gameLoopSystem.addUpdateCallback(updateCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        expect(updateCallback).toHaveBeenCalledTimes(GameLoopConstants.MAX_UPDATES_PER_FRAME);
        done();
      }, GameLoopConstants.FRAME_TIME * 2);
    });

    it('should maintain fixed time step', (done) => {
      const updateCallback = jest.fn();
      gameLoopSystem.addUpdateCallback(updateCallback);
      
      gameLoopSystem.start();
      
      setTimeout(() => {
        const calls = updateCallback.mock.calls;
        calls.forEach(([deltaTime]) => {
          expect(deltaTime).toBe(GameLoopConstants.FRAME_TIME);
        });
        done();
      }, GameLoopConstants.FRAME_TIME * 3);
    });
  });
}); 