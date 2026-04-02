export const PANEL_CSS = `
  #a11y-analyzer-panel,
  #a11y-analyzer-panel *,
  #a11y-analyzer-panel *::before,
  #a11y-analyzer-panel *::after {
    color-scheme: light !important;
    box-sizing: border-box !important;
    text-transform: none !important;
  }
  #a11y-analyzer-panel {

  /* CSS Variables */
  --surface: #FFFFFF;
  --bg-subtle: #F9FAFB;
  --border: #E5E7EB;
  --border-light: #F3F4F6;
  --text-primary: #1F2937;
  --text-secondary: #374151;
  --text-muted: #6B7280;
  --color-error: #DC2626;
  --color-error-bg: #FEF2F2;
  --color-warning: #B45309;
  --color-warning-bg: #FFFBEB;
  --color-info: #1D4ED8;
  --color-info-bg: #EFF6FF;
  --color-success: #15803D;
  --color-success-bg: #F0FDF4;
  --color-accent: #4F46E5;
  --color-accent-bg: #EEF2FF;

    color: #1F2937 !important;
    background-color: #FFFFFF !important;
    line-height: 1.5 !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    text-align: left !important;
  }
  #a11y-analyzer-panel div,
  #a11y-analyzer-panel p,
  #a11y-analyzer-panel h2,
  #a11y-analyzer-panel h3,
  #a11y-analyzer-panel label {
    margin: 0;
    padding: 0;
  }
  #a11y-analyzer-panel span:not([style*="color"]),
  #a11y-analyzer-panel div:not([style*="color"]),
  #a11y-analyzer-panel p:not([style*="color"]),
  #a11y-analyzer-panel h2:not([style*="color"]),
  #a11y-analyzer-panel h3:not([style*="color"]) {
    color: inherit;
  }
  #a11y-analyzer-panel button {
    font-family: inherit !important;
    line-height: 1.5 !important;
  }
  #a11y-analyzer-panel button:disabled {
    cursor: not-allowed !important;
    opacity: 0.5 !important;
  }
  #a11y-analyzer-panel input,
  #a11y-analyzer-panel select {
    font-family: inherit !important;
    line-height: 1.5 !important;
  }
  #a11y-analyzer-panel input::placeholder {
    color: #6B7280 !important;
  }
  #a11y-analyzer-panel code {
    color: #374151 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  }
  #a11y-analyzer-panel a {
    color: #1D4ED8 !important;
    text-decoration: underline !important;
  }
  #a11y-analyzer-panel a:hover {
    color: #1E40AF !important;
  }
  #a11y-analyzer-panel svg {
    color: inherit;
  }
  #a11y-analyzer-panel .acc-header:hover {
    background: #F9FAFB !important;
  }
  #a11y-analyzer-panel [title] {
    position: relative;
  }

  /* Utility Classes */
  .a11y-card {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    padding: 12px 14px !important;
    margin-bottom: 8px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
  }
  .a11y-card:hover {
    border-color: var(--color-accent) !important;
  }
  .a11y-badge {
    padding: 3px 10px !important;
    border-radius: 4px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    line-height: 1.5 !important;
  }
  .a11y-badge-sm {
    padding: 2px 8px !important;
    border-radius: 4px !important;
    font-size: 10px !important;
    font-weight: 600 !important;
  }
  .a11y-scroll-area {
    padding: 14px 16px !important;
    background: var(--bg-subtle) !important;
    overflow-y: auto !important;
    flex: 1 !important;
  }
  .a11y-header-bar {
    padding: 12px 16px !important;
    background: var(--surface) !important;
    border-bottom: 1px solid var(--border) !important;
    display: flex !important;
    gap: 16px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    align-items: center !important;
  }
  .a11y-section-title {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: var(--text-muted) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    margin-bottom: 8px !important;
  }
  .a11y-text-primary { color: var(--text-primary) !important; }
  .a11y-text-secondary { color: var(--text-secondary) !important; }
  .a11y-text-muted { color: var(--text-muted) !important; }
  .a11y-flex-center { display: flex !important; align-items: center !important; }
  .a11y-flex-between { display: flex !important; align-items: center !important; justify-content: space-between !important; }
  .a11y-code {
    font-size: 11px !important;
    color: var(--text-muted) !important;
    background: var(--border-light) !important;
    padding: 1px 6px !important;
    border-radius: 3px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
  }


  .a11y-text-error { color: var(--color-error) !important; }
  .a11y-text-warning { color: var(--color-warning) !important; }
  .a11y-text-success { color: var(--color-success) !important; }
  .a11y-text-info { color: var(--color-info) !important; }
  .a11y-empty-success { text-align: center !important; padding: 24px !important; color: var(--color-success) !important; font-size: 14px !important; font-weight: 500 !important; }
  .a11y-empty-state { text-align: center !important; padding: 24px !important; color: var(--text-muted) !important; font-size: 14px !important; }
  .a11y-card-header { display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 6px !important; }
  .a11y-card-desc { margin: 0 !important; font-size: 13px !important; color: var(--text-secondary) !important; line-height: 1.5 !important; }
  .a11y-card-title { font-size: 12px !important; font-weight: 600 !important; color: var(--text-secondary) !important; }

`;
