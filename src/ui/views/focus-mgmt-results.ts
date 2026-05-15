import type { FocusManagementIssue } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import {
  attachResultsPageListeners,
  renderIssueCard,
  renderResultsPage,
  renderSeverityBadge,
} from './results-template';

const TYPE_LABELS: Record<string, string> = {
  'no-focus-trap': 'Focus Not Trapped',
  'no-return-focus': 'No Return Focus',
  'no-escape-close': 'No Escape Key Handler',
  'missing-role-dialog': 'Missing Dialog Role',
  'missing-aria-label': 'Missing Dialog Label',
  'no-initial-focus': 'No Initial Focus',
};

export function renderFocusMgmtResults(issues: FocusManagementIssue[]): string {
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { value: issues.length, label: issues.length === 1 ? 'issue' : 'issues' },
  ];
  if (errors > 0) {
    stats.push({
      value: errors,
      label: errors === 1 ? 'Error' : 'Errors',
      color: SEV.error.badge,
    });
  }
  if (warnings > 0) {
    stats.push({
      value: warnings,
      label: warnings === 1 ? 'Warning' : 'Warnings',
      color: SEV.warning.badge,
    });
  }

  let bodyHtml = '';
  if (issues.length === 0) {
    bodyHtml = `
      <div class="a11y-empty-success">${escHtml('No dialog/modal focus issues detected.')}</div>
      <div style="text-align: center; padding: 0 24px 24px; color: #6B7280; font-size: 12px;">${escHtml('Note: This analysis checks currently open dialogs. Open a modal and re-run to test it.')}</div>`;
  } else {
    bodyHtml = issues
      .map((issue, idx) => {
        const palette = SEV[issue.severity as SeverityKey];
        const borderColor = palette?.badge ?? '#6B7280';
        const title = TYPE_LABELS[issue.type] || issue.type;
        return renderIssueCard({
          idx,
          borderColor,
          badgeHtml: renderSeverityBadge(issue.severity),
          titleHtml: escHtml(title),
          descriptionHtml: escHtml(issue.description),
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
        });
      })
      .join('');
  }

  return renderResultsPage({
    title: 'Focus Management',
    backLabel: 'Back',
    stats,
    bodyHtml,
  });
}

export function attachFocusMgmtListeners(
  container: HTMLElement,
  issues: FocusManagementIssue[],
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  }
): void {
  attachResultsPageListeners(container, {
    onBack: () => actions.onBack(),
    onHighlight: (idx) => {
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    },
  });
}
