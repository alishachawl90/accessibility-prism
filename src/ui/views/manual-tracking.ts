import { escHtml } from '../../utils/escape';
import { renderNavBar } from './helpers';

/** Unified trail entry type — supports both live Elements (standalone mode) and serialized refs (popup mode). */
export type TrailEntry = Element | { tag: string; label: string; selector: string; snippet: string; index: number };

function trailEntryTag(entry: TrailEntry): string {
  if (entry instanceof Element) return entry.tagName.toLowerCase();
  return entry.tag;
}

function trailEntryLabel(entry: TrailEntry): string {
  if (entry instanceof Element) {
    return (entry.getAttribute('aria-label') || entry.textContent?.trim().substring(0, 40) || entry.tagName.toLowerCase());
  }
  return entry.label;
}

function trailEntrySelector(entry: TrailEntry): string {
  if (entry instanceof Element) {
    if (entry.id) return `#${entry.id}`;
    return entry.tagName.toLowerCase();
  }
  return entry.selector;
}

export function renderManualTracking(trail: TrailEntry[], started: boolean): string {
  let html = renderNavBar('Manual Keyboard Test', true, 'Back');

  if (!started) {
    html += `
      <div style="display:flex !important;flex-direction:column !important;align-items:center !important;
                  justify-content:center !important;padding:32px 24px !important;gap:16px !important;
                  text-align:center !important;flex:1 !important;">
        <div style="width:56px !important;height:56px !important;background:#EEF2FF !important;
                    border-radius:50% !important;display:flex !important;align-items:center !important;
                    justify-content:center !important;font-size:26px !important;">⌨️</div>
        <div style="font-size:16px !important;font-weight:700 !important;color:#1F2937 !important;">
          Manual Keyboard Testing
        </div>
        <div style="font-size:13px !important;color:#6B7280 !important;max-width:280px !important;line-height:1.6 !important;">
          Click <strong>Start Recording</strong>, then use the <strong>Tab</strong> key to navigate the page.
          Numbered arrows show your focus order in real time.
        </div>
        <ul style="list-style:none !important;margin:0 !important;padding:0 !important;
                   text-align:left !important;font-size:12px !important;color:#6B7280 !important;
                   display:flex !important;flex-direction:column !important;gap:6px !important;">
          <li>🔵 &nbsp;Tab moves focus forward</li>
          <li>🔵 &nbsp;Shift+Tab moves focus backward</li>
          <li>🔴 &nbsp;Press <strong>Esc</strong> or click Stop to finish</li>
        </ul>
        <button id="btn-start-recording"
          style="margin-top:8px !important;padding:10px 28px !important;background:#4F46E5 !important;
                 color:white !important;border:none !important;border-radius:8px !important;
                 font-size:14px !important;font-weight:600 !important;cursor:pointer !important;">
          Start Recording
        </button>
      </div>
    `;
    return html;
  }

  html += `
    <div style="padding: 16px !important; background: white !important; border-bottom: 1px solid #E5E7EB !important; text-align: center !important;">
      <p style="color: #6B7280 !important; font-size: 13px !important; margin: 0 0 12px 0 !important;">
        Press <strong>Tab</strong> to navigate. Numbered arrows show your focus order in real time.<br>
        <span style="font-size:11px !important;color:#9CA3AF !important;">Press <strong>Esc</strong> on the page to stop and return here.</span>
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

export function buildTrailLogHtml(trail: TrailEntry[]): string {
  if (trail.length === 0) {
    return `<div style="text-align: center !important; padding: 20px !important; color: #6B7280 !important; font-size: 13px !important;">Start pressing Tab to record your navigation trail...</div>`;
  }

  let html = '';
  trail.forEach((entry, idx) => {
    const tag = trailEntryTag(entry);
    const label = trailEntryLabel(entry);
    const selector = trailEntrySelector(entry);

    html += `
      <div style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 6px 0 !important; border-bottom: 1px solid #F3F4F6 !important; font-size: 12px !important;">
        <span style="background: #6366F1 !important; color: white !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 700 !important; font-size: 11px !important; flex-shrink: 0 !important;">
          ${idx + 1}
        </span>
        <span style="color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important;">
          <code style="background: #F3F4F6 !important; padding: 1px 4px !important; border-radius: 3px !important; font-size: 11px !important;">${escHtml(tag)}</code>
          ${escHtml(label.substring(0, 50))}
        </span>
        <button
          class="a11y-highlight-btn"
          data-trail-selector="${escHtml(selector)}"
          style="padding: 3px 8px !important; font-size: 11px !important;"
          title="Highlight this element on the page"
        >Highlight</button>
      </div>
    `;
  });
  return html;
}

export function updateManualTrailLog(trail: TrailEntry[]): void {
  const counter = document.getElementById('manual-counter');
  if (counter) counter.textContent = `${trail.length} steps`;

  const log = document.getElementById('manual-trail-log');
  if (log) {
    log.innerHTML = buildTrailLogHtml(trail);
    log.scrollTop = log.scrollHeight;
  }
}

export function attachManualListeners(container: HTMLElement, actions: {
  onBeginRecording?: () => void;
  onReset: () => void;
  onStop: () => void;
  onBack: () => void;
  onHighlightTrailEntry?: (selector: string) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());
  container.querySelector('#btn-start-recording')?.addEventListener('click', () => actions.onBeginRecording?.());
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

  // Highlight button delegation — present on each trail row (tab-stop-highlight feature)
  if (actions.onHighlightTrailEntry) {
    const onHL = actions.onHighlightTrailEntry;
    container.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-trail-selector]') as HTMLElement | null;
      if (!btn) return;
      const sel = btn.getAttribute('data-trail-selector');
      if (sel) onHL(sel);
    });
  }
}
