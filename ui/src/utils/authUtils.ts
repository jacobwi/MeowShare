/**
 * Authentication utility functions
 */

import authService from "../services/auth";

/**
 * Sets up a timer to refresh the authentication token periodically
 * @param tokenRefreshTimerRef Reference to store the timer
 * @param logoutFn Function to call if token refresh fails
 * @returns A cleanup function to clear the timer
 */
export const setupAuthRefreshTimer = (
  tokenRefreshTimerRef: React.MutableRefObject<ReturnType<
    typeof setInterval
  > | null>,
  logoutFn: () => Promise<void>,
) => {
  // Clear any existing timer
  if (tokenRefreshTimerRef.current) {
    clearInterval(tokenRefreshTimerRef.current);
  }

  // Set up a new timer
  tokenRefreshTimerRef.current = setInterval(async () => {
    if (authService.shouldRefreshToken()) {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        await logoutFn();
      }
    }
  }, 60000); // Check every minute

  // Return a cleanup function
  return () => {
    if (tokenRefreshTimerRef.current) {
      clearInterval(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  };
};
