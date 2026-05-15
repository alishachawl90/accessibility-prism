/**
 * Background service worker for Accessibility Prism v3.
 *
 * Handles extension icon clicks:
 * 1. If the panel popup is already open, focus it.
 * 2. Otherwise, inject content.js into the active tab and open the popup window.
 *
 * The popup window communicates with content.js via chrome.runtime.connect (port: 'prism-panel').
 */

const PANEL_URL_SUFFIX = 'panel.html';
let panelWindowId = null;

chrome.action.onClicked.addListener(async (tab) => {
  // If we already have a panel window, just focus it
  if (panelWindowId !== null) {
    try {
      await chrome.windows.update(panelWindowId, { focused: true });
      return;
    } catch {
      // Window was closed externally — clear the reference and re-open
      panelWindowId = null;
    }
  }

  // Inject the content script into the active tab (guard against already-injected)
  if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
    } catch (err) {
      // Content script may already be injected — that's fine
      console.log('[Prism background] content.js injection skipped:', err?.message);
    }
  }

  // Open the detached popup window
  const panelUrl = chrome.runtime.getURL(PANEL_URL_SUFFIX);
  const win = await chrome.windows.create({
    url: panelUrl,
    type: 'popup',
    width: 480,
    height: 760,
    focused: true,
  });

  panelWindowId = win.id ?? null;
});

// Track when the panel window is closed so we re-open fresh next time
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) {
    panelWindowId = null;
  }
});
