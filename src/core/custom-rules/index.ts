import axe from 'axe-core';

import { textSpacingRule, textSpacingCheck } from './text-spacing';
import { targetSpacingRule, targetSpacingCheck } from './target-spacing';
import { focusObscuredRule, focusObscuredCheck } from './focus-obscured';
import { linkDistinguishableRule, linkDistinguishableCheck } from './link-distinguishable';
import { scrollableKeyboardRule, scrollableKeyboardCheck } from './scrollable-keyboard';
import { focusIndicatorRule, focusIndicatorCheck } from './focus-indicator';
import { presentationalChildrenRule, presentationalChildrenCheck } from './presentational-children';
import { textClippingRule, textClippingCheck } from './text-clipping';
import { ariaRoleNestingRule, ariaRoleNestingCheck } from './aria-role-nesting';
import { contrastLayeredRule, contrastLayeredCheck } from './contrast-layered';

export const PRISM_RULE_IDS = new Set([
  'prism-text-spacing',
  'prism-contrast-layered',
  'prism-target-spacing',
  'prism-focus-obscured',
  'prism-link-distinguishable',
  'prism-scrollable-keyboard',
  'prism-focus-indicator',
  'prism-presentational-children',
  'prism-text-clipping',
  'prism-aria-nesting',
]);

export function isPrismRule(ruleId: string): boolean {
  return PRISM_RULE_IDS.has(ruleId);
}

let registered = false;

export function registerPrismRules(): void {
  if (registered) return;
  registered = true;

  axe.configure({
    rules: [
      textSpacingRule,
      targetSpacingRule,
      focusObscuredRule,
      linkDistinguishableRule,
      scrollableKeyboardRule,
      focusIndicatorRule,
      presentationalChildrenRule,
      textClippingRule,
      ariaRoleNestingRule,
      contrastLayeredRule,
    ] as any[],
    checks: [
      textSpacingCheck,
      targetSpacingCheck,
      focusObscuredCheck,
      linkDistinguishableCheck,
      scrollableKeyboardCheck,
      focusIndicatorCheck,
      presentationalChildrenCheck,
      textClippingCheck,
      ariaRoleNestingCheck,
      contrastLayeredCheck,
    ] as any[],
  });
}
