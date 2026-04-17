import { escHtml } from '../../utils/escape';
import { renderNavBar } from './helpers';

export function renderManualTracking(trail: Element[]): string {
  let html = renderNavBar('Manual Keyboard Test', true, 'Back');

  html += `
    <div style="padding: 16px !important; background: white !important; border-bottom: 1px solid #E5E7EB !important; text-align: center !important;">
      <p style="color: #6B7280 !important; font-size: 13px !important; margin: 0 0 12px 0 !important;">
        Press <strong>Tab</strong> to navigate. Numbered arrows show your focus order in real time.
      </p>
      <div style="display: flex !important; gap: 8px !important; justify-content: center !important;">
        <span id="manual-counter" style="background: #EEF2FF !important; color: #6366F1 !important; padding: 4px 12px !important; border-radius: 12px !important; font-size: 13px !important; font-weight: 600 !important;">
          ${trail.length} steps
        </span>
        <button id="btn-reset-trail" style="padding: 4px 12px !important; border: 1px solid #FCA5A5 !important; border-radius: 12px !important; background: #FEF2F2 !important; color: #DC2626 !important; font-size: 12px !important; cursor: pointer !important; font-weight: 500 !important;">
          Reset
        </button>
        <button id="btn-stop-manual" style="padding: 4px 12px !important; border: 1px solid #D1D5DB !important; border-radius: 12px !important; background: #F3F4F6 !important; color: #374151 !important; font-size: 12px !important; cursor: pointer !important; font-weight: 500 !important;">
          Stop
        </button>
      </div>
    </div>
  `;

  html += `<div id="manual-trail-log" style="padding: 8px 16px !important; background: #F9FAFB !important; overflow-y: auto !important; flex: 1 !important;">`;
  html += buildTrailLogHtml(trail);
  html += `</div>`;
  return html;
}

export function buildTrailLogHtml(trail: Element[]): string {
  if (trail.length === 0) {
    return `<div style="text-align: center !important; padding: 20px !important; color: #6B7280 !important; font-size: 13px !important;">Start pressing Tab to record your navigation trail...</div>`;
  }

  let html = '';
  trail.forEach((el, idx) => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 40) || '';
    const ariaLabel = el.getAttribute('aria-label');
    const label = ariaLabel || text || tag;

    html += `
      <div style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 6px 0 !important; border-bottom: 1px solid #F3F4F6 !important; font-size: 12px !important;">
        <span style="background: #6366F1 !important; color: white !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 700 !important; font-size: 11px !important; flex-shrink: 0 !important;">
          ${idx + 1}
        </span>
        <span style="color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important;">
          <code style="background: #F3F4F6 !important; padding: 1px 4px !important; border-radius: 3px !important; font-size: 11px !important;">${tag}</code>
          ${escHtml(label.substring(0, 50))}
        </span>
      </div>
    `;
  });
  return html;
}

export function updateManualTrailLog(trail: Element[]): void {
  const counter = document.getElementById('manual-counter');
  if (counter) counter.textContent = `${trail.length} steps`;

  const log = document.getElementById('manual-trail-log');
  if (log) {
    log.innerHTML = buildTrailLogHtml(trail);
    log.scrollTop = log.scrollHeight;
  }
}

export function attachManualListeners(container: HTMLElement, actions: {
  onReset: () => void;
  onStop: () => void;
  onBack: () => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());
  container.querySelector('#btn-reset-trail')?.addEventListener('click', () => actions.onReset());
  container.querySelector('#btn-stop-manual')?.addEventListener('click', () => {
    actions.onStop();
    const btn = container.querySelector('#btn-stop-manual') as HTMLElement;
    if (btn) {
      btn.textContent = 'Stopped';
      btn.style.setProperty('background', '#E5E7EB', 'important');
      btn.style.setProperty('cursor', 'default', 'important');
    }
  });
}
