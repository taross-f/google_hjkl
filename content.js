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
    // Clear previous results
    this.searchResults = [];
    this.currentIndex = -1;
    
    // Wait a bit if search results container is not ready
    const searchContainer = document.querySelector('#search, #rso, .srg, [data-async-context]');
    if (!searchContainer) {
      console.log('Search container not ready, will retry...');
      return false;
    }
    
    // Focus only on main title links in search results
    const selectors = [
      // Main title links in standard search results
      '.g h3 a:first-of-type',          // Standard result titles
      '.yuRUbf > a',                    // Primary result link (new layout)
      '.rc > .yuRUbf > a',              // Result container title
      '.tF2Cxc > .yuRUbf > a',          // Alternative result structure
      
      // Video results (main titles only)
      '.g-blk h3 a:first-of-type',      // Video block titles
      '.rGhul h3 a',                    // Video carousel title
      
      // News results (main titles only)  
      '.SoaBEf h3 a',                   // News carousel titles
      '.WlydOe h3 a',                   // News article titles
      '.mCBkyc > a',                    // News result main link
      
      // Special result types (main links only)
      '.kp-blk h3 a:first-of-type',     // Knowledge panel main links
      '.g [data-header-feature] h3 a',  // Featured result titles
      
      // Ensure we get the primary link with favicon
      '.g a[data-ved]:has(br) + h3 a',  // Link after favicon
      '.g .kvH3mc > a',                 // Direct title container
    ];

    this.searchResults = [];
    const processedUrls = new Set();
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Filter for main result links only
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
            
            // Check if this is a main title link (not a sublink)
            const parent = el.closest('.g, .yuRUbf, .tF2Cxc, .rGhul, .SoaBEf, .WlydOe');
            const isMainLink = parent && (
              el.matches('h3 a') || 
              el.parentElement?.matches('h3') ||
              el.closest('.yuRUbf') ||
              el.matches('.yuRUbf > a') ||
              (parent.querySelector('h3 a') === el)
            );
            
            // Check visibility
            const isVisible = el.offsetParent !== null && 
                            window.getComputedStyle(el).display !== 'none';
            
            if (isMainLink && isVisible) {
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
    
    // Debug log for specific types
    const youtubeCount = this.searchResults.filter(el => el.href.includes('youtube.com') || el.href.includes('youtu.be')).length;
    const facebookCount = this.searchResults.filter(el => el.href.includes('facebook.com')).length;
    if (youtubeCount > 0 || facebookCount > 0) {
      console.log(`Including ${youtubeCount} YouTube and ${facebookCount} Facebook results`);
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

// Initialize navigation with retry mechanism
function initializeNavigation(retryCount = 0) {
  // Destroy existing instance if it exists
  if (navigationInstance) {
    navigationInstance.destroy();
    navigationInstance = null;
  }
  
  // Create new instance
  navigationInstance = new GoogleVimNavigation();
  
  // Check if initialization was successful
  if (!navigationInstance.searchResults.length && retryCount < 5) {
    console.log(`No search results found, retrying initialization (attempt ${retryCount + 1}/5)...`);
    setTimeout(() => {
      initializeNavigation(retryCount + 1);
    }, 300 * (retryCount + 1)); // Exponential backoff
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
let reinitTimer = null;

// More robust page change detection
const pageChangeObserver = new MutationObserver((mutations) => {
  const url = location.href;
  
  // Check if URL changed or if search results were updated
  const hasSearchMutation = mutations.some(mutation => {
    const target = mutation.target;
    return target.id === 'search' || 
           target.id === 'rso' || 
           target.classList?.contains('srg') ||
           target.querySelector?.('#search, #rso, .srg');
  });
  
  if (url !== lastUrl || hasSearchMutation) {
    lastUrl = url;
    
    // Clear any pending reinitialization
    if (reinitTimer) {
      clearTimeout(reinitTimer);
    }
    
    // Debounce reinitialization to avoid multiple rapid calls
    reinitTimer = setTimeout(() => {
      console.log('Page change detected, reinitializing navigation...');
      initializeNavigation();
    }, 800); // Slightly longer delay to ensure DOM is ready
  }
});

// Observe for changes in the main content area
pageChangeObserver.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: false
});