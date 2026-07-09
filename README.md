# ICE2026 — Web

Static frontend for ICE2026, served via GitHub Pages at https://ice2k26.github.io/

- No framework, no build step: `index.html` + vanilla JS hash-router.
- Design tokens from the [AHLab brand kit](https://cdn.ahlab.org/) (`css/theme.css`).
- Icons: Font Awesome Free. Fonts: Neue Haas Grotesk (Adobe Fonts) with system fallbacks.
- Backend: Google Apps Script (see the `ice2026-backend` repo). Endpoints configured in `js/config.js`.

## Local development

```bash
python3 -m http.server 4870
# open http://localhost:4870
```

Sign-in works from localhost too (the auth broker allows `http://localhost:*` redirects).
