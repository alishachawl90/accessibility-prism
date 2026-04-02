import { escHtml } from '../../utils/escape';
import { renderNavBar } from './helpers';

export function renderManualTracking(trail: Element[]): string {
  let html = renderNavBar('Manual Keyboard Test', true, 'Back');

  html += `
    <div style="padding: 16px; background: white; border-bottom: 1px solid #E5E7EB; text-align: center;">
      <p style="color: #6B7280; font-size: 13px; margin: 0 0 12px 0;">
        Press <strong>Tab</strong> to navigate. Numbered arrows show your focus order in real time.
      </p>
      <div style="display: flex; gap: 8px; justify-content: center;">
        <span id="manual-counter" style="background: #EEF2FF; color: #6366F1; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
          ${trail.length} steps
        </span>
        <button id="btn-reset-trail" style="padding: 4px 12px; border: 1px solid #FCA5A5; border-radius: 12px; background: #FEF2F2; color: #DC2626; font-size: 12px; cursor: pointer; font-weight: 500;">
          Reset
        </button>
        <button id="btn-stop-manual" style="padding: 4px 12px; border: 1px solid #D1D5DB; border-radius: 12px; background: #F3F4F6; color: #374151; font-size: 12px; cursor: pointer; font-weight: 500;">
          Stop
        </button>
      </div>
    </div>
  `;

  html += `<div id="manual-trail-log" style="padding: 8px 16px; background: #F9FAFB; overflow-y: auto; flex: 1;">`;
  html += buildTrailLogHtml(trail);
  html += `</div>`;
  return html;
}

export function buildTrailLogHtml(trail: Element[]): string {
  if (trail.length === 0) {
    return `<div style="text-align: center; padding: 20px; color: #6B7280; font-size: 13px;">Start pressing Tab to record your navigation trail...</div>`;
  }

  let html = '';
  trail.forEach((el, idx) => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 40) || '';
    const ariaLabel = el.getAttribute('aria-label');
    const label = ariaLabel || text || tag;

    html += `
      <div style="display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #F3F4F6; font-size: 12px;">
        <span style="background: #6366F1; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">
          ${idx + 1}
        </span>
        <span style="color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
          <code style="background: #F3F4F6; padding: 1px 4px; border-radius: 3px; font-size: 11px;">${tag}</code>
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
      btn.style.background = '#E5E7EB';
      btn.style.cursor = 'default';
    }
  });
}
