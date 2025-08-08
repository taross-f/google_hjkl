# Google HJKL Navigation

Navigate Google search results with vim-like hjkl keys.

## CI/CD

Publishing to the Chrome Web Store is automated via GitHub Actions:

- Trigger: publishing a GitHub Release (tag like `v1.2.3`)
- The workflow bumps `manifest.json` version to the tag version, zips the extension and uploads + publishes it.

### Required repository secrets

- `CHROME_EXTENSION_ID`: The extension's ID from the Chrome Web Store dashboard
- `CHROME_CLIENT_ID`: OAuth client ID
- `CHROME_CLIENT_SECRET`: OAuth client secret
- `CHROME_REFRESH_TOKEN`: OAuth refresh token with rights to the Web Store API

### Notes

- The workflow uses `chrome-webstore-upload-cli@3`.
- Ensure the extension has passed all store listing requirements (icons, store listing text, privacy policy, etc.).
