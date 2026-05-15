import type { AccNameEntry, AccNameResult } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import { ICON_CHEVRON_RIGHT } from '../icons';
import { renderCountBadge } from './helpers';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  attachResultsPageListeners,
} from './results-template';

export interface AccNameData {
  result: AccNameResult;
  searchQuery: string;
  /** Chip keys: `error`, `warning`, `info` (passing entries use the `info` chip). */
  activeSeverities: Set<string>;
}

type AccSev = 'error' | 'warning' | 'pass';

function entrySeverity(entry: AccNameEntry): AccSev {
  return entry.severity || 'pass';
}

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
        ((e.element as any)?.tagName?.toLowerCase() ?? '').includes(q)
    );
  }
  return entries;
}

function sevBorder(sev: AccSev): string {
  const s = SEV[sev as SeverityKey];
  return s?.border ?? '#D1D5DB';
}

function badgeLabel(sev: AccSev): string {
  if (sev === 'error') return 'Missing Name';
  if (sev === 'warning') return 'Warning';
  return 'Pass';
}

const SEV_ORDER: AccSev[] = ['error', 'warning', 'pass'];
const SEV_SECTION_LABELS: Record<AccSev, string> = {
  error: 'Missing Names',
  warning: 'Warnings',
  pass: 'Passing',
};

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

function renderEntryCard(entry: AccNameEntry, idx: number): string {
  const sev = entrySeverity(entry);
  const tag = (entry.element as any)?.tagName?.toLowerCase() ?? entry.role ?? 'element';
  const roleOrTag = entry.role || tag;
  const titleHtml = `<span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;"><code style="font-size: 11px !important; color: #6366F1 !important; background: #EEF2FF !important; padding: 1px 6px !important; border-radius: 3px !important;">${escHtml(roleOrTag)}</code> <code style="font-size: 11px !important; color: #6B7280 !important;">&lt;${escHtml(tag)}&gt;</code></span>`;
  const desc = entry.name.length > 120 ? entry.name.substring(0, 120) + '…' : entry.name;
  const descriptionHtml = `<span style="color: #6B7280 !important;">Name:</span> ${escHtml(desc)}`;
  return renderIssueCard({
    idx,
    borderColor: sevBorder(sev),
    badgeHtml: renderSeverityBadge(sev, badgeLabel(sev)),
    titleHtml,
    descriptionHtml,
    selector: entry.element ? getCssSelector(entry.element) : '',
    snippet: entry.element ? getSnippet(entry.element) : '',
    extraBodyHtml: renderAccNameExtra(entry),
  });
}

function renderSectionAccordion(key: string, title: string, count: number, borderColor: string, innerCards: string, defaultOpen: boolean): string {
  const headerHtml = `<span style="font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important;">${escHtml(title)}</span>`;
  return `
    <div style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${borderColor} !important; border-radius: 8px !important; margin-bottom: 10px !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
      <div class="an-acc-header" data-key="${escHtml(key)}" style="padding: 14px 16px !important; cursor: pointer !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: background 0.1s !important;">
        <div style="display: flex !important; align-items: center !important; gap: 10px !important; flex: 1 !important; min-width: 0 !important;">
          <span class="an-acc-chevron" data-key="${escHtml(key)}" style="transition: transform 0.2s !important; flex-shrink: 0 !important; color: #6B7280 !important; ${defaultOpen ? 'transform: rotate(90deg) !important;' : ''}">${ICON_CHEVRON_RIGHT}</span>
          ${headerHtml}
        </div>
        ${renderCountBadge(count)}
      </div>
      <div class="an-acc-body" data-key="${escHtml(key)}" style="display: ${defaultOpen ? 'block' : 'none'} !important; padding: 8px 16px 14px 16px !important; border-top: 1px solid #F3F4F6 !important;">
        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important;">
          ${innerCards}
        </div>
      </div>
    </div>`;
}

export function renderAccNameResults(data: AccNameData): string {
  const entries = data.result.entries;
  const total = entries.length;
  const errorCount = entries.filter(e => entrySeverity(e) === 'error').length;
  const warningCount = entries.filter(e => entrySeverity(e) === 'warning').length;
  const passCount = entries.filter(e => entrySeverity(e) === 'pass').length;

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

  // Group filtered entries by severity into accordion sections
  const groups = new Map<AccSev, AccNameEntry[]>();
  filtered.forEach(e => {
    const sev = entrySeverity(e);
    if (!groups.has(sev)) groups.set(sev, []);
    groups.get(sev)!.push(e);
  });

  let flatIdx = 0;
  const bodyHtml = SEV_ORDER
    .filter(sev => groups.has(sev))
    .map((sev, i) => {
      const groupEntries = groups.get(sev)!;
      const cards = groupEntries.map(entry => renderEntryCard(entry, flatIdx++)).join('');
      const isFirstIssueSection = i === 0 && sev !== 'pass';
      return renderSectionAccordion(
        `an-sec-${sev}`,
        SEV_SECTION_LABELS[sev],
        groupEntries.length,
        sevBorder(sev),
        cards,
        isFirstIssueSection,
      );
    })
    .join('');

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
  const signal = attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onHighlight: idx => {
        const filtered = getFilteredAccNameEntries(data);
        const entry = filtered[idx];
        if (entry?.element) actions.onHighlight([entry.element]);
      },
      onSeverityChange: actions.onSeverityChange,
      onSearchInput: actions.onSearchInput,
    },
    { active: data.activeSeverities }
  );

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const header = target.closest('.an-acc-header') as HTMLElement;
    if (!header) return;
    const key = header.getAttribute('data-key');
    if (!key) return;
    const body = container.querySelector(`.an-acc-body[data-key="${key}"]`) as HTMLElement;
    const chevron = container.querySelector(`.an-acc-chevron[data-key="${key}"]`) as HTMLElement;
    if (body) {
      const isOpen = body.style.display !== 'none' && body.style.display !== '';
      body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
    }
  }, { signal });
}
