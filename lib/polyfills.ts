/**
 * Performance and compatibility polyfills for older browsers/environments
 * Enhanced for Microsoft Edge compatibility
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

  // Microsoft Edge specific polyfills
  const isEdge = /Edge\/|Edg\//.test(navigator.userAgent);
  const isEdgeLegacy = /Edge\//.test(navigator.userAgent);
  
  if (isEdge) {
    console.log('🔧 Microsoft Edge detected - applying compatibility polyfills');
    
    // Fix backdrop-filter support for older Edge versions
    if (!CSS.supports || (!CSS.supports('backdrop-filter', 'blur(10px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(10px)'))) {
      console.log('⚠️ Backdrop-filter not supported, applying fallback');
      
      // Add fallback styles for backdrop-filter
      const style = document.createElement('style');
      style.textContent = `
        .memorial-backdrop,
        .orkut-content-card,
        .orkut-glass,
        .orkut-nav,
        .orkut-sidebar,
        .orkut-modal {
          background-color: rgba(255, 255, 255, 0.95) !important;
        }
        .dark .memorial-backdrop,
        .dark .orkut-content-card,
        .dark .orkut-glass,
        .dark .orkut-nav,
        .dark .orkut-sidebar,
        .dark .orkut-modal {
          background-color: rgba(31, 41, 55, 0.95) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Fix object-fit support for images
    if (!CSS.supports || !CSS.supports('object-fit', 'cover')) {
      console.log('⚠️ Object-fit not supported, applying image fallback');
      
      // Add polyfill for object-fit
      const objectFitImages = document.querySelectorAll('img[style*="object-fit"]');
      objectFitImages.forEach((img: any) => {
        const src = img.src;
        const parent = img.parentElement;
        if (parent && src) {
          img.style.display = 'none';
          parent.style.backgroundImage = `url(${src})`;
          parent.style.backgroundSize = 'cover';
          parent.style.backgroundPosition = 'center';
          parent.style.backgroundRepeat = 'no-repeat';
        }
      });
    }
    
    // Fix CSS custom properties (CSS Variables) for Edge Legacy
    if (isEdgeLegacy) {
      console.log('⚠️ Edge Legacy detected - applying CSS variables fallback');
      
      // Simple CSS variables polyfill for most common cases
      const style = document.createElement('style');
      style.textContent = `
        :root {
          /* Fallback values for Edge Legacy */
        }
        .orkut-content-card {
          background: rgba(255, 255, 255, 0.95) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Fix flexbox gap support
    if (!CSS.supports || !CSS.supports('gap', '1rem')) {
      console.log('⚠️ Flexbox gap not supported, applying margin fallback');
      
      const style = document.createElement('style');
      style.textContent = `
        .gap-1 > * + * { margin-left: 0.25rem; }
        .gap-2 > * + * { margin-left: 0.5rem; }
        .gap-3 > * + * { margin-left: 0.75rem; }
        .gap-4 > * + * { margin-left: 1rem; }
        .gap-6 > * + * { margin-left: 1.5rem; }
      `;
      document.head.appendChild(style);
    }
    
    // Fix scroll behavior
    if (!CSS.supports || !CSS.supports('scroll-behavior', 'smooth')) {
      console.log('⚠️ Smooth scrolling not supported, applying JS fallback');
      
      // Easing function for smooth scroll
      const easeInOutQuad = function(t: number, b: number, c: number, d: number) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      };
      
      // Polyfill for smooth scrolling
      (window as any).scrollToSmooth = function(element: Element | number, top?: number) {
        if (typeof element === 'number') {
          const start = window.pageYOffset;
          const change = element - start;
          const duration = 500;
          let currentTime = 0;
          const increment = 20;
          
          const animateScroll = () => {
            currentTime += increment;
            const val = easeInOutQuad(currentTime, start, change, duration);
            window.scrollTo(0, val);
            if (currentTime < duration) {
              setTimeout(animateScroll, increment);
            }
          };
          animateScroll();
        } else {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      };
    }
    
    // Fix pointer events for interactive elements
    document.addEventListener('DOMContentLoaded', () => {
      const interactiveElements = document.querySelectorAll('button, [role="button"], .cursor-pointer, [onclick]');
      interactiveElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.pointerEvents = 'auto';
        htmlElement.style.cursor = 'pointer';
        htmlElement.style.position = 'relative';
        htmlElement.style.zIndex = '1';
        
        // For Edge Legacy, ensure onclick handler
        if (isEdgeLegacy && !htmlElement.onclick && !htmlElement.getAttribute('onclick')) {
          htmlElement.setAttribute('onclick', 'void(0);');
        }
      });
    });
    
    // Observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const buttons = element.querySelectorAll('button, [role="button"], .cursor-pointer');
              buttons.forEach((btn) => {
                const htmlBtn = btn as HTMLElement;
                htmlBtn.style.pointerEvents = 'auto';
                htmlBtn.style.cursor = 'pointer';
                htmlBtn.style.position = 'relative';
                htmlBtn.style.zIndex = '1';
                
                if (isEdgeLegacy && !htmlBtn.onclick && !htmlBtn.getAttribute('onclick')) {
                  htmlBtn.setAttribute('onclick', 'void(0);');
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Export for manual import if needed
export {};
