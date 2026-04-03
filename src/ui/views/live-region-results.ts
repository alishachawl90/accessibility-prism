import type { LiveRegionResult } from '../../core/types';
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

const LIVE_COLORS: Record<string, string> = {
  assertive: '#EF4444',
  polite: '#2563EB',
  off: '#6B7280',
};

export function renderLiveRegionResults(data: LiveRegionResult): string {
  const stats = [
    {
      label: data.regions.length === 1 ? 'region' : 'regions',
      value: data.regions.length,
      color: '#1F2937',
    },
    {
      label: data.issues.length === 1 ? 'issue' : 'issues',
      value: data.issues.length,
      color: data.issues.length > 0 ? '#F59E0B' : '#16A34A',
    },
  ];

  let bodyHtml = '';

  if (data.issues.length > 0) {
    bodyHtml += `<div style="margin-bottom: 16px;"><div class="a11y-section-title">Issues</div>`;
    bodyHtml += data.issues
      .map((issue, idx) => {
        const sev = SEV[issue.severity as SeverityKey];
        return renderIssueCard({
          idx,
          borderColor: sev?.border || '#E5E7EB',
          badgeHtml: renderSeverityBadge(issue.severity),
          titleHtml: escHtml(issue.description),
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
        });
      })
      .join('');
    bodyHtml += `</div>`;
  }

  bodyHtml += `<div class="a11y-section-title">Detected Regions</div>`;

  const regionBaseIdx = data.issues.length;

  if (data.regions.length === 0) {
    bodyHtml += `<div class="a11y-empty-state">No live regions found on this page.</div>`;
  } else {
    bodyHtml += data.regions
      .map((region, idx) => {
        const color = LIVE_COLORS[region.ariaLive] || '#6B7280';
        const content = region.element.textContent?.trim().substring(0, 80) || '';
        const badgeHtml = `<span class="a11y-badge" style="background: ${color} !important; color: white !important;">aria-live="${escHtml(region.ariaLive)}"</span>`;
        const descriptionHtml = content
          ? escHtml(content)
          : `<span style="font-style: italic !important; color: #6B7280 !important;">empty</span>`;
        return renderIssueCard({
          idx: regionBaseIdx + idx,
          borderColor: color,
          badgeHtml,
          titleHtml: escHtml(region.role),
          descriptionHtml,
          selector: getCssSelector(region.element),
          snippet: getSnippet(region.element),
        });
      })
      .join('');
  }

  return renderResultsPage({
    title: 'Live Regions',
    backLabel: 'Back',
    stats,
    bodyHtml,
  });
}

export function attachLiveRegionListeners(
  container: HTMLElement,
  data: LiveRegionResult,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
  }
): void {
  const issueCount = data.issues.length;
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      if (idx < issueCount) {
        const issue = data.issues[idx];
        if (issue) actions.onHighlight([issue.element]);
      } else {
        const region = data.regions[idx - issueCount];
        if (region) actions.onHighlight([region.element]);
      }
    },
  });
}
