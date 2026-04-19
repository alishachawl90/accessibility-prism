import type { LandmarkInfo, LandmarkIssue, LandmarkAnalysisResult } from './types';

const LANDMARK_ROLES = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'form', 'region'];

const IMPLICIT_LANDMARK_MAP: Record<string, string> = {
  HEADER: 'banner',
  NAV: 'navigation',
  MAIN: 'main',
  ASIDE: 'complementary',
  FOOTER: 'contentinfo',
  FORM: 'form',
  SECTION: 'region',
};

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function getLandmarkRole(el: Element): string | null {
  const explicitRole = el.getAttribute('role');
  if (explicitRole && LANDMARK_ROLES.includes(explicitRole)) return explicitRole;

  const implicit = IMPLICIT_LANDMARK_MAP[el.tagName];
  if (!implicit) return null;

  if (el.tagName === 'HEADER' || el.tagName === 'FOOTER') {
    if (el.closest('article') || el.closest('section') || el.closest('aside')) return null;
  }

  if (el.tagName === 'FORM' || el.tagName === 'SECTION') {
    const label = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    if (!label) return null;
  }

  return implicit;
}

function getLandmarkLabel(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent?.trim()) return heading.textContent.trim();

  return '';
}

export function analyzeLandmarks(root?: Element | Document): LandmarkAnalysisResult {
  const allElements = Array.from((root ?? document).querySelectorAll('*'));
  const landmarks: LandmarkInfo[] = [];
  const issues: LandmarkIssue[] = [];

  allElements.forEach(el => {
    if (isExtension(el)) return;
    const role = getLandmarkRole(el);
    if (!role) return;

    landmarks.push({
      element: el,
      role,
      label: getLandmarkLabel(el),
    });
  });

  const hasMain = landmarks.some(l => l.role === 'main');
  if (!hasMain) {
    issues.push({
      type: 'missing-main',
      severity: 'error',
      description: 'Page has no main landmark. Use <main> or role="main" to identify the primary content area.',
      element: null,
    });
  }

  const hasNav = landmarks.some(l => l.role === 'navigation');
  if (!hasNav) {
    issues.push({
      type: 'missing-nav',
      severity: 'warning',
      description: 'Page has no navigation landmark. Use <nav> to identify navigation sections.',
      element: null,
    });
  }

  const roleGroups = new Map<string, LandmarkInfo[]>();
  landmarks.forEach(l => {
    if (!roleGroups.has(l.role)) roleGroups.set(l.role, []);
    roleGroups.get(l.role)!.push(l);
  });

  roleGroups.forEach((group, role) => {
    if (group.length > 1) {
      const unlabeled = group.filter(l => !l.label);
      if (unlabeled.length > 0) {
        unlabeled.forEach(l => {
          issues.push({
            type: 'duplicate-landmark',
            severity: 'warning',
            description: `Multiple "${role}" landmarks found but this one has no accessible name. When duplicating landmarks, each must have a unique label.`,
            element: l.element,
          });
        });
      }
    }
  });

  landmarks.forEach(l => {
    const parent = l.element.parentElement;
    let current = parent;
    while (current) {
      if (isExtension(current)) break;
      const parentRole = getLandmarkRole(current);
      if (parentRole && parentRole !== 'main') {
        issues.push({
          type: 'nested-landmark',
          severity: 'info',
          description: `This "${l.role}" landmark is nested inside a "${parentRole}" landmark. Ensure nesting is intentional.`,
          element: l.element,
        });
        break;
      }
      current = current.parentElement;
    }
  });

  if (landmarks.length > 0) {
    const bodyChildren = Array.from(document.body.children);
    let outsideCount = 0;
    bodyChildren.forEach(child => {
      if (isExtension(child)) return;
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'LINK' || child.tagName === 'NOSCRIPT') return;
      const cs = window.getComputedStyle(child);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;

      const role = getLandmarkRole(child);
      if (!role) {
        const containsLandmark = landmarks.some(l => child.contains(l.element));
        if (!containsLandmark) {
          const hasVisibleText = child.textContent?.trim();
          if (hasVisibleText) outsideCount++;
        }
      }
    });

    if (outsideCount > 0) {
      issues.push({
        type: 'content-outside-landmark',
        severity: 'warning',
        description: `${outsideCount} top-level content element(s) found outside any landmark region. All visible content should be inside a landmark.`,
        element: document.body,
      });
    }
  }

  return { landmarks, issues };
}
