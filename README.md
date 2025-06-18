# Google HJKL Navigation

A Chrome extension that adds vim-like keyboard navigation to Google search results pages. Navigate search results using hjkl keys without touching the mouse.

## Features

- **j**: Move focus down to next search result
- **k**: Move focus up to previous search result  
- **Enter**: Open the currently focused search result
- **h**: Navigate to previous page of results
- **l**: Navigate to next page of results

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select this project folder
5. The extension will be loaded and ready to use

## Usage

1. Perform a Google search
2. Use the following keyboard shortcuts on the search results page:
   - `j` / `k` to navigate up and down between search results
   - `Enter` to open the selected result
   - `h` / `l` to navigate between result pages

## Supported Sites

- google.com
- google.co.jp

## Important Notes

- Keyboard shortcuts are disabled when focus is in input fields (search box, etc.)
- Only works on Google search results pages
- Automatically activates after search results load
- Visual focus indicators help you track your current position

## Development

### Testing Changes

1. Make code changes
2. Go to `chrome://extensions/` and click the reload button for this extension
3. Test functionality on Google search results pages

### File Structure

- `manifest.json`: Extension configuration and permissions
- `content.js`: Main navigation logic and keyboard handling
- `styles.css`: Visual styling for focus indicators

## License

MIT License