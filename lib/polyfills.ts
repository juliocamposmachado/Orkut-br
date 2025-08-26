/**
 * Performance and compatibility polyfills for older browsers/environments
 * This addresses the JavaScript runtime errors seen in the browser console
 */

// Performance API polyfill
if (typeof window !== 'undefined' && !window.performance) {
  window.performance = {} as any;
}

if (typeof window !== 'undefined' && !window.performance.now) {
  let start = Date.now();
  window.performance.now = function() {
    return Date.now() - start;
  };
}

// Scheduler polyfill for React
if (typeof window !== 'undefined' && !(window as any).scheduler) {
  (window as any).scheduler = {
    postTask: (callback: any, options?: any) => {
      return Promise.resolve().then(callback);
    }
  };
}

// Additional polyfills for better compatibility
if (typeof window !== 'undefined') {
  // Fix potential issues with requestIdleCallback
  if (!(window as any).requestIdleCallback) {
    (window as any).requestIdleCallback = function(callback: any, options?: any) {
      const start = performance.now();
      return setTimeout(function() {
        callback({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (performance.now() - start));
          }
        });
      }, 1);
    };
  }

  if (!(window as any).cancelIdleCallback) {
    (window as any).cancelIdleCallback = function(id: any) {
      clearTimeout(id);
    };
  }

  // Ensure console methods exist to prevent errors
  if (!window.console) {
    window.console = {} as any;
  }
  
  ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
    if (!(window.console as any)[method]) {
      (window.console as any)[method] = function() {};
    }
  });
}

// Export for manual import if needed
export {};
