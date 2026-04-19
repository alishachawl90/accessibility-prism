import type { FocusManagementIssue } from './types';

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isVisible(el: Element): boolean {
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function getFocusableInside(root: Element): Element[] {
  const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll(sel)).filter(el => {
    if (!isVisible(el)) return false;
    if ((el as HTMLInputElement).disabled) return false;
    return true;
  });
}

export function analyzeFocusManagement(root?: Element | Document): FocusManagementIssue[] {
  const issues: FocusManagementIssue[] = [];

  const dialogs = Array.from((root ?? document).querySelectorAll(
    'dialog, [role="dialog"], [role="alertdialog"], [aria-modal="true"]'
  )).filter(el => !isExtension(el));

  dialogs.forEach(dialog => {
    const isOpen = dialog.tagName === 'DIALOG'
      ? (dialog as HTMLDialogElement).open
      : !dialog.hasAttribute('aria-hidden') || dialog.getAttribute('aria-hidden') !== 'true';

    if (!isOpen) return;
    if (!isVisible(dialog)) return;

    const role = dialog.getAttribute('role');
    if (dialog.tagName !== 'DIALOG' && role !== 'dialog' && role !== 'alertdialog') {
      issues.push({
        type: 'missing-role-dialog',
        severity: 'error',
        description: 'This modal element uses aria-modal="true" but lacks role="dialog" or role="alertdialog".',
        element: dialog,
      });
    }

    const label = dialog.getAttribute('aria-label') || dialog.getAttribute('aria-labelledby');
    if (!label) {
      issues.push({
        type: 'missing-aria-label',
        severity: 'warning',
        description: 'Dialog/modal has no accessible name. Add aria-label or aria-labelledby for screen reader users.',
        element: dialog,
      });
    }

    const focusableInside = getFocusableInside(dialog);
    if (focusableInside.length === 0) return;

    const allFocusable = getFocusableInside(document.body);
    const outsideFocusable = allFocusable.filter(el => {
      if (dialog.contains(el)) return false;
      if (isExtension(el)) return false;
      const inertParent = el.closest('[inert], [aria-hidden="true"]');
      return !inertParent;
    });

    if (outsideFocusable.length > 0) {
      issues.push({
        type: 'no-focus-trap',
        severity: 'error',
        description: `Open dialog with ${outsideFocusable.length} focusable element(s) reachable outside. Focus should be trapped within the dialog while open.`,
        element: dialog,
      });
    }

    const activeEl = document.activeElement;
    if (activeEl && !dialog.contains(activeEl) && activeEl !== document.body) {
      issues.push({
        type: 'no-initial-focus',
        severity: 'warning',
        description: 'An open dialog was found but focus is not currently inside it. Focus should move into the dialog when it opens.',
        element: dialog,
      });
    }

    const hasEscHandler = dialog.tagName === 'DIALOG';
    if (!hasEscHandler) {
      const hasKeydown = dialog.hasAttribute('onkeydown') || dialog.hasAttribute('onkeyup');
      if (!hasKeydown) {
        issues.push({
          type: 'no-escape-close',
          severity: 'info',
          description: 'Non-native dialog detected without an apparent Escape key handler. Users expect Escape to close modal dialogs.',
          element: dialog,
        });
      }
    }
  });

  return issues;
}
