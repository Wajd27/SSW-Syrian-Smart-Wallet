import { useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { vibrate, HapticPattern } from '@/shared/utils/haptics';
import { playSound, SoundType, initializeAudioOnInteraction } from '@/shared/utils/sounds';

export type FeedbackType = 'click' | 'success' | 'error' | 'warning' | 'notification' | 'delete';

interface FeedbackConfig {
  haptic?: HapticPattern;
  sound?: SoundType;
}

const feedbackConfigs: Record<FeedbackType, FeedbackConfig> = {
  click: { haptic: 'light', sound: 'click' },
  success: { haptic: 'success', sound: 'success' },
  error: { haptic: 'error', sound: 'error' },
  warning: { haptic: 'warning', sound: 'warning' },
  notification: { haptic: 'light', sound: 'notification' },
  delete: { haptic: 'warning', sound: 'delete' },
};

/**
 * Custom hook for triggering haptic and sound feedback
 * Respects user settings and handles browser compatibility
 */
export function useFeedback() {
  const { user } = useAuth();

  // Get user preferences with defaults
  const hapticEnabled = user?.notification_settings?.haptic_feedback_enabled !== false;
  const soundEnabled = user?.notification_settings?.sound_effects_enabled !== false;
  const soundVolume = user?.notification_settings?.sound_volume ?? 0.4;

  const triggerFeedback = useCallback(
    async (type: FeedbackType) => {
      const config = feedbackConfigs[type];

      // Trigger haptic feedback if enabled
      if (hapticEnabled && config.haptic) {
        vibrate(config.haptic);
      }

      // Trigger sound feedback if enabled
      if (soundEnabled && config.sound) {
        // Initialize audio context on first use if needed
        initializeAudioOnInteraction();
        await playSound(config.sound, soundVolume);
      }
    },
    [hapticEnabled, soundEnabled, soundVolume]
  );

  return { triggerFeedback };
}

