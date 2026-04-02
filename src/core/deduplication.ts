import type { AxeViolation, ComponentCluster, ComponentIssue } from './types';

const UNCATEGORIZED_ID = 'cmp_uncategorized';
const UNCATEGORIZED_NAME = 'Uncategorized';

/**
 * Maps violations to their nearest component cluster root and deduplicates.
 * Violations that don't match any cluster go into an "Uncategorized" bucket.
 */
export function deduplicateViolations(
  violations: AxeViolation[],
  clusters: Map<string, ComponentCluster>
): ComponentIssue[] {
  const componentIssuesMap = new Map<string, ComponentIssue>();

  const elementMap = buildElementToClusterMap(clusters);

  violations.forEach(violation => {
    violation.nodes.forEach(node => {
      if (!node.element) return;

      const matchedCluster = closestClusterRoot(node.element, elementMap);
      const compId = matchedCluster?.id || UNCATEGORIZED_ID;
      const compName = matchedCluster?.name || UNCATEGORIZED_NAME;
      const instanceCount = matchedCluster?.elements.length || 0;

      const issueKey = `${compId}_${violation.id}`;

      if (!componentIssuesMap.has(issueKey)) {
        componentIssuesMap.set(issueKey, {
          componentId: compId,
          componentName: compName,
          ruleId: violation.id,
          severity: violation.impact,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          count: 0,
          instanceCount,
          nodes: []
        });
      }

      const issue = componentIssuesMap.get(issueKey)!;
      issue.count += 1;
      issue.nodes.push(node.element);
    });
  });

  return Array.from(componentIssuesMap.values());
}

function buildElementToClusterMap(clusters: Map<string, ComponentCluster>): WeakMap<Element, ComponentCluster> {
  const map = new WeakMap<Element, ComponentCluster>();
  clusters.forEach(cluster => {
    cluster.elements.forEach(el => map.set(el, cluster));
  });
  return map;
}

function closestClusterRoot(node: Element, elementMap: WeakMap<Element, ComponentCluster>): ComponentCluster | null {
  let current: Element | null = node;
  while (current) {
    const cluster = elementMap.get(current);
    if (cluster) return cluster;
    current = current.parentElement;
  }
  return null;
}
