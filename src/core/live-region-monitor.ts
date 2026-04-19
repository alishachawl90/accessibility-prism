import type { LiveRegionInfo, LiveRegionIssue, LiveRegionResult } from './types';

const IMPLICIT_LIVE_ROLES: Record<string, string> = {
  alert: 'assertive',
  status: 'polite',
  log: 'polite',
  marquee: 'off',
  timer: 'off',
  progressbar: 'polite',
};

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isVisible(el: Element): boolean {
  const cs = window.getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden';
}

export function analyzeLiveRegions(root?: Element | Document): LiveRegionResult {
  const regions: LiveRegionInfo[] = [];
  const issues: LiveRegionIssue[] = [];
  const qsa = (root ?? document);

  const explicitLive = Array.from(qsa.querySelectorAll('[aria-live]'))
    .filter(el => !isExtension(el));

  explicitLive.forEach(el => {
    const liveValue = el.getAttribute('aria-live') || 'off';
    if (liveValue === 'off') return;

    regions.push({
      element: el,
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
      ariaLive: liveValue,
      ariaAtomic: el.getAttribute('aria-atomic') || 'false',
      hasContent: !!(el.textContent?.trim()),
    });

    if (!isVisible(el)) {
      const rect = el.getBoundingClientRect();
      const isScreenReaderOnly = rect.width <= 1 && rect.height <= 1;
      if (!isScreenReaderOnly) {
        issues.push({
          type: 'live-region-hidden',
          severity: 'warning',
          description: 'This live region is hidden via CSS. Updates may not be announced by screen readers unless using a visually-hidden technique.',
          element: el,
        });
      }
    }
  });

  const implicitRoleEls = Array.from(qsa.querySelectorAll(
    '[role="alert"], [role="status"], [role="log"], [role="progressbar"]'
  )).filter(el => !isExtension(el));

  implicitRoleEls.forEach(el => {
    const role = el.getAttribute('role')!;
    const explicitLive = el.getAttribute('aria-live');
    const impliedLive = IMPLICIT_LIVE_ROLES[role] || 'off';

    if (!regions.some(r => r.element === el)) {
      regions.push({
        element: el,
        role,
        ariaLive: explicitLive || impliedLive,
        ariaAtomic: el.getAttribute('aria-atomic') || 'false',
        hasContent: !!(el.textContent?.trim()),
      });
    }

    if (!explicitLive) {
      issues.push({
        type: 'implicit-live-region',
        severity: 'info',
        description: `This element uses role="${role}" which implies aria-live="${impliedLive}". Consider making the live behavior explicit with aria-live.`,
        element: el,
      });
    }

    if (role === 'alert') {
      const content = el.textContent?.trim();
      if (!content) {
        issues.push({
          type: 'empty-alert',
          severity: 'warning',
          description: 'This alert region is currently empty. If populated dynamically, ensure content is added after the element is in the DOM.',
          element: el,
        });
      }
    }
  });

  const ariaLiveElements = Array.from(qsa.querySelectorAll('[aria-live]:not([aria-live="off"])'))
    .filter(el => !isExtension(el));
  ariaLiveElements.forEach(el => {
    if (!el.getAttribute('role') && !IMPLICIT_LIVE_ROLES[el.getAttribute('role') || '']) {
      const hasRole = el.hasAttribute('role');
      if (!hasRole) {
        issues.push({
          type: 'missing-aria-live',
          severity: 'info',
          description: 'This live region has aria-live but no semantic role. Consider adding role="status" or role="alert" for clarity.',
          element: el,
        });
      }
    }
  });

  return { regions, issues };
}
