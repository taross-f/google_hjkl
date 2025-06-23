// Prevent multiple script execution
if (window.googleVimNavigationLoaded) {
  console.log('Google Vim Navigation already loaded, skipping...');
} else {
  window.googleVimNavigationLoaded = true;

class GoogleVimNavigation {
  constructor() {
    this.currentIndex = -1;
    this.searchResults = [];
    this.isActive = false;
    this.keydownHandler = null; // Store reference to event handler
    this.init();
  }

  init() {
    this.updateSearchResults();
    this.attachKeyboardListeners();
    this.addCustomStyles();
  }

  updateSearchResults() {
    // Store current position to restore later
    const previousIndex = this.currentIndex;
    const previousResultHref = previousIndex >= 0 && this.searchResults[previousIndex] 
      ? this.searchResults[previousIndex].href 
      : null;
    
    // Clear previous results
    this.searchResults = [];
    this.currentIndex = -1;
    
    // Wait a bit if search results container is not ready
    const searchContainer = document.querySelector('#search, #rso, .srg, [data-async-context]');
    if (!searchContainer) {
      console.log('Search container not ready, will retry...');
      return false;
    }
    
    // Focus on main title links - using more flexible selectors
    const selectors = [
      // Standard search results - main title links
      '.g h3 a',                        // Most common: h3 title links
      '.yuRUbf a',                      // New layout primary links
      '.tF2Cxc h3 a',                   // Alternative structure
      '.rc h3 a',                       // Results container
      
      // Video and special content
      '.g-blk h3 a',                    // Video block titles
      '.video-result h3 a',             // Video results
      
      // News results
      '.SoaBEf h3 a',                   // News carousel
      '.WlydOe h3 a',                   // News articles
      
      // Knowledge panel and rich results
      '.kp-blk h3 a',                   // Knowledge panel
      '.mod h3 a',                      // Module results
      
      // Fallback selectors for main links
      '[data-ved] h3 a',                // Data-ved containers with h3
      '.g > div > div > div > a[href]:has(h3)', // Direct structure
    ];

    this.searchResults = [];
    const processedUrls = new Set();
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Basic filtering for valid external links
          if (el.href && 
              !el.href.includes('google.com/search') &&
              !el.href.includes('accounts.google.com') &&
              !el.href.includes('support.google.com') &&
              !el.href.includes('policies.google.com') &&
              !el.href.includes('maps.google.com/maps?') &&
              !el.href.startsWith('javascript:') &&
              !el.href.startsWith('#') &&
              el.href.trim() !== '' &&
              !processedUrls.has(el.href)) {
            
            // Check if this is likely a main title link
            const isInH3 = el.closest('h3') !== null;
            const hasValidParent = el.closest('.g, .yuRUbf, .tF2Cxc, .g-blk, .SoaBEf, .WlydOe, .kp-blk, .mod') !== null;
            const hasText = el.textContent && el.textContent.trim().length > 3;
            
            // Check visibility
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                            window.getComputedStyle(el).display !== 'none';
            
            // Accept if it's in h3 or has valid parent and text
            if ((isInH3 || hasValidParent) && hasText && isVisible) {
              this.searchResults.push(el);
              processedUrls.add(el.href);
            }
          }
        });
      } catch (e) {
        console.warn(`Selector failed: ${selector}`, e);
      }
    }

    // Sort results by their position on the page
    this.searchResults.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return (rectA.top + rectA.left) - (rectB.top + rectB.left);
    });

    console.log(`Found ${this.searchResults.length} search results`);
    
    // Try to restore previous position
    if (previousResultHref && this.searchResults.length > 0) {
      const restoredIndex = this.searchResults.findIndex(result => result.href === previousResultHref);
      if (restoredIndex !== -1) {
        this.currentIndex = restoredIndex;
        console.log(`Restored navigation position to index ${restoredIndex}`);
        // Apply focus to restored position
        setTimeout(() => this.addFocus(), 100);
      } else if (previousIndex < this.searchResults.length) {
        // If exact URL not found, try to restore approximate position
        this.currentIndex = Math.min(previousIndex, this.searchResults.length - 1);
        console.log(`Restored approximate navigation position to index ${this.currentIndex}`);
        setTimeout(() => this.addFocus(), 100);
      }
    }
    
    // Debug information about found results
    if (this.searchResults.length > 0) {
      console.log('First 3 results:', this.searchResults.slice(0, 3).map(el => ({
        text: el.textContent?.slice(0, 50) + '...',
        href: el.href,
        selector: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : '')
      })));
    } else {
      // Debug: check what elements exist
      const debugSelectors = ['.g', '.yuRUbf', 'h3 a', '[data-ved]'];
      debugSelectors.forEach(sel => {
        const count = document.querySelectorAll(sel).length;
        console.log(`Debug: ${sel} found ${count} elements`);
      });
    }
    
    return this.searchResults.length > 0;
  }

  attachKeyboardListeners() {
    // Store the handler reference so we can remove it later
    this.keydownHandler = (e) => {
      // Only activate on first keypress of j, k, h, l, or Enter
      if (['KeyJ', 'KeyK', 'KeyH', 'KeyL', 'Enter'].includes(e.code)) {
        // Prevent default browser behavior
        if (e.target.tagName.toLowerCase() !== 'input' && 
            e.target.tagName.toLowerCase() !== 'textarea' &&
            !e.target.isContentEditable) {
          
          this.handleKeypress(e);
        }
      }
    };
    
    document.addEventListener('keydown', this.keydownHandler);
  }

  handleKeypress(e) {
    switch(e.code) {
      case 'KeyJ':
        e.preventDefault();
        this.navigateDown();
        break;
      case 'KeyK':
        e.preventDefault();
        this.navigateUp();
        break;
      case 'KeyH':
        e.preventDefault();
        this.navigatePrevPage();
        break;
      case 'KeyL':
        // Don't handle Cmd+L (or Ctrl+L on Windows/Linux)
        if (e.metaKey || e.ctrlKey) {
          return; // Let Chrome handle the default behavior
        }
        e.preventDefault();
        this.navigateNextPage();
        break;
      case 'Enter':
        if (this.currentIndex >= 0) {
          e.preventDefault();
          this.openCurrentResult();
        }
        break;
    }
  }

  navigateDown() {
    if (this.searchResults.length === 0) {
      this.updateSearchResults();
    }

    if (this.searchResults.length > 0) {
      this.removeFocus();
      this.currentIndex = Math.min(this.currentIndex + 1, this.searchResults.length - 1);
      this.addFocus();
      this.scrollToCurrentResult();
    }
  }

  navigateUp() {
    if (this.searchResults.length === 0) {
      this.updateSearchResults();
    }

    if (this.searchResults.length > 0) {
      this.removeFocus();
      this.currentIndex = Math.max(this.currentIndex - 1, 0);
      this.addFocus();
      this.scrollToCurrentResult();
    }
  }

  navigatePrevPage() {
    const prevButton = document.querySelector('#pnprev, a[aria-label*="Previous"], a[aria-label*="前"]');
    if (prevButton && !prevButton.getAttribute('aria-disabled') && prevButton.style.display !== 'none') {
      prevButton.click();
    }
  }

  navigateNextPage() {
    const nextButton = document.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="次"]');
    if (nextButton && !nextButton.getAttribute('aria-disabled')) {
      nextButton.click();
    }
  }

  openCurrentResult() {
    if (this.currentIndex >= 0 && this.searchResults[this.currentIndex]) {
      const link = this.searchResults[this.currentIndex];
      // Open in current tab
      window.location.href = link.href;
    }
  }

  addFocus() {
    if (this.currentIndex >= 0 && this.searchResults[this.currentIndex]) {
      const element = this.searchResults[this.currentIndex];
      element.classList.add('vim-nav-focused');
      
      // Find the appropriate parent container for main results only
      const parentSelectors = [
        '.g',                    // Standard result container
        '.yuRUbf',              // New layout container
        '.tF2Cxc',              // Result wrapper
        '.g-blk',               // Block container (videos)
        '.rGhul',               // Video carousel item
        '.kp-blk',              // Knowledge panel
        '.SoaBEf',              // News carousel
        '.WlydOe',              // News article
        '.mCBkyc'               // News container
      ];
      
      // Try each selector to find the closest parent
      let parentFound = false;
      for (const selector of parentSelectors) {
        const parent = element.closest(selector);
        if (parent) {
          parent.classList.add('vim-nav-result-focused');
          parentFound = true;
          break;
        }
      }
      
      // If no specific parent found, try to find the nearest block-level ancestor
      if (!parentFound) {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          const display = window.getComputedStyle(parent).display;
          if (display === 'block' || display === 'flex' || display === 'grid') {
            parent.classList.add('vim-nav-result-focused');
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
  }

  removeFocus() {
    document.querySelectorAll('.vim-nav-focused, .vim-nav-result-focused').forEach(el => {
      el.classList.remove('vim-nav-focused', 'vim-nav-result-focused');
    });
  }

  scrollToCurrentResult() {
    if (this.currentIndex >= 0 && this.searchResults[this.currentIndex]) {
      const element = this.searchResults[this.currentIndex];
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Scroll if element is not visible or too close to edges
      if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  addCustomStyles() {
    if (document.getElementById('vim-nav-styles')) return;

    const style = document.createElement('style');
    style.id = 'vim-nav-styles';
    style.textContent = `
      .vim-nav-focused {
        outline: 2px solid #4285f4 !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
        background-color: rgba(66, 133, 244, 0.1) !important;
      }
      
      .vim-nav-result-focused {
        background-color: rgba(66, 133, 244, 0.05) !important;
        border-radius: 8px !important;
        box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  destroy() {
    // Clean up event listeners
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    // Remove focus from any currently focused elements
    this.removeFocus();
    
    // Clear search results
    this.searchResults = [];
    this.currentIndex = -1;
  }
}

// Singleton instance to prevent multiple instances
let navigationInstance = null;
let isInitializing = false;

// Initialize navigation with retry mechanism
function initializeNavigation(retryCount = 0) {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log('Initialization already in progress, skipping...');
    return;
  }
  
  isInitializing = true;
  console.log(`Attempting initialization ${new Date()}`);
  
  // Destroy existing instance if it exists
  if (navigationInstance) {
    navigationInstance.destroy();
    navigationInstance = null;
  }
  
  // Create new instance
  navigationInstance = new GoogleVimNavigation();
  
  // Check if initialization was successful
  if (navigationInstance.searchResults.length === 0 && retryCount < 3) {
    console.log(`No search results found, retrying initialization (attempt ${retryCount + 1}/3)...`);
    setTimeout(() => {
      isInitializing = false; // Reset flag before retry
      initializeNavigation(retryCount + 1);
    }, 500 * (retryCount + 1)); // Longer delays
  } else {
    if (navigationInstance.searchResults.length === 0) {
      console.log('Failed to find search results after 3 attempts. Check if this is a search results page.');
    }
    isInitializing = false; // Reset flag after completion
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}

// Re-initialize on page changes (for Google's AJAX navigation)
let lastUrl = location.href;
let reinitializationTimer = null;
let isReinitializing = false;

// More robust page change detection
const pageChangeObserver = new MutationObserver((mutations) => {
  const url = location.href;
  
  // Skip if already reinitializing or initializing
  if (isReinitializing || isInitializing) {
    return;
  }
  
  // Only react to significant changes - URL changes or major DOM updates
  const urlChanged = url !== lastUrl;
  const hasSearchMutation = mutations.some(mutation => {
    const target = mutation.target;
    // Only react to major container changes, not minor text/attribute changes
    return mutation.type === 'childList' && 
           (target.id === 'search' || 
            target.id === 'rso' || 
            target.classList?.contains('srg'));
  });
  
  if (urlChanged || hasSearchMutation) {
    lastUrl = url;
    
    // Clear any pending reinitialization
    if (reinitializationTimer) {
      clearTimeout(reinitializationTimer);
    }
    
    // Debounce reinitialization to avoid multiple rapid calls
    reinitializationTimer = setTimeout(() => {
      isReinitializing = true;
      console.log('Page change detected, reinitializing navigation...');
      initializeNavigation();
      // Reset flag after initialization
      setTimeout(() => { isReinitializing = false; }, 1000);
    }, 800); // Slightly longer delay to ensure DOM is ready
  }
});

// Observe for changes in the main content area
pageChangeObserver.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: false
});

} // End of if (!window.googleVimNavigationLoaded)