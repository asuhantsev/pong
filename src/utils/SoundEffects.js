const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

export const SoundEffects = {
  init: () => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    return audioContext.state === 'running';
  },

  resume: async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext?.state === 'running';
  },

  createMenuSounds: () => {
    if (!audioContext) {
      return {
        success: { play: () => {} },
        error: { play: () => {} }
      };
    }
    
    const createTone = (frequency, duration, type = 'sine') => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      return {
        play: async () => {
          await SoundEffects.resume();
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          osc.stop(audioContext.currentTime + duration);
        }
      };
    };

    return {
      success: createTone(880, 0.3), // High pitch for success
      error: createTone(220, 0.3, 'square'), // Low pitch for error
    };
  }
}; 