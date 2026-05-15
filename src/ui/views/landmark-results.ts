import type { LandmarkAnalysisResult, LandmarkIssue } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  attachResultsPageListeners,
} from './results-template';

const ROLE_COLORS: Record<string, string> = {
  banner: '#6366F1', navigation: '#F59E0B', main: '#16A34A', complementary: '#7C3AED',
  contentinfo: '#0891B2', search: '#D97706', form: '#2563EB', region: '#6B7280',
};

function renderLandmarkCards(landmarks: LandmarkAnalysisResult['landmarks'], startIdx: number): string {
  return landmarks.map((lm, i) => {
    const color = ROLE_COLORS[lm.role] || '#6B7280';
    const idx = startIdx + i;
    const labelLine = lm.label
      ? escHtml(lm.label)
      : `<span style="color: #6B7280 !important; font-style: italic !important;">no label</span>`;
    const tagSnippet = `&lt;${escHtml(lm.element.tagName.toLowerCase())}&gt;`;

    return renderIssueCard({
      idx,
      borderColor: color,
      badgeHtml: `<span class="a11y-badge" style="background: ${color} !important; color: white !important;">${escHtml(lm.role)}</span>`,
      titleHtml: labelLine,
      descriptionHtml: tagSnippet,
      selector: getCssSelector(lm.element),
      snippet: getSnippet(lm.element),
    });
  }).join('');
}

function renderIssueCards(issues: LandmarkIssue[]): string {
  return issues.map((issue, idx) => {
    const sev = issue.severity as SeverityKey;
    const s = SEV[sev] || SEV.info;
    return renderIssueCard({
      idx,
      borderColor: s.badge,
      badgeHtml: renderSeverityBadge(issue.severity),
      titleHtml: escHtml(issue.description),
      selector: issue.element ? getCssSelector(issue.element) : '(page-level)',
      snippet: issue.element ? getSnippet(issue.element) : '',
      extraBodyHtml: issue.element
        ? ''
        : `<div style="font-size: 12px !important; color: #6B7280 !important; padding: 4px 0 !important;">Page-level structural issue</div>`,
    });
  }).join('');
}

export function renderLandmarkResults(data: LandmarkAnalysisResult): string {
  const issueCount = data.issues.length;
  const errors = data.issues.filter(i => i.severity === 'error').length;
  const warnings = data.issues.filter(i => i.severity === 'warning').length;
  const infos = data.issues.filter(i => i.severity === 'info').length;

  let bodyHtml = '';

  if (issueCount > 0) {
    bodyHtml += `
      <div style="margin-bottom: 18px !important;">
        <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">Issues (${issueCount})</div>
        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; margin-top: 10px !important;">
          ${renderIssueCards(data.issues)}
        </div>
      </div>`;
  }

  bodyHtml += `
    <div style="margin-bottom: 18px !important;">
      <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">Page Landmarks (${data.landmarks.length})</div>
      <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; margin-top: 10px !important;">
        ${data.landmarks.length === 0
          ? `<div style="text-align: center !important; padding: 20px !important; color: #6B7280 !important;">No landmarks found on this page.</div>`
          : renderLandmarkCards(data.landmarks, data.issues.length)}
      </div>
    </div>`;

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: data.landmarks.length === 1 ? 'landmark' : 'landmarks', value: data.landmarks.length },
    { label: issueCount === 1 ? 'issue' : 'issues', value: issueCount, color: issueCount > 0 ? '#EF4444' : '#16A34A' },
  ];

  if (errors > 0) stats.push({ label: 'Errors', value: errors, color: SEV.error.badge });
  if (warnings > 0) stats.push({ label: 'Warnings', value: warnings, color: SEV.warning.badge });
  if (infos > 0) stats.push({ label: 'Info', value: infos, color: SEV.info.badge });

  return renderResultsPage({
    title: 'Landmark Overview',
    backLabel: 'Back',
    stats,
    bodyHtml,
    emptyMessage: data.landmarks.length === 0 && issueCount === 0 ? 'No landmarks found.' : undefined,
  });
}

export function attachLandmarkListeners(
  container: HTMLElement,
  data: LandmarkAnalysisResult,
  actions: { onBack: () => void; onHighlight: (els: Element[]) => void },
): void {
  const allItems = [
    ...data.issues.map(i => i.element),
    ...data.landmarks.map(l => l.element),
  ];

  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      const el = allItems[idx];
      if (el) actions.onHighlight([el]);
    },
  });
}
