import type { ContrastIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { CONTRAST_KNOWLEDGE, renderKnowledgeBlock } from '../../utils/issue-knowledge';
import {
  renderResultsPage,
  renderIssueCard,
  getCssSelector,
  getSnippet,
  attachResultsPageListeners,
} from './results-template';

const AA_FAIL_BORDER = '#EF4444';
const AAA_ONLY_FAIL_BORDER = '#F97316';

function contrastBorderColor(issue: ContrastIssue): string {
  if (!issue.passesAA) return AA_FAIL_BORDER;
  return AAA_ONLY_FAIL_BORDER;
}

function renderRatioBadge(issue: ContrastIssue): string {
  const sevColor = contrastBorderColor(issue);
  return `<span style="background: ${sevColor}12; color: ${sevColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; flex-shrink: 0;">${issue.ratio}:1</span>`;
}

function renderContrastExtraBody(issue: ContrastIssue): string {
  const fg = escHtml(issue.foreground);
  const bg = escHtml(issue.background);
  const aaOk = issue.passesAA;
  const aaaOk = issue.passesAAA;
  const aaColor = aaOk ? '#15803D' : '#EF4444';
  const aaaColor = aaaOk ? '#15803D' : '#EF4444';
  const aaMark = aaOk ? '&#10003;' : '&#10007;';
  const aaaMark = aaaOk ? '&#10003;' : '&#10007;';
  const meta = `${Math.round(issue.fontSize)}px${issue.isBold ? ' bold' : ''}${issue.isLargeText ? ' (large)' : ''}`;

  return `
    <div style="display: flex !important; gap: 8px !important; align-items: center !important; margin-bottom: 8px !important;">
      <div style="display: flex !important; align-items: center !important; gap: 6px !important;">
        <span style="display: inline-block !important; width: 18px !important; height: 18px !important; border-radius: 4px !important; background: ${issue.foreground} !important; border: 1px solid #E5E7EB !important;"></span>
        <span style="font-size: 11px !important; color: #6B7280 !important; font-family: monospace !important;">${fg}</span>
      </div>
      <span style="color: #6B7280 !important; font-size: 11px !important;">on</span>
      <div style="display: flex !important; align-items: center !important; gap: 6px !important;">
        <span style="display: inline-block !important; width: 18px !important; height: 18px !important; border-radius: 4px !important; background: ${issue.background} !important; border: 1px solid #E5E7EB !important;"></span>
        <span style="font-size: 11px !important; color: #6B7280 !important; font-family: monospace !important;">${bg}</span>
      </div>
    </div>
    <div style="display: flex !important; gap: 8px !important; font-size: 11px !important; flex-wrap: wrap !important;">
      <span style="color: ${aaColor} !important; font-weight: 600 !important;">${aaMark} AA (${issue.requiredAA}:1)</span>
      <span style="color: ${aaaColor} !important; font-weight: 600 !important;">${aaaMark} AAA (${issue.requiredAAA}:1)</span>
      <span style="color: #6B7280 !important;">${escHtml(meta)}</span>
    </div>`;
}

export function renderContrastResults(issues: ContrastIssue[]): string {
  const aaFails = issues.filter(i => !i.passesAA).length;
  const stats = [
    {
      label: issues.length === 1 ? 'issue' : 'issues',
      value: issues.length,
      color: '#1F2937',
    },
    {
      label: aaFails === 1 ? 'AA failure' : 'AA failures',
      value: aaFails,
      color: '#DC2626',
    },
  ];

  let bodyHtml = '';
  if (issues.length > 0) {
    bodyHtml = issues
      .map((issue, idx) =>
        renderIssueCard({
          idx,
          borderColor: contrastBorderColor(issue),
          badgeHtml: renderRatioBadge(issue),
          titleHtml: `"${escHtml(issue.text)}"`,
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
          extraBodyHtml: renderContrastExtraBody(issue) + renderKnowledgeBlock(CONTRAST_KNOWLEDGE),
        })
      )
      .join('');
  }

  return renderResultsPage({
    title: 'Color Contrast',
    backLabel: 'Back',
    stats,
    bodyHtml,
    emptyMessage:
      issues.length === 0 ? 'All text passes AA contrast requirements.' : undefined,
  });
}

export function attachContrastListeners(
  container: HTMLElement,
  issues: ContrastIssue[],
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  }
): void {
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    },
  });
}
