import type { TouchTargetIssue } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { SEV } from '../tokens';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  attachResultsPageListeners,
} from './results-template';

function getContext(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim().substring(0, 40) || '';
  const ariaLabel = el.getAttribute('aria-label');
  return ariaLabel || text || tag;
}

function touchTargetBorderColor(issue: TouchTargetIssue): string {
  return SEV[issue.severity].badge;
}

function renderTouchTargetDescription(issue: TouchTargetIssue): string {
  const line = `Actual: ${issue.width}×${issue.height}px · Minimum required: ${issue.minRequired}×${issue.minRequired}px · WCAG ${issue.level}`;
  return escHtml(line);
}

export function renderTouchTargetResults(issues: TouchTargetIssue[]): string {
  const aaFails = issues.filter(i => i.level === 'AA').length;
  const aaaFails = issues.filter(i => i.level === 'AAA').length;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: 'undersized', value: issues.length, color: '#1F2937' },
  ];
  if (aaFails > 0) {
    stats.push({ label: 'below 24px (AA)', value: aaFails, color: '#DC2626' });
  }
  if (aaaFails > 0) {
    stats.push({ label: 'below 44px (AAA)', value: aaaFails, color: '#B45309' });
  }

  let bodyHtml = '';
  if (issues.length > 0) {
    bodyHtml = issues
      .map((issue, idx) =>
        renderIssueCard({
          idx,
          borderColor: touchTargetBorderColor(issue),
          badgeHtml: renderSeverityBadge(issue.severity),
          titleHtml: escHtml(getContext(issue.element)),
          descriptionHtml: renderTouchTargetDescription(issue),
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
        })
      )
      .join('');
  }

  return renderResultsPage({
    title: 'Touch Targets',
    backLabel: 'Back',
    stats,
    bodyHtml,
    emptyMessage:
      issues.length === 0
        ? 'All interactive elements meet touch target size requirements.'
        : undefined,
  });
}

export function attachTouchTargetListeners(
  container: HTMLElement,
  issues: TouchTargetIssue[],
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  }
): void {
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: idx => {
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    },
  });
}
