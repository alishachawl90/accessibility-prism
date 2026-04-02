import { hashString } from '../utils/hash';
import type { ComponentCluster } from './types';

const UTILITY_CLASS_PATTERNS = /^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|overflow|container|row|col|w-|h-|p-|m-|px-|py-|mx-|my-|gap-|space-|text-|font-|bg-|border-|rounded|shadow|opacity|transition|transform|animate|cursor|pointer|select-|z-|sr-only|clearfix|d-)/;

const LANDMARK_SELECTORS = 'nav, header, footer, main, aside, section, [role="navigation"], [role="banner"], [role="contentinfo"], [role="main"], [role="complementary"]';

function normalizeClasses(className: string | SVGAnimatedString): string {
  const cn = typeof className === 'string' ? className : (className?.baseVal || '');
  if (!cn) return '';

  return cn
    .split(/\s+/)
    .map(cls => cls.replace(/[-_]?[a-zA-Z0-9]{4,}$/g, ''))
    .filter(Boolean)
    .join(' ');
}

function getChildStructure(el: Element, depth = 1): string[] {
  const structure: string[] = [];
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    let entry = child.tagName;
    if (depth > 0 && child.children.length > 0) {
      const grandchildren = getChildStructure(child, depth - 1);
      entry += `[${grandchildren.join(',')}]`;
    }
    structure.push(entry);
  }
  return structure;
}

function getRelativeDepthFromLandmark(el: Element): number {
  let depth = 0;
  let curr: Element | null = el;
  while (curr) {
    if (curr.matches(LANDMARK_SELECTORS)) return depth;
    depth++;
    curr = curr.parentElement;
  }
  return -1;
}

function findMeaningfulClass(className: string | SVGAnimatedString): string | null {
  const cn = typeof className === 'string' ? className : (className?.baseVal || '');
  if (!cn) return null;

  const classes = cn.split(/\s+/);
  for (const cls of classes) {
    if (!cls) continue;
    if (UTILITY_CLASS_PATTERNS.test(cls)) continue;
    if (cls.length < 3) continue;
    return cls;
  }
  return null;
}

function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function generateComponentName(el: Element, elements: Element[]): string {
  const dataComp = el.getAttribute('data-component');
  if (dataComp) return dataComp;

  const testId = el.getAttribute('data-testid');
  if (testId) return humanize(testId);

  const role = el.getAttribute('role');
  if (role && !['presentation', 'none', 'generic'].includes(role)) {
    return humanize(role);
  }

  const meaningful = findMeaningfulClass(el.className);
  if (meaningful) return humanize(meaningful);

  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent) return heading.textContent.trim().substring(0, 30);

  return `${el.tagName.toLowerCase()} group (${elements.length})`;
}

export function generateSignature(el: Element): string {
  const role = el.getAttribute('role') || '';
  const testId = el.getAttribute('data-testid') || '';
  const relDepth = getRelativeDepthFromLandmark(el);

  return hashString(JSON.stringify({
    tag: el.tagName,
    role,
    testId,
    classPattern: normalizeClasses(el.className),
    structure: getChildStructure(el, 1),
    relDepth: relDepth >= 0 ? relDepth : null,
  }));
}

function isLayoutWrapper(el: Element): boolean {
  const style = window.getComputedStyle(el);
  const display = style.display;
  const isFlexOrGrid = display === 'flex' || display === 'grid' || display === 'inline-flex' || display === 'inline-grid';
  if (!isFlexOrGrid) return false;

  const cn = typeof el.className === 'string' ? el.className : '';
  const hasSemanticClass = findMeaningfulClass(cn) !== null;
  const hasRole = el.getAttribute('role') !== null;
  const hasTestId = el.hasAttribute('data-testid') || el.hasAttribute('data-component');

  return !hasSemanticClass && !hasRole && !hasTestId;
}

export function detectComponents(): Map<string, ComponentCluster> {
  const allNodes = document.querySelectorAll('*');
  const clusters = new Map<string, Element[]>();

  Array.from(allNodes).forEach(node => {
    if (node.children.length < 2) return;
    if (['SCRIPT', 'STYLE', 'SVG', 'HEAD', 'NOSCRIPT'].includes(node.tagName)) return;
    if (node.closest('svg')) return;
    if (node.closest('#a11y-analyzer-panel') || node.closest('#a11y-analyzer-overlay')) return;

    // Skip list items inside lists
    if (node.tagName === 'LI' && node.parentElement?.matches('ul, ol')) return;

    // Skip pure layout wrappers
    if (isLayoutWrapper(node)) return;

    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const sig = generateSignature(node);
    if (!clusters.has(sig)) clusters.set(sig, []);
    clusters.get(sig)!.push(node);
  });

  const validClusters = new Map<string, ComponentCluster>();

  clusters.forEach((elements, signature) => {
    const overrides = elements.filter(el => el.hasAttribute('data-component'));
    if (overrides.length > 0) {
      const name = overrides[0].getAttribute('data-component') || 'CustomComponent';
      const id = 'cmp_' + hashString(name + signature);
      validClusters.set(id, {
        id,
        signature,
        elements,
        name,
        confidence: 100,
      });
      return;
    }

    // Threshold of 3 for auto-detected clusters
    if (elements.length >= 3) {
      const id = 'cmp_' + hashString(signature);
      const classConsistency = measureClassConsistency(elements);
      const confidence = Math.min(100, elements.length * 8 + classConsistency * 30);
      const name = generateComponentName(elements[0], elements);

      validClusters.set(id, {
        id,
        signature,
        elements,
        name,
        confidence,
      });
    }
  });

  return validClusters;
}

function measureClassConsistency(elements: Element[]): number {
  if (elements.length < 2) return 1;
  const classLists = elements.map(el => {
    const cn = typeof el.className === 'string' ? el.className : '';
    return new Set(cn.split(/\s+/).filter(Boolean));
  });
  const first = classLists[0];
  let matchCount = 0;
  for (let i = 1; i < classLists.length; i++) {
    let shared = 0;
    let total = 0;
    first.forEach(c => {
      total++;
      if (classLists[i].has(c)) shared++;
    });
    classLists[i].forEach(c => {
      if (!first.has(c)) total++;
    });
    if (total > 0) matchCount += shared / total;
  }
  return matchCount / (classLists.length - 1);
}
