const btn = document.getElementById('btn-run');
const status = document.getElementById('status');

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isRestrictedUrl(url) {
  return !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
    url.startsWith('about:') || url.startsWith('edge://') || url.startsWith('brave://');
}

async function probeTab(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!window.__a11y_analyzer_instance,
    });
    return result?.result === true;
  } catch {
    return false;
  }
}

async function init() {
  const tab = await getActiveTab();

  if (!tab?.id || isRestrictedUrl(tab.url)) {
    btn.textContent = 'Cannot run on this page';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    status.textContent = 'Extension pages are not supported';
    return;
  }

  const isActive = await probeTab(tab.id);

  if (isActive) {
    btn.textContent = 'Show Panel';
    status.textContent = 'Analyzer active!';
    status.classList.add('active');
  } else {
    btn.textContent = 'Activate on this page';
    status.textContent = 'Click to inject analyzer';
  }

  btn.addEventListener('click', async () => {
    try {
      if (isActive) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const panel = document.getElementById('a11y-analyzer-panel');
            if (panel) panel.style.setProperty('display', 'flex', 'important');
          },
        });
      } else {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        });
      }
      status.textContent = 'Analyzer active!';
      status.classList.add('active');
      btn.textContent = 'Show Panel';
    } catch (err) {
      status.textContent = 'Error: ' + err.message;
    }
  });
}

init();
