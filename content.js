// Prevent multiple script execution
if (window.googleVimNavigationLoaded) {
  Logger.info("Google Vim Navigation already loaded, skipping...");
} else {
  window.googleVimNavigationLoaded = true;

  // Lightweight logger for Chrome extension
  const Logger = {
    // Log levels: 0=OFF, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
    level: 2, // Default to WARN level for production

    // Set from extension storage or manifest
    init() {
      // Try to get log level from localStorage (for development)
      const savedLevel = localStorage.getItem("googleVimNavLogLevel");
      if (savedLevel !== null) {
        this.level = parseInt(savedLevel, 10);
      }
    },

    error(...args) {
      if (this.level >= 1) console.error("[GoogleVimNav]", ...args);
    },

    warn(...args) {
      if (this.level >= 2) console.warn("[GoogleVimNav]", ...args);
    },

    info(...args) {
      if (this.level >= 3) console.info("[GoogleVimNav]", ...args);
    },

    debug(...args) {
      if (this.level >= 4) console.log("[GoogleVimNav]", ...args);
    },

    // Convenience method to enable debug mode
    enableDebug() {
      this.level = 4;
      localStorage.setItem("googleVimNavLogLevel", "4");
      this.info("Debug logging enabled");
    },

    // Convenience method to disable logging
    disableLogging() {
      this.level = 0;
      localStorage.setItem("googleVimNavLogLevel", "0");
    },
  };

  // Initialize logger
  Logger.init();

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
      const previousResultHref =
        previousIndex >= 0 && this.searchResults[previousIndex]
          ? this.searchResults[previousIndex].href
          : null;

      // Clear previous results
      this.searchResults = [];
      this.currentIndex = -1;

      // Wait a bit if search results container is not ready
      const searchContainer = document.querySelector(
        "#search, #rso, .srg, [data-async-context]"
      );
      if (!searchContainer) {
        Logger.debug("Search container not ready, will retry...");
        return false;
      }

      // Focus on main title links - using more flexible selectors
      const selectors = [
        // Standard search results - main title links
        ".g h3 a", // Most common: h3 title links
        ".yuRUbf a", // New layout primary links
        ".tF2Cxc h3 a", // Alternative structure
        ".rc h3 a", // Results container

        // Image search results
        ".isv-r a", // Image result links
        ".rg_l", // Image gallery links
        ".islir", // Image result items
        "[data-ved] a[data-ri]", // Data-ved image links with data-ri
        ".w2tnNd", // New layout image links
        ".VFACy a", // Image result containers
        ".Q4LuWd a", // Image thumbnail links

        // Video and special content (including YouTube)
        ".g-blk h3 a", // Video block titles
        ".video-result h3 a", // Video results
        '.g .yuRUbf a[href*="youtube.com"]', // YouTube links in standard results
        '.g h3 a[href*="youtube.com"]', // YouTube title links
        '.g a[href*="youtube.com"]:has(h3)', // Links containing h3 elements
        '[data-ved] a[href*="youtube.com"]', // Data-ved containers with YouTube links
        '.video-carousel a[href*="youtube.com"]', // Video carousel items
        '.g .T47uwc a[href*="youtube.com"]', // Video thumbnail containers
        '.g .qPKGkd a[href*="youtube.com"]', // Video result containers

        // News results - enhanced selectors
        ".SoaBEf h3 a", // News carousel
        ".WlydOe h3 a", // News articles
        ".ftSUBd a", // News article links
        ".Y3v8qd a", // News card links
        ".xTFaxe a", // News result links
        ".tHmfQe a", // News article titles
        ".mCBkyc h3 a", // News container titles
        ".dbsr a", // News story links

        // Knowledge panel and rich results
        ".kp-blk h3 a", // Knowledge panel
        ".mod h3 a", // Module results

        // Fallback selectors for main links
        "[data-ved] h3 a", // Data-ved containers with h3
        ".g > div > div > div > a[href]:has(h3)", // Direct structure
      ];

      this.searchResults = [];
      // Use element-based deduplication to avoid skipping results that share the same URL
      const processedElements = new Set();

      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            // Basic filtering for valid external links
            if (
              el.href &&
              !el.href.includes("google.com/search") &&
              !el.href.includes("accounts.google.com") &&
              !el.href.includes("support.google.com") &&
              !el.href.includes("policies.google.com") &&
              !el.href.includes("maps.google.com/maps?") &&
              !el.href.startsWith("javascript:") &&
              !el.href.startsWith("#") &&
              el.href.trim() !== "" &&
              !processedElements.has(el)
            ) {
              // Check if this is likely a main title link
              const isInH3 = el.closest("h3") !== null;
              const hasValidParent =
                el.closest(
                  ".MjjYud, .g, .yuRUbf, .tF2Cxc, .g-blk, .SoaBEf, .WlydOe, .kp-blk, .mod, .T47uwc, .qPKGkd, .isv-r, .VFACy, .Q4LuWd, .ftSUBd, .Y3v8qd, .xTFaxe, .mCBkyc, .dbsr"
                ) !== null;
              const hasText =
                el.textContent && el.textContent.trim().length > 0;
              const isYouTubeLink = el.href.includes("youtube.com");
              const isImageResult =
                el.closest(".isv-r, .VFACy, .Q4LuWd") !== null;
              const isNewsResult =
                el.closest(
                  ".SoaBEf, .WlydOe, .ftSUBd, .Y3v8qd, .xTFaxe, .mCBkyc, .dbsr"
                ) !== null;

              // Check visibility
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              const isVisible =
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                el.offsetParent !== null;

              // Accept if it's in h3, has valid parent, is a special result type, or is a YouTube link
              // For image results, we're more lenient with text requirements
              const textRequirementMet = isImageResult
                ? hasText
                : hasText && el.textContent.trim().length > 2;

              if (
                (isInH3 ||
                  hasValidParent ||
                  isImageResult ||
                  isNewsResult ||
                  isYouTubeLink) &&
                textRequirementMet &&
                isVisible
              ) {
                this.searchResults.push(el);
                processedElements.add(el);
              }
            }
          });
        } catch (e) {
          console.warn(`Selector failed: ${selector}`, e);
        }
      }

      // Sort results by their position on the page
      this.searchResults.sort((a, b) => {
        if (a === b) return 0;
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        // Fallback to geometry if DOM position is indeterminate
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        const topDelta = rectA.top - rectB.top;
        if (topDelta !== 0) return topDelta;
        return rectA.left - rectB.left;
      });

      const youtubeCount = this.searchResults.filter((el) =>
        el.href.includes("youtube.com")
      ).length;
      const imageCount = this.searchResults.filter((el) =>
        el.closest(".isv-r, .VFACy, .Q4LuWd")
      ).length;
      const newsCount = this.searchResults.filter((el) =>
        el.closest(
          ".SoaBEf, .WlydOe, .ftSUBd, .Y3v8qd, .xTFaxe, .mCBkyc, .dbsr"
        )
      ).length;
      Logger.debug(
        `Found ${this.searchResults.length} search results (${youtubeCount} YouTube, ${imageCount} Images, ${newsCount} News)`
      );

      // Try to restore previous position
      if (previousResultHref && this.searchResults.length > 0) {
        const restoredIndex = this.searchResults.findIndex(
          (result) => result.href === previousResultHref
        );
        if (restoredIndex !== -1) {
          this.currentIndex = restoredIndex;
          Logger.debug(
            `Restored navigation position to index ${restoredIndex}`
          );
          // Apply focus to restored position
          setTimeout(() => this.addFocus(), 100);
        } else if (previousIndex < this.searchResults.length) {
          // If exact URL not found, try to restore approximate position
          this.currentIndex = Math.min(
            previousIndex,
            this.searchResults.length - 1
          );
          Logger.debug(
            `Restored approximate navigation position to index ${this.currentIndex}`
          );
          setTimeout(() => this.addFocus(), 100);
        }
      }

      // Debug information about found results
      if (this.searchResults.length === 0) {
        Logger.debug("No search results found, checking DOM structure...");
        const debugSelectors = [".g", ".yuRUbf", "h3 a", "[data-ved]"];
        debugSelectors.forEach((sel) => {
          const count = document.querySelectorAll(sel).length;
          Logger.debug(`${sel} found ${count} elements`);
        });
      }

      return this.searchResults.length > 0;
    }

    attachKeyboardListeners() {
      // Store the handler reference so we can remove it later
      this.keydownHandler = (e) => {
        // Only activate on first keypress of j, k, h, l, or Enter
        if (["KeyJ", "KeyK", "KeyH", "KeyL", "Enter"].includes(e.code)) {
          // Prevent default browser behavior
          if (
            e.target.tagName.toLowerCase() !== "input" &&
            e.target.tagName.toLowerCase() !== "textarea" &&
            !e.target.isContentEditable
          ) {
            this.handleKeypress(e);
          }
        }
      };

      document.addEventListener("keydown", this.keydownHandler);
    }

    handleKeypress(e) {
      switch (e.code) {
        case "KeyJ":
          e.preventDefault();
          this.navigateDown();
          break;
        case "KeyK":
          e.preventDefault();
          this.navigateUp();
          break;
        case "KeyH":
          e.preventDefault();
          this.navigatePrevPage();
          break;
        case "KeyL":
          // Don't handle Cmd+L (or Ctrl+L on Windows/Linux)
          if (e.metaKey || e.ctrlKey) {
            return; // Let Chrome handle the default behavior
          }
          e.preventDefault();
          this.navigateNextPage();
          break;
        case "Enter":
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
        this.currentIndex = Math.min(
          this.currentIndex + 1,
          this.searchResults.length - 1
        );
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
      const prevButton = document.querySelector(
        '#pnprev, a[aria-label*="Previous"], a[aria-label*="前"]'
      );
      if (
        prevButton &&
        !prevButton.getAttribute("aria-disabled") &&
        prevButton.style.display !== "none"
      ) {
        prevButton.click();
      }
    }

    navigateNextPage() {
      const nextButton = document.querySelector(
        '#pnnext, a[aria-label*="Next"], a[aria-label*="次"]'
      );
      if (nextButton && !nextButton.getAttribute("aria-disabled")) {
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

        // Find the appropriate parent container for main results only
        // Prefer tighter inner cards to avoid visual overlap with next items
        const parentSelectors = [
          ".g", // Standard result container (precise card)
          ".tF2Cxc", // Result inner wrapper
          ".yuRUbf", // New layout container around title
          ".hlcw0c", // Common result card wrapper
          ".N54PNb", // Alternative card wrapper
          ".MjjYud", // Outer Google result container (fallback only)
          ".g-blk", // Block container (videos)
          ".rGhul", // Video carousel item
          ".kp-blk", // Knowledge panel

          // Image search containers
          ".isv-r", // Image result container
          ".VFACy", // Image container
          ".Q4LuWd", // Image thumbnail container

          // News search containers
          ".SoaBEf", // News carousel
          ".WlydOe", // News article
          ".mCBkyc", // News container
          ".ftSUBd", // News article container
          ".Y3v8qd", // News card container
          ".xTFaxe", // News result container
          ".dbsr", // News story container
        ];

        // Try each selector to find the closest parent
        let parentContainer = null;
        for (const selector of parentSelectors) {
          const parent = element.closest(selector);
          if (parent) {
            parentContainer = parent;
            break;
          }
        }

        // If no specific parent found, try to find the nearest block-level ancestor
      if (!parentContainer) {
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const display = window.getComputedStyle(parent).display;
            if (
              display === "block" ||
              display === "flex" ||
              display === "grid"
            ) {
              parentContainer = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }

        // Apply focus styles to the container so auxiliary chips (PDF, translate, menu) are included
        if (parentContainer) {
        parentContainer.classList.add("vim-nav-result-focused");
        parentContainer.classList.add("vim-nav-focused");
        // Avoid overlap: constrain to the card's padding box
        parentContainer.style.overflow = parentContainer.style.overflow || "hidden";
        } else {
          // Fallback to link element
          element.classList.add("vim-nav-focused");
        }
      }
    }

    removeFocus() {
      document
        .querySelectorAll(".vim-nav-focused, .vim-nav-result-focused")
        .forEach((el) => {
          el.classList.remove("vim-nav-focused", "vim-nav-result-focused");
        });
    }

    scrollToCurrentResult() {
      if (this.currentIndex >= 0 && this.searchResults[this.currentIndex]) {
        const element = this.searchResults[this.currentIndex];
        const container =
          element.closest(".vim-nav-focused, .vim-nav-result-focused") ||
          element;
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Scroll if element is not visible or too close to edges
        if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
          container.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    addCustomStyles() {
      if (document.getElementById("vim-nav-styles")) return;

      const style = document.createElement("style");
      style.id = "vim-nav-styles";
      style.textContent = `
      .vim-nav-focused {
        outline: none !important;
        box-shadow: 0 0 0 2px #4285f4 inset !important;
        border-radius: 8px !important;
        background-color: rgba(66, 133, 244, 0.1) !important; /* revert tone */
        overflow: clip !important; /* prevent bleed without affecting scrollbars */
        position: relative !important;
      }
      
      .vim-nav-result-focused {
        background-color: rgba(66, 133, 244, 0.05) !important; /* revert tone */
        border-radius: 8px !important;
        box-shadow: 0 0 0 1px rgba(66, 133, 244, 0.2) inset !important; /* match original intensity */
        overflow: clip !important;
      }
    `;
      document.head.appendChild(style);
    }

    destroy() {
      // Clean up event listeners
      if (this.keydownHandler) {
        document.removeEventListener("keydown", this.keydownHandler);
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
      Logger.debug("Initialization already in progress, skipping...");
      return;
    }

    isInitializing = true;
    Logger.debug(`Attempting initialization ${new Date()}`);

    // Destroy existing instance if it exists
    if (navigationInstance) {
      navigationInstance.destroy();
      navigationInstance = null;
    }

    // Create new instance
    navigationInstance = new GoogleVimNavigation();

    // Check if initialization was successful
    if (navigationInstance.searchResults.length === 0 && retryCount < 3) {
      Logger.info(
        `No search results found, retrying initialization (attempt ${
          retryCount + 1
        }/3)...`
      );
      setTimeout(() => {
        isInitializing = false; // Reset flag before retry
        initializeNavigation(retryCount + 1);
      }, 500 * (retryCount + 1)); // Longer delays
    } else {
      if (navigationInstance.searchResults.length === 0) {
        Logger.warn(
          "Failed to find search results after 3 attempts. Check if this is a search results page."
        );
      }
      isInitializing = false; // Reset flag after completion
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavigation);
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
    const hasSearchMutation = mutations.some((mutation) => {
      const target = mutation.target;
      // Only react to major container changes, not minor text/attribute changes
      return (
        mutation.type === "childList" &&
        (target.id === "search" ||
          target.id === "rso" ||
          target.classList?.contains("srg"))
      );
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
        Logger.info("Page change detected, reinitializing navigation...");
        initializeNavigation();
        // Reset flag after initialization
        setTimeout(() => {
          isReinitializing = false;
        }, 1000);
      }, 800); // Slightly longer delay to ensure DOM is ready
    }
  });

  // Observe for changes in the main content area
  pageChangeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });
} // End of if (!window.googleVimNavigationLoaded)
