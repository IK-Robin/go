
# RobinLinks

A free URL shortener hosted on GitHub Pages.

## Features

- Custom URL aliases
- Responsive dashboard
- Link search and management
- Browser draft storage
- JSON export
- Automatic browser redirects
- No backend or database required

## Setup

1. Create a public GitHub repository named `go`.
2. Upload index.html, app.js, 404.html, links.json.
3. Open Settings > Pages.
4. Choose Deploy from a branch.
5. Select main and / (root).
6. Save and wait for deployment.

Website:
https://YOUR_USERNAME.github.io/go/

## Create links

1. Open the dashboard.
2. Enter the destination URL.
3. Add a custom alias or generate one.
4. Click Create Short Link.
5. Click Export JSON.
6. Replace links.json in your GitHub repository.
7. Wait for GitHub Pages deployment.

Example:
https://YOUR_USERNAME.github.io/go/s/google

## Limitations

GitHub Pages is static hosting.

- Browser drafts are not public until published.
- No automatic shared database.
- No built-in click analytics.
- Redirects use a JavaScript-based 404 fallback.
- GitHub Pages may return HTTP 404 before JavaScript redirects.
- Social media previews and some automated clients may fail.
- The dashboard has no authentication.
- Browser drafts can become out of sync across devices.

For production use, consider Cloudflare Workers
with a database or key-value storage.
