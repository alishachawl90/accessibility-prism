import type { AriaValidationResult, AriaIssue } from '../../core/types';
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

const TYPE_LABELS: Record<string, string> = {
  'invalid-role': 'Invalid Role',
  'redundant-role': 'Redundant Role',
  'missing-required-prop': 'Missing Required Property',
  'broken-reference': 'Broken Reference',
  'hidden-focusable': 'Hidden but Focusable',
  'presentation-conflict': 'Presentation Conflict',
  'invalid-value': 'Invalid Value',
  'positive-tabindex': 'Positive Tabindex',
};

function vis(issues: AriaIssue[], active: Set<string>): AriaIssue[] {
  return issues.filter(i => active.has(i.severity));
}

function sevBorder(sev: AriaIssue['severity']): string {
  const s = SEV[sev as SeverityKey];
  return s?.badge ?? '#6B7280';
}

export function renderAriaResults(result: AriaValidationResult, activeSevs: Set<string>): string {
  const { issues, errorCount, warningCount } = result;
  const infoCount = issues.length - errorCount - warningCount;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: issues.length === 1 ? 'issue' : 'issues', value: issues.length, color: '#1F2937' },
  ];
  if (errorCount > 0) {
    stats.push({
      label: errorCount === 1 ? 'Error' : 'Errors',
      value: errorCount,
      color: SEV.error.badge,
    });
  }
  if (warningCount > 0) {
    stats.push({
      label: warningCount === 1 ? 'Warning' : 'Warnings',
      value: warningCount,
      color: SEV.warning.badge,
    });
  }
  if (infoCount > 0) {
    stats.push({
      label: 'info',
      value: infoCount,
      color: SEV.info.badge,
    });
  }

  if (issues.length === 0) {
    return renderResultsPage({
      title: 'ARIA Validation',
      backLabel: 'Back',
      stats,
      bodyHtml: '',
      emptyMessage: 'No ARIA issues found. Well done!',
    });
  }

  const filtered = vis(issues, activeSevs);
  const bodyHtml = !filtered.length
    ? '<div class="a11y-empty-state">No issues match the selected filters.</div>'
    : filtered
        .map((issue, idx) => {
          const title = TYPE_LABELS[issue.type] || issue.type;
          return renderIssueCard({
            idx,
            borderColor: sevBorder(issue.severity),
            badgeHtml: renderSeverityBadge(issue.severity),
            titleHtml: escHtml(title),
            descriptionHtml: escHtml(issue.description),
            selector: getCssSelector(issue.element),
            snippet: getSnippet(issue.element),
          });
        })
        .join('');

  const levels = (['error', 'warning', 'info'] as const)
    .map(k => ({ key: k, count: issues.filter(i => i.severity === k).length }))
    .filter(l => l.count > 0);

  return renderResultsPage({
    title: 'ARIA Validation',
    backLabel: 'Back',
    stats,
    chips: levels.length ? { levels, active: activeSevs } : undefined,
    bodyHtml,
  });
}

export function attachAriaListeners(
  container: HTMLElement,
  result: AriaValidationResult,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onSeverityChange?: (next: Set<string>) => void;
  },
  activeSevs: Set<string>,
): void {
  const filtered = vis(result.issues, activeSevs);
  attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onHighlight: idx => {
        const issue = filtered[idx];
        if (issue) actions.onHighlight([issue.element]);
      },
      onSeverityChange: actions.onSeverityChange,
    },
    { active: activeSevs },
  );
}
