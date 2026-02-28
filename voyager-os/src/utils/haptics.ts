export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors gracefully
    }
  }
};

export const hapticFeedback = {
  light: () => vibrate(10),
  medium: () => vibrate(30),
  heavy: () => vibrate(50),
  success: () => vibrate([20, 50, 20]),
  error: () => vibrate([50, 50, 50]),
  selection: () => vibrate(15),
};
