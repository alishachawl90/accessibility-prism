import type { FormLabelsResult } from '../../core/types';
import { getCssSelector, getSnippet } from '../../utils/dom-utils';
import { escHtml } from '../../utils/escape';
import { FORM_LABEL_KNOWLEDGE, renderKnowledgeBlock } from '../../utils/issue-knowledge';
import { SEV } from '../tokens';
import { renderDevToolsButton } from './devtools-button';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  attachResultsPageListeners,
  type ResultsPageConfig,
} from './results-template';

const TYPE_LABELS: Record<string, string> = {
  'missing-label': 'No Label',
  'placeholder-only': 'Placeholder Only',
  'title-only': 'Title Only',
  'missing-fieldset-legend': 'Missing Legend',
  'ungrouped-radio': 'Ungrouped Radio/Checkbox',
};

const vis = (issues: FormLabelsResult['issues'], active: Set<string>) => issues.filter(i => active.has(i.severity));

export function renderFormLabelsResults(result: FormLabelsResult, activeSevs: Set<string>): string {
  const { issues, totalControls, labeledControls } = result;
  const pct = totalControls ? Math.round((labeledControls / totalControls) * 100) : 100;
  const covCol = pct >= 90 ? '#15803D' : pct >= 70 ? '#F59E0B' : '#EF4444';
  const err = issues.filter(i => i.severity === 'error').length;
  const warn = issues.filter(i => i.severity === 'warning').length;
  const stats: ResultsPageConfig['stats'] = [
    { label: 'controls', value: totalControls, color: '#374151' },
    { label: 'labeled', value: `${pct}%`, color: covCol },
    ...(err ? [{ label: err === 1 ? 'Error' : 'Errors', value: err, color: SEV.error.badge }] : []),
    ...(warn ? [{ label: warn === 1 ? 'Warning' : 'Warnings', value: warn, color: SEV.warning.badge }] : []),
  ];
  if (!issues.length) {
    return renderResultsPage({ title: 'Form Labels Audit', stats, bodyHtml: '', emptyMessage: 'All form controls are properly labeled!' });
  }
  const levels = (['error', 'warning', 'info'] as const)
    .map(k => ({ key: k, count: issues.filter(i => i.severity === k).length }))
    .filter(l => l.count);
  const fil = vis(issues, activeSevs);
  const bodyHtml = !fil.length
    ? '<div class="a11y-empty-state">No issues match the selected filters.</div>'
    : fil.map((issue, idx) => {
        const s = SEV[issue.severity];
        const tl = TYPE_LABELS[issue.type] || issue.type;
        const d = issue.description;
        const short = d.length > 180 ? `${d.slice(0, 180)}...` : d;
        const k = FORM_LABEL_KNOWLEDGE[issue.type];
        return renderIssueCard({
          idx,
          borderColor: s.border,
          badgeHtml: renderSeverityBadge(issue.severity),
          titleHtml: `${escHtml(tl)} <code class="a11y-code">${escHtml(issue.fieldType)}</code>`,
          descriptionHtml: escHtml(short),
          selector: getCssSelector(issue.element),
          snippet: getSnippet(issue.element),
          extraBodyHtml: (k ? renderKnowledgeBlock(k) : '') + renderDevToolsButton(idx),
        });
      }).join('');
  return renderResultsPage({ title: 'Form Labels Audit', stats, chips: levels.length ? { levels, active: activeSevs } : undefined, bodyHtml });
}

export function attachFormLabelsListeners(
  container: HTMLElement,
  result: FormLabelsResult,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onShowInDevTools?: (idx: number) => void;
    onSeverityChange?: (next: Set<string>) => void;
  },
  activeSevs: Set<string>,
): void {
  const filtered = vis(result.issues, activeSevs);
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => { const i = filtered[idx]; if (i) actions.onHighlight([i.element]); },
    onShowInDevTools: actions.onShowInDevTools,
    onSeverityChange: actions.onSeverityChange,
    autoHighlightOnExpand: true,
  }, { active: activeSevs });
}
