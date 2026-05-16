import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(timeout: number, onIdle: () => void) {
  const timeoutRef = useRef<number | null>(null);

  const handleIdle = useCallback(() => {
    onIdle();
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(handleIdle, timeout);
  }, [timeout, handleIdle]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

    const handleEvent = () => resetTimer();

    // Set initial timer
    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleEvent, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [resetTimer]);
}
