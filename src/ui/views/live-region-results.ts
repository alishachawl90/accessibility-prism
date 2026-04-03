import type { LiveRegionResult, LiveRegionIssue, LiveRegionIssueType, LiveRegionInfo } from '../../core/types';
import { LR_TYPE_LABELS } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { SEV, type SeverityKey } from '../tokens';
import { ICON_CHEVRON_RIGHT } from '../icons';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  getCssSelector,
  getSnippet,
  attachResultsPageListeners,
} from './results-template';
import { renderCountBadge } from './helpers';

const LIVE_COLORS: Record<string, string> = {
  assertive: '#EF4444',
  polite: '#2563EB',
  off: '#6B7280',
};

interface LrSection {
  type: LiveRegionIssueType;
  title: string;
  issues: LiveRegionIssue[];
}

function getIssueSections(issues: LiveRegionIssue[]): LrSection[] {
  const groups = new Map<LiveRegionIssueType, LiveRegionIssue[]>();
  issues.forEach(issue => {
    if (!groups.has(issue.type)) groups.set(issue.type, []);
    groups.get(issue.type)!.push(issue);
  });
  const typeOrder: LiveRegionIssueType[] = ['empty-alert', 'live-region-hidden', 'implicit-live-region', 'missing-aria-live'];
  return typeOrder
    .filter(t => groups.has(t))
    .map(t => ({
      type: t,
      title: LR_TYPE_LABELS[t],
      issues: groups.get(t)!,
    }));
}

function getHealthyRegions(data: LiveRegionResult): LiveRegionInfo[] {
  const issueElements = new Set(data.issues.map(i => i.element));
  return data.regions.filter(r => !issueElements.has(r.element));
}

function renderSectionAccordion(
  key: string,
  title: string,
  count: number,
  innerCards: string,
  options?: { borderColor?: string; defaultOpen?: boolean },
): string {
  const headerHtml = `<span style="font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important;">${escHtml(title)}</span>`;
  const badgeHtml = renderCountBadge(count, options?.borderColor);
  const borderLeft = options?.borderColor || '#E5E7EB';
  const isOpen = options?.defaultOpen ?? false;

  return `
    <div style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${borderLeft} !important; border-radius: 8px !important; margin-bottom: 10px !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
      <div class="lr-acc-header" data-key="${escHtml(key)}" style="padding: 14px 16px !important; cursor: pointer !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: background 0.1s !important;">
        <div style="display: flex !important; align-items: center !important; gap: 10px !important; flex: 1 !important; min-width: 0 !important;">
          <span class="lr-acc-chevron" data-key="${escHtml(key)}" style="transition: transform 0.2s !important; flex-shrink: 0 !important; color: #6B7280 !important; ${isOpen ? 'transform: rotate(90deg) !important;' : ''}">${ICON_CHEVRON_RIGHT}</span>
          ${headerHtml}
        </div>
        ${badgeHtml}
      </div>
      <div class="lr-acc-body" data-key="${escHtml(key)}" style="display: ${isOpen ? 'block' : 'none'} !important; padding: 8px 16px 14px 16px !important; border-top: 1px solid #F3F4F6 !important;">
        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important;">
          ${innerCards}
        </div>
      </div>
    </div>`;
}

function renderBreakdownBar(data: LiveRegionResult): string {
  const assertiveCount = data.regions.filter(r => r.ariaLive === 'assertive').length;
  const politeCount = data.regions.filter(r => r.ariaLive === 'polite').length;
  const emptyCount = data.regions.filter(r => !r.hasContent).length;
  const healthy = getHealthyRegions(data).length;

  const pill = (label: string, value: number, color: string) => `
    <div style="flex: 1 !important; background: ${color}0D !important; border: 1px solid ${color}33 !important; border-radius: 6px !important; padding: 8px 10px !important; text-align: center !important;">
      <div style="font-size: 18px !important; font-weight: 700 !important; color: ${color} !important; line-height: 1.3 !important;">${value}</div>
      <div style="font-size: 11px !important; color: #6B7280 !important; font-weight: 500 !important; margin-top: 2px !important;">${escHtml(label)}</div>
    </div>`;

  return `
    <div style="display: flex !important; gap: 8px !important; margin-bottom: 16px !important;">
      ${pill('assertive', assertiveCount, '#EF4444')}
      ${pill('polite', politeCount, '#2563EB')}
      ${pill('empty', emptyCount, '#F59E0B')}
      ${pill('healthy', healthy, '#16A34A')}
    </div>`;
}

export interface LrViewData {
  result: LiveRegionResult;
  severityFilter: Set<string>;
}

export function renderLiveRegionResults(data: LrViewData): string {
  const { result, severityFilter } = data;
  const filtered = result.issues.filter(i => severityFilter.has(i.severity));
  const warnings = result.issues.filter(i => i.severity === 'warning').length;
  const infos = result.issues.filter(i => i.severity === 'info').length;

  const stats = [
    { label: result.regions.length === 1 ? 'region' : 'regions', value: result.regions.length, color: '#1F2937' },
    { label: result.issues.length === 1 ? 'issue' : 'issues', value: result.issues.length, color: result.issues.length > 0 ? '#F59E0B' : '#16A34A' },
  ];

  let bodyHtml = '';

  bodyHtml += renderBreakdownBar(result);

  // Issue sections grouped by type
  const sections = getIssueSections(filtered);
  const flatIssues: LiveRegionIssue[] = [];

  if (sections.length > 0) {
    sections.forEach((sec, secIdx) => {
      const cardsHtml = sec.issues.map(issue => {
        const idx = flatIssues.length;
        flatIssues.push(issue);
        const sev = SEV[issue.severity as SeverityKey];
        const role = issue.element.getAttribute('role') || issue.element.tagName.toLowerCase();
        const ariaLive = issue.element.getAttribute('aria-live') || '';
        const descParts: string[] = [];
        if (role) descParts.push(`role="${escHtml(role)}"`);
        if (ariaLive) descParts.push(`aria-live="${escHtml(ariaLive)}"`);
        return renderIssueCard({
          idx,
          borderColor: sev?.badge || '#E5E7EB',
          badgeHtml: renderSeverityBadge(issue.severity),
          titleHtml: `<span style="font-size: 12px !important; color: #374151 !important;">${escHtml(issue.element.tagName.toLowerCase())}</span>` +
            (descParts.length > 0 ? ` <span style="font-size: 11px !important; color: #6B7280 !important;">${descParts.join(' · ')}</span>` : ''),
          descriptionHtml: escHtml(issue.description),
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
        });
      }).join('');

      const sevColor = sec.issues[0] ? SEV[sec.issues[0].severity as SeverityKey]?.badge : undefined;
      bodyHtml += renderSectionAccordion(
        `lr-issue-${secIdx}`,
        sec.title,
        sec.issues.length,
        cardsHtml,
        { borderColor: sevColor, defaultOpen: secIdx === 0 },
      );
    });
  }

  // Healthy regions accordion (collapsed by default)
  const healthy = getHealthyRegions(result);
  if (healthy.length > 0) {
    const healthyBaseIdx = flatIssues.length;
    const healthyCardsHtml = healthy.map((region, idx) => {
      const color = LIVE_COLORS[region.ariaLive] || '#6B7280';
      const content = region.element.textContent?.trim().substring(0, 80) || '';
      const badgeHtml = `<span class="a11y-badge" style="background: ${color} !important; color: white !important;">aria-live="${escHtml(region.ariaLive)}"</span>`;
      const descriptionHtml = content
        ? escHtml(content)
        : `<span style="font-style: italic !important; color: #6B7280 !important;">empty</span>`;
      return renderIssueCard({
        idx: healthyBaseIdx + idx,
        borderColor: '#16A34A',
        badgeHtml,
        titleHtml: escHtml(region.role),
        descriptionHtml,
        selector: getCssSelector(region.element),
        snippet: getSnippet(region.element),
      });
    }).join('');

    bodyHtml += renderSectionAccordion(
      'lr-healthy',
      'Healthy Regions',
      healthy.length,
      healthyCardsHtml,
      { borderColor: '#16A34A' },
    );
  }

  return renderResultsPage({
    title: 'Live Regions',
    backLabel: 'Back',
    stats,
    chips: {
      levels: [
        { key: 'warning', count: warnings },
        { key: 'info', count: infos },
      ],
      active: severityFilter,
    },
    bodyHtml,
    emptyMessage: result.issues.length === 0 && result.regions.length === 0 ? 'No live regions found on this page.' : undefined,
  });
}

export function attachLiveRegionListeners(
  container: HTMLElement,
  data: LrViewData,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onSeverityChange: (next: Set<string>) => void;
  }
): void {
  const { result, severityFilter } = data;
  const filtered = result.issues.filter(i => severityFilter.has(i.severity));
  const sections = getIssueSections(filtered);
  const flatIssues: LiveRegionIssue[] = [];
  sections.forEach(sec => sec.issues.forEach(i => flatIssues.push(i)));
  const healthy = getHealthyRegions(result);

  const signal = attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onSeverityChange: actions.onSeverityChange,
      onHighlight: (idx) => {
        if (idx < flatIssues.length) {
          const issue = flatIssues[idx];
          if (issue) actions.onHighlight([issue.element]);
        } else {
          const region = healthy[idx - flatIssues.length];
          if (region) actions.onHighlight([region.element]);
        }
      },
    },
    { active: severityFilter },
  );

  // Accordion expand/collapse
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const header = target.closest('.lr-acc-header') as HTMLElement;
    if (!header) return;
    const key = header.getAttribute('data-key');
    if (!key) return;
    const body = container.querySelector(`.lr-acc-body[data-key="${key}"]`) as HTMLElement;
    const chevron = container.querySelector(`.lr-acc-chevron[data-key="${key}"]`) as HTMLElement;
    if (body) {
      const isOpen = body.style.display !== 'none' && body.style.display !== '';
      body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
    }
  }, { signal });
}
