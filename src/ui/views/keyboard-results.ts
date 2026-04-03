import type { KeyboardIssue, KeyboardIssueType, KeyboardPriority, ComponentCluster, ComponentTabFlow } from '../../core/types';
import { KB_TYPE_LABELS, KB_TYPE_PRIORITY, KB_PRIORITY_LABELS } from '../../core/types';
import { findRegionForElement } from '../../core/region-detection';
import { escHtml } from '../../utils/escape';
import { getElementContext } from '../../utils/wcag-map';
import { KB_KNOWLEDGE, renderKnowledgeBlock } from '../../utils/issue-knowledge';
import { SEV, PRIO } from '../tokens';
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

export type KbGroupMode = 'type' | 'region' | 'component';

export interface KbData {
  issues: KeyboardIssue[];
  componentFlows: ComponentTabFlow[];
  components: Map<string, ComponentCluster>;
  groupMode: KbGroupMode;
  severityFilter: Set<'error' | 'warning' | 'info'>;
}

interface KbSection {
  title: string;
  issues: KeyboardIssue[];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max) + '…';
}

function getKeyboardSections(data: KbData, filtered: KeyboardIssue[]): KbSection[] {
  if (filtered.length === 0) return [];

  if (data.groupMode === 'type') {
    const groups = new Map<KeyboardIssueType, KeyboardIssue[]>();
    filtered.forEach(issue => {
      if (!groups.has(issue.type)) groups.set(issue.type, []);
      groups.get(issue.type)!.push(issue);
    });
    const sorted = Array.from(groups.entries()).sort((a, b) => KB_TYPE_PRIORITY[a[0]] - KB_TYPE_PRIORITY[b[0]]);
    return sorted.map(([type, typeIssues]) => ({
      title: KB_TYPE_LABELS[type],
      issues: typeIssues,
    }));
  }

  if (data.groupMode === 'region') {
    const regionGroups = new Map<string, { name: string; issues: KeyboardIssue[] }>();
    filtered.forEach(issue => {
      const info = findRegionForElement(issue.element);
      if (!regionGroups.has(info.name)) regionGroups.set(info.name, { name: info.name, issues: [] });
      regionGroups.get(info.name)!.issues.push(issue);
    });
    const sorted = Array.from(regionGroups.values()).sort((a, b) => b.issues.length - a.issues.length);
    return sorted.map(group => ({
      title: group.name,
      issues: group.issues,
    }));
  }

  const compGroups = new Map<string, { name: string; issues: KeyboardIssue[] }>();
  filtered.forEach(issue => {
    let matched = false;
    data.components.forEach(cluster => {
      for (const root of cluster.elements) {
        if (root.contains(issue.element)) {
          if (!compGroups.has(cluster.id)) compGroups.set(cluster.id, { name: cluster.name, issues: [] });
          compGroups.get(cluster.id)!.issues.push(issue);
          matched = true;
          break;
        }
      }
    });
    if (!matched) {
      if (!compGroups.has('__uncat')) compGroups.set('__uncat', { name: 'Uncategorized', issues: [] });
      compGroups.get('__uncat')!.issues.push(issue);
    }
  });
  const sorted = Array.from(compGroups.values()).sort((a, b) => b.issues.length - a.issues.length);
  return sorted.map(group => ({
    title: group.name,
    issues: group.issues,
  }));
}

function renderKbCardBadges(issue: KeyboardIssue): string {
  const prio = PRIO[issue.priority];
  const typeLabel = escHtml(KB_TYPE_LABELS[issue.type]);
  const prioLabel = escHtml(KB_PRIORITY_LABELS[issue.priority as KeyboardPriority]);
  return `
    <div style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; flex-shrink: 0 !important;">
      ${renderSeverityBadge(issue.severity)}
      <span style="background: ${prio.bg} !important; color: ${prio.text} !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 700 !important;">${prioLabel}</span>
      <span style="font-size: 11px !important; font-weight: 600 !important; color: #4B5563 !important; line-height: 1.3 !important;">${typeLabel}</span>
    </div>`;
}

function renderKbKnowledgeBlock(issue: KeyboardIssue): string {
  const k = KB_KNOWLEDGE[issue.type];
  return k ? renderKnowledgeBlock(k) : '';
}

function renderIssueCardsForIssues(issues: KeyboardIssue[], flatIssues: KeyboardIssue[]): string {
  return issues
    .map(issue => {
      const idx = flatIssues.length;
      flatIssues.push(issue);
      const s = SEV[issue.severity];
      return renderIssueCard({
        idx,
        borderColor: s.badge,
        badgeHtml: renderKbCardBadges(issue),
        titleHtml: escHtml(getElementContext(issue.element)),
        descriptionHtml: escHtml(truncate(issue.description, 220)),
        selector: getCssSelector(issue.element),
        snippet: getSnippet(issue.element),
        extraBodyHtml: renderKbKnowledgeBlock(issue),
      });
    })
    .join('');
}

function renderSectionAccordion(key: string, title: string, count: number, innerCards: string): string {
  const headerHtml = `<span style="font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important;">${escHtml(title)}</span>`;
  const badgeHtml = renderCountBadge(count);

  return `
    <div style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid #E5E7EB !important; border-radius: 8px !important; margin-bottom: 10px !important; overflow: hidden !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
      <div class="kb-acc-header" data-key="${escHtml(key)}" style="padding: 14px 16px !important; cursor: pointer !important; display: flex !important; justify-content: space-between !important; align-items: center !important; transition: background 0.1s !important;">
        <div style="display: flex !important; align-items: center !important; gap: 10px !important; flex: 1 !important; min-width: 0 !important;">
          <span class="kb-acc-chevron" data-key="${escHtml(key)}" style="transition: transform 0.2s !important; flex-shrink: 0 !important; color: #6B7280 !important;">${ICON_CHEVRON_RIGHT}</span>
          ${headerHtml}
        </div>
        ${badgeHtml}
      </div>
      <div class="kb-acc-body" data-key="${escHtml(key)}" style="display: none !important; padding: 8px 16px 14px 16px !important; border-top: 1px solid #F3F4F6 !important;">
        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important;">
          ${innerCards}
        </div>
      </div>
    </div>`;
}

export function renderKeyboardResults(data: KbData): string {
  const filtered = data.issues.filter(i => data.severityFilter.has(i.severity));
  const errors = filtered.filter(i => i.severity === 'error').length;
  const warnings = filtered.filter(i => i.severity === 'warning').length;
  const infos = filtered.filter(i => i.severity === 'info').length;

  const stats: { label: string; value: string | number; color?: string }[] = [
    {
      label: filtered.length === 1 ? 'issue' : 'issues',
      value: filtered.length,
      color: '#6B7280',
    },
  ];
  if (errors > 0) {
    stats.push({
      label: errors === 1 ? 'Error' : 'Errors',
      value: errors,
      color: SEV.error.badge,
    });
  }
  if (warnings > 0) {
    stats.push({
      label: warnings === 1 ? 'Warning' : 'Warnings',
      value: warnings,
      color: SEV.warning.badge,
    });
  }
  if (infos > 0) {
    stats.push({ label: infos === 1 ? 'Info' : 'Infos', value: infos, color: SEV.info.badge });
  }

  const sections = getKeyboardSections(data, filtered);
  const flatIssues: KeyboardIssue[] = [];
  const bodyHtml = sections
    .map((sec, i) => renderSectionAccordion(
      `kb-sec-${i}`,
      sec.title,
      sec.issues.length,
      renderIssueCardsForIssues(sec.issues, flatIssues),
    ))
    .join('');

  const toolbarHtml =
    data.componentFlows.length > 0
      ? `<button type="button" data-toolbar-action="component-flow" style="padding: 6px 14px !important; border: 1px solid #16A34A !important; border-radius: 6px !important; font-size: 12px !important; cursor: pointer !important; background: #F0FDF4 !important; color: #15803D !important; font-weight: 600 !important;">Component flow &rarr;</button>`
      : undefined;

  return renderResultsPage({
    title: 'Keyboard Issues',
    backLabel: 'Back',
    stats,
    chips: {
      levels: [
        { key: 'error', count: errors },
        { key: 'warning', count: warnings },
        { key: 'info', count: infos },
      ],
      active: data.severityFilter,
    },
    groupTabs: {
      modes: [
        { key: 'type', label: 'By Type' },
        { key: 'region', label: 'By Region' },
        { key: 'component', label: 'By Component' },
      ],
      active: data.groupMode,
    },
    toolbarHtml,
    bodyHtml,
    emptyMessage: filtered.length === 0 ? 'No issues match the current filters.' : undefined,
  });
}

export function attachKeyboardListeners(
  container: HTMLElement,
  data: KbData,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onNavigateFlow: () => void;
    onGroupModeChange: (mode: KbGroupMode) => void;
    onSeverityFilterChange: (filter: Set<'error' | 'warning' | 'info'>) => void;
  }
): void {
  const filtered = data.issues.filter(i => data.severityFilter.has(i.severity));
  const flatIssues = getKeyboardSections(data, filtered).flatMap(s => s.issues);

  const signal = attachResultsPageListeners(
    container,
    {
      onBack: actions.onBack,
      onSeverityChange: next => {
        actions.onSeverityFilterChange(next as Set<'error' | 'warning' | 'info'>);
      },
      onGroupChange: mode => {
        actions.onGroupModeChange((mode as KbGroupMode) || 'type');
      },
      onHighlight: idx => {
        const issue = flatIssues[idx];
        if (issue) actions.onHighlight([issue.element]);
      },
      onToolbarAction: action => {
        if (action === 'component-flow') actions.onNavigateFlow();
      },
    },
    { active: data.severityFilter }
  );

  // Accordion expand/collapse using delegated listener with AbortSignal
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const header = target.closest('.kb-acc-header') as HTMLElement;
    if (!header) return;
    const key = header.getAttribute('data-key');
    if (!key) return;
    const body = container.querySelector(`.kb-acc-body[data-key="${key}"]`) as HTMLElement;
    const chevron = container.querySelector(`.kb-acc-chevron[data-key="${key}"]`) as HTMLElement;
    if (body) {
      const isOpen = body.style.display !== 'none' && body.style.display !== '';
      body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
    }
  }, { signal });
}
