import type { TouchTargetIssue } from './types';

const INTERACTIVE_SELECTOR = [
  'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
  '[role="checkbox"]', '[role="radio"]', '[role="switch"]', '[role="option"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const AA_MIN_SIZE = 24;
const AAA_MIN_SIZE = 44;

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isVisible(el: Element): boolean {
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  if (cs.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isInlineTextLink(el: Element): boolean {
  if (el.tagName !== 'A') return false;
  const cs = window.getComputedStyle(el);
  if (cs.display !== 'inline') return false;
  const parent = el.parentElement;
  if (!parent) return false;
  const parentText = parent.textContent?.trim() || '';
  const linkText = el.textContent?.trim() || '';
  return parentText.length > linkText.length + 10;
}

export function analyzeTouchTargets(): TouchTargetIssue[] {
  const issues: TouchTargetIssue[] = [];

  const elements = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR))
    .filter(el => !isExtension(el) && isVisible(el));

  elements.forEach(el => {
    if (isInlineTextLink(el)) return;

    const rect = el.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const minDim = Math.min(width, height);

    if (minDim < AA_MIN_SIZE) {
      issues.push({
        element: el,
        width,
        height,
        minRequired: AA_MIN_SIZE,
        level: 'AA',
        severity: 'error',
        description: `Touch target is ${width}x${height}px. WCAG 2.5.8 requires at least ${AA_MIN_SIZE}x${AA_MIN_SIZE}px for AA compliance.`,
      });
    } else if (minDim < AAA_MIN_SIZE) {
      issues.push({
        element: el,
        width,
        height,
        minRequired: AAA_MIN_SIZE,
        level: 'AAA',
        severity: 'warning',
        description: `Touch target is ${width}x${height}px. WCAG 2.5.5 recommends at least ${AAA_MIN_SIZE}x${AAA_MIN_SIZE}px for AAA compliance.`,
      });
    }
  });

  issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return Math.min(a.width, a.height) - Math.min(b.width, b.height);
  });

  return issues;
}
