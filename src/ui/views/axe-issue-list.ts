import type { AxeViolation, AxeResultType, ComponentCluster, ComponentIssue } from '../../core/types';
import type { PageRegion } from '../../core/region-detection';
import { parseWcagInfo, getElementContext } from '../../utils/wcag-map';
import { escHtml } from '../../utils/escape';
import { IMPACT, WCAG_LEVEL, HIGHLIGHT, BORDER, RESULT_TYPE } from '../tokens';
import { renderNavBar, renderAccordion, attachAccordionListeners, renderCountBadge, hoverListeners } from './helpers';

const UNCATEGORIZED_ID = 'cmp_uncategorized';

export type GroupMode = 'rule' | 'region' | 'component';

export interface AxeListData {
  violations: AxeViolation[];
  components: Map<string, ComponentCluster>;
  dedupedIssues: ComponentIssue[];
  regions: PageRegion[];
  searchQuery: string;
  filterSeverity: 'ALL' | 'AA' | 'AAA';
  groupMode: GroupMode;
  activeResultTypes: Set<AxeResultType>;
}

function resultTypeBadge(type: AxeResultType): string {
  const t = RESULT_TYPE[type];
  return `<span style="background: ${t.bg} !important; color: ${t.text} !important; border: 1px solid ${t.border} !important; padding: 2px 7px !important; border-radius: 4px !important; font-size: 10px !important; font-weight: 600 !important; white-space: nowrap !important;">${t.icon} ${t.label}</span>`;
}

function resultTypeChip(type: AxeResultType, active: boolean, count: number): string {
  const t = RESULT_TYPE[type];
  const bg = active ? t.bg : 'white';
  const border = active ? t.border : '#D1D5DB';
  const color = active ? t.text : '#6B7280';
  return `
    <button class="result-type-chip" data-type="${type}" style="padding: 5px 10px !important; border: 1.5px solid ${border} !important; border-radius: 6px !important; font-size: 11px !important; cursor: pointer !important; background: ${bg} !important; color: ${color} !important; font-weight: 600 !important; transition: all 0.15s !important; display: flex !important; align-items: center !important; gap: 4px !important; white-space: nowrap !important;">
      <span style="font-size: 10px !important;">${t.icon}</span>
      ${t.label}
      <span style="background: ${active ? t.badge : '#D1D5DB'} !important; color: white !important; padding: 1px 6px !important; border-radius: 10px !important; font-size: 10px !important; font-weight: 700 !important; min-width: 18px !important; text-align: center !important;">${count}</span>
    </button>`;
}

export function renderAxeIssueList(data: AxeListData): string {
  const active = data.activeResultTypes;
  const visibleViolations = data.violations.filter(v => active.has(v.resultType));

  const totalNodes = visibleViolations.reduce((sum, v) => sum + v.nodes.length, 0);
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  visibleViolations.forEach(v => {
    const key = (v.impact || 'minor') as keyof typeof counts;
    if (counts[key] !== undefined) counts[key] += v.nodes.length;
  });

  const typeCounts: Record<AxeResultType, number> = { violation: 0, 'needs-review': 0, 'best-practice': 0, experimental: 0 };
  data.violations.forEach(v => { typeCounts[v.resultType] = (typeCounts[v.resultType] || 0) + v.nodes.length; });

  let html = renderNavBar('Issues', true, 'Back');

  // Result type filter chips
  html += `
    <div style="padding: 10px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important; display: flex !important; gap: 6px !important; flex-wrap: wrap !important;">
      ${resultTypeChip('violation', active.has('violation'), typeCounts.violation)}
      ${resultTypeChip('needs-review', active.has('needs-review'), typeCounts['needs-review'])}
      ${resultTypeChip('best-practice', active.has('best-practice'), typeCounts['best-practice'])}
      ${typeCounts.experimental > 0 ? resultTypeChip('experimental', active.has('experimental'), typeCounts.experimental) : ''}
    </div>
  `;

  // Impact summary counts
  html += `
    <div style="padding: 10px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important; display: flex !important; gap: 14px !important; flex-wrap: wrap !important; font-size: 13px !important; font-weight: 600 !important; align-items: center !important;">
      <span class="a11y-text-secondary">${totalNodes} total</span>
      ${counts.critical > 0 ? `<span style="color: ${IMPACT.critical.badge} !important;">${counts.critical} Critical</span>` : ''}
      ${counts.serious > 0 ? `<span style="color: ${IMPACT.serious.badge} !important;">${counts.serious} Serious</span>` : ''}
      ${counts.moderate > 0 ? `<span style="color: ${IMPACT.moderate.badge} !important;">${counts.moderate} Moderate</span>` : ''}
      ${counts.minor > 0 ? `<span style="color: ${IMPACT.minor.badge} !important;">${counts.minor} Minor</span>` : ''}
    </div>
  `;

  // Search + severity filter + group mode
  html += `
    <div style="background: white !important; padding: 12px 16px !important; border-bottom: 1px solid ${BORDER} !important;">
      <div style="display: flex !important; gap: 8px !important; margin-bottom: 10px !important; align-items: center !important;">
        <input type="text" id="filter-search" value="${escHtml(data.searchQuery)}" placeholder="Search by rule, WCAG criterion, tag..." style="flex: 1 !important; min-width: 0 !important; padding: 8px 12px !important; border: 1px solid #D1D5DB !important; border-radius: 8px !important; font-size: 13px !important; outline: none !important; color: #1F2937 !important; background: white !important; transition: border-color 0.15s;" onfocus="this.style.borderColor='#6366F1'" onblur="this.style.borderColor='#D1D5DB'" />
        <select id="filter-severity" style="width: 110px !important; flex-shrink: 0 !important; padding: 8px 6px !important; border: 1px solid #D1D5DB !important; border-radius: 8px !important; font-size: 12px !important; background: white !important; color: #374151 !important; cursor: pointer !important;">
          <option value="ALL" ${data.filterSeverity === 'ALL' ? 'selected' : ''}>All levels</option>
          <option value="AA" ${data.filterSeverity === 'AA' ? 'selected' : ''}>A + AA</option>
          <option value="AAA" ${data.filterSeverity === 'AAA' ? 'selected' : ''}>AAA only</option>
        </select>
      </div>
      <div style="display: flex; gap: 8px;">
        ${(['rule', 'region', 'component'] as GroupMode[]).map(mode => {
          const isActive = data.groupMode === mode;
          return `<button class="group-mode-btn" data-mode="${mode}" style="padding: 6px 14px; border: 1px solid ${isActive ? '#6366F1' : '#D1D5DB'}; border-radius: 6px; font-size: 12px; cursor: pointer; background: ${isActive ? '#EEF2FF' : 'white'}; color: ${isActive ? '#6366F1' : '#6B7280'}; font-weight: ${isActive ? '600' : '500'}; transition: all 0.15s;">
            ${mode === 'rule' ? 'By Rule' : mode === 'region' ? 'By Region' : 'By Component'}
          </button>`;
        }).join('')}
      </div>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  const filteredData = { ...data, violations: visibleViolations };

  if (data.groupMode === 'component') {
    html += renderComponentGroup(filteredData);
  } else if (data.groupMode === 'region') {
    html += renderRegionGroup(filteredData);
  } else {
    html += renderRuleGroup(filteredData);
  }

  html += `</div>`;
  return html;
}

function filterViolations(violations: AxeViolation[], search: string, sev: string): AxeViolation[] {
  return violations.filter(v => {
    const s = search.toLowerCase();
    if (s) {
      const wcag = parseWcagInfo(v.tags);
      const searchableText = [
        v.help, v.id, v.description,
        wcag.fullLabel, wcag.level,
        ...v.tags
      ].join(' ').toLowerCase();
      if (!searchableText.includes(s)) return false;
    }
    const wcag = parseWcagInfo(v.tags);
    if (sev === 'AA' && wcag.level === 'AAA') return false;
    if (sev === 'AAA' && wcag.level !== 'AAA') return false;
    return true;
  });
}

function renderRuleGroup(data: AxeListData): string {
  const filtered = filterViolations(data.violations, data.searchQuery, data.filterSeverity);
  if (filtered.length === 0) return `<div style="text-align: center; padding: 24px; color: #15803D; font-weight: 500; font-size: 14px;">No issues found matching your filters.</div>`;

  let html = '';
  filtered.forEach(v => {
    const wcag = parseWcagInfo(v.tags);
    const impact = IMPACT[(v.impact || 'minor') as keyof typeof IMPACT] || IMPACT.minor;
    html += `
      <div class="rule-card" data-id="${v.id}" style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${impact.badge} !important; border-radius: 8px !important; padding: 16px !important; margin-bottom: 10px !important; cursor: pointer !important; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
        <div style="display: flex !important; align-items: center !important; gap: 6px !important; margin-bottom: 8px !important;">
          <h3 style="margin: 0 !important; font-size: 14px !important; font-weight: 600 !important; line-height: 1.5 !important; color: #1F2937 !important; flex: 1 !important;">${escHtml(v.help)}</h3>
        </div>
        <div style="display: flex !important; justify-content: space-between !important; align-items: center !important;">
          <div style="display: flex !important; align-items: center !important; gap: 6px !important; flex-wrap: wrap !important;">
            ${resultTypeBadge(v.resultType)}
            <span style="background: ${WCAG_LEVEL[wcag.level]} !important; color: white !important; padding: 3px 8px !important; border-radius: 4px !important; font-weight: 600 !important; font-size: 11px !important;">${wcag.level}</span>
            <span style="font-size: 12px !important; color: #6B7280 !important;">${wcag.fullLabel || v.id}</span>
          </div>
          <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
            ${renderCountBadge(v.nodes.length, impact.badge)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    `;
  });
  return html;
}

function renderRegionGroup(data: AxeListData): string {
  let html = '';
  data.regions.forEach((region, rIdx) => {
    const filtered = region.violations.filter(v => {
      const s = data.searchQuery.toLowerCase();
      if (s && !v.help.toLowerCase().includes(s) && !v.ruleId.toLowerCase().includes(s)) return false;
      const wcag = parseWcagInfo(v.tags);
      if (data.filterSeverity === 'AA' && wcag.level === 'AAA') return false;
      if (data.filterSeverity === 'AAA' && wcag.level !== 'AAA') return false;
      return true;
    });
    if (filtered.length === 0) return;

    const ruleGroups = new Map<string, { help: string; tags: string[]; nodes: { node: Element; html: string }[] }>();
    filtered.forEach(v => {
      if (!ruleGroups.has(v.ruleId)) ruleGroups.set(v.ruleId, { help: v.help, tags: v.tags, nodes: [] });
      ruleGroups.get(v.ruleId)!.nodes.push({ node: v.node, html: v.html });
    });

    let body = '';
    ruleGroups.forEach((group, ruleId) => {
      const wcag = parseWcagInfo(group.tags);
      body += renderRuleSubGroup(ruleId, group.help, wcag, group.nodes, `region-${rIdx}`);
    });

    html += renderAccordion(
      `region-${rIdx}`,
      `<span style="font-weight: 600; font-size: 14px; color: #1F2937;">${escHtml(region.name)}</span>`,
      renderCountBadge(filtered.length),
      body
    );
  });
  return html;
}

function renderComponentGroup(data: AxeListData): string {
  if (data.dedupedIssues.length === 0 && data.components.size === 0) {
    return `<div class="a11y-empty-state">No component clusters detected on this page.</div>`;
  }

  const byComponent = new Map<string, ComponentIssue[]>();
  data.dedupedIssues.forEach(issue => {
    if (!byComponent.has(issue.componentId)) byComponent.set(issue.componentId, []);
    byComponent.get(issue.componentId)!.push(issue);
  });

  const sorted = Array.from(byComponent.entries()).sort((a, b) => {
    const ac = a[1].reduce((s, i) => s + i.count, 0);
    const bc = b[1].reduce((s, i) => s + i.count, 0);
    return bc - ac;
  });

  let html = '';
  sorted.forEach(([compId, issues], cIdx) => {
    const cluster = data.components.get(compId);
    const compName = issues[0]?.componentName || cluster?.name || `Component ${compId.substring(4, 10)}`;
    const totalIssues = issues.reduce((s, i) => s + i.count, 0);
    const totalInstances = cluster?.elements.length || issues[0]?.instanceCount || 0;

    const affectedElements = new Set<Element>();
    issues.forEach(issue => issue.nodes.forEach(n => {
      if (cluster) {
        const matched = cluster.elements.find(el => el.contains(n) || n.contains(el) || el === n);
        if (matched) affectedElements.add(matched);
      } else {
        affectedElements.add(n);
      }
    }));
    const affectedCount = affectedElements.size;

    let body = '';
    issues.forEach((issue, iIdx) => {
      const wcag = parseWcagInfo(issue.tags || []);
      const ruleKey = `comp-${cIdx}-rule-${iIdx}`;

      let nodeHtml = '';
      issue.nodes.forEach((nodeEl, nIdx) => {
        const context = getElementContext(nodeEl);
        nodeHtml += `
          <div class="comp-node" data-cidx="${cIdx}" data-iidx="${iIdx}" data-nidx="${nIdx}" style="padding: 8px 10px; margin-bottom: 4px; background: white; border: 1px solid #E5E7EB; border-radius: 6px; cursor: pointer; font-size: 12px; color: #374151; display: flex; justify-content: space-between; align-items: center; transition: border-color 0.15s;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${escHtml(context)}</span>
            <span style="color: ${HIGHLIGHT}; font-weight: 500; flex-shrink: 0; margin-left: 8px; font-size: 12px;">Highlight &rarr;</span>
          </div>
        `;
      });

      body += renderAccordion(
        ruleKey,
        `<div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #1F2937;">${escHtml(issue.help)}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: ${WCAG_LEVEL[wcag.level]}; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 600; font-size: 11px;">${wcag.level}</span>
            <span style="font-size: 12px; color: #6B7280;">${issue.ruleId}</span>
          </div>
        </div>`,
        `<span style="background: #F3F4F6; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #6B7280;">${issue.count}</span>`,
        nodeHtml
      );
    });

    body += `
      <button class="comp-highlight-btn" data-compid="${compId}" style="width: 100%; padding: 8px; background: #F5F3FF; border: 1px solid #C4B5FD; border-radius: 6px; cursor: pointer; font-size: 12px; color: ${HIGHLIGHT}; font-weight: 500; margin-top: 6px; transition: all 0.15s;">
        Highlight all ${totalInstances} instances on page
      </button>
    `;

    const instanceLabel = compId === UNCATEGORIZED_ID
      ? ''
      : `<div style="font-size: 12px; color: #6B7280; margin-top: 2px; line-height: 1.5;">${affectedCount} of ${totalInstances} instance${totalInstances !== 1 ? 's' : ''} affected</div>`;

    html += renderAccordion(
      `comp-${cIdx}`,
      `<div style="min-width: 0;">
        <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #1F2937;">${escHtml(compName)}</div>
        ${instanceLabel}
      </div>`,
      renderCountBadge(totalIssues),
      body
    );
  });
  return html;
}

function renderRuleSubGroup(ruleId: string, help: string, wcag: ReturnType<typeof parseWcagInfo>, nodes: { node: Element; html: string }[], parentKey: string): string {
  let html = `
    <div style="margin-bottom: 8px; padding: 10px 12px; background: #F9FAFB; border-radius: 8px; border: 1px solid #F3F4F6;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 13px; font-weight: 500; color: #1F2937;">${escHtml(help)}</span>
        <span style="background: #F3F4F6; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #6B7280;">${nodes.length}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="background: ${WCAG_LEVEL[wcag.level]}; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 600; font-size: 11px;">${wcag.level}</span>
        <span style="font-size: 12px; color: #6B7280;">${ruleId}</span>
      </div>
  `;
  nodes.forEach((n, nIdx) => {
    const context = getElementContext(n.node);
    html += `
      <div class="group-node" data-pkey="${parentKey}" data-rule="${ruleId}" data-nidx="${nIdx}" style="padding: 8px 10px; margin-bottom: 4px; background: white; border: 1px solid #E5E7EB; border-radius: 6px; cursor: pointer; font-size: 12px; color: #374151; display: flex; justify-content: space-between; align-items: center; transition: border-color 0.15s;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escHtml(context)}</span>
        <span style="color: ${HIGHLIGHT}; font-weight: 500; flex-shrink: 0; margin-left: 8px; font-size: 12px;">Highlight &rarr;</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

export function attachAxeListListeners(container: HTMLElement, data: AxeListData, actions: {
  onBack: () => void;
  onExport: () => void;
  onHighlight: (els: Element[]) => void;
  onNavigateDetails: (v: AxeViolation) => void;
  onFilterChange: (search: string, sev: string, mode: GroupMode, activeTypes: Set<AxeResultType>) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelector('#filter-search')?.addEventListener('input', (e) => {
    actions.onFilterChange((e.target as HTMLInputElement).value, data.filterSeverity, data.groupMode, data.activeResultTypes);
  });
  container.querySelector('#filter-severity')?.addEventListener('change', (e) => {
    actions.onFilterChange(data.searchQuery, (e.target as HTMLSelectElement).value, data.groupMode, data.activeResultTypes);
  });
  container.querySelectorAll('.group-mode-btn').forEach(el => {
    el.addEventListener('click', () => {
      actions.onFilterChange(data.searchQuery, data.filterSeverity, (el.getAttribute('data-mode') as GroupMode) || 'rule', data.activeResultTypes);
    });
  });

  container.querySelectorAll('.result-type-chip').forEach(el => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-type') as AxeResultType;
      const next = new Set(data.activeResultTypes);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      actions.onFilterChange(data.searchQuery, data.filterSeverity, data.groupMode, next);
    });
  });

  // Navigate to violation details on rule-card click — match against full (unfiltered by type) list
  container.querySelectorAll('.rule-card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      const v = data.violations.find(v => v.id === id);
      if (v) actions.onNavigateDetails(v);
    });
  });
  hoverListeners(container, '.rule-card', HIGHLIGHT);

  attachAccordionListeners(container);

  container.querySelectorAll('.comp-highlight-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const compId = el.getAttribute('data-compid') || '';
      const cluster = data.components.get(compId);
      if (cluster) actions.onHighlight(cluster.elements);
    });
  });

  container.querySelectorAll('.comp-node').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const cIdx = parseInt(el.getAttribute('data-cidx') || '0', 10);
      const iIdx = parseInt(el.getAttribute('data-iidx') || '0', 10);
      const nIdx = parseInt(el.getAttribute('data-nidx') || '0', 10);

      const byComponent = new Map<string, ComponentIssue[]>();
      data.dedupedIssues.forEach(issue => {
        if (!byComponent.has(issue.componentId)) byComponent.set(issue.componentId, []);
        byComponent.get(issue.componentId)!.push(issue);
      });
      const sorted = Array.from(byComponent.entries()).sort((a, b) => {
        const ac = a[1].reduce((s, i) => s + i.count, 0);
        const bc = b[1].reduce((s, i) => s + i.count, 0);
        return bc - ac;
      });
      const entry = sorted[cIdx];
      if (entry) {
        const issue = entry[1][iIdx];
        if (issue?.nodes[nIdx]) actions.onHighlight([issue.nodes[nIdx]]);
      }
    });
  });
  hoverListeners(container, '.comp-node', HIGHLIGHT);

  container.querySelectorAll('.group-node').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const pkey = el.getAttribute('data-pkey') || '';
      const ruleId = el.getAttribute('data-rule') || '';
      const nidx = parseInt(el.getAttribute('data-nidx') || '0', 10);
      const match = pkey.match(/region-(\d+)/);
      if (match) {
        const ridx = parseInt(match[1], 10);
        const region = data.regions[ridx];
        if (region) {
          const matching = region.violations.filter(v => v.ruleId === ruleId);
          if (matching[nidx]) actions.onHighlight([matching[nidx].node]);
        }
      }
    });
  });
  hoverListeners(container, '.group-node', HIGHLIGHT);
}
