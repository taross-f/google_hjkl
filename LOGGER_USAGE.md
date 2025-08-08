# Logger Usage

Google HJKL Navigation uses a lightweight logger with configurable log levels.

## Log Levels

- **0 - OFF**: No logging
- **1 - ERROR**: Only errors
- **2 - WARN**: Warnings and errors (default for production)
- **3 - INFO**: Info, warnings, and errors
- **4 - DEBUG**: All logs including debug information

## Default Behavior

- **Production**: Log level 2 (WARN) - only shows warnings and errors
- **Development**: Can be changed via browser console

## Enabling Debug Mode

Open browser console and run:
```javascript
Logger.enableDebug()
```

This will:
- Set log level to DEBUG (4)
- Show all log messages including detailed navigation info
- Persist the setting in localStorage

## Disabling All Logging

```javascript
Logger.disableLogging()
```

## Manual Log Level Control

```javascript
// Set specific log level (0-4)
Logger.level = 3; // INFO level
localStorage.setItem('googleVimNavLogLevel', '3');
```

## Log Message Format

All log messages are prefixed with `[GoogleVimNav]` for easy identification:

```
[GoogleVimNav] Found 10 search results (3 YouTube)
[GoogleVimNav] Page change detected, reinitializing navigation...
```

## Log Categories

- **ERROR**: Critical failures
- **WARN**: Issues that don't break functionality
- **INFO**: Important state changes (page navigation, initialization)
- **DEBUG**: Detailed operational information (search results found, position restoration)

## For Development

To see debug information during development:
1. Open Google search page
2. Open DevTools Console
3. Run: `Logger.enableDebug()`
4. Navigate search results to see detailed logs

## For Production

Default log level (WARN) only shows important issues without cluttering the console.
Users won't see debug information unless they explicitly enable it.