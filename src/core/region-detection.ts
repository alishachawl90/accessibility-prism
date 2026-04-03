/**
 * Region Detection Engine
 * 
 * Maps any DOM element to its nearest semantic "region" (page section),
 * and generates human-readable names like "Navigation", "Search Form",
 * "Hero Section", "Footer", etc.
 */

export interface PageRegion {
  id: string;
  name: string;
  element: Element;
  violations: RegionViolation[];
}

export interface RegionViolation {
  ruleId: string;
  help: string;
  impact: string | null | undefined;
  tags: string[];
  node: Element;
  html: string;
  failureSummary: string;
  helpUrl: string;
  resultType: string;
}

// Landmark selectors in priority order
const LANDMARK_SELECTORS = [
  { selector: 'nav, [role="navigation"]', name: 'Navigation' },
  { selector: 'header, [role="banner"]', name: 'Header' },
  { selector: 'footer, [role="contentinfo"]', name: 'Footer' },
  { selector: 'main, [role="main"]', name: 'Main Content' },
  { selector: 'aside, [role="complementary"]', name: 'Sidebar' },
  { selector: '[role="search"]', name: 'Search' },
  { selector: 'form', name: 'Form' },
  { selector: 'section', name: 'Section' },
  { selector: '[role="dialog"], dialog', name: 'Dialog' },
  { selector: '[role="alert"], [role="alertdialog"]', name: 'Alert' },
  { selector: '[role="tablist"]', name: 'Tab List' },
  { selector: '[role="menu"], [role="menubar"]', name: 'Menu' },
];

/**
 * Walks up from a DOM element to find its nearest semantic region ancestor.
 * Returns descriptive name based on tag, role, aria-label, headings, etc.
 */
export function findRegionForElement(el: Element): { regionEl: Element; name: string } {
  let current: Element | null = el;

  while (current) {
    // Check each landmark type
    for (const landmark of LANDMARK_SELECTORS) {
      if (current.matches(landmark.selector)) {
        const name = generateRegionName(current, landmark.name);
        return { regionEl: current, name };
      }
    }

    // Check for meaningful semantic containers
    if (current.hasAttribute('data-component') || current.hasAttribute('data-testid')) {
      const label = current.getAttribute('data-component') 
        || current.getAttribute('data-testid') 
        || 'Component';
      return { regionEl: current, name: humanize(label) };
    }

    // Check for elements with aria-label (these are intentionally named)
    if (current.hasAttribute('aria-label') && isSignificantContainer(current)) {
      return { regionEl: current, name: current.getAttribute('aria-label')! };
    }

    // Check for elements with aria-labelledby
    if (current.hasAttribute('aria-labelledby') && isSignificantContainer(current)) {
      const labelId = current.getAttribute('aria-labelledby')!;
      const labelEl = document.getElementById(labelId);
      if (labelEl) {
        return { regionEl: current, name: labelEl.textContent?.trim().substring(0, 40) || 'Labelled Region' };
      }
    }

    current = current.parentElement;
  }

  // Fallback: use the body
  return { regionEl: document.body, name: 'Page (Uncategorized)' };
}

function isSignificantContainer(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  // These are meaningful containers worth naming
  return ['div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'form', 'ul', 'ol'].includes(tag);
}

/**
 * Generate a human-readable name for a region element.
 * Uses aria-label > heading content > id > generic landmark name.
 */
function generateRegionName(el: Element, baseName: string): string {
  // 1. aria-label is the strongest signal
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.substring(0, 50);
  }

  // 2. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent) {
      return labelEl.textContent.trim().substring(0, 50);
    }
  }

  // 3. First heading inside the region
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent) {
    const headingText = heading.textContent.trim().substring(0, 40);
    return `${baseName}: ${headingText}`;
  }

  // 4. Title attribute
  if (el.getAttribute('title')) {
    return el.getAttribute('title')!.substring(0, 50);
  }

  // 5. ID-based (useful for forms, specific sections)
  if (el.id) {
    return `${baseName} (${humanize(el.id)})`;
  }

  // 6. Class-based hint
  const classes = typeof el.className === 'string' ? el.className : '';
  const meaningfulClass = classes.split(/\s+/).find(c => 
    /hero|banner|carousel|slider|search|footer|header|sidebar|card|modal|menu|toolbar|breadcrumb/i.test(c)
  );
  if (meaningfulClass) {
    return `${baseName}: ${humanize(meaningfulClass)}`;
  }

  return baseName;
}

/** Convert kebab-case/snake_case/camelCase to Title Case */
function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Given axe violations, maps each violation node to its semantic page region
 * and returns a list of PageRegions with their violations grouped inside.
 */
export function mapViolationsToRegions(violations: { id: string; help: string; helpUrl: string; impact: string | null | undefined; tags: string[]; resultType?: string; nodes: { element: Element | null; html: string; failureSummary: string }[] }[]): PageRegion[] {
  const regionMap = new Map<string, PageRegion>();
  
  // We use a WeakMap to cache element -> region lookups for performance
  const cache = new WeakMap<Element, { regionEl: Element; name: string }>();

  violations.forEach(violation => {
    violation.nodes.forEach(node => {
      if (!node.element) return;

      let regionInfo = cache.get(node.element);
      if (!regionInfo) {
        regionInfo = findRegionForElement(node.element);
        cache.set(node.element, regionInfo);
      }

      // Use the region element's identity as the dedup key
      // We need a stable string key, so use a combo of tag + position
      const regionKey = getRegionKey(regionInfo.regionEl);

      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, {
          id: regionKey,
          name: regionInfo.name,
          element: regionInfo.regionEl,
          violations: []
        });
      }

      regionMap.get(regionKey)!.violations.push({
        ruleId: violation.id,
        help: violation.help,
        impact: violation.impact,
        tags: violation.tags,
        node: node.element,
        html: node.html,
        failureSummary: node.failureSummary || '',
        helpUrl: violation.helpUrl || '',
        resultType: violation.resultType || 'violation',
      });
    });
  });

  // Sort regions: most violations first
  return Array.from(regionMap.values()).sort((a, b) => b.violations.length - a.violations.length);
}

function getRegionKey(el: Element): string {
  // Use a simple path-based key for uniqueness
  const parts: string[] = [];
  let curr: Element | null = el;
  let depth = 0;
  while (curr && depth < 5) {
    const idx = curr.parentElement 
      ? Array.from(curr.parentElement.children).indexOf(curr)
      : 0;
    parts.unshift(`${curr.tagName}[${idx}]`);
    curr = curr.parentElement;
    depth++;
  }
  return parts.join('>');
}
