// DevTools page for Accessibility Prism
// This script runs automatically in the background when DevTools is open.

// Listen for messages from the popup/background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEVTOOLS_INSPECT' && message.selector) {
    // We execute `inspect(element)` in the context of the inspected window.
    // The content script must have added the unique ID to the element before sending this.
    chrome.devtools.inspectedWindow.eval(
      `(function() {
         var el = document.querySelector("${message.selector}");
         if (el) {
           inspect(el);
           // We can optionally clean up the ID if it was temporary, 
           // but the content script handles cleanup if needed.
         } else {
           console.warn("[Prism] Could not find element to inspect: ${message.selector}");
         }
      })()`
    );
  }
});
