import type { AccNameEntry } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar } from './helpers';
export function renderReadingOrderResults(entries: AccNameEntry[]): string {
  let html = renderNavBar('Reading Order', true, 'Back');

  html += `
    <div class="a11y-header-bar">
      <span class="a11y-text-secondary">${entries.length} significant elements</span>
      <span class="a11y-text-info">DOM order markers drawn on page</span>
    </div>
  `;

  html += `
    <div style="padding: 10px 16px !important; background: #EFF6FF !important; border-bottom: 1px solid #BFDBFE !important; font-size: 12px !important; color: #1E40AF !important; line-height: 1.5 !important;">
      Numbered markers show the order a screen reader reads the page. Check for elements that appear in a different visual position than their DOM order.
    </div>
  `;

  html += `<div id="scroll-area" style="padding: 10px 16px !important; background: #F9FAFB !important; overflow-y: auto !important; flex: 1 !important;">`;

  entries.forEach((entry, idx) => {
    const isErr = entry.severity === 'error';
    const tag = entry.element.tagName.toLowerCase();
    html += `
      <div class="ro-card" data-idx="${idx}" style="padding: 8px 10px !important; margin-bottom: 4px !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; background: white !important; border: 1px solid #E5E7EB !important; display: flex !important; align-items: center !important; gap: 8px !important; transition: border-color 0.15s !important;">
        <span style="width: 28px !important; height: 28px !important; border-radius: 50% !important; background: #5C6BC0 !important; color: white !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 11px !important; font-weight: 700 !important; flex-shrink: 0 !important;">${idx + 1}</span>
        <div style="flex: 1 !important; min-width: 0 !important;">
          <div style="display: flex !important; gap: 6px !important; align-items: center !important;">
            <code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 5px !important; border-radius: 3px !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">${escHtml(entry.role || tag)}</code>
            ${isErr ? '<span style="font-size: 10px !important; color: #DC2626 !important; font-weight: 600 !important;">NO NAME</span>' : ''}
          </div>
          <div style="font-size: 12px !important; color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; margin-top: 2px !important;">${entry.name ? escHtml(entry.name) : `<span class="a11y-text-muted">&lt;${escHtml(tag)}&gt;</span>`}</div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

export function attachReadingOrderListeners(container: HTMLElement, entries: AccNameEntry[], actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.ro-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const entry = entries[idx];
      if (entry) actions.onHighlight([entry.element]);
    });
  });
}
