/**
 * Sound Feedback Utility
 * 
 * Provides sound feedback using Web Audio API.
 * Generates tones programmatically without external audio files.
 */

export type SoundType = 'click' | 'success' | 'error' | 'warning' | 'notification' | 'delete';

interface SoundConfig {
  frequency: number | [number, number]; // Hz - single frequency or [start, end] for sweep
  duration: number; // milliseconds
  type: 'tone' | 'sweep'; // tone = constant, sweep = frequency change
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  click: { frequency: 800, duration: 50, type: 'tone' },
  success: { frequency: [600, 800], duration: 150, type: 'sweep' },
  error: { frequency: [400, 300], duration: 200, type: 'sweep' },
  warning: { frequency: 500, duration: 100, type: 'tone' },
  notification: { frequency: 700, duration: 120, type: 'tone' },
  delete: { frequency: 300, duration: 100, type: 'tone' },
};

let audioContext: AudioContext | null = null;
let isInitialized = false;

/**
 * Initialize audio context (requires user interaction)
 */
function initAudioContext(): AudioContext | null {
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }

  try {
    // Check for Web Audio API support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
    isInitialized = true;
    return audioContext;
  } catch (error) {
    console.warn('Audio context initialization failed:', error);
    return null;
  }
}

/**
 * Check if Web Audio API is supported
 */
export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && 
         (window.AudioContext !== undefined || (window as any).webkitAudioContext !== undefined);
}

/**
 * Play a sound using Web Audio API
 * @param type - The sound type to play
 * @param volume - Volume level (0-1, default 0.4)
 * @returns Promise that resolves when sound finishes playing
 */
export async function playSound(type: SoundType, volume: number = 0.4): Promise<void> {
  if (!isAudioSupported()) {
    return;
  }

  const ctx = initAudioContext();
  if (!ctx) {
    return;
  }

  // Resume audio context if suspended (required after user interaction)
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (error) {
      console.warn('Failed to resume audio context:', error);
      return;
    }
  }

  const config = soundConfigs[type];
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Set volume
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration / 1000);

  // Set frequency
  if (config.type === 'tone') {
    const freq = Array.isArray(config.frequency) ? config.frequency[0] : config.frequency;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.type = 'sine';
  } else if (config.type === 'sweep') {
    const [startFreq, endFreq] = Array.isArray(config.frequency) 
      ? config.frequency 
      : [config.frequency, config.frequency];
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + config.duration / 1000);
    oscillator.type = 'sine';
  }

  // Play sound
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + config.duration / 1000);

  // Clean up after sound finishes
  return new Promise((resolve) => {
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
      resolve();
    }, config.duration);
  });
}

/**
 * Initialize audio context on first user interaction
 * Call this early in the app lifecycle (e.g., on first button click)
 */
export function initializeAudioOnInteraction(): void {
  if (!isInitialized && isAudioSupported()) {
    // Try to initialize on any user interaction
    const init = () => {
      initAudioContext();
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };
    document.addEventListener('click', init, { once: true });
    document.addEventListener('touchstart', init, { once: true });
  }
}

