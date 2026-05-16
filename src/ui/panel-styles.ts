// Panel CSS injected into the host page for the standalone test fixture (index.html).
// In the popup window mode this file is NOT used — panel.html has its own clean <style> block.
// The !important rules here are still needed to fight host-page CSS in the injected context.
export const PANEL_CSS = `
  :root {
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
  }

  #a11y-analyzer-panel,
  #a11y-analyzer-panel *,
  #a11y-analyzer-panel *::before,
  #a11y-analyzer-panel *::after {
    color-scheme: light !important;
    box-sizing: border-box !important;
    text-transform: none !important;
  }

  #a11y-analyzer-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                 Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    color: #1F2937 !important;
    background-color: #FFFFFF !important;
    line-height: 1.5 !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    text-align: left !important;
  }

  /* Scoped structural resets — only affect layout elements that use flex/grid inside the panel.
     Using class-based scoping avoids nuking ALL divs/paragraphs globally on the host page. */
  #a11y-analyzer-panel .a11y-reset {
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Direct children of scroll area and card containers need the reset applied */
  #a11y-analyzer-panel .a11y-scroll-area > div,
  #a11y-analyzer-panel .a11y-chip-row > *,
  #a11y-analyzer-panel .a11y-stats-strip > *,
  #a11y-analyzer-panel .a11y-toolbar-row > *,
  #a11y-analyzer-panel .a11y-header-bar > * {
    margin: 0 !important;
    padding: 0 !important;
  }

  #a11y-analyzer-panel span:not([style*="color"]),
  #a11y-analyzer-panel div:not([style*="color"]),
  #a11y-analyzer-panel p:not([style*="color"]),
  #a11y-analyzer-panel h2:not([style*="color"]),
  #a11y-analyzer-panel h3:not([style*="color"]) {
    color: inherit;
  }
  #a11y-analyzer-panel button {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                 Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif !important;
    line-height: 1.5 !important;
  }
  #a11y-analyzer-panel button:disabled {
    cursor: not-allowed !important;
    opacity: 0.5 !important;
  }
  #a11y-analyzer-panel input,
  #a11y-analyzer-panel select {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                 Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif !important;
    line-height: 1.5 !important;
  }
  #a11y-analyzer-panel input::placeholder { color: #6B7280 !important; }
  #a11y-analyzer-panel code {
    color: #374151 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  }
  #a11y-analyzer-panel a            { color: #1D4ED8 !important; text-decoration: underline !important; }
  #a11y-analyzer-panel a:hover      { color: #1E40AF !important; }
  #a11y-analyzer-panel svg          { color: inherit; }
  #a11y-analyzer-panel .acc-header:hover { background: #F9FAFB !important; }
  #a11y-analyzer-panel [title]      { position: relative !important; }

  /* ─── Utility Classes ─────────────────────────────────────────────────── */
  #a11y-analyzer-panel .a11y-card {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    padding: 12px 14px !important;
    margin-bottom: 8px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
  }
  #a11y-analyzer-panel .a11y-card:hover { border-color: var(--color-accent) !important; }

  #a11y-analyzer-panel .a11y-badge {
    display: inline-flex !important;
    align-items: center !important;
    padding: 3px 10px !important;
    border-radius: 4px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    line-height: 1.5 !important;
  }
  #a11y-analyzer-panel .a11y-badge-sm {
    display: inline-flex !important;
    align-items: center !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
    font-size: 10px !important;
    font-weight: 600 !important;
  }
  #a11y-analyzer-panel .a11y-panel-title    { font-weight: 700 !important; font-size: 15px !important; letter-spacing: 0.2px !important; color: #1F2937 !important; }
  #a11y-analyzer-panel .a11y-scroll-area    { padding: 14px 16px !important; background: var(--bg-subtle) !important; overflow-y: auto !important; flex: 1 !important; }
  #a11y-analyzer-panel .a11y-header-bar     { padding: 12px 16px !important; background: var(--surface) !important; border-bottom: 1px solid var(--border) !important; display: flex !important; gap: 16px !important; font-size: 13px !important; font-weight: 600 !important; align-items: center !important; }
  #a11y-analyzer-panel .a11y-section-title  { font-size: 12px !important; font-weight: 600 !important; color: var(--text-muted) !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; margin-bottom: 8px !important; }
  #a11y-analyzer-panel .a11y-text-primary   { color: var(--text-primary) !important; }
  #a11y-analyzer-panel .a11y-text-secondary { color: var(--text-secondary) !important; }
  #a11y-analyzer-panel .a11y-text-muted     { color: var(--text-muted) !important; }
  #a11y-analyzer-panel .a11y-flex-center    { display: flex !important; align-items: center !important; }
  #a11y-analyzer-panel .a11y-flex-between   { display: flex !important; align-items: center !important; justify-content: space-between !important; }
  #a11y-analyzer-panel .a11y-code           { font-size: 11px !important; color: var(--text-muted) !important; background: var(--border-light) !important; padding: 1px 6px !important; border-radius: 3px !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important; }
  #a11y-analyzer-panel .a11y-text-error     { color: var(--color-error) !important; }
  #a11y-analyzer-panel .a11y-text-warning   { color: var(--color-warning) !important; }
  #a11y-analyzer-panel .a11y-text-success   { color: var(--color-success) !important; }
  #a11y-analyzer-panel .a11y-text-info      { color: var(--color-info) !important; }
  #a11y-analyzer-panel .a11y-empty-success  { text-align: center !important; padding: 24px !important; color: var(--color-success) !important; font-size: 14px !important; font-weight: 500 !important; }
  #a11y-analyzer-panel .a11y-empty-state    { text-align: center !important; padding: 24px !important; color: var(--text-muted) !important; font-size: 14px !important; }

  @keyframes a11y-spin { to { transform: rotate(360deg); } }
  #a11y-analyzer-panel .a11y-spinner {
    width: 36px !important;
    height: 36px !important;
    border: 3px solid #E5E7EB !important;
    border-top-color: #6366F1 !important;
    border-radius: 50% !important;
    animation: a11y-spin 0.7s linear infinite !important;
  }
  #a11y-analyzer-panel .a11y-card-header { display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 6px !important; }
  #a11y-analyzer-panel .a11y-card-desc   { margin: 0 !important; font-size: 13px !important; color: var(--text-secondary) !important; line-height: 1.5 !important; }
  #a11y-analyzer-panel .a11y-card-title  { font-size: 12px !important; font-weight: 600 !important; color: var(--text-secondary) !important; }

  #a11y-analyzer-panel .a11y-sev-chip {
    padding: 5px 10px !important;
    border: 1.5px solid #D1D5DB !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    cursor: pointer !important;
    background: white !important;
    color: #6B7280 !important;
    font-weight: 600 !important;
    transition: all 0.15s !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  #a11y-analyzer-panel .a11y-issue-card {
    background: var(--node-bg, white) !important;
    border: 1px solid var(--node-border, #E5E7EB) !important;
    border-radius: 8px !important;
    margin-bottom: 8px !important;
    overflow: hidden !important;
    transition: border-color 0.15s !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
  }

  /* Hover and Active/Expanded states via CSS variables */
  #a11y-analyzer-panel .a11y-issue-card:hover,
  #a11y-analyzer-panel .a11y-issue-card.is-expanded,
  #a11y-analyzer-panel .rule-card:hover,
  #a11y-analyzer-panel .rule-card.is-expanded,
  #a11y-analyzer-panel .comp-node:hover,
  #a11y-analyzer-panel .comp-node.is-active,
  #a11y-analyzer-panel .group-node:hover,
  #a11y-analyzer-panel .group-node.is-active,
  #a11y-analyzer-panel .heading-node:hover,
  #a11y-analyzer-panel .heading-node.is-active {
    --node-bg: #FDF2F8;
    --node-border: #FBCFE8;
  }

  /* Keep the body transparent when the card is expanded so it doesn't clash */
  #a11y-analyzer-panel .a11y-issue-card.is-expanded .a11y-card-body {
    background: transparent !important;
    border-top-color: #FBCFE8 !important;
  }

  /* Back Button Hover via CSS variables */
  #a11y-analyzer-panel #btn-back:hover {
    --back-bg: #F3F4F6;
    --back-color: #1F2937;
  }

  /* Pre-screen Audit Button Hover via CSS variables */
  #a11y-analyzer-panel .a11y-audit-btn:hover {
    --btn-border: var(--audit-btn-hover, #6366F1);
    --btn-bg: #FDF2F8;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
  }

  #a11y-analyzer-panel .a11y-card-body {
    padding: 10px 14px !important;
    border-top: 1px solid #F3F4F6 !important;
    background: #FAFAFA !important;
  }
  #a11y-analyzer-panel .a11y-card-chevron { transition: transform 0.2s !important; flex-shrink: 0 !important; color: #6B7280 !important; }

  #a11y-analyzer-panel .a11y-highlight-btn {
    padding: 6px 12px !important;
    background: var(--color-accent-bg) !important;
    border: 1px solid #C7D2FE !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    font-size: 12px !important;
    color: var(--color-accent) !important;
    font-weight: 500 !important;
    transition: all 0.15s !important;
  }
  #a11y-analyzer-panel .a11y-highlight-btn:hover { background: #E0E7FF !important; }

  #a11y-analyzer-panel .a11y-stats-strip {
    padding: 10px 16px !important;
    background: white !important;
    border-bottom: 1px solid var(--border) !important;
    display: flex !important;
    gap: 14px !important;
    flex-wrap: wrap !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    align-items: center !important;
  }

  #a11y-analyzer-panel .a11y-search-input {
    flex: 1 !important;
    min-width: 0 !important;
    padding: 8px 12px !important;
    border: 1px solid #D1D5DB !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    outline: none !important;
    color: #1F2937 !important;
    background: white !important;
    transition: border-color 0.15s !important;
  }
  #a11y-analyzer-panel .a11y-search-input:focus { border-color: var(--color-accent) !important; }

  #a11y-analyzer-panel .a11y-group-tab {
    padding: 6px 14px !important;
    border: 1px solid #D1D5DB !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    cursor: pointer !important;
    background: white !important;
    color: #6B7280 !important;
    font-weight: 500 !important;
    transition: all 0.15s !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
  #a11y-analyzer-panel .a11y-group-tab[data-active="true"] {
    border-color: var(--color-accent) !important;
    background: var(--color-accent-bg) !important;
    color: var(--color-accent) !important;
    font-weight: 600 !important;
  }

  #a11y-analyzer-panel .a11y-chip-row {
    padding: 10px 16px !important;
    background: white !important;
    border-bottom: 1px solid var(--border) !important;
    display: flex !important;
    gap: 6px !important;
    flex-wrap: wrap !important;
    align-items: center !important;
  }
  #a11y-analyzer-panel .a11y-toolbar-row {
    padding: 8px 16px !important;
    background: white !important;
    border-bottom: 1px solid var(--border) !important;
    display: flex !important;
    gap: 8px !important;
    align-items: center !important;
    flex-wrap: wrap !important;
  }

  #a11y-analyzer-panel .a11y-code-block {
    background: #F9FAFB !important;
    border: 1px solid #F3F4F6 !important;
    border-radius: 6px !important;
    padding: 8px 10px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 11px !important;
    color: #374151 !important;
    word-break: break-all !important;
    margin-bottom: 6px !important;
  }
  #a11y-analyzer-panel .a11y-selector-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 11px !important;
    color: #6B7280 !important;
    word-break: break-all !important;
  }

  /* Header icon buttons (export / close) — light theme (white header) */
  #a11y-analyzer-panel .a11y-hdr-btn:hover {
    background: #E5E7EB !important;
    color: #1F2937 !important;
  }
  #a11y-analyzer-panel .a11y-hdr-btn-light:hover {
    background: #E5E7EB !important;
    border-color: #D1D5DB !important;
    color: #1F2937 !important;
  }
  #a11y-analyzer-panel .a11y-hdr-btn-close-light:hover {
    background: #FEE2E2 !important;
    border-color: #FCA5A5 !important;
    color: #B91C1C !important;
  }
  #a11y-analyzer-panel .a11y-hdr-btn-export-popup:hover {
    background: #E5E7EB !important;
    border-color: #D1D5DB !important;
  }

  /* Tooltip on download report button */
  #a11y-analyzer-panel .a11y-tooltip-wrap { display: inline-flex !important; position: relative !important; }
  #a11y-analyzer-panel .a11y-tooltip {
    position: absolute !important;
    top: calc(100% + 6px) !important;
    right: 0 !important;
    background: #1F2937 !important;
    color: #FFFFFF !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    padding: 4px 8px !important;
    border-radius: 5px !important;
    pointer-events: none !important;
    opacity: 0 !important;
    transform: translateY(-3px) !important;
    transition: opacity 0.15s, transform 0.15s !important;
    z-index: 9999 !important;
    line-height: 1.4 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.18) !important;
  }
  #a11y-analyzer-panel .a11y-tooltip::after {
    content: '' !important;
    position: absolute !important;
    bottom: 100% !important;
    right: 10px !important;
    border: 4px solid transparent !important;
    border-bottom-color: #1F2937 !important;
  }
  #a11y-analyzer-panel .a11y-tooltip-wrap:hover .a11y-tooltip,
  #a11y-analyzer-panel .a11y-tooltip-wrap:focus-within .a11y-tooltip {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }



  /* Scorecard export button */
  #a11y-analyzer-panel .a11y-export-scorecard-btn:hover {
    background: #1D4ED8 !important;
  }
`;
