class GoogleVimNavigation {
  constructor() {
    this.currentIndex = -1;
    this.searchResults = [];
    this.isActive = false;
    this.init();
  }

  init() {
    this.updateSearchResults();
    this.attachKeyboardListeners();
    this.addCustomStyles();
  }

  updateSearchResults() {
    // Comprehensive Google search result selectors for all content types
    const selectors = [
      // Standard web results
      'div[data-ved] h3 a', // Main organic results
      '.g h3 a', // Standard results
      '.rc h3 a', // Results container
      '.yuRUbf a', // New layout
      '[data-ved] a[href^="/url"]', // URL redirects
      
      // Video results (YouTube, etc.)
      '.g-blk a[href*="youtube.com"]', // YouTube video blocks
      '.g-blk a[href*="youtu.be"]', // YouTube short links
      'g-card a[href*="youtube.com"]', // Video cards
      '.rGhul a', // Video carousel items
      '.BVG0Nb a', // Video result links
      'div[jsname] a[href*="youtube.com"]', // Dynamic video results
      '.video-result a', // Generic video results
      '.g-scrolling-carousel a[href*="youtube.com"]', // Scrolling video carousels
      
      // Social media results
      '.g a[href*="facebook.com"]', // Facebook results
      '.g a[href*="twitter.com"]', // Twitter/X results
      '.g a[href*="x.com"]', // X (formerly Twitter) results
      '.g a[href*="instagram.com"]', // Instagram results
      '.g a[href*="linkedin.com"]', // LinkedIn results
      '.g a[href*="reddit.com"]', // Reddit results
      '.g a[href*="tiktok.com"]', // TikTok results
      
      // Rich snippets and special formats
      '.kp-blk a:not([href*="google.com"])', // Knowledge panel links
      '.xpdopen a[href]:not([href*="google.com"])', // Expandable results
      '.mod a[href]:not([href*="google.com"])', // Module results
      '.g-blk a[href]:not([href*="google.com"])', // Block results
      
      // Direct links without redirects
      'a[data-ved][href^="http"]:not([href*="google.com"])', // Direct HTTP links
      'a[data-ved][href^="https"]:not([href*="google.com"])', // Direct HTTPS links
      
      // News results
      '.SoaBEf a', // News carousel
      '.WlydOe a', // News articles
      
      // Image pack results
      '.ivg-i a', // Image pack links
      
      // Shopping results
      '.sh-np__click-target', // Shopping product links
      '.shntl a', // Shopping list items
      
      // Local pack results
      '.rllt__link', // Local business links
      '.VkpGBb a', // Maps/local results
      
      // Featured snippets
      '.FjYOQe a', // Featured snippet source links
      
      // People also ask
      '.related-question-pair a:not([href*="google.com"])', // PAA links
      
      // Sitelinks
      '.sld a', // Sitelink results
      '.BNeawe a', // Alternative sitelinks
      
      // Generic catch-all selectors
      '[data-sokoban-container] a[href]:not([href*="google.com"])', // Dynamic containers
      '.MjjYud a[href]:not([href*="google.com"])', // Result containers
      '.N54PNb a[href]:not([href*="google.com"])', // Alternative containers
      '.hlcw0c a[href]:not([href*="google.com"])' // Text result containers
    ];

    this.searchResults = [];
    const processedUrls = new Set();
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // More comprehensive filtering
          if (el.href && 
              !el.href.includes('google.com/search') &&
              !el.href.includes('accounts.google.com') &&
              !el.href.includes('support.google.com') &&
              !el.href.includes('policies.google.com') &&
              !el.href.includes('maps.google.com/maps?') && // Exclude map embeds
              !el.href.startsWith('javascript:') &&
              !el.href.startsWith('#') &&
              el.href.trim() !== '' &&
              !processedUrls.has(el.href)) {
            
            // Additional checks for valid results
            const isVisible = el.offsetParent !== null || window.getComputedStyle(el).display !== 'none';
            const hasText = el.textContent.trim().length > 0 || el.querySelector('h3, h2, [role="heading"]');
            
            if (isVisible || hasText) {
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
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Only activate on first keypress of j, k, h, l, or Enter
      if (['KeyJ', 'KeyK', 'KeyH', 'KeyL', 'Enter'].includes(e.code)) {
        // Prevent default browser behavior
        if (e.target.tagName.toLowerCase() !== 'input' && 
            e.target.tagName.toLowerCase() !== 'textarea' &&
            !e.target.isContentEditable) {
          
          this.handleKeypress(e);
        }
      }
    });
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
      
      // Find the appropriate parent container for different result types
      const parentSelectors = [
        '.g',                    // Standard result container
        '.yuRUbf',              // New layout container
        '[data-ved]',           // Data-ved container
        '.g-blk',               // Block container (videos, etc.)
        'g-card',               // Card container
        '.rGhul',               // Video carousel item
        '.kp-blk',              // Knowledge panel
        '.xpdopen',             // Expandable container
        '.mod',                 // Module container
        '.MjjYud',              // Result wrapper
        '.N54PNb',              // Alternative wrapper
        '.hlcw0c',              // Text result wrapper
        '.sh-np__click-target', // Shopping container
        '.rllt__link',          // Local result
        '.SoaBEf',              // News carousel
        '.WlydOe'               // News article
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GoogleVimNavigation();
  });
} else {
  new GoogleVimNavigation();
}

// Re-initialize on page changes (for Google's AJAX navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      new GoogleVimNavigation();
    }, 500);
  }
}).observe(document, { subtree: true, childList: true });