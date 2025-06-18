# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Vim Navigation is a Chrome extension that adds vim-like keyboard navigation to Google search results pages. Users can navigate search results using hjkl keys without touching the mouse.

## Development Commands

Since this is a Chrome extension project, development primarily involves:

1. **Load extension for testing:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" 
   - Click "Load unpacked" and select this directory

2. **Test changes:**
   - Make code changes
   - Go to `chrome://extensions/` and click the refresh icon for this extension
   - Navigate to Google search results to test

## Architecture

### Key Files

- **manifest.json**: Chrome extension configuration defining content scripts, permissions, and metadata
- **content.js**: Main navigation logic that runs on Google search pages
- **styles.css**: Visual styling for focus indicators and transitions

### Navigation Implementation

The extension uses a `GoogleVimNavigation` class that:

1. **Result Detection**: Scans for Google search result links using multiple selectors to handle different Google layouts
2. **Keyboard Handling**: Listens for hjkl keypress events and prevents default browser behavior when appropriate
3. **Focus Management**: Tracks current result index and applies CSS classes for visual feedback
4. **Page Navigation**: Finds and clicks Google's previous/next page buttons

### Key Navigation Functions

- `navigateDown()/navigateUp()`: Move focus between search results (j/k keys)
- `navigatePrevPage()/navigateNextPage()`: Handle pagination (h/l keys)
- `openCurrentResult()`: Navigate to focused result (Enter key)
- `updateSearchResults()`: Refresh result list when page changes

### Google Layout Compatibility

The extension handles multiple Google search result selectors to work across different layouts and localizations. It also re-initializes when Google's AJAX navigation changes the page content.

## Key Behaviors

- Only activates keyboard shortcuts when not in input fields
- Automatically scrolls focused results into view
- Prevents duplicate results in navigation list
- Provides smooth visual transitions for better UX
- Handles both google.com and google.co.jp domains