import type { AccNameEntry } from '../../core/types';
import { escHtml } from '../../utils/escape';
import {
  renderResultsPage,
  renderIssueCard,
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

  const cardsHtml = entries.map((entry, idx) => {
    const isErr = entry.severity === 'error';
    const tag = entry.element.tagName.toLowerCase();
    const roleOrTag = escHtml(entry.role || tag);
    const nameLine = entry.name
      ? escHtml(entry.name)
      : `<span style="color: #6B7280 !important; font-style: italic !important;">&lt;${escHtml(tag)}&gt;</span>`;
    const borderColor = isErr ? '#DC2626' : '#5C6BC0';

    const badgeHtml = `
      <span class="a11y-badge" style="background: #5C6BC0 !important; color: white !important; min-width: 22px !important; text-align: center !important;">${idx + 1}</span>`;

    const titleHtml = `
      <div style="display: flex !important; gap: 6px !important; align-items: center !important;">
        <code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 5px !important; border-radius: 3px !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">${roleOrTag}</code>
        ${isErr ? '<span style="font-size: 10px !important; color: #DC2626 !important; font-weight: 600 !important;">NO NAME</span>' : ''}
      </div>
      <div style="font-size: 12px !important; color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; margin-top: 2px !important;">${nameLine}</div>`;

    return renderIssueCard({
      idx,
      borderColor,
      badgeHtml,
      titleHtml,
      selector: getCssSelector(entry.element),
      snippet: getSnippet(entry.element),
    });
  }).join('');

  return renderResultsPage({
    title: 'Reading Order',
    backLabel: 'Back',
    stats: [
      { value: entries.length, label: 'significant elements' },
      { value: '·', label: 'DOM order markers drawn on page', color: '#1E40AF' },
    ],
    bodyHtml: entries.length === 0 ? '' : infoBanner + cardsHtml,
    emptyMessage: entries.length === 0 ? 'No significant elements found.' : undefined,
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
