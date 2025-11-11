/**
 * Haptic Feedback Utility
 * 
 * Provides vibration feedback using the Web Vibration API.
 * Works on mobile browsers and desktop browsers with vibration support.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10, // Short single pulse (10ms)
  medium: 20, // Medium pulse (20ms)
  heavy: 30, // Strong pulse (30ms)
  success: [10, 50, 10], // Double pulse pattern
  error: [20, 50, 20, 50, 20], // Triple pulse pattern
  warning: [15, 30, 15], // Double pulse pattern
};

/**
 * Check if vibration API is supported
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback vibration
 * @param pattern - The vibration pattern to use
 * @returns true if vibration was triggered, false otherwise
 */
export function vibrate(pattern: HapticPattern = 'light'): boolean {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    console.warn('Vibration failed:', error);
    return false;
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelVibration(): void {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.warn('Cancel vibration failed:', error);
    }
  }
}

