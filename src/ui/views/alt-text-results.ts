import type { AltTextIssue, AltTextIssueType } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  attachResultsPageListeners,
} from './results-template';

const TYPE_LABELS: Record<AltTextIssueType, string> = {
  'missing-alt': 'Missing Alt',
  'empty-alt-in-link': 'Empty Alt in Link',
  'suspicious-alt': 'Suspicious Alt Text',
  'long-alt': 'Alt Text Too Long',
  'decorative-with-role': 'Decorative Conflict',
};

function sevBorder(sev: AltTextIssue['severity']): string {
  const s = SEV[sev as SeverityKey];
  return s?.border ?? '#D1D5DB';
}

function renderAltExtraMeta(issue: AltTextIssue): string {
  const src = (issue.element as HTMLImageElement).src || '';
  const filename = src.split('/').pop()?.split('?')[0] || '';
  const altShort =
    issue.currentAlt !== null
      ? issue.currentAlt.length > 40
        ? escHtml(issue.currentAlt.substring(0, 40)) + '…'
        : escHtml(issue.currentAlt)
      : null;
  return `
    <div style="font-size: 11px !important; color: #6B7280 !important; margin-bottom: 8px !important;">
      ${filename ? `<div style="overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;">${escHtml(filename)}</div>` : ''}
      <div>${altShort !== null ? `<span>alt="${altShort}"</span>` : '<span>no alt attribute</span>'}</div>
    </div>`;
}

export function renderAltTextResults(issues: AltTextIssue[], activeSevs: Set<string>): string {
  const total = issues.length;
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: total === 1 ? 'issue' : 'issues', value: total },
  ];
  if (errorCount > 0) {
    stats.push({
      label: errorCount === 1 ? 'error' : 'errors',
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
  if (infoCount > 0) {
    stats.push({
      label: 'info',
      value: infoCount,
      color: SEV.info.text,
    });
  }

  const filtered = issues.filter(i => activeSevs.has(i.severity));

  const bodyHtml =
    filtered.length > 0
      ? filtered
          .map((issue, idx) => {
            const title = TYPE_LABELS[issue.type] || issue.type;
            const desc = issue.description;
            const descHtml =
              desc.length > 160 ? escHtml(desc.substring(0, 160)) + '…' : escHtml(desc);
            return renderIssueCard({
              idx,
              borderColor: sevBorder(issue.severity),
              badgeHtml: renderSeverityBadge(issue.severity),
              titleHtml: escHtml(title),
              descriptionHtml: descHtml,
              selector: getCssSelector(issue.element),
              snippet: getSnippet(issue.element),
              extraBodyHtml: renderAltExtraMeta(issue),
            });
          })
          .join('')
      : '';

  let emptyMessage: string | undefined;
  if (issues.length === 0) {
    emptyMessage = 'All images have appropriate alt text.';
  } else if (filtered.length === 0) {
    emptyMessage = 'No issues match the selected severity filters.';
  }

  return renderResultsPage({
    title: 'Alt Text Audit',
    stats,
    chips: {
      levels: [
        { key: 'error', count: errorCount },
        { key: 'warning', count: warningCount },
        { key: 'info', count: infoCount },
      ],
      active: activeSevs,
    },
    bodyHtml,
    emptyMessage,
  });
}

export function attachAltTextListeners(
  container: HTMLElement,
  issues: AltTextIssue[],
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onSeverityChange?: (next: Set<string>) => void;
  },
  activeSevs: Set<string>
): void {
  attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onHighlight: idx => {
        const filtered = issues.filter(i => activeSevs.has(i.severity));
        const issue = filtered[idx];
        if (issue) actions.onHighlight([issue.element]);
      },
      onSeverityChange: actions.onSeverityChange,
    },
    { active: activeSevs }
  );
}
