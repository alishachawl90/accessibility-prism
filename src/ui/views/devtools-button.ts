/**
 * Renders the "Show in developer tools" button used by the three Screen Reader
 * views (acc-name, aria-validation, form-labels).
 *
 * The button carries a `data-idx` attribute so the delegated listener in
 * `attachResultsPageListeners` can resolve the correct issue index and call
 * `actions.onShowInDevTools(idx)`.
 */
export function renderDevToolsButton(idx: number): string {
  return `<button
    class="a11y-devtools-btn"
    data-idx="${idx}"
    style="
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      margin-top: 10px !important;
      padding: 5px 10px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      color: #374151 !important;
      background: #F3F4F6 !important;
      border: 1px solid #D1D5DB !important;
      border-radius: 5px !important;
      cursor: pointer !important;
      transition: background 0.15s !important;
    "
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
    Show in developer tools
  </button>`;
}
