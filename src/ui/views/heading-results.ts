import type { HeadingAnalysisResult, HeadingIssue } from '../../core/types';
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

const LEVEL_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F59E0B',
  4: '#3B82F6',
  5: '#8B5CF6',
  6: '#6B7280',
};

function issueBorder(sev: HeadingIssue['severity']): string {
  const s = SEV[sev as SeverityKey];
  return s?.border ?? '#D1D5DB';
}

function renderHeadingTree(data: HeadingAnalysisResult): string {
  if (data.headings.length === 0) {
    return `<div class="a11y-empty-state">No headings found on this page.</div>`;
  }
  let html = '';
  data.headings.forEach((h, idx) => {
    const indent = (h.level - 1) * 20;
    const color = LEVEL_COLORS[h.level] || '#6B7280';
    const hasIssue = data.issues.some(i => i.element === h.element);
    const textHtml = h.text
      ? escHtml(h.text)
      : '<em style="color: #6B7280;">empty</em>';
    html += `
        <div class="heading-node" data-idx="${idx}" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; padding-left: ${12 + indent}px; margin-bottom: 4px; background: white; border: 1px solid ${hasIssue ? '#FCA5A5' : '#E5E7EB'}; border-left: 3px solid ${color}; border-radius: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; flex-shrink: 0;">H${h.level}</span>
          <span style="font-size: 13px; color: #1F2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${textHtml}</span>
          ${hasIssue ? '<span style="color: #DC2626; font-size: 12px; flex-shrink: 0;">&#9888;</span>' : ''}
        </div>`;
  });
  return html;
}

export function renderHeadingResults(data: HeadingAnalysisResult): string {
  const issueCount = data.issues.length;
  const headingCount = data.headings.length;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: headingCount === 1 ? 'heading' : 'headings', value: headingCount },
    {
      label: issueCount === 1 ? 'issue' : 'issues',
      value: issueCount,
      color: issueCount > 0 ? SEV.error.text : '#16A34A',
    },
  ];

  const issuesHtml =
    data.issues.length > 0
      ? `<div style="margin-bottom: 16px;">
      <div class="a11y-section-title">Issues</div>
      ${data.issues
        .map((issue, idx) => {
          const titleHtml = escHtml(issue.type.replace(/-/g, ' '));
          const descriptionHtml = escHtml(issue.description);
          const selector = issue.element ? getCssSelector(issue.element) : '(no element)';
          const snippet = issue.element ? getSnippet(issue.element) : '';
          return renderIssueCard({
            idx,
            borderColor: issueBorder(issue.severity),
            badgeHtml: renderSeverityBadge(issue.severity),
            titleHtml,
            descriptionHtml,
            selector,
            snippet,
          });
        })
        .join('')}
    </div>`
      : '';

  const bodyHtml = `
    ${issuesHtml}
    <div class="a11y-section-title">Heading Tree</div>
    ${renderHeadingTree(data)}
  `;

  return renderResultsPage({
    title: 'Heading Structure',
    stats,
    bodyHtml,
  });
}

export function attachHeadingListeners(
  container: HTMLElement,
  data: HeadingAnalysisResult,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  }
): void {
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: idx => {
      const issue = data.issues[idx];
      if (issue?.element) actions.onHighlight([issue.element]);
    },
  });

  container.addEventListener('click', (e: MouseEvent) => {
    const row = (e.target as HTMLElement).closest('.heading-node');
    if (!row) return;
    const idx = parseInt(row.getAttribute('data-idx') || '0', 10);
    const heading = data.headings[idx];
    if (heading) actions.onHighlight([heading.element]);
  });
}
