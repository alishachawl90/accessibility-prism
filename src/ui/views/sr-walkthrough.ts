import type { AccNameEntry } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { BORDER } from '../tokens';
import {
  renderResultsPage,
  attachResultsPageListeners,
} from './results-template';

export interface WalkthroughData {
  entries: AccNameEntry[];
  currentIndex: number;
}

export function renderSrWalkthrough(data: WalkthroughData): string {
  const total = data.entries.length;
  const current = data.currentIndex;

  if (total === 0) {
    return renderResultsPage({
      title: 'Screen Reader Walk-Through',
      backLabel: 'Back',
      stats: [{ value: 0, label: 'elements' }],
      bodyHtml: '',
      emptyMessage: 'No significant elements found.',
    });
  }

  const entry = data.entries[current];
  const sev = entry.severity || 'pass';
  const sevColor = sev === 'error' ? '#EF4444' : sev === 'warning' ? '#F59E0B' : '#2563EB';
  const tag = (entry.element as any)?.tagName?.toLowerCase() ?? entry.role ?? 'element';

  const toolbarHtml = `
    <div style="display: flex !important; align-items: center !important; justify-content: space-between !important; width: 100% !important;">
      <span style="font-size: 13px !important; font-weight: 600 !important; color: #374151 !important;">Element ${current + 1} of ${total}</span>
      <div style="display: flex !important; gap: 6px !important;">
        <button data-toolbar-action="wt-prev" ${current <= 0 ? 'disabled' : ''} style="padding: 4px 12px !important; border: 1px solid #D1D5DB !important; border-radius: 6px !important; font-size: 12px !important; cursor: ${current <= 0 ? 'not-allowed' : 'pointer'} !important; background: white !important; color: ${current <= 0 ? '#6B7280' : '#374151'} !important; font-weight: 600 !important;">&#9664; Prev</button>
        <button data-toolbar-action="wt-next" ${current >= total - 1 ? 'disabled' : ''} style="padding: 4px 12px !important; border: 1px solid #D1D5DB !important; border-radius: 6px !important; font-size: 12px !important; cursor: ${current >= total - 1 ? 'not-allowed' : 'pointer'} !important; background: white !important; color: ${current >= total - 1 ? '#6B7280' : '#374151'} !important; font-weight: 600 !important;">Next &#9654;</button>
      </div>
    </div>
    <div style="height: 4px !important; background: #E5E7EB !important; border-radius: 2px !important; overflow: hidden !important; margin-top: 8px !important; width: 100% !important;">
      <div style="height: 100% !important; width: ${((current + 1) / total) * 100}% !important; background: #2563EB !important; border-radius: 2px !important; transition: width 0.2s !important;"></div>
    </div>`;

  let bodyHtml = `
    <div style="padding: 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important;">
      <div style="background: #1F2937 !important; border-radius: 10px !important; padding: 16px !important; margin-bottom: 12px !important;">
        <div style="font-size: 11px !important; color: #6B7280 !important; margin-bottom: 6px !important; font-weight: 600 !important; letter-spacing: 0.5px !important;">SCREEN READER WOULD ANNOUNCE</div>
        <div style="font-size: 15px !important; color: white !important; font-weight: 500 !important; line-height: 1.5 !important; word-break: break-word !important;">
          ${entry.announcement ? escHtml(entry.announcement) : '<span style="color: #DC2626 !important; font-style: italic !important;">(nothing — element has no accessible name)</span>'}
        </div>
      </div>

      <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important;">
        <div style="background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">Role</div>
          <div style="font-size: 13px !important; color: #6366F1 !important; font-weight: 600 !important;">${escHtml(entry.role || 'generic')}</div>
        </div>
        <div style="background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">Element</div>
          <code style="font-size: 12px !important; color: #374151 !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">&lt;${escHtml(tag)}&gt;</code>
        </div>
        <div style="background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">Name</div>
          <div style="font-size: 13px !important; color: ${entry.name ? '#374151' : '#EF4444'} !important; font-weight: 500 !important; word-break: break-word !important;">${entry.name ? escHtml(entry.name) : '(none)'}</div>
        </div>
        <div style="background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">Status</div>
          <span style="background: ${sevColor} !important; color: white !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 600 !important;">${sev === 'error' ? 'Missing Name' : sev === 'warning' ? 'Warning' : 'Pass'}</span>
        </div>
      </div>

      ${entry.states.length > 0 ? `
        <div style="margin-top: 10px !important; background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">States</div>
          <div style="display: flex !important; gap: 6px !important; flex-wrap: wrap !important;">
            ${entry.states.map(s => `<span style="background: #EEF2FF !important; color: #4F46E5 !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 500 !important;">${escHtml(s)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${entry.description ? `
        <div style="margin-top: 10px !important; background: #F9FAFB !important; border-radius: 8px !important; padding: 10px !important;">
          <div style="font-size: 11px !important; color: #4B5563 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; margin-bottom: 4px !important; line-height: 1.5 !important;">Description</div>
          <div style="font-size: 13px !important; color: #374151 !important;">${escHtml(entry.description)}</div>
        </div>
      ` : ''}
    </div>
  `;

  // Nearby elements list
  bodyHtml += `
    <div style="padding: 10px 16px !important;">
      <div style="font-size: 11px !important; font-weight: 600 !important; color: #6B7280 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; margin-bottom: 8px !important;">Nearby elements</div>`;

  const start = Math.max(0, current - 2);
  const end = Math.min(total, current + 5);
  for (let i = start; i < end; i++) {
    const e = data.entries[i];
    const isCurrent = i === current;
    const isErr = e.severity === 'error';
    bodyHtml += `
      <div class="wt-item" data-idx="${i}" style="padding: 8px 10px !important; margin-bottom: 4px !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; background: ${isCurrent ? '#EEF2FF' : 'white'} !important; border: 1px solid ${isCurrent ? '#C7D2FE' : '#E5E7EB'} !important; display: flex !important; align-items: center !important; gap: 8px !important; transition: background 0.1s !important;">
        <span style="width: 24px !important; height: 24px !important; border-radius: 50% !important; background: ${isCurrent ? '#2563EB' : '#F3F4F6'} !important; color: ${isCurrent ? 'white' : '#6B7280'} !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 10px !important; font-weight: 700 !important; flex-shrink: 0 !important;">${i + 1}</span>
        <span style="color: ${isErr ? '#EF4444' : '#374151'} !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important; font-weight: ${isCurrent ? '600' : '400'} !important;">${escHtml(e.announcement || '(empty)')}</span>
      </div>`;
  }

  bodyHtml += `</div>`;

  return renderResultsPage({
    title: 'Screen Reader Walk-Through',
    backLabel: 'Back',
    stats: [
      { value: `${current + 1} / ${total}`, label: 'elements' },
    ],
    toolbarHtml,
    bodyHtml,
  });
}

export function attachWalkthroughListeners(
  container: HTMLElement,
  data: WalkthroughData,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onNavigate: (index: number) => void;
  },
): void {
  const signal = attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: () => {},
    onToolbarAction: (action) => {
      if (action === 'wt-prev' && data.currentIndex > 0) actions.onNavigate(data.currentIndex - 1);
      if (action === 'wt-next' && data.currentIndex < data.entries.length - 1) actions.onNavigate(data.currentIndex + 1);
    },
  });

  const currentEntry = data.entries[data.currentIndex];
  if (currentEntry?.element) {
    actions.onHighlight([currentEntry.element]);
  }

  container.querySelectorAll('.wt-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      actions.onNavigate(idx);
    }, { signal });
  });
}
