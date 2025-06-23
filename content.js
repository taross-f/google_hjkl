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
    // Google search result selectors (various layouts)
    const selectors = [
      'div[data-ved] h3 a', // Main organic results
      '.g h3 a', // Standard results
      '.rc h3 a', // Results container
      '.yuRUbf a', // New layout
      '[data-ved] a[href^="/url"]' // Alternative selector
    ];

    this.searchResults = [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.href && !el.href.includes('google.com/search')) {
          this.searchResults.push(el);
        }
      });
    }

    // Remove duplicates based on href
    this.searchResults = this.searchResults.filter((el, index, arr) => 
      arr.findIndex(item => item.href === el.href) === index
    );

    console.log(`Found ${this.searchResults.length} search results`);
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
      element.closest('.g, .yuRUbf, [data-ved]')?.classList.add('vim-nav-result-focused');
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