import type { KeyboardIssue, KeyboardIssueType, KeyboardPriority, ComponentCluster, ComponentTabFlow } from '../../core/types';
import { KB_TYPE_LABELS, KB_TYPE_PRIORITY, KB_PRIORITY_LABELS } from '../../core/types';
import { findRegionForElement } from '../../core/region-detection';
import { escHtml } from '../../utils/escape';
import { getElementContext } from '../../utils/wcag-map';
import { SEV, PRIO } from '../tokens';
import { renderNavBar, renderAccordion, attachAccordionListeners, renderSeverityBadge, renderPriorityBadge, renderCountBadge, hoverListeners } from './helpers';

export type KbGroupMode = 'type' | 'region' | 'component';

export interface KbData {
  issues: KeyboardIssue[];
  componentFlows: ComponentTabFlow[];
  components: Map<string, ComponentCluster>;
  groupMode: KbGroupMode;
  severityFilter: Set<'error' | 'warning' | 'info'>;
}

export function renderKeyboardResults(data: KbData): string {
  const filtered = data.issues.filter(i => data.severityFilter.has(i.severity));
  const errors = filtered.filter(i => i.severity === 'error').length;
  const warnings = filtered.filter(i => i.severity === 'warning').length;
  const infos = filtered.filter(i => i.severity === 'info').length;

  let html = renderNavBar('Keyboard Issues', true, 'Back');

  html += `
    <div style="padding: 12px 16px !important; background: white !important; border-bottom: 1px solid #E5E7EB !important; display: flex !important; gap: 16px !important; flex-wrap: wrap !important; font-size: 13px !important; font-weight: 600 !important;">
      <span class="a11y-text-secondary">${filtered.length} total</span>
      ${errors > 0 ? `<span style="color: ${SEV.error.badge} !important;">${errors} Error${errors !== 1 ? 's' : ''}</span>` : ''}
      ${warnings > 0 ? `<span style="color: ${SEV.warning.badge} !important;">${warnings} Warning${warnings !== 1 ? 's' : ''}</span>` : ''}
      ${infos > 0 ? `<span style="color: ${SEV.info.badge} !important;">${infos} Info</span>` : ''}
    </div>
  `;

  html += `<div style="background: white !important; padding: 10px 16px 6px 16px !important; display: flex !important; gap: 8px !important; flex-wrap: wrap !important; align-items: center !important;">`;
  (['error', 'warning', 'info'] as const).forEach(sev => {
    const active = data.severityFilter.has(sev);
    const s = SEV[sev];
    html += `
      <button class="kb-sev-filter" data-sev="${sev}" style="padding: 6px 14px !important; border: 1px solid ${active ? s.badge : '#D1D5DB'} !important; border-radius: 20px !important; font-size: 12px !important; cursor: pointer !important; background: ${active ? s.bg : 'white'} !important; color: ${active ? s.text : '#6B7280'} !important; font-weight: 600 !important; transition: all 0.15s;">
        ${s.label}
      </button>
    `;
  });
  html += `</div>`;

  html += `<div style="background: white !important; padding: 6px 16px 12px 16px !important; border-bottom: 1px solid #E5E7EB !important; display: flex !important; gap: 8px !important; flex-wrap: wrap !important; align-items: center !important;">`;

  (['type', 'region', 'component'] as KbGroupMode[]).forEach(mode => {
    const active = data.groupMode === mode;
    html += `
      <button class="kb-group-btn" data-mode="${mode}" style="padding: 6px 14px !important; border: 1px solid ${active ? '#6366F1' : '#D1D5DB'} !important; border-radius: 6px !important; font-size: 12px !important; cursor: pointer !important; background: ${active ? '#EEF2FF' : 'white'} !important; color: ${active ? '#6366F1' : '#6B7280'} !important; font-weight: ${active ? '600' : '500'} !important; transition: all 0.15s;">
        ${mode === 'type' ? 'By Type' : mode === 'region' ? 'By Region' : 'By Component'}
      </button>
    `;
  });

  html += `</div>`;

  if (data.componentFlows.length > 0) {
    html += `
      <div style="background: white !important; padding: 6px 16px 10px 16px !important; border-bottom: 1px solid #E5E7EB !important;">
        <button id="btn-go-component-flow" style="padding: 6px 14px !important; border: 1px solid #16A34A !important; border-radius: 6px !important; font-size: 12px !important; cursor: pointer !important; background: #F0FDF4 !important; color: #15803D !important; font-weight: 600 !important; transition: all 0.15s;">
          Component flow &rarr;
        </button>
      </div>
    `;
  }

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (filtered.length === 0) {
    html += `<div style="text-align: center; padding: 24px; color: #15803D; font-weight: 500; font-size: 14px;">No issues match the current filters.</div>`;
  } else if (data.groupMode === 'type') {
    html += renderByType(filtered);
  } else if (data.groupMode === 'region') {
    html += renderByRegion(filtered);
  } else {
    html += renderByComponent(filtered, data.components);
  }

  html += `</div>`;
  return html;
}

function renderByType(issues: KeyboardIssue[]): string {
  const groups = new Map<KeyboardIssueType, KeyboardIssue[]>();
  issues.forEach(issue => {
    if (!groups.has(issue.type)) groups.set(issue.type, []);
    groups.get(issue.type)!.push(issue);
  });

  const sorted = Array.from(groups.entries()).sort((a, b) => {
    const pa = KB_TYPE_PRIORITY[a[0]];
    const pb = KB_TYPE_PRIORITY[b[0]];
    return pa - pb;
  });

  let html = '';
  sorted.forEach(([type, typeIssues]) => {
    const priority = KB_TYPE_PRIORITY[type];
    const sev = typeIssues[0].severity;

    const headerHtml = `<div style="min-width: 0;">
      <div style="font-weight: 600; font-size: 14px; color: #1F2937;">${escHtml(KB_TYPE_LABELS[type])}</div>
      <div style="display: flex; gap: 4px; margin-top: 4px;">${renderPriorityBadge(priority)}</div>
    </div>`;

    const badges = `<div style="display: flex; align-items: center; gap: 8px;">${renderSeverityBadge(sev)}${renderCountBadge(typeIssues.length)}</div>`;

    let body = '';
    typeIssues.forEach((issue, iIdx) => {
      body += renderKbIssueRow(issue, `kbt-${type}-${iIdx}`);
    });

    html += renderAccordion(`kbt-${type}`, headerHtml, badges, body);
  });

  return html;
}

function renderByRegion(issues: KeyboardIssue[]): string {
  const regionGroups = new Map<string, { name: string; issues: KeyboardIssue[] }>();
  issues.forEach(issue => {
    const info = findRegionForElement(issue.element);
    if (!regionGroups.has(info.name)) regionGroups.set(info.name, { name: info.name, issues: [] });
    regionGroups.get(info.name)!.issues.push(issue);
  });

  const sorted = Array.from(regionGroups.values()).sort((a, b) => b.issues.length - a.issues.length);
  let html = '';

  sorted.forEach((group, gIdx) => {
    const errCount = group.issues.filter(i => i.severity === 'error').length;
    const warnCount = group.issues.filter(i => i.severity === 'warning').length;

    const headerHtml = `<span style="font-weight: 600; font-size: 14px; color: #1F2937;">${escHtml(group.name)}</span>`;
    const badges = `<div style="display: flex; align-items: center; gap: 6px;">
      ${errCount > 0 ? `<span style="background: ${SEV.error.bg}; color: ${SEV.error.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${errCount}E</span>` : ''}
      ${warnCount > 0 ? `<span style="background: ${SEV.warning.bg}; color: ${SEV.warning.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${warnCount}W</span>` : ''}
      ${renderCountBadge(group.issues.length)}
    </div>`;

    let body = '';
    group.issues.forEach((issue, iIdx) => {
      body += renderKbIssueRow(issue, `kbr-${gIdx}-${iIdx}`);
    });

    html += renderAccordion(`kbr-${gIdx}`, headerHtml, badges, body);
  });

  return html;
}

function renderByComponent(issues: KeyboardIssue[], components: Map<string, ComponentCluster>): string {
  const compGroups = new Map<string, { name: string; issues: KeyboardIssue[] }>();

  issues.forEach(issue => {
    let matched = false;
    components.forEach(cluster => {
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
  let html = '';

  sorted.forEach((group, gIdx) => {
    const errCount = group.issues.filter(i => i.severity === 'error').length;
    const warnCount = group.issues.filter(i => i.severity === 'warning').length;

    const headerHtml = `<span style="font-weight: 600; font-size: 14px; color: #1F2937;">${escHtml(group.name)}</span>`;
    const badges = `<div style="display: flex; align-items: center; gap: 6px;">
      ${errCount > 0 ? `<span style="background: ${SEV.error.bg}; color: ${SEV.error.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${errCount}E</span>` : ''}
      ${warnCount > 0 ? `<span style="background: ${SEV.warning.bg}; color: ${SEV.warning.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${warnCount}W</span>` : ''}
      ${renderCountBadge(group.issues.length)}
    </div>`;

    let body = '';
    group.issues.forEach((issue, iIdx) => {
      body += renderKbIssueRow(issue, `kbc-${gIdx}-${iIdx}`);
    });

    html += renderAccordion(`kbc-${gIdx}`, headerHtml, badges, body);
  });

  return html;
}

function renderKbIssueRow(issue: KeyboardIssue, key: string): string {
  const context = getElementContext(issue.element);
  const s = SEV[issue.severity];
  const prio = PRIO[issue.priority];

  return `
    <div class="kb-issue-row" data-key="${key}" style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${s.badge} !important; border-radius: 8px !important; padding: 12px 14px !important; margin-bottom: 8px !important; cursor: pointer !important; transition: border-color 0.15s;">
      <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 6px !important;">
        <span style="font-size: 13px !important; font-weight: 500 !important; color: #1F2937 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important;">${escHtml(context)}</span>
        <div style="display: flex !important; gap: 6px !important; flex-shrink: 0 !important; margin-left: 8px !important;">
          <span style="background: ${prio.bg} !important; color: ${prio.text} !important; padding: 2px 8px !important; border-radius: 4px !important; font-size: 11px !important; font-weight: 700 !important;">${KB_PRIORITY_LABELS[issue.priority as KeyboardPriority]}</span>
        </div>
      </div>
      <p style="margin: 0 !important; font-size: 12px !important; color: #6B7280 !important; line-height: 1.5 !important;">${escHtml(issue.description.substring(0, 140))}${issue.description.length > 140 ? '...' : ''}</p>
      <div style="text-align: right !important; margin-top: 6px !important;">
        <span style="font-size: 12px !important; color: #6366F1 !important; font-weight: 500 !important;">Highlight &rarr;</span>
      </div>
    </div>
  `;
}

export function attachKeyboardListeners(container: HTMLElement, data: KbData, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
  onNavigateFlow: () => void;
  onGroupModeChange: (mode: KbGroupMode) => void;
  onSeverityFilterChange: (filter: Set<'error' | 'warning' | 'info'>) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelector('#btn-go-component-flow')?.addEventListener('click', () => actions.onNavigateFlow());

  container.querySelectorAll('.kb-group-btn').forEach(el => {
    el.addEventListener('click', () => {
      actions.onGroupModeChange((el.getAttribute('data-mode') as KbGroupMode) || 'type');
    });
  });

  container.querySelectorAll('.kb-sev-filter').forEach(el => {
    el.addEventListener('click', () => {
      const sev = el.getAttribute('data-sev') as 'error' | 'warning' | 'info';
      const newFilter = new Set(data.severityFilter);
      if (newFilter.has(sev)) {
        if (newFilter.size > 1) newFilter.delete(sev);
      } else {
        newFilter.add(sev);
      }
      actions.onSeverityFilterChange(newFilter);
    });
  });

  attachAccordionListeners(container);

  container.querySelectorAll('.kb-issue-row').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-key') || '';
      const issue = findIssueByKey(key, data);
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.kb-issue-row', '#6366F1', '#E5E7EB');
}

function findIssueByKey(key: string, data: KbData): KeyboardIssue | null {
  const filtered = data.issues.filter(i => data.severityFilter.has(i.severity));
  const parts = key.split('-');

  if (key.startsWith('kbt-')) {
    const type = parts.slice(1, -1).join('-') as KeyboardIssueType;
    const idx = parseInt(parts[parts.length - 1], 10);
    const ofType = filtered.filter(i => i.type === type);
    return ofType[idx] || null;
  }

  if (key.startsWith('kbr-')) {
    const gIdx = parseInt(parts[1], 10);
    const iIdx = parseInt(parts[2], 10);
    const regionMap = new Map<string, KeyboardIssue[]>();
    filtered.forEach(issue => {
      const name = findRegionForElement(issue.element).name;
      if (!regionMap.has(name)) regionMap.set(name, []);
      regionMap.get(name)!.push(issue);
    });
    const sorted = Array.from(regionMap.values()).sort((a, b) => b.length - a.length);
    return sorted[gIdx]?.[iIdx] || null;
  }

  if (key.startsWith('kbc-')) {
    const gIdx = parseInt(parts[1], 10);
    const iIdx = parseInt(parts[2], 10);
    const compMap = new Map<string, KeyboardIssue[]>();
    filtered.forEach(issue => {
      let matched = false;
      data.components.forEach(cluster => {
        for (const root of cluster.elements) {
          if (root.contains(issue.element)) {
            if (!compMap.has(cluster.id)) compMap.set(cluster.id, []);
            compMap.get(cluster.id)!.push(issue);
            matched = true;
            break;
          }
        }
      });
      if (!matched) {
        if (!compMap.has('__uncat')) compMap.set('__uncat', []);
        compMap.get('__uncat')!.push(issue);
      }
    });
    const sorted = Array.from(compMap.values()).sort((a, b) => b.length - a.length);
    return sorted[gIdx]?.[iIdx] || null;
  }

  return null;
}
