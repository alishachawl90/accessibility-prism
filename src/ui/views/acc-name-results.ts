import type { AccNameEntry, AccNameResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';
import { BORDER } from '../tokens';

type FilterMode = 'all' | 'errors' | 'warnings';

export interface AccNameData {
  result: AccNameResult;
  filter: FilterMode;
  searchQuery: string;
}

function getFilteredEntries(data: AccNameData): AccNameEntry[] {
  let entries = data.result.entries;

  if (data.filter === 'errors') entries = entries.filter(e => e.severity === 'error');
  else if (data.filter === 'warnings') entries = entries.filter(e => e.severity === 'error' || e.severity === 'warning');

  if (data.searchQuery) {
    const q = data.searchQuery.toLowerCase();
    entries = entries.filter(e =>
      e.role.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.announcement || '').toLowerCase().includes(q) ||
      e.element.tagName.toLowerCase().includes(q)
    );
  }
  return entries;
}

export function renderAccNameResults(data: AccNameData): string {
  let html = renderNavBar('Accessible Names', true, 'Back');

  const total = data.result.entries.length;
  const errors = data.result.issueCount;
  const warnings = data.result.warningCount;
  const pass = total - errors - warnings;

  html += `
    <div class="a11y-header-bar">
      <span class="a11y-text-secondary">${total} elements</span>
      ${errors > 0 ? `<span class="a11y-text-error">${errors} missing name</span>` : ''}
      ${warnings > 0 ? `<span class="a11y-text-warning">${warnings} warnings</span>` : ''}
      <span class="a11y-text-success">${pass} pass</span>
    </div>
  `;

  html += `
    <div style="padding: 8px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important; display: flex !important; gap: 8px !important; align-items: center !important;">
      <input type="text" id="accname-search" value="${escHtml(data.searchQuery)}" placeholder="Filter by role, name, tag..." style="flex: 1 !important; min-width: 0 !important; padding: 6px 10px !important; border: 1px solid #D1D5DB !important; border-radius: 6px !important; font-size: 12px !important; color: #1F2937 !important; background: white !important; outline: none !important;" />
      <select id="accname-filter" style="width: 110px !important; padding: 6px !important; border: 1px solid #D1D5DB !important; border-radius: 6px !important; font-size: 12px !important; background: white !important; color: #374151 !important; cursor: pointer !important;">
        <option value="all" ${data.filter === 'all' ? 'selected' : ''}>All</option>
        <option value="errors" ${data.filter === 'errors' ? 'selected' : ''}>Errors only</option>
        <option value="warnings" ${data.filter === 'warnings' ? 'selected' : ''}>Issues</option>
      </select>
    </div>
  `;

  const filtered = getFilteredEntries(data);
  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (filtered.length === 0) {
    html += `<div style="text-align: center !important; padding: 24px !important; color: #15803D !important; font-size: 14px !important;">No issues found.</div>`;
  } else {
    filtered.forEach((entry, idx) => {
      const sev = entry.severity || 'pass';
      const borderColor = sev === 'error' ? '#EF4444' : sev === 'warning' ? '#F59E0B' : '#16A34A';
      const tag = entry.element.tagName.toLowerCase();
      const sevLabel = sev === 'error' ? 'Missing Name' : sev === 'warning' ? 'Warning' : 'Pass';
      const sevBg = sev === 'error' ? '#EF4444' : sev === 'warning' ? '#F59E0B' : '#16A34A';

      html += `
        <div class="accname-card" data-idx="${idx}" class="a11y-card" style="border-left-color: ${borderColor} !important; cursor: pointer !important;">
          <div class="a11y-card-header">
            <span class="a11y-badge-sm" style="background: ${sevBg} !important; color: white !important;">${sevLabel}</span>
            <code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 6px !important; border-radius: 3px !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">${entry.role || tag}</code>
            <code style="font-size: 11px !important; color: #6B7280 !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">&lt;${escHtml(tag)}&gt;</code>
          </div>
          <div style="font-size: 13px !important; color: #1F2937 !important; margin-bottom: 4px !important;">
            <span style="color: #6B7280 !important; font-size: 11px !important;">Announcement:</span>
            <span style="font-weight: 500 !important;">${escHtml(entry.announcement || '(empty)')}</span>
          </div>
          ${entry.states.length > 0 ? `<div style="font-size: 11px !important; color: #6B7280 !important;">States: ${escHtml(entry.states.join(', '))}</div>` : ''}
          ${entry.ariaHidden ? '<div style="font-size: 11px !important; color: #DC2626 !important;">aria-hidden="true"</div>' : ''}
        </div>
      `;
    });
  }
  html += `</div>`;
  return html;
}

export function attachAccNameListeners(container: HTMLElement, data: AccNameData, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
  onFilterChange: (search: string, filter: FilterMode) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  const searchInput = container.querySelector('#accname-search') as HTMLInputElement;
  const filterSelect = container.querySelector('#accname-filter') as HTMLSelectElement;

  const emitChange = () => {
    actions.onFilterChange(searchInput?.value || '', (filterSelect?.value || 'all') as FilterMode);
  };
  searchInput?.addEventListener('input', emitChange);
  filterSelect?.addEventListener('change', emitChange);

  const filtered = getFilteredEntries(data);
  container.querySelectorAll('.accname-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const entry = filtered[idx];
      if (entry) actions.onHighlight([entry.element]);
    });
  });
  hoverListeners(container, '.accname-card', '#6366F1');
}
