import type { AxeViolation, ComponentCluster, ComponentIssue, KeyboardIssue } from '../core/types';
import { KB_TYPE_LABELS, KB_PRIORITY_LABELS } from '../core/types';
import { parseWcagInfo, getElementContext } from './wcag-map';
import { escHtml } from './escape';

export function generateHtmlReport(
  violations: AxeViolation[],
  components: Map<string, ComponentCluster>,
  dedupedIssues: ComponentIssue[],
  keyboardIssues: KeyboardIssue[]
): string {
  const totalNodes = violations.reduce((s, v) => s + v.nodes.length, 0);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>A11y Analysis Report — ${escHtml(document.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px auto; max-width: 920px; color: #111827; line-height: 1.6; }
    h1 { border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; font-size: 24px; color: #111827; }
    h2 { margin-top: 32px; color: #374151; font-size: 20px; }
    h3 { font-size: 16px; margin: 0 0 8px 0; }
    .meta { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
    .summary-bar { display: flex; gap: 16px; padding: 14px 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 24px; font-size: 14px; font-weight: 500; }
    .card { background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; color: white; }
    .badge-a { background: #E03E79; }
    .badge-aa { background: #7C3AED; }
    .badge-aaa { background: #2563EB; }
    .badge-critical { background: #DC2626; }
    .badge-serious { background: #EA580C; }
    .badge-moderate { background: #D97706; color: white; }
    .badge-minor { background: #6B7280; }
    .badge-violation { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; }
    .badge-needs-review { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
    .badge-best-practice { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
    .badge-p1 { background: #FEE2E2; color: #991B1B; }
    .badge-p2 { background: #FFF7ED; color: #9A3412; }
    .badge-p3 { background: #FFFBEB; color: #92400E; }
    .badge-p4 { background: #F3F4F6; color: #374151; }
    code { background: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-size: 13px; word-break: break-all; }
    .fix-box { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px; margin-top: 10px; font-size: 13px; }
    .occ { padding: 8px 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
    ul { padding-left: 20px; }
    a { color: #2563EB; }
    .kb-card { border-left: 3px solid; }
    .kb-error { border-color: #DC2626; }
    .kb-warning { border-color: #EA580C; }
    .kb-info { border-color: #2563EB; }
  </style>
</head>
<body>
  <h1>Accessibility Analysis Report</h1>
  <div class="meta">
    <div><strong>Page:</strong> ${escHtml(document.title)} &mdash; ${escHtml(location.href)}</div>
    <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Total violations:</strong> ${violations.length} rules, ${totalNodes} occurrences</div>
  </div>
`;

  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  violations.forEach(v => {
    const k = (v.impact || 'minor') as keyof typeof counts;
    if (counts[k] !== undefined) counts[k] += v.nodes.length;
  });
  html += `
  <div class="summary-bar">
    <span>${totalNodes} total</span>
    ${counts.critical > 0 ? `<span style="color: #DC2626;">${counts.critical} Critical</span>` : ''}
    ${counts.serious > 0 ? `<span style="color: #EA580C;">${counts.serious} Serious</span>` : ''}
    ${counts.moderate > 0 ? `<span style="color: #D97706;">${counts.moderate} Moderate</span>` : ''}
    ${counts.minor > 0 ? `<span style="color: #6B7280;">${counts.minor} Minor</span>` : ''}
  </div>`;

  html += `<h2>Issues by Rule</h2>`;
  violations.forEach(v => {
    const wcag = parseWcagInfo(v.tags);
    const badgeClass = wcag.level === 'AAA' ? 'badge-aaa' : wcag.level === 'AA' ? 'badge-aa' : 'badge-a';

    const rtClass = `badge-${v.resultType}`;
    const rtLabel = v.resultType === 'violation' ? '✕ Violation' : v.resultType === 'needs-review' ? '? Needs Review' : '★ Best Practice';
    html += `<div class="card">
      <h3>${escHtml(v.help)}</h3>
      <div style="margin-bottom: 8px;">
        <span class="badge ${rtClass}">${rtLabel}</span>
        <span class="badge ${badgeClass}">${wcag.level}</span>
        <span style="margin-left: 8px; font-size: 13px; color: #6B7280;">${wcag.fullLabel || v.id}</span>
        <span style="margin-left: 8px; font-size: 13px; color: #9CA3AF;">${v.nodes.length} occurrence${v.nodes.length !== 1 ? 's' : ''}</span>
      </div>
      <p style="font-size: 13px; color: #6B7280; margin: 0 0 8px 0;">${escHtml(v.description)}</p>
      ${v.helpUrl ? `<a href="${v.helpUrl}" target="_blank" style="font-size: 13px;">Learn more</a>` : ''}
    `;

    if (v.nodes[0]?.failureSummary) {
      html += `<div class="fix-box"><strong>How to fix:</strong><br/>${escHtml(v.nodes[0].failureSummary).replace(/\n/g, '<br/>')}</div>`;
    }

    html += `<div style="margin-top: 12px;">`;
    v.nodes.forEach((node, idx) => {
      const context = getElementContext(node.element);
      html += `<div class="occ">${idx + 1}. ${escHtml(context)} <code>${escHtml(node.target.join(' > '))}</code></div>`;
    });
    html += `</div></div>`;
  });

  if (dedupedIssues.length > 0) {
    html += `<h2>Issues by Component</h2>`;
    const byComp = new Map<string, ComponentIssue[]>();
    dedupedIssues.forEach(i => {
      if (!byComp.has(i.componentId)) byComp.set(i.componentId, []);
      byComp.get(i.componentId)!.push(i);
    });

    byComp.forEach((issues, compId) => {
      const cluster = components.get(compId);
      const name = issues[0]?.componentName || cluster?.name || `Component ${compId.substring(4, 10)}`;
      const totalCount = issues.reduce((s, i) => s + i.count, 0);
      const instances = cluster?.elements.length || 0;

      html += `<div class="card">
        <h3>${escHtml(name)} <span style="color: #9CA3AF; font-size: 14px; font-weight: normal;">(${instances} instances, ${totalCount} issues)</span></h3>
        <ul>`;
      issues.forEach(i => {
        const sevClass = (i.severity === 'critical' || i.severity === 'serious') ? 'badge-critical' : (i.severity === 'moderate' ? 'badge-moderate' : 'badge-minor');
        html += `<li>
          <span class="badge ${sevClass}">${(i.severity || 'minor').toUpperCase()}</span>
          <strong>${escHtml(i.ruleId)}</strong> &mdash; ${escHtml(i.help)}
          <span style="color: #9CA3AF;">(${i.count} occurrences)</span>
        </li>`;
      });
      html += `</ul></div>`;
    });
  }

  html += `<h2>Keyboard Accessibility</h2>`;
  if (keyboardIssues.length === 0) {
    html += `<p style="color: #16A34A; font-weight: 500;">All interactive elements are keyboard accessible.</p>`;
  } else {
    const kbErrors = keyboardIssues.filter(k => k.severity === 'error').length;
    const kbWarns = keyboardIssues.filter(k => k.severity === 'warning').length;
    const kbInfos = keyboardIssues.filter(k => k.severity === 'info').length;

    html += `
    <div class="summary-bar" style="margin-bottom: 16px;">
      <span>${keyboardIssues.length} total</span>
      ${kbErrors > 0 ? `<span style="color: #DC2626;">${kbErrors} Errors</span>` : ''}
      ${kbWarns > 0 ? `<span style="color: #EA580C;">${kbWarns} Warnings</span>` : ''}
      ${kbInfos > 0 ? `<span style="color: #2563EB;">${kbInfos} Info</span>` : ''}
    </div>`;

    const sortedKb = [...keyboardIssues].sort((a, b) => a.priority - b.priority);
    sortedKb.forEach(k => {
      const sevClass = k.severity === 'error' ? 'kb-error' : k.severity === 'warning' ? 'kb-warning' : 'kb-info';
      const prioClass = `badge-p${k.priority}`;

      html += `<div class="card kb-card ${sevClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong>${escHtml(KB_TYPE_LABELS[k.type])}</strong>
          <div style="display: flex; gap: 4px;">
            <span class="badge ${prioClass}" style="font-size: 11px;">${KB_PRIORITY_LABELS[k.priority]}</span>
          </div>
        </div>
        <code>${escHtml(k.element.tagName.toLowerCase())}${k.element.className ? '.' + String(k.element.className).split(' ').slice(0, 2).join('.') : ''}</code>
        <div style="font-size: 13px; margin-top: 6px; color: #6B7280;">${escHtml(k.description)}</div>
      </div>`;
    });
  }

  html += `</body></html>`;
  return html;
}
