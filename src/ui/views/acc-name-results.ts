import type { AccNameEntry, AccNameResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  getCssSelector,
  getSnippet,
  attachResultsPageListeners,
} from './results-template';

export interface AccNameData {
  result: AccNameResult;
  searchQuery: string;
  /** Chip keys: `error`, `warning`, `info` (passing entries use the `info` chip). */
  activeSeverities: Set<string>;
}

function entrySeverity(entry: AccNameEntry): 'error' | 'warning' | 'pass' {
  return entry.severity || 'pass';
}

/** Maps entry severity to severity chip key (`pass` → `info` for chip row). */
function entryChipKey(entry: AccNameEntry): 'error' | 'warning' | 'info' {
  const s = entrySeverity(entry);
  if (s === 'error') return 'error';
  if (s === 'warning') return 'warning';
  return 'info';
}

function getFilteredAccNameEntries(data: AccNameData): AccNameEntry[] {
  let entries = data.result.entries;

  entries = entries.filter(e => data.activeSeverities.has(entryChipKey(e)));

  if (data.searchQuery) {
    const q = data.searchQuery.toLowerCase();
    entries = entries.filter(
      e =>
        e.role.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        (e.announcement || '').toLowerCase().includes(q) ||
        e.element.tagName.toLowerCase().includes(q)
    );
  }
  return entries;
}

function sevBorder(sev: 'error' | 'warning' | 'pass'): string {
  const s = SEV[sev as SeverityKey];
  return s?.border ?? '#D1D5DB';
}

function badgeLabel(sev: 'error' | 'warning' | 'pass'): string {
  if (sev === 'error') return 'Missing Name';
  if (sev === 'warning') return 'Warning';
  return 'Pass';
}

function renderAccNameExtra(entry: AccNameEntry): string {
  const parts: string[] = [];
  parts.push(
    `<div style="font-size: 12px !important; color: #1F2937 !important; margin-bottom: 6px !important;"><span style="color: #6B7280 !important;">Accessible name:</span> <span style="font-weight: 500 !important;">${escHtml(entry.name)}</span></div>`
  );
  parts.push(
    `<div style="font-size: 12px !important; color: #1F2937 !important; margin-bottom: 6px !important;"><span style="color: #6B7280 !important;">Announcement:</span> <span style="font-weight: 500 !important;">${escHtml(entry.announcement || '(empty)')}</span></div>`
  );
  if (entry.states.length > 0) {
    parts.push(
      `<div style="font-size: 11px !important; color: #6B7280 !important;">States: ${escHtml(entry.states.join(', '))}</div>`
    );
  }
  if (entry.ariaHidden) {
    parts.push(`<div style="font-size: 11px !important; color: #DC2626 !important;">aria-hidden="true"</div>`);
  }
  return parts.join('');
}

export function renderAccNameResults(data: AccNameData): string {
  const entries = data.result.entries;
  const total = entries.length;
  const errorCount = entries.filter(e => entrySeverity(e) === 'error').length;
  const warningCount = entries.filter(e => entrySeverity(e) === 'warning').length;
  const passCount = entries.filter(e => entrySeverity(e) === 'pass').length; // shown under `info` chip

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: total === 1 ? 'element' : 'elements', value: total },
  ];
  if (errorCount > 0) {
    stats.push({
      label: errorCount === 1 ? 'missing name' : 'missing names',
      value: errorCount,
      color: SEV.error.text,
    });
  }
  if (warningCount > 0) {
    stats.push({
      label: warningCount === 1 ? 'warning' : 'warnings',
      value: warningCount,
      color: SEV.warning.text,
    });
  }
  if (passCount > 0) {
    stats.push({
      label: passCount === 1 ? 'pass' : 'passes',
      value: passCount,
      color: SEV.pass.text,
    });
  }

  const filtered = getFilteredAccNameEntries(data);

  const bodyHtml =
    filtered.length > 0
      ? filtered
          .map((entry, idx) => {
            const sev = entrySeverity(entry);
            const tag = entry.element.tagName.toLowerCase();
            const roleOrTag = entry.role || tag;
            const titleHtml = `<span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;"><code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 6px !important; border-radius: 3px !important;">${escHtml(roleOrTag)}</code> <code style="font-size: 11px !important; color: #6B7280 !important;">&lt;${escHtml(tag)}&gt;</code></span>`;
            const desc =
              entry.name.length > 120 ? entry.name.substring(0, 120) + '…' : entry.name;
            const descriptionHtml = `<span style="color: #6B7280 !important;">Name:</span> ${escHtml(desc)}`;
            return renderIssueCard({
              idx,
              borderColor: sevBorder(sev),
              badgeHtml: renderSeverityBadge(sev, badgeLabel(sev)),
              titleHtml,
              descriptionHtml,
              selector: getCssSelector(entry.element),
              snippet: getSnippet(entry.element),
              extraBodyHtml: renderAccNameExtra(entry),
            });
          })
          .join('')
      : '';

  let emptyMessage: string | undefined;
  if (total === 0) {
    emptyMessage = 'No elements found.';
  } else if (filtered.length === 0) {
    emptyMessage = 'No entries match the current filters.';
  }

  return renderResultsPage({
    title: 'Accessible Names',
    stats,
    chips: {
      levels: [
        { key: 'error', count: errorCount },
        { key: 'warning', count: warningCount },
        { key: 'info', count: passCount, label: 'Pass' },
      ],
      active: data.activeSeverities,
    },
    search: {
      value: data.searchQuery,
      placeholder: 'Filter by role, name, tag, announcement…',
    },
    bodyHtml,
    emptyMessage,
  });
}

export function attachAccNameListeners(
  container: HTMLElement,
  data: AccNameData,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onSeverityChange?: (next: Set<string>) => void;
    onSearchInput?: (value: string) => void;
  }
): void {
  attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onHighlight: idx => {
        const filtered = getFilteredAccNameEntries(data);
        const entry = filtered[idx];
        if (entry) actions.onHighlight([entry.element]);
      },
      onSeverityChange: actions.onSeverityChange,
      onSearchInput: actions.onSearchInput,
    },
    { active: data.activeSeverities }
  );
}
