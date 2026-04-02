import axe from 'axe-core';
import type { AxeViolation, AxeCheckResult, AxeResultType } from './types';

function mapChecks(checks: any[]): AxeCheckResult[] {
  if (!checks || !Array.isArray(checks)) return [];
  return checks.map((c: any) => ({
    id: c.id || '',
    message: c.message || '',
    impact: c.impact || '',
    data: c.data || null,
  }));
}

function isInsideExtension(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isBestPractice(tags: string[]): boolean {
  return tags.includes('best-practice');
}

function mapResultNodes(violation: any): AxeViolation['nodes'] {
  return violation.nodes
    .map((node: any) => {
      let element: Element | null = null;
      try {
        if (node.target && node.target.length > 0) {
          const selector = node.target[node.target.length - 1];
          element = document.querySelector(selector);
        }
      } catch (_e) {
        /* axe selectors can be complex */
      }

      if (isInsideExtension(element)) return null;

      return {
        target: node.target || [],
        html: node.html || '',
        element,
        failureSummary: node.failureSummary || '',
        any: mapChecks(node.any),
        all: mapChecks(node.all),
        none: mapChecks(node.none),
      };
    })
    .filter(Boolean);
}

function mapResult(item: any, resultType: AxeResultType): AxeViolation | null {
  const nodes = mapResultNodes(item);
  if (nodes.length === 0) return null;

  const actualType = isBestPractice(item.tags || []) ? 'best-practice' : resultType;

  return {
    id: item.id,
    impact: item.impact,
    tags: item.tags || [],
    help: item.help,
    helpUrl: item.helpUrl || '',
    description: item.description,
    nodes,
    resultType: actualType,
  };
}

export async function runAxe(root?: Element): Promise<AxeViolation[]> {
  try {
    const context: any = root
      ? { include: [root], exclude: ['#a11y-analyzer-panel', '#a11y-analyzer-overlay'] }
      : { exclude: ['#a11y-analyzer-panel', '#a11y-analyzer-overlay', '#a11y-panel-reset'] };

    const results = await axe.run(context, {
      resultTypes: ['violations', 'incomplete'],
      runOnly: {
        type: 'tag',
        values: [
          'wcag2a', 'wcag2aa', 'wcag2aaa',
          'wcag21a', 'wcag21aa',
          'wcag22aa',
          'best-practice',
        ],
      },
    });

    const out: AxeViolation[] = [];

    for (const v of results.violations) {
      const mapped = mapResult(v, 'violation');
      if (mapped) out.push(mapped);
    }

    for (const inc of (results.incomplete || [])) {
      const mapped = mapResult(inc, 'needs-review');
      if (mapped) out.push(mapped);
    }

    return out;
  } catch (err) {
    console.error('axe-core error:', err);
    return [];
  }
}
