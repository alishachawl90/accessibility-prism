import type { AccNameEntry } from '../../core/types';
import { escHtml } from '../../utils/escape';
import {
  renderResultsPage,
  attachResultsPageListeners,
  getCssSelector,
  getSnippet,
} from './results-template';

export function renderReadingOrderResults(entries: AccNameEntry[]): string {
  const infoBanner = `
    <div style="padding: 10px 16px !important; background: #EFF6FF !important; border-bottom: 1px solid #BFDBFE !important; font-size: 12px !important; color: #1E40AF !important; line-height: 1.5 !important; margin-bottom: 12px !important;">
      Numbered markers show the order a screen reader reads the page. Check for elements that appear in a different visual position than their DOM order.
    </div>
  `;

  const listHtml =
    entries.length === 0
      ? ''
      : `<div role="list" style="display: flex !important; flex-direction: column !important; gap: 0 !important; margin: 0 !important; padding: 0 !important;">
${entries
  .map((entry, idx) => {
    const isErr = entry.severity === 'error';
    const tag = entry.element.tagName.toLowerCase();
    const roleOrTag = escHtml(entry.role || tag);
    const selector = escHtml(getCssSelector(entry.element));
    const snippet = escHtml(getSnippet(entry.element));
    const nameLine = entry.name
      ? escHtml(entry.name)
      : `<span class="a11y-text-muted">&lt;${escHtml(tag)}&gt;</span>`;
    return `          <div role="listitem" style="margin: 0 !important; padding: 0 !important;">
            <button type="button" class="a11y-highlight-btn" data-idx="${idx}"
              style="width: 100% !important; text-align: left !important; box-sizing: border-box !important; padding: 8px 10px !important; margin-bottom: 4px !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; background: white !important; border: 1px solid #E5E7EB !important; display: flex !important; align-items: center !important; gap: 8px !important; transition: border-color 0.15s !important;">
              <span aria-hidden="true" style="width: 28px !important; height: 28px !important; border-radius: 50% !important; background: #5C6BC0 !important; color: white !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 11px !important; font-weight: 700 !important; flex-shrink: 0 !important;">${idx + 1}</span>
              <div style="flex: 1 !important; min-width: 0 !important;">
                <div style="display: flex !important; gap: 6px !important; align-items: center !important;">
                  <code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 5px !important; border-radius: 3px !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">${roleOrTag}</code>
                  ${isErr ? '<span style="font-size: 10px !important; color: #DC2626 !important; font-weight: 600 !important;">NO NAME</span>' : ''}
                </div>
                <div style="font-size: 12px !important; color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; margin-top: 2px !important;">${nameLine}</div>
                <div style="font-size: 10px !important; color: #9CA3AF !important; margin-top: 4px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;" title="${selector}">${selector}</div>
                <div style="font-size: 10px !important; color: #6B7280 !important; margin-top: 2px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;" title="${snippet}">${snippet}</div>
              </div>
            </button>
          </div>`;
  })
  .join('\n')}
        </div>`;

  return renderResultsPage({
    title: 'Reading Order',
    backLabel: 'Back',
    stats: [
      { value: entries.length, label: 'significant elements' },
      { value: '·', label: 'DOM order markers drawn on page', color: '#1E40AF' },
    ],
    bodyHtml: entries.length === 0 ? '' : infoBanner + listHtml,
    emptyMessage:
      entries.length === 0
        ? 'No significant elements found.'
        : undefined,
  });
}

export function attachReadingOrderListeners(
  container: HTMLElement,
  entries: AccNameEntry[],
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  },
): void {
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      const entry = entries[idx];
      if (entry) actions.onHighlight([entry.element]);
    },
  });
}
