import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type BackButtonCallback = () => boolean; // Returns true if it handled/closed something, false otherwise

class AndroidBackButtonManager {
  private handlers: BackButtonCallback[] = [];
  private lastBackPressTime = 0;
  private isCapacitorActive = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. Check if running inside Capacitor native Android container
    if (Capacitor.isNativePlatform()) {
      try {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          this.triggerBack(canGoBack);
        });
        this.isCapacitorActive = true;
      } catch (e) {
        console.warn('Capacitor backButton listener warning:', e);
      }
    }

    // 2. Web / PWA / Android Chrome Navigation Back Gesture (popstate)
    window.addEventListener('popstate', () => {
      this.triggerBack(true);
    });
  }

  /**
   * Pushes a state to browser history when a modal opens,
   * so Android swipe gestures or system back button trigger popstate
   */
  public pushModalState(modalName: string) {
    if (typeof window === 'undefined') return;
    try {
      window.history.pushState({ modal: modalName, time: Date.now() }, '');
    } catch {
      // Ignore history errors
    }
  }

  /**
   * Registers a back button handler. Handlers are evaluated in LIFO (last in, first out) order.
   * Return true to indicate the event was consumed (e.g. modal closed).
   */
  public register(handler: BackButtonCallback): () => void {
    this.handlers.unshift(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /**
   * Called when Android hardware back button is pressed
   */
  public triggerBack(canGoBack: boolean = false): boolean {
    // Check registered handlers (top-most modal or screen)
    for (const handler of this.handlers) {
      const handled = handler();
      if (handled) {
        return true;
      }
    }

    // Double tap back button to exit prevention on main screen
    const now = Date.now();
    if (now - this.lastBackPressTime < 2200) {
      if (Capacitor.isNativePlatform()) {
        try {
          CapacitorApp.exitApp();
        } catch {
          // ignore
        }
      }
      return false;
    } else {
      this.lastBackPressTime = now;
      this.notifyExitConfirmation();
      return true;
    }
  }

  private exitConfirmListeners: Array<(remainingMs: number) => void> = [];

  public onExitConfirm(listener: (remainingMs: number) => void): () => void {
    this.exitConfirmListeners.push(listener);
    return () => {
      this.exitConfirmListeners = this.exitConfirmListeners.filter((l) => l !== listener);
    };
  }

  private notifyExitConfirmation() {
    this.exitConfirmListeners.forEach((fn) => fn(2000));
  }
}

export const androidBackButtonManager = new AndroidBackButtonManager();
