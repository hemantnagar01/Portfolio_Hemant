# /fonts — Font Assets

This folder is reserved for locally-hosted font files.

## Fonts in Use

All fonts are currently loaded from CDN. To self-host for performance,
download and place the WOFF2 files here, then update the @font-face rules
in `css/typography.css`.

### Fontshare (https://www.fontshare.com)
- **Cabinet Grotesk** — weights: 200 (ExtraLight), 400 (Regular), 700 (Bold), 800 (ExtraBold)
  - Used for: `.t-hero`, `.t-display`, `.t-heading`, `.nav-logo`, `.mobile-nav-links`
  - Download: https://www.fontshare.com/fonts/cabinet-grotesk

- **Satoshi** — weights: 400 (Regular), 500 (Medium), 700 (Bold)
  - Used for: `.t-subhead`, `.t-body`, `.t-small`, `.t-label`, body text
  - Download: https://www.fontshare.com/fonts/satoshi

### Google Fonts (https://fonts.google.com)
- **JetBrains Mono** — weights: 400 (Regular), 500 (Medium)
  - Used for: `.t-mono`, `#loader-counter`, technical/code text
  - Download: https://fonts.google.com/specimen/JetBrains+Mono

## Self-Hosting @font-face Template

```css
@font-face {
  font-family: 'Cabinet Grotesk';
  src: url('../fonts/CabinetGrotesk-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```
